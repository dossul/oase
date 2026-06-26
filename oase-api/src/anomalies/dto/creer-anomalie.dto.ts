import { IsString, IsOptional, IsIn, Length } from 'class-validator';

export class CreerAnomalieDto {
  @IsString()
  @Length(1, 50)
  categorieCode: string;

  @IsString()
  @Length(1, 50)
  graviteCode: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  demandeId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  baseJuridiqueVersionId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  conventionId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  utilisateurId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  regleId?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class TraiterAnomalieDto {
  @IsIn(['en_cours', 'resolue', 'rejetee', 'escaladee'])
  statut: 'en_cours' | 'resolue' | 'rejetee' | 'escaladee';

  @IsOptional()
  @IsString()
  commentaire?: string;
}
