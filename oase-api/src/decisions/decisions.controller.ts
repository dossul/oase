import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { DecisionsService } from './decisions.service';

class DecisionDto {
  pin: string;
  motif?: string;
}

@Controller('demandes/:demandeId/decisions')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DecisionsController {
  constructor(private service: DecisionsService) {}

  @Post('approuver')
  @Roles(Role.DECIDEUR, Role.ADMIN_SI)
  approuver(
    @CurrentUser() user: AuthUser,
    @Param('demandeId', ParseUUIDPipe) demandeId: string,
    @Body() dto: DecisionDto,
  ) {
    return this.service.approuver(user, demandeId, dto.pin, dto.motif);
  }

  @Post('rejeter')
  @Roles(
    Role.DECIDEUR,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.ADMIN_SI,
  )
  rejeter(
    @CurrentUser() user: AuthUser,
    @Param('demandeId', ParseUUIDPipe) demandeId: string,
    @Body() dto: DecisionDto,
  ) {
    if (!dto.motif) throw new Error('Motif requis');
    return this.service.rejeter(user, demandeId, dto.pin, dto.motif);
  }

  @Get()
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
  lister(@Param('demandeId', ParseUUIDPipe) demandeId: string) {
    return this.service.listerParDemande(demandeId);
  }
}
