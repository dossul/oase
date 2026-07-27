import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

/**
 * Endpoints publics (PAS de JwtAuthGuard) — un user pas encore créé doit
 * pouvoir demander un OTP pour s'inscrire.
 *
 * Throttling strict par IP pour limiter le brute-force / SMS bombing.
 */
@Controller('otp')
export class OtpController {
  constructor(private otp: OtpService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 demandes / minute / IP
  async request(@Body() dto: RequestOtpDto, @Req() req: Request) {
    if (!dto) throw new BadRequestException({ code: 'BODY_REQUIS' });
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? undefined;
    return this.otp.demander(dto, ip);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // 10 tentatives / minute / IP
  async verify(@Body() dto: VerifyOtpDto) {
    if (!dto) throw new BadRequestException({ code: 'BODY_REQUIS' });
    return this.otp.verifier(dto.telephone, dto.contexte, dto.code);
  }
}
