import { IsString, IsOptional, IsInt, Min, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreerWorkflowTemplateEtapeDto {
  @IsString()
  nomEtape: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  ordre: number;

  @IsString()
  acteurRole: string;

  @IsString()
  @IsOptional()
  institutionTypeCode?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  delaiCibleJours?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  pinRequis?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  estObligatoire?: boolean;
}

export class CreerWorkflowTemplateDto {
  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @Matches(UUID_REGEX, { message: 'baseJuridiqueVersionId doit etre un UUID au format 8-4-4-4-12' })
  @IsOptional()
  baseJuridiqueVersionId?: string;

  @IsString()
  typeTexte1: string;

  @IsString()
  @IsOptional()
  organeGestionCode?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  estActif?: boolean;

  etapes: CreerWorkflowTemplateEtapeDto[];
}
