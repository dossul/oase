import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutDemande } from '../../common/enums/generated';

export class FiltrerDemandesDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(StatutDemande))
  statutCode?: StatutDemande;

  @IsString()
  @IsOptional()
  contribuableId?: string;

  @IsString()
  @IsOptional()
  baseJuridiqueVersionId?: string;

  @IsString()
  @IsOptional()
  instructeurId?: string;

  @IsString()
  @IsOptional()
  secteur?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
