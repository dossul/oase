import { Injectable, Logger } from '@nestjs/common';
import { MfaChannelAdapter, MfaChannel } from '../mfa-channel.interface';

@Injectable()
export class WhatsAppAdapter implements MfaChannelAdapter {
  readonly canal: MfaChannel = 'whatsapp';
  private readonly logger = new Logger(WhatsAppAdapter.name);

  async sendCode(params: {
    utilisateurId: string;
    email: string;
    telephone: string | null;
    code: string;
    ttlSeconds: number;
  }): Promise<void> {
    // PLACEHOLDER: In production, integrate with WhatsApp Business API
    this.logger.log(
      `[WHATSAPP MFA PLACEHOLDER] Code ${params.code} would be sent to ${params.telephone} (user ${params.utilisateurId}, TTL ${params.ttlSeconds}s)`,
    );
  }

  async verifyCode(): Promise<boolean> {
    // WhatsApp channel uses MfaChallenge table for verification, not TOTP
    // Verification is handled by MfaPolicyService
    return false;
  }
}
