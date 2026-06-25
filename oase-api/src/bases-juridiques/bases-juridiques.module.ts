import { Module } from '@nestjs/common';
import { BasesJuridiquesController } from './bases-juridiques.controller';
import { BasesJuridiquesService } from './bases-juridiques.service';

@Module({
  controllers: [BasesJuridiquesController],
  providers: [BasesJuridiquesService],
  exports: [BasesJuridiquesService],
})
export class BasesJuridiquesModule {}
