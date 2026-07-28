import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** Même forme libérale que ParseUUIDPipe (8-4-4-4-12 hex, nibble de version libre). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreerMissionDto {
  @IsString()
  @Matches(/^MIS-\d{4}-\d{3}$/, { message: 'reference au format MIS-AAAA-NNN' })
  reference: string;

  @IsString()
  @MaxLength(200)
  titre: string;

  @IsIn(['audit', 'controle'])
  type: string;

  @IsOptional()
  @IsIn(['planifiee', 'en_cours', 'terminee'])
  statut?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  organe?: string;

  @Matches(UUID_REGEX, { message: 'auditeurId doit être un UUID' })
  auditeurId: string;

  @IsOptional()
  @Matches(UUID_REGEX, { message: 'demandeId doit être un UUID' })
  demandeId?: string;

  @IsOptional()
  @IsString()
  dateDebut?: string;

  @IsOptional()
  @IsString()
  dateFin?: string;

  @IsOptional()
  @IsString()
  constats?: string;

  @IsOptional()
  @IsString()
  recommandations?: string;
}
