import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BasesJuridiquesService } from './bases-juridiques.service';
import {
  CreerBaseJuridiqueDto,
  CreerBaseJuridiqueVersionDto,
  ImporterBasesJuridiquesDto,
} from './dto/creer-base-juridique.dto';
import { FiltrerBasesJuridiquesDto } from './dto/filtrer-bases-juridiques.dto';

@Controller('bases-juridiques')
@UseGuards(JwtAuthGuard, RbacGuard)
export class BasesJuridiquesController {
  constructor(private readonly service: BasesJuridiquesService) {}

  @Get()
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI, Role.AGENT_DGMG)
  async lister(@Query() filtres: FiltrerBasesJuridiquesDto) {
    return this.service.lister(filtres);
  }

  @Get(':id')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_CI, Role.AGENT_DGMG)
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE)
  async creer(@Body() dto: CreerBaseJuridiqueDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Post('versions')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE)
  async creerVersion(@Body() dto: CreerBaseJuridiqueVersionDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creerVersion(dto, utilisateurId);
  }

  @Post('importer')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE)
  async importer(@Body() dto: ImporterBasesJuridiquesDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.importer(dto, utilisateurId);
  }
}
