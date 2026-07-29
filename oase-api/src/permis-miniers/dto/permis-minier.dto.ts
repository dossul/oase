import { IsString, IsOptional, IsDateString, IsInt, Min, Length, IsBoolean, IsIn, IsNumber } from 'class-validator';

export const TYPES_PERMIS = ['recherche', 'exploitation', 'carriere'] as const;
export const MODES_OCTROI = ['ao_ouvert', 'ao_international', 'ao_restreint', 'gre_a_gre', 'premier_venu'] as const;
export const STATUTS_PERMIS = ['actif', 'expire', 'suspendu', 'retire'] as const;

export class CreerPermisMinierDto {
  @IsString()
  @Length(1, 30)
  reference: string;

  @IsString()
  @Length(1, 36)
  contribuableId: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  conventionId?: string;

  @IsIn(TYPES_PERMIS)
  typePermis: string;

  @IsString()
  @Length(1, 100)
  substance: string;

  @IsDateString()
  dateDemande: string;

  @IsDateString()
  dateOctroi: string;

  @IsInt()
  @Min(1)
  dureeAnnees: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  superficieKm2?: number;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  localite?: string;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsBoolean()
  rapportEiePublic?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  lienRapportEie?: string;

  @IsIn(MODES_OCTROI)
  modeOctroi: string;
}

export class MajStatutPermisDto {
  @IsIn(STATUTS_PERMIS)
  statut: string;
}
