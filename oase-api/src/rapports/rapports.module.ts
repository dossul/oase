import { Module } from '@nestjs/common';
import { RapportsController } from './rapports.controller';
import { OpenDataController } from './opendata.controller';
import { RapportsService } from './rapports.service';

@Module({
  // NB : OpenDataController AVANT RapportsController — sinon GET /rapports/:id
  // (protégé) capturerait /rapports/opendata (public).
  controllers: [OpenDataController, RapportsController],
  providers: [RapportsService],
  exports: [RapportsService],
})
export class RapportsModule {}
