import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DashboardsController {
  constructor(private readonly service: DashboardsService) {}

  @Get('p4')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR)
  async p4(@Query('dateDebut') dateDebut?: string, @Query('dateFin') dateFin?: string) {
    return this.service.kpisP4(dateDebut, dateFin);
  }

  @Get('p5')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR)
  async p5(@Query('dateDebut') dateDebut?: string, @Query('dateFin') dateFin?: string) {
    return this.service.kpisP5(dateDebut, dateFin);
  }
}
