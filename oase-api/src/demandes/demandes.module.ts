import { Module } from '@nestjs/common';
import { DemandesController } from './demandes.controller';
import { DemandesService } from './demandes.service';
import { StateMachineService } from './state-machine.service';

@Module({
  controllers: [DemandesController],
  providers: [DemandesService, StateMachineService],
  exports: [DemandesService, StateMachineService],
})
export class DemandesModule {}
