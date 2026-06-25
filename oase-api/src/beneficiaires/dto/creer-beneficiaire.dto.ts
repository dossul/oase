import { IsString, IsOptional, IsIn } from 'class-validator';
import { TypeBeneficiaire } from '../../common/enums/generated';

export class CreerBeneficiaireDto {
  @IsString()
  raisonSociale: string;

  @IsString()
  nif: string;

  @IsString()
  @IsOptional()
  rccm?: string;

  @IsString()
  @IsIn(Object.values(TypeBeneficiaire))
  typeBeneficiaireCode: TypeBeneficiaire;

  @IsString()
  @IsOptional()
  secteur?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  emailContact?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  adresse?: string;
}
