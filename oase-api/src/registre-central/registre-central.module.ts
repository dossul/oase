import { Module } from '@nestjs/common';
import { RegistreCentralController } from './registre-central.controller';
import { RegistreCentralService } from './registre-central.service';

@Module({
  controllers: [RegistreCentralController],
  providers: [RegistreCentralService],
  exports: [RegistreCentralService],
})
export class RegistreCentralModule {}
