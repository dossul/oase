import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Demande de réinitialisation de mot de passe par e-mail.
 *
 * Le endpoint renvoie TOUJOURS 200 { envoye: true }, que le compte existe
 * ou non (anti-énumération de comptes). Si le compte existe et est actif,
 * un code à 6 chiffres est envoyé par e-mail (TTL 15 min, 5 tentatives max).
 */
export class PasswordResetRequestDto {
  @ApiProperty({
    example: 'kossiwa.amele@texlome.tg',
    description: 'Adresse e-mail du compte à réinitialiser',
  })
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  @MaxLength(200)
  email: string;
}
