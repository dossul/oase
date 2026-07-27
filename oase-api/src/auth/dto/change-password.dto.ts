import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Changement de mot de passe pour un user authentifié.
 *
 * Sécurité :
 * - oldPassword : obligatoire, vérifié contre le hash bcrypt en DB
 * - newPassword : min 10 chars, 1 majuscule, 1 chiffre, 1 spécial (mêmes règles que signup)
 * - confirmation : doit être === newPassword (vérifié côté service)
 *
 * Pas d'OTP ici : l'authentification Bearer (access_token 15min) + la
 * re-saisie du mot de passe actuel sont des preuves suffisantes.
 * Si le token est volé, l'attaquant ne peut pas deviner le password.
 */
export class ChangePasswordDto {
  @ApiProperty({ example: 'Oase@2026!', description: 'Mot de passe actuel' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  oldPassword: string;

  @ApiProperty({
    example: 'Oase@2027!',
    description: 'Nouveau mot de passe - min 10 chars, 1 majuscule, 1 chiffre, 1 spécial',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/, {
    message: 'Nouveau mot de passe doit contenir au moins 1 majuscule, 1 chiffre, 1 caractère spécial',
  })
  newPassword: string;

  @ApiProperty({ example: 'Oase@2027!', description: 'Confirmation du nouveau mot de passe' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPasswordConfirm: string;
}
