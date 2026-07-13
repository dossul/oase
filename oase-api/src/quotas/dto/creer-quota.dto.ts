import { IsString, IsOptional, IsInt, IsNumberString, Min, Length, Max } from 'class-validator';

export class CreerQuotaDto {
  @IsString()
  @Length(1, 36)
  baseJuridiqueVersionId: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  contribuableId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  conventionId?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  exerciceAnnuel?: number;

  @IsString()
  @Length(1, 50)
  typeQuotaCode: string;

  @IsString()
  @Length(1, 50)
  uniteCode: string;

  @IsNumberString()
  total: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  alerteSeuilPct?: number;
}
