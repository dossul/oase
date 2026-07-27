import { IsString, Matches } from 'class-validator';

export class VerifyPinDto {
  @IsString() @Matches(/^\d{4,6}$/) pin: string;
}
