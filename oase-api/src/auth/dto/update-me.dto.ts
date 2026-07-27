import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OTP_CONTEXTS, OtpContext } from '../../otp/dto/request-otp.dto';

/**
 * Mise à jour partielle du profil utilisateur connecté.
 *
 * Règles :
 * - nom / prenom : modifiables librement (user authentifié)
 * - telephone : modifiable UNIQUEMENT avec un OTP CHANGE_PHONE valide
 *   (sinon quelqu'un qui vole le session token pourrait changer le tel
 *   et prendre le contrôle du compte via OTP reset password)
 * - email : NON modifiable ici. Pour changer l'email,流程 de vérification
 *   dédié (Lot future) car ça impacte l'identifiant de login.
 */
export class UpdateMeDto {
  @ApiProperty({ required: false, example: 'Agbodjan', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom?: string;

  @ApiProperty({ required: false, example: 'Kossi', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  prenom?: string;

  @ApiProperty({
    required: false,
    example: '+22890123456',
    description:
      'Nouveau téléphone E.164. Doit être accompagné de contexte+codeOtp CHANGE_PHONE (OTP demandé via /otp/request).',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Téléphone au format E.164 obligatoire (ex: +22890123456)',
  })
  telephone?: string;

  @ApiProperty({
    required: false,
    example: 'CHANGE_PHONE',
    enum: OTP_CONTEXTS,
    description: 'OBLIGATOIRE si telephone est fourni. Doit être CHANGE_PHONE. Validé côté service.',
  })
  // Optionnel au niveau DTO — la règle "OTP obligatoire si tel" est portée par
  // le service pour remonter un code d'erreur métier unique (OTP_CHANGE_PHONE_REQUIS)
  // au lieu d'une liste de messages class-validator.
  @IsOptional()
  @IsIn(OTP_CONTEXTS, {
    message: `contexte doit être l'un de : ${OTP_CONTEXTS.join(', ')}`,
  })
  contexte?: OtpContext;

  @ApiProperty({
    required: false,
    example: '482915',
    description: 'Code OTP à 6 chiffres. OBLIGATOIRE si telephone est fourni. Validé côté service.',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit faire exactement 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le code OTP est numérique (6 chiffres)' })
  codeOtp?: string;
}
