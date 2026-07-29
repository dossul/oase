import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FluxExtractifsService } from './flux-extractifs.service';
import {
  CreerProductionDto,
  CreerExportationDto,
  CreerRedevanceDto,
  CreerTransfertCommuneDto,
} from './dto/flux-extractifs.dto';

const ROLES_LECTURE = [
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
];

const ROLES_ECRITURE = [Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.ADMIN_SI];

@Controller('flux-extractifs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FluxExtractifsController {
  constructor(private readonly service: FluxExtractifsService) {}

  // ---------------------------------------------------------- Productions

  @Get('productions')
  @Roles(...ROLES_LECTURE)
  async listerProductions(
    @Query('contribuableId') contribuableId?: string,
    @Query('annee') annee?: string,
  ) {
    return this.service.listerProductions({ contribuableId, annee: annee ? parseInt(annee, 10) : undefined });
  }

  @Post('productions')
  @Roles(...ROLES_ECRITURE)
  async creerProduction(@Body() dto: CreerProductionDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creerProduction(dto, utilisateurId);
  }

  // ---------------------------------------------------------- Exportations

  @Get('exportations')
  @Roles(...ROLES_LECTURE)
  async listerExportations(
    @Query('contribuableId') contribuableId?: string,
    @Query('annee') annee?: string,
  ) {
    return this.service.listerExportations({ contribuableId, annee: annee ? parseInt(annee, 10) : undefined });
  }

  @Post('exportations')
  @Roles(...ROLES_ECRITURE)
  async creerExportation(@Body() dto: CreerExportationDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creerExportation(dto, utilisateurId);
  }

  // ---------------------------------------------------------- Redevances

  @Get('redevances')
  @Roles(...ROLES_LECTURE)
  async listerRedevances(
    @Query('contribuableId') contribuableId?: string,
    @Query('annee') annee?: string,
  ) {
    return this.service.listerRedevances({ contribuableId, annee: annee ? parseInt(annee, 10) : undefined });
  }

  @Post('redevances')
  @Roles(...ROLES_ECRITURE)
  async creerRedevance(@Body() dto: CreerRedevanceDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creerRedevance(dto, utilisateurId);
  }

  // ---------------------------------------------------------- Transferts communes (CFLDR)

  @Get('transferts-communes')
  @Roles(...ROLES_LECTURE)
  async listerTransferts(
    @Query('contribuableId') contribuableId?: string,
    @Query('annee') annee?: string,
  ) {
    return this.service.listerTransferts({ contribuableId, annee: annee ? parseInt(annee, 10) : undefined });
  }

  @Post('transferts-communes')
  @Roles(...ROLES_ECRITURE)
  async creerTransfert(@Body() dto: CreerTransfertCommuneDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creerTransfert(dto, utilisateurId);
  }
}
