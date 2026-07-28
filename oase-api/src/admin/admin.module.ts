import { Module } from '@nestjs/common';
import { AdminController, ReferentielsController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, ReferentielsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
