import { IsString, IsEmail, MinLength, MaxLength, Matches, Length, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OTP_CONTEXTS } from '../../../otp/dto/request-otp.dto';

export class SignupDto {
  @ApiProperty({ example: 'Kossi' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  prenom: string;

  @ApiProperty({ example: 'Agbodjan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'k.agbodjan@otr.tg' })
  @IsEmail()
  @MaxLength(200)
  email: string;

  @ApiProperty({
    example: '+22890123456',
    description: 'Numéro E.164 - doit matcher celui du /otp/request précédent',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Téléphone au format E.164 obligatoire',
  })
  telephone: string;

  @ApiProperty({
    example: 'SIGNUP',
    enum: OTP_CONTEXTS,
    description: 'Doit être SIGNUP',
  })
  @IsIn(OTP_CONTEXTS, { message: 'contexte doit être SIGNUP pour une inscription' })
  contexte: 'SIGNUP';

  @ApiProperty({
    example: '482915',
    description: 'Code OTP reçu par SMS - doit avoir été vérifié ou sera vérifié ici',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  codeOtp: string;

  @ApiProperty({
    example: 'Oase@2026!',
    description: 'Mot de passe - min 10 chars, au moins 1 majuscule, 1 chiffre, 1 spécial',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/, {
    message: 'Mot de passe doit contenir au moins 1 majuscule, 1 chiffre, 1 caractère spécial',
  })
  password: string;
}
