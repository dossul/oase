import { Module } from '@nestjs/common';
import { AccordsSiegeController } from './accords-siege.controller';
import { AccordsSiegeService } from './accords-siege.service';

@Module({
  controllers: [AccordsSiegeController],
  providers: [AccordsSiegeService],
  exports: [AccordsSiegeService],
})
export class AccordsSiegeModule {}
