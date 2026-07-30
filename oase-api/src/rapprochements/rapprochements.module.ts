import { Module } from '@nestjs/common';
import { RapprochementsController } from './rapprochements.controller';
import { RapprochementsService } from './rapprochements.service';

@Module({
  controllers: [RapprochementsController],
  providers: [RapprochementsService],
})
export class RapprochementsModule {}
