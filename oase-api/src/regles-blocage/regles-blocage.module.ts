import { Module } from '@nestjs/common';
import { ReglesBlocageController } from './regles-blocage.controller';
import { ReglesBlocageService } from './regles-blocage.service';

@Module({
  controllers: [ReglesBlocageController],
  providers: [ReglesBlocageService],
  exports: [ReglesBlocageService],
})
export class ReglesBlocageModule {}
