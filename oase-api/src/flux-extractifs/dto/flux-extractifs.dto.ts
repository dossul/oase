import { IsString, IsOptional, IsInt, Min, Max, Length, IsNumber, IsDateString } from 'class-validator';

export class CreerProductionDto {
  @IsString()
  @Length(1, 36)
  contribuableId: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  permisId?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  annee: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mois: number;

  @IsString()
  @Length(1, 100)
  substance: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeProduitT?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeVenduT?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeTraiteT?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  valeurMarchandeFcfa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  valeurMarchandeUsd?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  chiffreAffairesFcfa?: number;
}

export class CreerExportationDto {
  @IsString()
  @Length(1, 36)
  contribuableId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  annee: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mois: number;

  @IsString()
  @Length(1, 100)
  substance: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeT?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  valeurFcfa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  valeurUsd?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  destination?: string;
}

export class CreerRedevanceDto {
  @IsString()
  @Length(1, 36)
  contribuableId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  annee: number;

  @IsInt()
  @Min(1)
  @Max(4)
  trimestre: number;

  @IsString()
  @Length(1, 100)
  substance: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseAssietteFcfa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taux?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  montantDuFcfa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  montantPayeFcfa?: number;

  @IsOptional()
  @IsDateString()
  datePaiement?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  referencePaiement?: string;
}

export class CreerTransfertCommuneDto {
  @IsString()
  @Length(1, 36)
  contribuableId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  annee: number;

  @IsString()
  @Length(1, 100)
  commune: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  chiffreAffairesAnnuelFcfa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  montantDuFcfa?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  montantEncaisseFcfa?: number;

  @IsOptional()
  @IsDateString()
  dateEncaissement?: string;
}
