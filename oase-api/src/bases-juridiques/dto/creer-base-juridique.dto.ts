import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, Length, Min } from 'class-validator';

export class CreerBaseJuridiqueDto {
  @IsString()
  @Length(1, 20)
  codeMesure: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  codeMesureMrd?: number;
}

export class CreerBaseJuridiqueVersionDto {
  @IsString()
  @Length(1, 36)
  baseJuridiqueId: string;

  @IsString()
  @Length(1, 100)
  impotConcerne: string;

  @IsString()
  @Length(1, 50)
  natureMesureCode: string;

  @IsString()
  libelle: string;

  @IsOptional()
  @IsString()
  typeTexte1?: string;

  @IsOptional()
  @IsString()
  typeTexte2?: string;

  @IsOptional()
  @IsString()
  supportJuridiqueBase?: string;

  @IsOptional()
  @IsString()
  supportJuridiqueComplem?: string;

  @IsOptional()
  @IsString()
  article?: string;

  @IsOptional()
  @IsString()
  articleCgi2025?: string;

  @IsOptional()
  @IsString()
  porteeCategorieCode?: string;

  @IsOptional()
  @IsInt()
  porteeDureeMois?: number;

  @IsOptional()
  @IsString()
  organeGestionCode?: string;

  @IsOptional()
  @IsString()
  organeAttribution?: string;

  @IsOptional()
  @IsString()
  modeInstructionCode?: string;

  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @IsOptional()
  @IsDateString()
  dateAdoption?: string;

  @IsOptional()
  @IsDateString()
  dateAbrogation?: string;
}

export class ImporterBasesJuridiquesDto {
  @IsString()
  format: 'csv' | 'json';

  @IsString()
  contenu: string;
}
