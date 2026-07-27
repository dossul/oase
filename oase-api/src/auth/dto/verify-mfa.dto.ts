import { IsString, Length, IsOptional, IsIn } from 'class-validator';

export class VerifyMfaDto {
  @IsString() mfa_token: string;
  @IsString() @Length(6, 6) code: string;
  @IsOptional()
  @IsString()
  @IsIn(['totp', 'email', 'whatsapp'])
  canal?: string;
}
