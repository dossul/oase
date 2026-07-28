import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConventionsService } from './conventions.service';
import { CreerConventionDto, RenouvelerConventionDto } from './dto/creer-convention.dto';

@Controller('conventions')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ConventionsController {
  constructor(private readonly service: ConventionsService) {}

  @Get()
  @Roles(
    Role.CONTRIBUABLE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  async lister(@Query('contribuableId') contribuableId?: string) {
    return this.service.lister(contribuableId);
  }

  @Get(':id')
  @Roles(
    Role.CONTRIBUABLE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.ADMIN_SI)
  async creer(@Body() dto: CreerConventionDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Patch(':id/renouveler')
  @Roles(Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.ADMIN_SI)
  async renouveler(
    @Param('id') id: string,
    @Body() dto: RenouvelerConventionDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.service.renouveler(id, dto, utilisateurId);
  }

  @Post('alertes/echeance')
  @Roles(Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI)
  async verifierAlertesEcheance(@CurrentUser('id') utilisateurId: string) {
    return this.service.verifierAlertesEcheance(utilisateurId);
  }
}
