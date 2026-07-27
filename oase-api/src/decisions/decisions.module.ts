import { Module } from '@nestjs/common';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { ReglesBlocageModule } from '../regles-blocage/regles-blocage.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AttestationsModule } from '../attestations/attestations.module';

@Module({
  imports: [ReglesBlocageModule, AuthModule, NotificationsModule, AttestationsModule],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
