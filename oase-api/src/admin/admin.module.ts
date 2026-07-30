import { Module } from '@nestjs/common';
import { AdminController, ReferentielsController } from './admin.controller';
import { AdminService } from './admin.service';
import { RbacMatriceService } from './rbac-matrice.service';
import { RbacMatriceController } from './rbac-matrice.controller';

@Module({
  controllers: [AdminController, ReferentielsController, RbacMatriceController],
  providers: [AdminService, RbacMatriceService],
  exports: [AdminService, RbacMatriceService],
})
export class AdminModule {}
