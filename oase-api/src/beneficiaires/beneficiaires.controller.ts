import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { BeneficiairesService } from './beneficiaires.service';
import { CreerBeneficiaireDto } from './dto/creer-beneficiaire.dto';
import { ModifierBeneficiaireDto } from './dto/modifier-beneficiaire.dto';
import { FiltrerBeneficiairesDto } from './dto/filtrer-beneficiaires.dto';

@Controller('api/v1/beneficiaires')
@UseGuards(JwtAuthGuard, RbacGuard)
export class BeneficiairesController {
  constructor(private service: BeneficiairesService) {}

  @Post()
  @Roles(Role.BENEFICIAIRE, Role.ADMIN_SI)
  creer(@CurrentUser() user: AuthUser, @Body() dto: CreerBeneficiaireDto) {
    return this.service.creer(user, dto);
  }

  @Get()
  @Roles(
    Role.BENEFICIAIRE,
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
  lister(@CurrentUser() user: AuthUser, @Query() dto: FiltrerBeneficiairesDto) {
    return this.service.lister(user, dto);
  }

  @Get('me')
  @Roles(Role.BENEFICIAIRE)
  me(@CurrentUser() user: AuthUser) {
    return this.service.lister(user, { page: 1, limit: 1 } as FiltrerBeneficiairesDto).then((r) => r.data[0]);
  }

  @Get(':id')
  @Roles(
    Role.BENEFICIAIRE,
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
  @Roles(Role.BENEFICIAIRE, Role.ADMIN_SI)
  modifier(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierBeneficiaireDto,
  ) {
    return this.service.modifier(user, id, dto);
  }

  @Get(':id/statut-fiscal')
  @Roles(
    Role.BENEFICIAIRE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGBF,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  statutFiscal(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.statutFiscal(user, id);
  }
}
