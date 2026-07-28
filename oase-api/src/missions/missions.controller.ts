import { Body, Controller, Get, Param, Post, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { MissionsService } from './missions.service';
import { CreerMissionDto } from './dto/creer-mission.dto';

const LECTEURS = [Role.AUDITEUR, Role.ADMIN_SI, Role.AGENT_CI] as const;

@Controller('missions')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MissionsController {
  constructor(private service: MissionsService) {}

  @Get()
  @Roles(...LECTEURS)
  lister(@Query('statut') statut?: string, @Query('type') type?: string) {
    return this.service.lister(statut, type);
  }

  @Get(':id')
  @Roles(...LECTEURS)
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(id);
  }

  @Post()
  @Roles(Role.ADMIN_SI)
  creer(@CurrentUser() admin: AuthUser, @Body() dto: CreerMissionDto) {
    return this.service.creer(admin.id, dto);
  }
}
