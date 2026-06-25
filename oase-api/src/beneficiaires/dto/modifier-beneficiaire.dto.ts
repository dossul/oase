import { IsString, IsOptional } from 'class-validator';

export class ModifierBeneficiaireDto {
  @IsString()
  @IsOptional()
  raisonSociale?: string;

  @IsString()
  @IsOptional()
  emailContact?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  secteur?: string;

  @IsString()
  @IsOptional()
  region?: string;
}
