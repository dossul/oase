import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'k.agbodjan@otr.tg' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Oase@2026!' })
  @IsString()
  @MinLength(8)
  password: string;
}
