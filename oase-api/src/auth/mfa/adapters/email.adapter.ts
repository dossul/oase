import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MfaChannelAdapter, MfaChannel } from '../mfa-channel.interface';

/**
 * Envoi réel du code MFA par e-mail via SMTP (o2switch en prod).
 * Config attendue (variables d'environnement, JAMAIS commitées) :
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE ('true' pour SSL 465), SMTP_USER, SMTP_PASS, SMTP_FROM
 * Si la config est absente (dev, tests unitaires), on retombe sur le log placeholder —
 * le canal reste fonctionnel pour la chaîne de vérification (table mfa_challenges).
 */
@Injectable()
export class EmailAdapter implements MfaChannelAdapter {
  readonly canal: MfaChannel = 'email';
  private readonly logger = new Logger(EmailAdapter.name);

  constructor(private readonly cfg: ConfigService) {}

  private transporter(): nodemailer.Transporter | null {
    const host = this.cfg.get<string>('SMTP_HOST');
    const user = this.cfg.get<string>('SMTP_USER');
    const pass = this.cfg.get<string>('SMTP_PASS');
    if (!host || !user || !pass) return null;
    return nodemailer.createTransport({
      host,
      port: Number(this.cfg.get<string>('SMTP_PORT', '465')),
      secure: (this.cfg.get<string>('SMTP_SECURE', 'true') ?? 'true') === 'true',
      auth: { user, pass },
    });
  }

  async sendCode(params: {
    utilisateurId: string;
    email: string;
    telephone: string | null;
    code: string;
    ttlSeconds: number;
  }): Promise<void> {
    const transport = this.transporter();
    if (!transport) {
      this.logger.warn(
        `[EMAIL MFA PLACEHOLDER] SMTP non configuré — code ${params.code} NON envoyé à ${params.email} (user ${params.utilisateurId})`,
      );
      return;
    }
    const minutes = Math.max(1, Math.round(params.ttlSeconds / 60));
    await transport.sendMail({
      from: this.cfg.get<string>('SMTP_FROM') ?? this.cfg.get<string>('SMTP_USER'),
      to: params.email,
      subject: 'OASE — Votre code de vérification',
      text:
        `Votre code de vérification OASE est : ${params.code}\n\n` +
        `Il expire dans ${minutes} minute(s).\n` +
        `Si vous n'êtes pas à l'origine de cette connexion, contactez l'administrateur.`,
      html:
        `<p>Votre code de vérification <strong>OASE</strong> est :</p>` +
        `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${params.code}</p>` +
        `<p>Il expire dans <strong>${minutes} minute(s)</strong>.</p>` +
        `<p style="color:#64748B;font-size:12px">Si vous n'êtes pas à l'origine de cette connexion, contactez l'administrateur.</p>`,
    });
    this.logger.log(`[EMAIL MFA] Code envoyé à ${params.email} (user ${params.utilisateurId})`);
  }

  async verifyCode(): Promise<boolean> {
    // Email channel uses MfaChallenge table for verification, not TOTP
    // Verification is handled by MfaPolicyService
    return false;
  }
}
