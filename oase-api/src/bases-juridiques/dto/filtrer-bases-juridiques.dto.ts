import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrerBasesJuridiquesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  impotConcerne?: string;

  @IsOptional()
  @IsString()
  natureMesureCode?: string;

  @IsOptional()
  @IsString()
  organeGestionCode?: string;

  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @IsOptional()
  @IsString()
  codeMesure?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
