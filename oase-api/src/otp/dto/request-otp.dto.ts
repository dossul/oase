import { IsString, Matches, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Contexte d'usage de l'OTP.
 * On whitelist pour éviter qu'un client invente un contexte.
 * - SIGNUP       : creation de compte (payload: { email })
 * - RESET_PWD    : reinitialisation password (payload: { userId })
 * - CHANGE_PHONE : changement de telephone (payload: { userId, newPhone })
 */
export const OTP_CONTEXTS = ['SIGNUP', 'RESET_PWD', 'CHANGE_PHONE'] as const;
export type OtpContext = (typeof OTP_CONTEXTS)[number];

export class RequestOtpDto {
  @ApiProperty({
    example: '+22890123456',
    description: 'Numéro au format E.164 international',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Téléphone au format E.164 obligatoire (ex: +22890123456)',
  })
  telephone: string;

  @ApiProperty({
    example: 'SIGNUP',
    enum: OTP_CONTEXTS,
    description: 'Contexte d\'usage de l\'OTP',
  })
  @IsIn(OTP_CONTEXTS, {
    message: `contexte doit être l'un de : ${OTP_CONTEXTS.join(', ')}`,
  })
  contexte: OtpContext;

  @ApiProperty({
    required: false,
    description: 'Données contextuelles (ex: { email } pour SIGNUP). Stockées chiffrées en payload_json.',
    example: { email: 'k.agbodjan@otr.tg' },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
