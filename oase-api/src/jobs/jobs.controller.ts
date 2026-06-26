import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get('heartbeat')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE)
  async heartbeat() {
    return this.service.getHeartbeat();
  }

  @Post('archiver')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE)
  async archiver(@Body('jours') jours: number, @CurrentUser('id') utilisateurId: string) {
    return this.service.archiverDemandesAncienne(utilisateurId, jours);
  }
}
