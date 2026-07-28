import { Controller, Get } from '@nestjs/common';
import { RapportsService } from './rapports.service';

/**
 * Portail open data PUBLIC — aucune authentification requise.
 * (Séparé de RapportsController qui est protégé par JwtAuthGuard.)
 */
@Controller('rapports')
export class OpenDataController {
  constructor(private service: RapportsService) {}

  @Get('opendata')
  openData() {
    return this.service.openData();
  }
}
