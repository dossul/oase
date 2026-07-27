import { Body, Controller, HttpCode, HttpStatus, Post, Req, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SignupService } from './signup.service';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller('auth')
export class SignupController {
  constructor(private signup: SignupService) {}

  /**
   * Inscription contribuable.
   * Le client doit avoir fait POST /otp/request {tel, contexte:'SIGNUP', payload:{email}}
   * puis POST /otp/verify AVANT d'appeler ce endpoint (le code OTP est consommé ici).
   *
   * Réponse : { access_token, refresh_token, user, contribuable }
   * Le user est connecté directement.
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } }) // 3 inscriptions / minute / IP
  @ApiOperation({ summary: 'Inscription contribuable (OTP requis)' })
  async inscrire(@Body() dto: SignupDto, @Req() req: Request) {
    if (!dto) throw new BadRequestException({ code: 'BODY_REQUIS' });
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.ip
      ?? 'unknown';
    const ua = (req.headers['user-agent'] as string) ?? '';
    return this.signup.inscrire(dto, ip, ua);
  }
}
