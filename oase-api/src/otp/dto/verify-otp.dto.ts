import { IsString, Matches, IsIn, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OTP_CONTEXTS, OtpContext } from './request-otp.dto';

export class VerifyOtpDto {
  @ApiProperty({ example: '+22890123456' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Téléphone au format E.164 obligatoire',
  })
  telephone: string;

  @ApiProperty({ example: 'SIGNUP', enum: OTP_CONTEXTS })
  @IsIn(OTP_CONTEXTS)
  contexte: OtpContext;

  @ApiProperty({ example: '482915', description: 'Code OTP à 6 chiffres' })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit faire exactement 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le code OTP est numérique (6 chiffres)' })
  code: string;
}
