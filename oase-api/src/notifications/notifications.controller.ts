import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { NotificationsService, EnvoyerNotificationDto } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @Roles(
    Role.CONTRIBUABLE,
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
  lister(@CurrentUser() user: AuthUser, @Query('lues') lues?: string) {
    const parsedLues = lues === undefined ? undefined : lues === 'true';
    return this.service.lister(user, parsedLues);
  }

  @Get('unread-count')
  @Roles(
    Role.CONTRIBUABLE,
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
  compterNonLues(@CurrentUser() user: AuthUser) {
    return this.service.compterNonLues(user);
  }

  @Post()
  @Roles(Role.ADMIN_SI)
  envoyer(@CurrentUser() user: AuthUser, @Body() dto: EnvoyerNotificationDto) {
    return this.service.envoyer(dto);
  }

  @Patch(':id/lue')
  @Roles(
    Role.CONTRIBUABLE,
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
  marquerLue(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.marquerLue(user, id);
  }
}
