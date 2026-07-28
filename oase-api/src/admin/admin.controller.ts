import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('parametres')
  @Roles(Role.ADMIN_SI)
  parametres() {
    return this.service.parametres();
  }

  @Put('parametres')
  @Roles(Role.ADMIN_SI)
  majParametres(@Body() updates: Record<string, string>) {
    return this.service.majParametres(updates);
  }

  @Get('monitoring')
  @Roles(Role.ADMIN_SI)
  monitoring() {
    return this.service.monitoring();
  }
}

@Controller('referentiels')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReferentielsController {
  constructor(private service: AdminService) {}

  @Get('inseed')
  @Roles(
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
  inseed() {
    return this.service.inseed();
  }

  @Put('inseed')
  @Roles(Role.ADMIN_SI)
  majInseed(@Body() updates: Record<string, string>) {
    return this.service.majInseed(updates);
  }
}
