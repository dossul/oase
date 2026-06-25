import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';
import { Role } from '../../common/enums/generated';

export class CreerUtilisateurDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  prenom: string;

  @IsString()
  @IsIn(Object.values(Role))
  role: Role;

  @IsString()
  institutionId: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  secteurAffecte?: string;
}
