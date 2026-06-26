import { Module } from '@nestjs/common';
import { ConventionsController } from './conventions.controller';
import { ConventionsService } from './conventions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ConventionsController],
  providers: [ConventionsService],
  exports: [ConventionsService],
})
export class ConventionsModule {}
