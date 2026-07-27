import { Module } from '@nestjs/common';
import { AuthModule } from '../auth.module';
import { MfaPolicyService } from './mfa-policy.service';
import { MfaConfigController } from './mfa-config.controller';
import { TotpAdapter } from './adapters/totp.adapter';
import { EmailAdapter } from './adapters/email.adapter';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { MFA_CHANNEL_ADAPTERS } from './mfa-channel.interface';

@Module({
  imports: [AuthModule],
  controllers: [MfaConfigController],
  providers: [
    MfaPolicyService,
    TotpAdapter,
    EmailAdapter,
    WhatsAppAdapter,
    {
      provide: MFA_CHANNEL_ADAPTERS,
      useFactory: (totp: TotpAdapter, email: EmailAdapter, whatsapp: WhatsAppAdapter) => [
        totp,
        email,
        whatsapp,
      ],
      inject: [TotpAdapter, EmailAdapter, WhatsAppAdapter],
    },
  ],
  exports: [MfaPolicyService],
})
export class MfaModule {}
