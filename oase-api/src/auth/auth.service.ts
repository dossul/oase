import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { SetPinDto } from './dto/set-pin.dto';

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
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cfg: ConfigService,
    private mfa: MfaService,
    private audit: AuditService,
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
    const mfaRequis = user.mfaActive;

    if (mfaRequis) {
      const mfaToken = this.jwt.sign(
        { sub: user.id, step: 'mfa_pending' },
        { expiresIn: '5m', secret: this.cfg.getOrThrow('JWT_SECRET') + '_mfa' },
      );
      return { mfa_required: true, mfa_token: mfaToken, expires_in: 300 };
    }

    return this.issueTokenPair(user, ip, userAgent);
  }

  async verifyMfa(mfaToken: string, code: string, ip: string, ua: string) {
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

    const valid = await this.mfa.verifyTotp(user.mfaSecretEnc!, code);
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
