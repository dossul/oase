import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermisMiniersService } from './permis-miniers.service';
import { CreerPermisMinierDto, MajStatutPermisDto } from './dto/permis-minier.dto';

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

@Controller('permis-miniers')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PermisMiniersController {
  constructor(private readonly service: PermisMiniersService) {}

  @Get()
  @Roles(...ROLES_LECTURE)
  async lister(
    @Query('contribuableId') contribuableId?: string,
    @Query('typePermis') typePermis?: string,
    @Query('statut') statut?: string,
  ) {
    return this.service.lister({ contribuableId, typePermis, statut });
  }

  @Get(':id')
  @Roles(...ROLES_LECTURE)
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(...ROLES_ECRITURE)
  async creer(@Body() dto: CreerPermisMinierDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Patch(':id/statut')
  @Roles(...ROLES_ECRITURE)
  async majStatut(
    @Param('id') id: string,
    @Body() dto: MajStatutPermisDto,
    @CurrentUser('id') utilisateurId: string,
  ) {
    return this.service.majStatut(id, dto, utilisateurId);
  }
}
