import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { DemandesService } from './demandes.service';
import { CreerDemandeDto } from './dto/creer-demande.dto';
import { FiltrerDemandesDto } from './dto/filtrer-demandes.dto';
import {
  ApprouverDemandeDto,
  RejeterDemandeDto,
  DemanderComplementDto,
  CompleterDemandeDto,
} from './dto/transition-demande.dto';

@Controller('demandes')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DemandesController {
  constructor(private service: DemandesService) {}

  @Post()
  @Roles(Role.CONTRIBUABLE, Role.ADMIN_SI)
  creer(@CurrentUser() user: AuthUser, @Body() dto: CreerDemandeDto) {
    return this.service.creer(user, dto);
  }

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
  lister(@CurrentUser() user: AuthUser, @Query() dto: FiltrerDemandesDto) {
    return this.service.lister(user, dto);
  }

  @Get('stats/par-statut')
  @Roles(Role.DECIDEUR, Role.AGENT_CONEDEF, Role.AUDITEUR, Role.ADMIN_SI)
  statsParStatut(@CurrentUser() user: AuthUser) {
    return this.service.statsParStatut(user);
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
  detail(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(user, id);
  }

  @Patch(':id')
  @Roles(Role.CONTRIBUABLE, Role.ADMIN_SI)
  modifier(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreerDemandeDto) {
    return this.service.creer(user, dto);
  }

  @Post(':id/soumettre')
  @Roles(Role.CONTRIBUABLE, Role.ADMIN_SI)
  soumettre(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.transition(user, id, 'soumettre');
  }

  @Post(':id/prendre-en-charge')
  @Roles(
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.AGENT_MINISTERE,
    Role.ADMIN_SI,
  )
  prendreEnCharge(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.transition(user, id, 'prendre_en_charge');
  }

  @Post(':id/demander-complement')
  @Roles(Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI)
  demanderComplement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DemanderComplementDto,
  ) {
    return this.service.transition(user, id, 'demander_complement', dto);
  }

  @Post(':id/completer')
  @Roles(Role.CONTRIBUABLE, Role.ADMIN_SI)
  completer(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CompleterDemandeDto) {
    return this.service.transition(user, id, 'completer', dto);
  }

  @Post(':id/approuver')
  @Roles(Role.DECIDEUR, Role.ADMIN_SI)
  approuver(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ApprouverDemandeDto) {
    return this.service.transition(user, id, 'approuver', dto);
  }

  @Post(':id/rejeter')
  @Roles(
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.ADMIN_SI,
  )
  rejeter(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejeterDemandeDto) {
    return this.service.transition(user, id, 'rejeter', dto);
  }

  @Post(':id/archiver')
  @Roles(Role.ADMIN_SI)
  archiver(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.transition(user, id, 'archiver');
  }
}
