import { Module } from '@nestjs/common';
import { ContribuableController } from './contribuable.controller';
import { ContribuableService } from './contribuable.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ContribuableController],
  providers: [ContribuableService],
  exports: [ContribuableService],
})
export class ContribuablesModule {}
