import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuotasService } from './quotas.service';
import { CreerQuotaDto } from './dto/creer-quota.dto';
import { MouvementQuotaDto } from './dto/mouvement-quota.dto';

@Controller('quotas')
@UseGuards(JwtAuthGuard, RbacGuard)
export class QuotasController {
  constructor(private readonly service: QuotasService) {}

  @Get()
  @Roles(
    Role.CONTRIBUABLE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGBF,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.AGENT_MINISTERE,
    Role.DECIDEUR,
    Role.AGENT_CONEDEF,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  async lister(
    @Query('baseJuridiqueVersionId') baseJuridiqueVersionId?: string,
    @Query('contribuableId') contribuableId?: string,
  ) {
    return this.service.lister(baseJuridiqueVersionId, contribuableId);
  }

  @Get(':id')
  @Roles(
    Role.CONTRIBUABLE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGBF,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.AGENT_MINISTERE,
    Role.DECIDEUR,
    Role.AGENT_CONEDEF,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(Role.DECIDEUR, Role.ADMIN_SI)
  async creer(@Body() dto: CreerQuotaDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Post('mouvements')
  @Roles(Role.DECIDEUR, Role.ADMIN_SI)
  async ajouterMouvement(@Body() dto: MouvementQuotaDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.ajouterMouvement(dto, utilisateurId);
  }
}
