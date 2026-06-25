import { IsString, IsOptional, Length, MinLength } from 'class-validator';

export class ApprouverDemandeDto {
  @IsString()
  @Length(4, 6)
  pin: string;

  @IsString()
  @IsOptional()
  commentaire?: string;
}

export class RejeterDemandeDto {
  @IsString()
  @MinLength(20)
  motifRejet: string;

  @IsString()
  @Length(4, 6)
  pin: string;
}

export class DemanderComplementDto {
  @IsString()
  @MinLength(10)
  message: string;
}

export class CompleterDemandeDto {
  @IsString()
  @IsOptional()
  commentaire?: string;
}
