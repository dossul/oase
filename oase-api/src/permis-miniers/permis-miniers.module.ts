import { Module } from '@nestjs/common';
import { PermisMiniersController } from './permis-miniers.controller';
import { PermisMiniersService } from './permis-miniers.service';

@Module({
  controllers: [PermisMiniersController],
  providers: [PermisMiniersService],
  exports: [PermisMiniersService],
})
export class PermisMiniersModule {}
