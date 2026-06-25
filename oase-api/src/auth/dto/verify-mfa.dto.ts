import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString() mfa_token: string;
  @IsString() @Length(6, 6) code: string;
}
