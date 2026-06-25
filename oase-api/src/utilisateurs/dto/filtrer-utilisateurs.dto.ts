import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../common/enums/generated';

export class FiltrerUtilisateursDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @IsString()
  @IsOptional()
  statutCode?: string;

  @IsString()
  @IsOptional()
  institutionId?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
