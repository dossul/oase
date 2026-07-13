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
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI, Role.AGENT_DGMG)
  async lister(@Query('contribuableId') contribuableId?: string) {
    return this.service.lister(contribuableId);
  }

  @Get(':id')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI, Role.AGENT_DGMG)
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI)
  async creer(@Body() dto: CreerConventionDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Patch(':id/renouveler')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI)
  async renouveler(
    @Param('id') id: string,
    @Body() dto: RenouvelerConventionDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.service.renouveler(id, dto, utilisateurId);
  }

  @Post('alertes/echeance')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI)
  async verifierAlertesEcheance(@CurrentUser('id') utilisateurId: string) {
    return this.service.verifierAlertesEcheance(utilisateurId);
  }
}
