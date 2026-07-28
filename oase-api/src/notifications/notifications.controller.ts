import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
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
    Role.AGENT_DSI_MEF,
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
    Role.AGENT_DSI_MEF,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  compterNonLues(@CurrentUser() user: AuthUser) {
    return this.service.compterNonLues(user);
  }

  @Get('templates')
  @Roles(Role.ADMIN_SI)
  templates() {
    return this.service.templates();
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
    Role.AGENT_DSI_MEF,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  async marquerLue(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    // OASE [BUG #13] fix : 404 uniforme quand la notification n'existe pas OU
    // appartient à un autre utilisateur. Auparavant le service renvoyait `null`
    // et NestJS répondait 200 + body null — ce qui permettait de distinguer
    // « existe mais pas à moi » (200 null) de « à moi » (200 objet), fuite
    // d'information inter-utilisateurs (détecté par notifications.spec.ts).
    const notif = await this.service.marquerLue(user, id);
    if (!notif) throw new NotFoundException('Notification introuvable');
    return notif;
  }
}
