import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

/**
 * Réinitialisation de mot de passe par e-mail — routes PUBLIQUES (pas de JWT :
 * l'utilisateur a perdu son mot de passe ou active son compte pour la 1re fois).
 * Mêmes garde-fous que /auth/login : throttling strict + réponse uniforme.
 */
@ApiTags('auth')
@Controller('auth/password')
export class PasswordResetController {
  constructor(private passwordReset: PasswordResetService) {}

  @Post('reset-request')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Demande de reset par e-mail — envoie un code à 6 chiffres si le compte existe (réponse toujours identique)',
  })
  requestReset(@Body() dto: PasswordResetRequestDto, @Req() req: Request) {
    return this.passwordReset.requestReset(dto, req.ip ?? 'unknown', req.headers['user-agent'] ?? '');
  }

  @Post('reset-confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Confirmation du reset — consomme le code e-mail + change le mot de passe + révoque toutes les sessions',
  })
  confirmReset(@Body() dto: PasswordResetConfirmDto, @Req() req: Request) {
    return this.passwordReset.confirmReset(dto, req.ip ?? 'unknown', req.headers['user-agent'] ?? '');
  }
}
