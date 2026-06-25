import { Module } from '@nestjs/common';
import { BeneficiairesController } from './beneficiaires.controller';
import { BeneficiairesService } from './beneficiaires.service';

@Module({
  controllers: [BeneficiairesController],
  providers: [BeneficiairesService],
  exports: [BeneficiairesService],
})
export class BeneficiairesModule {}
