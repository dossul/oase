import { IsString, IsInt, IsOptional, IsIn, Min, Max, Length } from 'class-validator';

export class GenererRapportDto {
  @IsString()
  @Length(1, 50)
  typeRapportCode: string;

  @IsInt()
  @Min(2000)
  periodeAnnee: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  periodeMois?: number;

  @IsIn(['csv', 'pdf', 'xlsx', 'json'])
  format: 'csv' | 'pdf' | 'xlsx' | 'json';
}
