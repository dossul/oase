import { Module } from '@nestjs/common';
import { DemandesController } from './demandes.controller';
import { DemandesService } from './demandes.service';
import { StateMachineService } from './state-machine.service';
import { AuthModule } from '../auth/auth.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [AuthModule, WorkflowModule],
  controllers: [DemandesController],
  providers: [DemandesService, StateMachineService],
  exports: [DemandesService, StateMachineService],
})
export class DemandesModule {}
