import { Module } from '@nestjs/common';
import { DemandesController } from './demandes.controller';
import { DemandesService } from './demandes.service';
import { StateMachineService } from './state-machine.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DemandesController],
  providers: [DemandesService, StateMachineService],
  exports: [DemandesService, StateMachineService],
})
export class DemandesModule {}
