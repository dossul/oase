import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreerDemandeDto {
  @IsString()
  @Matches(UUID_REGEX, { message: 'baseJuridiqueVersionId doit etre un UUID au format 8-4-4-4-12' })
  baseJuridiqueVersionId: string;

  @IsString()
  @Matches(UUID_REGEX, { message: 'contribuableId doit etre un UUID au format 8-4-4-4-12' })
  contribuableId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  montantFcfa: number;

  @IsString()
  @IsOptional()
  secteur?: string;

  @IsDateString()
  @IsOptional()
  dateEcheance?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  estUrgente?: boolean;
}
