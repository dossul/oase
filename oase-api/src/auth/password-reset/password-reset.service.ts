import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

const PASSWORD_HASH_ROUNDS = 12;
const RESET_TTL_SECONDS = 15 * 60;
const RESET_MAX_TENTATIVES = 5;
/** Canal libre dans mfa_challenges (pas de contrainte FK — même pattern que le MFA email). */
const CANAL = 'password_reset';

/**
 * Réinitialisation de mot de passe par E-MAIL (flux « mot de passe oublié »
 * et première activation de compte).
 *
 * Pourquoi ce module alors que POST /auth/password/reset existe déjà ?
 * Le flux historique dépend de l'OTP par SMS (OtpService, contexte RESET_PWD),
 * or l'adaptateur SMS est un placeholder (log-sms) — inutilisable en prod.
 * Ce flux réutilise les briques éprouvées du MFA e-mail : table mfa_challenges
 * (codeHash sha256 + sel, tentatives, expiresAt) et envoi SMTP nodemailer
 * (mêmes variables d'environnement SMTP_* que l'adaptateur MFA email).
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private cfg: ConfigService,
    private audit: AuditService,
  ) {}

  /**
   * Étape 1 — demande. Réponse IDENTIQUE que le compte existe ou non
   * (anti-énumération). Le code n'est généré et envoyé que si le compte
   * existe ET est actif ; l'absence d'envoi n'est jamais révélée au client.
   */
  async requestReset(dto: PasswordResetRequestDto, ip: string, ua: string) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.utilisateur.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, statutCode: true },
    });

    if (user && user.statutCode === 'actif') {
      // Invalide les challenges précédents (un seul code actif à la fois)
      await this.prisma.mfaChallenge.updateMany({
        where: { utilisateurId: user.id, canal: CANAL, estUtilise: false },
        data: { estUtilise: true },
      });

      const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
      const sel = randomBytes(16).toString('hex');
      const codeHash = this.hashCode(code, sel);
      const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);

      await this.prisma.mfaChallenge.create({
        data: {
          utilisateurId: user.id,
          canal: CANAL,
          codeHash,
          sel,
          tentatives: 0,
          expiresAt,
          estUtilise: false,
        },
      });

      await this.sendEmail(user.email, code);

      await this.audit.createEntry({
        action: 'PASSWORD_RESET_DEMANDE',
        entite: 'utilisateurs',
        entiteId: user.id,
        utilisateurId: user.id,
        roleAuMoment: user.role,
        nouvelleValeur: { canal: 'email', expireDans: RESET_TTL_SECONDS },
        ip,
        userAgent: ua,
      });

      this.logger.log(`Reset demandé: userId=${user.id} — code envoyé à ${user.email}`);
    } else {
      this.logger.warn(`Reset demandé pour e-mail inconnu ou inactif: ${email} (aucune action)`);
    }

    return {
      data: {
        envoye: true,
        message:
          'Si un compte actif correspond à cette adresse, un code de réinitialisation vient d’être envoyé. Il est valable 15 minutes.',
        expireDans: RESET_TTL_SECONDS,
      },
    };
  }

  /**
   * Étape 2 — confirmation. Vérifie le code (même logique que le MFA email :
   * expiry, max tentatives, hash sha256(code:sel)), change le mot de passe,
   * révoque toutes les sessions. Message d'erreur uniforme (anti-énumération).
   */
  async confirmReset(dto: PasswordResetConfirmDto, ip: string, ua: string) {
    const email = dto.email.trim().toLowerCase();

    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException({ code: 'PASSWORD_CONFIRMATION_INCORRECTE' });
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, statutCode: true },
    });

    const challenge = user
      ? await this.prisma.mfaChallenge.findFirst({
          where: { utilisateurId: user.id, canal: CANAL, estUtilise: false },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    const invalide = async (reason: string): Promise<never> => {
      if (user) {
        await this.audit.createEntry({
          action: 'PASSWORD_RESET_ECHEC',
          entite: 'utilisateurs',
          entiteId: user.id,
          utilisateurId: user.id,
          roleAuMoment: user.role,
          nouvelleValeur: { reason },
          ip,
          userAgent: ua,
        });
      }
      throw new UnauthorizedException({
        code: 'RESET_CODE_INVALIDE',
        message: 'Code invalide ou expiré. Recommencez la demande de réinitialisation.',
      });
    };

    if (!user || user.statutCode !== 'actif' || !challenge) {
      return invalide(!user ? 'user_inexistant' : user.statutCode !== 'actif' ? 'user_non_actif' : 'challenge_absent');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { estUtilise: true },
      });
      return invalide('challenge_expire');
    }

    if (challenge.tentatives >= RESET_MAX_TENTATIVES) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { estUtilise: true },
      });
      return invalide('max_tentatives');
    }

    if (this.hashCode(dto.code, challenge.sel) !== challenge.codeHash) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { tentatives: challenge.tentatives + 1 },
      });
      return invalide('code_incorrect');
    }

    // Consomme le challenge AVANT le changement (usage unique)
    await this.prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { estUtilise: true },
    });

    const newHash = await bcrypt.hash(dto.newPassword, PASSWORD_HASH_ROUNDS);
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    const { count: revokedCount } = await this.prisma.refreshToken.updateMany({
      where: { utilisateurId: user.id, estRevoque: false },
      data: { estRevoque: true },
    });

    await this.audit.createEntry({
      action: 'PASSWORD_RESET_SUCCES',
      entite: 'utilisateurs',
      entiteId: user.id,
      utilisateurId: user.id,
      roleAuMoment: user.role,
      nouvelleValeur: { sessionsRevoquees: revokedCount, provenance: 'RESET_PWD_EMAIL' },
      ip,
      userAgent: ua,
    });

    this.logger.log(`Password reset (email): userId=${user.id} sessionsRevoquees=${revokedCount}`);

    return {
      data: {
        reset: true,
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        sessionsRevoquees: revokedCount,
      },
    };
  }

  /** Envoi SMTP — même config que l'adaptateur MFA email (o2switch en prod). */
  private async sendEmail(email: string, code: string): Promise<void> {
    const host = this.cfg.get<string>('SMTP_HOST');
    const user = this.cfg.get<string>('SMTP_USER');
    const pass = this.cfg.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(`[RESET EMAIL PLACEHOLDER] SMTP non configuré — code NON envoyé à ${email}`);
      return;
    }

    const transport = nodemailer.createTransport({
      host,
      port: Number(this.cfg.get<string>('SMTP_PORT', '465')),
      secure: (this.cfg.get<string>('SMTP_SECURE', 'true') ?? 'true') === 'true',
      auth: { user, pass },
    });

    const minutes = Math.round(RESET_TTL_SECONDS / 60);
    await transport.sendMail({
      from: this.cfg.get<string>('SMTP_FROM') ?? user,
      to: email,
      subject: 'OASE — Réinitialisation de votre mot de passe',
      text:
        `Votre code de réinitialisation OASE est : ${code}\n\n` +
        `Il expire dans ${minutes} minutes.\n` +
        `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et contactez l'administrateur.`,
      html:
        `<p>Votre code de réinitialisation <strong>OASE</strong> est :</p>` +
        `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
        `<p>Il expire dans <strong>${minutes} minutes</strong>.</p>` +
        `<p style="color:#64748B;font-size:12px">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et contactez l'administrateur.</p>`,
    });
  }

  private hashCode(code: string, sel: string): string {
    return createHash('sha256').update(`${code}:${sel}`).digest('hex');
  }
}
