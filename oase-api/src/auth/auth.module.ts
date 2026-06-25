import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PinGuard } from './guards/pin.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
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
  controllers: [AuthController],
  providers: [AuthService, MfaService, TokenBlacklistService, JwtStrategy, PinGuard],
  exports: [AuthService, MfaService, JwtModule, PinGuard],
})
export class AuthModule {}
