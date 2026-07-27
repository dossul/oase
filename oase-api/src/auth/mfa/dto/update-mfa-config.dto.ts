import { IsString, IsArray, IsBoolean, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';

export class UpdateMfaConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['totp', 'email', 'whatsapp'], { each: true })
  channels?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['totp', 'email', 'whatsapp'])
  defaultChannel?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(900)
  ttlSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsString()
  whatsappTemplate?: string;
}
