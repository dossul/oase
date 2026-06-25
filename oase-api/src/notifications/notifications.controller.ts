import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { NotificationsService, EnvoyerNotificationDto } from './notifications.service';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  lister(@CurrentUser() user: AuthUser, @Query('lues') lues?: string) {
    const parsedLues = lues === undefined ? undefined : lues === 'true';
    return this.service.lister(user, parsedLues);
  }

  @Post()
  envoyer(@CurrentUser() user: AuthUser, @Body() dto: EnvoyerNotificationDto) {
    return this.service.envoyer(dto);
  }

  @Patch(':id/lue')
  marquerLue(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.marquerLue(user, id);
  }
}
