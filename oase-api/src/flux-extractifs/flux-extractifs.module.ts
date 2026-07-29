import { Module } from '@nestjs/common';
import { FluxExtractifsController } from './flux-extractifs.controller';
import { FluxExtractifsService } from './flux-extractifs.service';

@Module({
  controllers: [FluxExtractifsController],
  providers: [FluxExtractifsService],
  exports: [FluxExtractifsService],
})
export class FluxExtractifsModule {}
