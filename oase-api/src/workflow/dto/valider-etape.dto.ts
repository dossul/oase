import { IsString, Length, IsOptional } from 'class-validator';

export class ValiderEtapeDto {
  @IsString()
  @Length(4, 6)
  pin: string;

  @IsString()
  @IsOptional()
  commentaire?: string;
}
