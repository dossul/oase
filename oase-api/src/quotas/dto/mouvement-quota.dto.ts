import { IsString, IsOptional, IsNumberString, Length } from 'class-validator';

export class MouvementQuotaDto {
  @IsString()
  @Length(1, 36)
  quotaId: string;

  @IsOptional()
  @IsString()
  @Length(1, 36)
  demandeId?: string;

  @IsString()
  @Length(1, 50)
  typeMouvementCode: string;

  @IsNumberString()
  montant: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
