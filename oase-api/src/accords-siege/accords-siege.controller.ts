import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AccordsSiegeService } from './accords-siege.service';
import { CreerAccordSiegeDto, ModifierAccordSiegeDto } from './dto/accord-siege.dto';

/**
 * Sous-registre des accords de siège (MAE / OTR).
 * Lecture : agents habilités (données diplomatiques sensibles — pas de CONTRIBUABLE).
 * Écriture : AGENT_MAE (gestionnaire du sous-registre) et ADMIN_SI.
 */
@ApiTags('accords-siege')
@ApiBearerAuth()
@Controller('accords-siege')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AccordsSiegeController {
  constructor(private readonly service: AccordsSiegeService) {}

  @Get()
  @Roles(
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
  @ApiOperation({ summary: 'Lister les accords de siège (filtre optionnel par type d’institution)' })
  lister(@Query('typeInstitutionCode') typeInstitutionCode?: string) {
    return this.service.lister(typeInstitutionCode);
  }

  @Get(':id')
  @Roles(
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
  @ApiOperation({ summary: 'Fiche détaillée d’un accord de siège (contribuables + conventions rattachés)' })
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post()
  @Roles(Role.AGENT_MAE, Role.ADMIN_SI)
  @ApiOperation({ summary: 'Enregistrer un nouvel accord de siège dans le sous-registre' })
  creer(@Body() dto: CreerAccordSiegeDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.creer(dto, utilisateurId);
  }

  @Patch(':id')
  @Roles(Role.AGENT_MAE, Role.ADMIN_SI)
  @ApiOperation({ summary: 'Modifier un accord de siège (dont retrait du registre actif via estActif=false)' })
  modifier(@Param('id') id: string, @Body() dto: ModifierAccordSiegeDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.modifier(id, dto, utilisateurId);
  }
}
