import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnomaliesService } from './anomalies.service';
import { CreerAnomalieDto, TraiterAnomalieDto } from './dto/creer-anomalie.dto';
import { FiltrerAnomaliesDto } from './dto/filtrer-anomalies.dto';

@Controller('anomalies')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnomaliesController {
  constructor(private readonly service: AnomaliesService) {}

  @Get()
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI, Role.AGENT_DGMG)
  async lister(@Query() filtres: FiltrerAnomaliesDto) {
    return this.service.lister(filtres);
  }

  @Get(':id')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI, Role.AGENT_DGMG)
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI)
  async creer(@Body() dto: CreerAnomalieDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Patch(':id/traiter')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI)
  async traiter(@Param('id') id: string, @Body() dto: TraiterAnomalieDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.traiter(id, dto, utilisateurId);
  }

  @Post('detecter')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI)
  async detecter(@Body('regleId') regleId: string, @CurrentUser('id') utilisateurId: string) {
    return this.service.detecterAutomatiquement(regleId, utilisateurId);
  }
}
