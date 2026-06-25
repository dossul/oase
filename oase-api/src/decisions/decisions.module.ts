import { Module } from '@nestjs/common';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { ReglesBlocageModule } from '../regles-blocage/regles-blocage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ReglesBlocageModule, AuthModule],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
