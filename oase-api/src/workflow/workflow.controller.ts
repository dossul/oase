import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { WorkflowService } from './workflow.service';
import { CreerWorkflowTemplateDto } from './dto/creer-workflow-template.dto';
import { ValiderEtapeDto } from './dto/valider-etape.dto';

@Controller('workflow')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowController {
  constructor(private service: WorkflowService) {}

  @Post('templates')
  @Roles(Role.ADMIN_SI)
  creerTemplate(@CurrentUser() user: AuthUser, @Body() dto: CreerWorkflowTemplateDto) {
    return this.service.creerTemplate(user, dto);
  }

  @Get('templates')
  @Roles(
    Role.ADMIN_SI,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
  )
  listerTemplates() {
    return this.service.listerTemplates();
  }

  @Post('demandes/:demandeId/demarrer/:templateId')
  @Roles(Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI)
  demarrerInstance(
    @CurrentUser() user: AuthUser,
    @Param('demandeId', ParseUUIDPipe) demandeId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    return this.service.demarrerInstance(user, demandeId, templateId);
  }

  @Get('demandes/:demandeId/etapes')
  @Roles(
    Role.CONTRIBUABLE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  listerEtapes(@Param('demandeId', ParseUUIDPipe) demandeId: string) {
    return this.service.listerEtapesInstance(demandeId);
  }

  @Post('etapes/:etapeId/valider')
  @Roles(
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.ADMIN_SI,
  )
  validerEtape(
    @CurrentUser() user: AuthUser,
    @Param('etapeId', ParseUUIDPipe) etapeId: string,
    @Body() dto: ValiderEtapeDto,
  ) {
    return this.service.validerEtape(user, etapeId, dto);
  }
}
