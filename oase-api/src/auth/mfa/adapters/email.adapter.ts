import { Injectable, Logger } from '@nestjs/common';
import { MfaChannelAdapter, MfaChannel } from '../mfa-channel.interface';

@Injectable()
export class EmailAdapter implements MfaChannelAdapter {
  readonly canal: MfaChannel = 'email';
  private readonly logger = new Logger(EmailAdapter.name);

  async sendCode(params: {
    utilisateurId: string;
    email: string;
    telephone: string | null;
    code: string;
    ttlSeconds: number;
  }): Promise<void> {
    // PLACEHOLDER: In production, integrate with an email service (SendGrid, SES, etc.)
    this.logger.log(
      `[EMAIL MFA PLACEHOLDER] Code ${params.code} would be sent to ${params.email} (user ${params.utilisateurId}, TTL ${params.ttlSeconds}s)`,
    );
  }

  async verifyCode(): Promise<boolean> {
    // Email channel uses MfaChallenge table for verification, not TOTP
    // Verification is handled by MfaPolicyService
    return false;
  }
}
