import { Module } from '@nestjs/common';
import { QuotasController } from './quotas.controller';
import { QuotasService } from './quotas.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [QuotasController],
  providers: [QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
