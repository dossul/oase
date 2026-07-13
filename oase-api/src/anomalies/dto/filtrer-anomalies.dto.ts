import { IsOptional, IsString, IsIn, Length } from 'class-validator';

export class FiltrerAnomaliesDto {
  @IsOptional()
  @IsString()
  @Length(1, 36)
  demandeId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  categorieCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  graviteCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  statutCode?: string;

  @IsOptional()
  @IsIn(['nouvelle', 'en_cours', 'resolue', 'rejetee'])
  statut?: 'nouvelle' | 'en_cours' | 'resolue' | 'rejetee';

  @IsOptional()
  @IsString()
  @Length(1, 36)
  contribuableId?: string;
}
