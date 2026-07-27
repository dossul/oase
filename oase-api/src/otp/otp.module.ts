import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { LogSmsAdapter } from './adapters/log-sms.adapter';
import { SMS_ADAPTER } from './adapters/sms-adapter.interface';

@Module({
  controllers: [OtpController],
  providers: [
    OtpService,
    LogSmsAdapter,
    // Bind le token SMS_ADAPTER sur LogSmsAdapter par défaut.
    // En prod, remplacer par un vrai provider sans toucher au service :
    //   { provide: SMS_ADAPTER, useClass: TwilioSmsAdapter }
    { provide: SMS_ADAPTER, useExisting: LogSmsAdapter },
  ],
  exports: [OtpService],
})
export class OtpModule {}
