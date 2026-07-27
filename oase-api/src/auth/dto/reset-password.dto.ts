import { IsString, IsEmail, MinLength, MaxLength, Matches, IsIn, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpContext } from '../../otp/dto/request-otp.dto';

/**
 * Contexte autorisé pour un reset password. On whitelist explicitement
 * RESET_PWD pour empêcher un client d'envoyer un contexte d'un autre
 * type (ex: SIGNUP) — le DTO l'aurait sinon accepté via OTP_CONTEXTS.
 */
const RESET_PWD_CONTEXTS: OtpContext[] = ['RESET_PWD'];

/**
 * Reset password (mot de passe oublié).
 *
 * Le user a déjà demandé un OTP via /api/v1/otp/request avec :
 *   { telephone, contexte: "RESET_PWD", payload: { userId, email } }
 *
 * Maintenant il confirme avec :
 *   { telephone, email, contexte: "RESET_PWD", codeOtp, newPassword, newPasswordConfirm }
 *
 * Sécurité :
 * - OTP doit être valide (contexte RESET_PWD, non expiré, non utilisé)
 * - payload.userId (de l'OTP) doit matcher un user existant
 * - user.email (en base) doit matcher l'email du body (anti-attack : empêche
 *   d'utiliser un OTP d'un user A pour reset le password d'un user B)
 * - newPassword : min 10 chars + 1 maj + 1 chiffre + 1 spécial
 * - newPasswordConfirm doit === newPassword
 * - Tous les refresh tokens du user sont révoqués (force re-login sur tous appareils)
 *
 * Pas de login automatique : le user doit se reconnecter avec son nouveau password.
 */
export class ResetPasswordDto {
  @ApiProperty({
    example: '+22890123456',
    description: 'Téléphone utilisé pour demander l\'OTP (info de cohérence)',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Téléphone au format E.164 obligatoire',
  })
  telephone: string;

  @ApiProperty({
    example: 'k.agbodjan@otr.tg',
    description: 'Email du compte (doit matcher celui du user en base)',
  })
  @IsEmail()
  @MaxLength(200)
  email: string;

  @ApiProperty({
    example: 'RESET_PWD',
    enum: RESET_PWD_CONTEXTS,
    description: 'Contexte obligatoire = RESET_PWD (whitelist stricte pour ce flow)',
  })
  @IsIn(RESET_PWD_CONTEXTS, {
    message: `contexte doit être RESET_PWD pour un reset password`,
  })
  contexte: 'RESET_PWD';

  @ApiProperty({
    example: '482915',
    description: 'Code OTP à 6 chiffres reçu par SMS',
  })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit faire exactement 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le code OTP est numérique (6 chiffres)' })
  codeOtp: string;

  @ApiProperty({
    example: 'NewPwd@2026!',
    description: 'Nouveau mot de passe - min 10 chars, 1 majuscule, 1 chiffre, 1 spécial',
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
