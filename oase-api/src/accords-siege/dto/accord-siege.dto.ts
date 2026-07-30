import { IsBoolean, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreerAccordSiegeDto {
  @ApiProperty({ example: 'Ambassade d’Allemagne', description: 'Nom de l’organisation internationale ou du corps diplomatique' })
  @IsString()
  @MaxLength(200)
  institution: string;

  @ApiProperty({ example: 'ambassade', description: 'Code du type d’institution (ref_types_accord_siege)' })
  @IsString()
  @MaxLength(50)
  typeInstitutionCode: string;

  @ApiPropertyOptional({ description: 'Texte fondateur (accord de siège, convention, note verbale…)' })
  @IsOptional()
  @IsString()
  texteFondateur?: string;

  @ApiPropertyOptional({ example: '1968-05-25', description: 'Date de signature (ISO YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateSignature au format YYYY-MM-DD' })
  dateSignature?: string;
}

export class ModifierAccordSiegeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  typeInstitutionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  texteFondateur?: string;

  @ApiPropertyOptional({ example: '1968-05-25' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateSignature au format YYYY-MM-DD' })
  dateSignature?: string;

  @ApiPropertyOptional({ description: 'false = accord retiré du sous-registre actif' })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}
