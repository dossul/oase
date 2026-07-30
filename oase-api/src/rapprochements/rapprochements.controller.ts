import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { RapprochementsService } from './rapprochements.service';

/**
 * Rapprochements internes OASE (demandes approuvées ↔ attestations).
 * Lecture : DGTCP (trésor), décideur, auditeur, admin.
 */
@ApiTags('rapprochements')
@ApiBearerAuth()
@Controller('rapprochements')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RapprochementsController {
  constructor(private readonly service: RapprochementsService) {}

  @Get()
  @Roles(Role.AGENT_DGTCP, Role.DECIDEUR, Role.AUDITEUR, Role.ADMIN_SI)
  @ApiOperation({
    summary: 'Rapprochement réel demandes approuvées ↔ actes d’attestation (écarts budgétaires et documentaires)',
  })
  lister() {
    return this.service.lister();
  }
}
