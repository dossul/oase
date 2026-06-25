import { IsString, IsOptional, IsInt, Min, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsUUID()
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
