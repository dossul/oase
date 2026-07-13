import { IsUUID, IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreerDemandeDto {
  @IsUUID()
  baseJuridiqueVersionId: string;

  @IsUUID()
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
