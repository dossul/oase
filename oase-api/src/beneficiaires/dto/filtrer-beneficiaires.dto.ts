import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeBeneficiaire, StatutFiscal } from '../../common/enums/generated';

export class FiltrerBeneficiairesDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(TypeBeneficiaire))
  typeBeneficiaireCode?: TypeBeneficiaire;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(StatutFiscal))
  statutFiscalCode?: StatutFiscal;

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
