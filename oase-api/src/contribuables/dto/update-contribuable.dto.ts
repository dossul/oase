import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsIn,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Mise à jour partielle du profil contribuable.
 *
 * Règles :
 * - Tous les champs sont optionnels (PATCH partiel)
 * - Si NIF fourni : doit être unique (pas pris par un autre contribuable)
 * - Si typeContribuableCode fourni : doit être dans ref_types_contribuable
 * - Si profilLocked=true : PATCH refusé (sauf admin, à venir)
 *
 * Le recalcul de profilCompletude est fait côté service.
 */
export class UpdateContribuableDto {
  @ApiProperty({ required: false, example: 'SARL TechTogo', minLength: 2, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  raisonSociale?: string;

  @ApiProperty({
    required: false,
    example: 'TG-2026-A1234',
    description: 'NIF réel (≠ PENDING-*). Doit être unique. 4-20 chars alphanumériques ou tirets.',
    minLength: 4,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9\-]+$/, {
    message: 'NIF doit être alphanumérique (tirets autorisés)',
  })
  nif?: string;

  @ApiProperty({
    required: false,
    example: 'TG-LOM-2020-B-1234',
    description: 'RCCM (Registre du Commerce) — optionnel',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  rccm?: string;

  @ApiProperty({
    required: false,
    example: 'entreprise_privee',
    description: 'Code type contribuable (cf. ref_types_contribuable)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  typeContribuableCode?: string;

  @ApiProperty({
    required: false,
    example: 'inconnu',
    description: 'Code statut fiscal (cf. ref_statuts_fiscal)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  statutFiscalCode?: string;

  @ApiProperty({ required: false, example: 'Agroalimentaire', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  secteur?: string;

  @ApiProperty({ required: false, example: 'Maritime', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiProperty({ required: false, example: 'contact@techtogo.tg' })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  emailContact?: string;

  @ApiProperty({ required: false, example: '+22890123456' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Téléphone au format E.164 obligatoire (ex: +22890123456)',
  })
  telephone?: string;

  @ApiProperty({
    required: false,
    example: '12 Avenue de la Libération, Lomé, Togo',
    description: 'Adresse complète au format texte libre',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adresse?: string;
}
