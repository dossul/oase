import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Confirmation de réinitialisation de mot de passe par e-mail.
 *
 * Le user a reçu un code à 6 chiffres via POST /auth/password/reset-request.
 * Sécurité (mêmes règles que le reset par OTP SMS existant) :
 * - code valide (non expiré — 15 min, non utilisé, max 5 tentatives)
 * - newPassword : min 10 chars + 1 maj + 1 chiffre + 1 spécial
 * - newPasswordConfirm doit === newPassword
 * - Tous les refresh tokens du user sont révoqués (force re-login partout)
 *
 * Pas de login automatique : le user doit se reconnecter avec son nouveau password.
 */
export class PasswordResetConfirmDto {
  @ApiProperty({
    example: 'kossiwa.amele@texlome.tg',
    description: 'Adresse e-mail du compte (doit matcher celle de la demande)',
  })
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  @MaxLength(200)
  email: string;

  @ApiProperty({
    example: '482915',
    description: 'Code à 6 chiffres reçu par e-mail',
  })
  @IsString()
  @Length(6, 6, { message: 'Le code doit faire exactement 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le code est numérique (6 chiffres)' })
  code: string;

  @ApiProperty({
    example: 'NewPwd@2026!',
    description: 'Nouveau mot de passe — min 10 chars, 1 majuscule, 1 chiffre, 1 spécial',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/, {
    message: 'Nouveau mot de passe doit contenir au moins 1 majuscule, 1 chiffre, 1 caractère spécial',
  })
  newPassword: string;

  @ApiProperty({ example: 'NewPwd@2026!', description: 'Confirmation du nouveau mot de passe' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPasswordConfirm: string;
}
