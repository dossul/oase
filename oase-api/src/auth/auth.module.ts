import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { MfaService } from './mfa.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PinGuard } from './guards/pin.guard';
import { SignupService } from './signup/signup.service';
import { SignupController } from './signup/signup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { OtpModule } from '../otp/otp.module';
import { MfaPolicyService } from './mfa/mfa-policy.service';
import { TotpAdapter } from './mfa/adapters/totp.adapter';
import { EmailAdapter } from './mfa/adapters/email.adapter';
import { WhatsAppAdapter } from './mfa/adapters/whatsapp.adapter';
import { MFA_CHANNEL_ADAPTERS } from './mfa/mfa-channel.interface';
import { MfaConfigController } from './mfa/mfa-config.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    OtpModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_ACCESS_EXPIRATION', '15m') },
      }),
    }),
  ],
  controllers: [AuthController, SignupController, MfaConfigController],
  providers: [
    AuthService,
    ProfileService,
    MfaService,
    TokenBlacklistService,
    JwtStrategy,
    PinGuard,
    SignupService,
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
  exports: [AuthService, ProfileService, MfaService, JwtModule, PinGuard, MfaPolicyService],
})
export class AuthModule {}
