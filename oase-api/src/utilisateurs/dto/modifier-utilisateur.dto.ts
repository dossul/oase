import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';
import { Role } from '../../common/enums/generated';

export class ModifierUtilisateurDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  nom?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  prenom?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @IsString()
  @IsOptional()
  institutionId?: string;

  @IsString()
  @IsOptional()
  statutCode?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  secteurAffecte?: string;
}
