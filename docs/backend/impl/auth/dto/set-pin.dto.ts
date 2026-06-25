import { IsString, IsOptional, Matches } from 'class-validator';

export class SetPinDto {
  @IsString() @Matches(/^\d{4,6}$/) pin: string;
  @IsString() @Matches(/^\d{4,6}$/) pin_confirm: string;
  @IsOptional() @IsString() current_pin?: string;
}
