import { IsString, IsOptional, IsDateString, IsNumberString, IsInt, Min, Length } from 'class-validator';

export class CreerConventionDto {
  @IsString()
  @Length(1, 30)
  reference: string;

  @IsString()
  @Length(1, 36)
  beneficiaireId: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  baseJuridiqueVersionId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  accordSiegeId?: string;

  @IsString()
  @Length(1, 50)
  regimeCode: string;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsOptional()
  @IsNumberString()
  montantEstime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  emploisEngages?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  emploisCrees?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  zoneZfi?: string;

  @IsOptional()
  @IsString()
  objet?: string;
}

export class RenouvelerConventionDto {
  @IsDateString()
  dateFin: string;

  @IsOptional()
  @IsNumberString()
  montantEstime?: string;
}
