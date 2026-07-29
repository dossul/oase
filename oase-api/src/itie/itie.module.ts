import { Module } from '@nestjs/common';
import { ItieController } from './itie.controller';
import { ItieService } from './itie.service';

@Module({
  controllers: [ItieController],
  providers: [ItieService],
  exports: [ItieService],
})
export class ItieModule {}
