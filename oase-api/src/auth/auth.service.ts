import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from './mfa.service';
import { OtpService } from '../otp/otp.service';
import { AuditService } from '../audit/audit.service';
import { MfaPolicyService } from './mfa/mfa-policy.service';
import { MfaChannel } from './mfa/mfa-channel.interface';
import { LoginDto } from './dto/login.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const PASSWORD_HASH_ROUNDS = 12;

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  institutionId: string;
  institution: string;
  mfaActive: boolean;
  secteurAffecte?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private mfa: MfaService,
    private otp: OtpService,
    private audit: AuditService,
    @Inject(forwardRef(() => MfaPolicyService)) private mfaPolicy: MfaPolicyService,
  ) {}

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email },
      include: { institutions: true },
    });

    if (!user || user.statutCode !== 'actif') {
      throw new UnauthorizedException({ code: 'CREDENTIALS_INVALIDES' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await this.audit.createEntry({
        action: 'LOGIN_ECHEC',
        entite: 'utilisateurs',
        entiteId: user.id,
        utilisateurId: user.id,
        nouvelleValeur: { reason: 'password_incorrect' },
      });
      throw new UnauthorizedException({ code: 'CREDENTIALS_INVALIDES' });
    }

    return user;
  }

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.validateCredentials(dto.email, dto.password);
    const mfaConfig = await this.mfaPolicy.getConfig();
    const mfaRequis = mfaConfig.enabled && user.mfaActive;

    if (mfaRequis) {
      const canal = mfaConfig.defaultChannel;
      const mfaToken = this.jwt.sign(
        { sub: user.id, step: 'mfa_pending', canal },
        { expiresIn: '5m', secret: this.cfg.getOrThrow('JWT_SECRET') + '_mfa' },
      );

      // If channel is email or whatsapp, send the challenge code
      if (canal !== 'totp') {
        await this.mfaPolicy.sendChallenge({
          utilisateurId: user.id,
          email: user.email,
          telephone: user.telephone,
          canal,
        });
      }

      return { mfa_required: true, mfa_token: mfaToken, canal, expires_in: mfaConfig.ttlSeconds };
    }

    return this.issueTokenPair(user, ip, userAgent);
  }

  async verifyMfa(mfaToken: string, code: string, ip: string, ua: string, canal?: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(mfaToken, {
        secret: this.cfg.getOrThrow('JWT_SECRET') + '_mfa',
      });
    } catch {
      throw new UnauthorizedException({ code: 'MFA_TOKEN_EXPIRE' });
    }

    if (payload.step !== 'mfa_pending') {
      throw new UnauthorizedException({ code: 'MFA_TOKEN_INVALIDE' });
    }

    const user = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: payload.sub },
      include: { institutions: true },
    });

    const effectiveCanal = (canal || payload.canal || 'totp') as MfaChannel;

    const valid = await this.mfaPolicy.verifyChallenge({
      utilisateurId: user.id,
      canal: effectiveCanal,
      code,
      mfaSecretEnc: user.mfaSecretEnc,
    });
    if (!valid) {
      throw new UnauthorizedException({ code: 'CODE_MFA_INVALIDE' });
    }

    return this.issueTokenPair(user, ip, ua);
  }

  async refreshToken(rawToken: string, ip: string, ua: string) {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: tokenHash },
    });

    if (!stored || stored.estRevoque || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALIDE' });
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { estRevoque: true },
    });

    const user = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: stored.utilisateurId },
      include: { institutions: true },
    });

    return this.issueTokenPair(user, ip, ua);
  }

  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: tokenHash },
      data: { estRevoque: true },
    });
  }

  /**
   * POST /auth/password/reset : reset password (mot de passe oublié).
   *
   * Flow :
   *   1. Vérifier OTP (contexte RESET_PWD) — payload doit contenir { userId, email }
   *   2. Charger le user par userId
   *   3. Vérifier que user.email === body.email (anti-OTP-theft)
   *   4. Vérifier newPassword === newPasswordConfirm
   *   5. Hasher + update password
   *   6. Révoquer TOUS les refresh tokens du user (force re-login)
   *   7. Audit
   *
   * Pas de login automatique : le user doit se reconnecter avec son nouveau password.
   */
  async resetPassword(dto: ResetPasswordDto, ip: string, ua: string) {
    // 1. Vérifier l'OTP (le consume)
    let otpResult;
    try {
      otpResult = await this.otp.verifier(dto.telephone, 'RESET_PWD', dto.codeOtp);
    } catch (e) {
      // Remapper l'erreur OtpService : 401 par défaut
      throw e;
    }

    const payload = otpResult.payload as { userId?: string; email?: string } | null;
    if (!payload || !payload.userId) {
      throw new BadRequestException({ code: 'OTP_PAYLOAD_USERID_MANQUANT' });
    }

    // 2. Charger le user
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, statutCode: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_INEXISTANT' });
    }

    // 2b. Vérifier que le user est actif (pas suspendu, désactivé, etc.)
    // Sinon un user suspendu pourrait reset son password et contourner la suspension.
    if (user.statutCode !== 'actif') {
      // Audit même en cas d'échec
      await this.audit.createEntry({
        action: 'PASSWORD_RESET_ECHEC',
        entite: 'utilisateurs',
        entiteId: user.id,
        utilisateurId: user.id,
        roleAuMoment: user.role,
        nouvelleValeur: { reason: 'user_not_active', statutCode: user.statutCode },
        ip,
        userAgent: ua,
      });
      throw new ForbiddenException({
        code: 'USER_NON_ACTIF',
        statutCode: user.statutCode,
        message: 'Compte désactivé ou suspendu. Contactez l\'administrateur.',
      });
    }

    // 3. user.email === body.email (case insensitive)
    if (user.email.toLowerCase() !== dto.email.toLowerCase()) {
      // Audit même en cas d'échec
      await this.audit.createEntry({
        action: 'PASSWORD_RESET_ECHEC',
        entite: 'utilisateurs',
        entiteId: user.id,
        utilisateurId: user.id,
        roleAuMoment: user.role,
        nouvelleValeur: { reason: 'email_mismatch', emailBody: dto.email },
        ip,
        userAgent: ua,
      });
      throw new BadRequestException({ code: 'EMAIL_OTP_MISMATCH' });
    }

    // 4. newPassword === newPasswordConfirm (le DTO ne peut pas le faire car ce sont 2 champs)
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException({ code: 'PASSWORD_CONFIRMATION_INCORRECTE' });
    }

    // 5. Hash + update
    const newHash = await bcrypt.hash(dto.newPassword, PASSWORD_HASH_ROUNDS);
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // 6. Révoquer TOUS les refresh tokens
    const { count: revokedCount } = await this.prisma.refreshToken.updateMany({
      where: { utilisateurId: user.id, estRevoque: false },
      data: { estRevoque: true },
    });

    // 7. Audit
    await this.audit.createEntry({
      action: 'PASSWORD_RESET_SUCCES',
      entite: 'utilisateurs',
      entiteId: user.id,
      utilisateurId: user.id,
      roleAuMoment: user.role,
      nouvelleValeur: {
        sessionsRevoquees: revokedCount,
        provenance: 'RESET_PWD_OTP',
      },
      ip,
      userAgent: ua,
    });

    this.logger.log(
      `Password reset: userId=${user.id} sessionsRevoquees=${revokedCount}`,
    );

    return {
      data: {
        reset: true,
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        sessionsRevoquees: revokedCount,
      },
    };
  }

  async setPin(userId: string, dto: SetPinDto) {
    const user = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.pinHash) {
      const ok = await bcrypt.compare(dto.current_pin!, user.pinHash);
      if (!ok) throw new UnauthorizedException({ code: 'PIN_INVALIDE' });
    }

    if (dto.pin !== dto.pin_confirm) {
      throw new ConflictException({ code: 'PIN_CONFIRMATION_INCORRECTE' });
    }

    const pinHash = await bcrypt.hash(dto.pin, 12);
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { pinHash: pinHash },
    });

    await this.audit.createEntry({
      action: 'PIN_MODIFIE',
      entite: 'utilisateurs',
      entiteId: userId,
      utilisateurId: userId,
    });
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: userId },
      select: { pinHash: true },
    });
    if (!user.pinHash) return false;
    return bcrypt.compare(pin, user.pinHash);
  }

  /**
   * Émet une paire access/refresh token pour un user déjà chargé.
   * Public pour permettre à SignupService (création de compte) de connecter
   * directement le nouveau user sans repasser par /auth/login.
   */
  async issueTokensForUser(user: any, ip: string, ua: string) {
    return this.issueTokenPair(user, ip, ua);
  }

  private async issueTokenPair(user: any, ip: string, ua: string) {
    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      institutionId: user.institutionId,
      institution: user.institutions.nom,
      mfaActive: user.mfaActive,
      secteurAffecte: user.secteurAffecte,
    };

    const accessToken = this.jwt.sign(
      { sub: user.id, ...payload },
      { expiresIn: this.cfg.get('JWT_ACCESS_EXPIRATION', '15m') },
    );

    const rawRefresh = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + this.parseDuration(this.cfg.get('JWT_REFRESH_EXPIRATION', '7d')));

    await this.prisma.refreshToken.create({
      data: {
        utilisateurId: user.id,
        tokenHash: tokenHash,
        expiresAt: expiresAt,
        ip,
        userAgent: ua,
      },
    });

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date(), ipDerniereCx: ip },
    });

    await this.audit.createEntry({
      action: 'LOGIN_SUCCES',
      entite: 'utilisateurs',
      entiteId: user.id,
      utilisateurId: user.id,
      roleAuMoment: user.role,
      institution: user.institutions.nom,
      ip,
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefresh,
      expires_in: 900,
      user: payload,
    };
  }

  private hashToken(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseDuration(duration: string): number {
    const units: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86_400_000;
    return parseInt(match[1]) * units[match[2]];
  }
}
