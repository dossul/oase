import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { ReglesBlocageService } from './regles-blocage.service';

@Controller('api/v1/demandes/:demandeId/blocages')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReglesBlocageController {
  constructor(private service: ReglesBlocageService) {}

  @Get()
  @Roles(
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  evaluer(@Param('demandeId', ParseUUIDPipe) demandeId: string) {
    return this.service.evaluer(demandeId);
  }
}
