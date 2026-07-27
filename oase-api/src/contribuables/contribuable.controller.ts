import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { ContribuableService } from './contribuable.service';
import { UpdateContribuableDto } from './dto/update-contribuable.dto';
import { Request } from 'express';

@ApiTags('contribuables')
@Controller('contribuables')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ContribuableController {
  constructor(private service: ContribuableService) {}

  @Get('me')
  @Roles(Role.CONTRIBUABLE, Role.ADMIN_SI)
  @ApiOperation({
    summary:
      "Profil contribuable de l'utilisateur connecté + détail complétude + alertes",
  })
  getMe(@CurrentUser() user: AuthUser) {
    return this.service.getMyProfile(user.id);
  }

  @Patch('me')
  @Roles(Role.CONTRIBUABLE, Role.ADMIN_SI)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary:
      "Mise à jour partielle du profil contribuable + recalcul automatique de la complétude (lock à 100%)",
  })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateContribuableDto,
    @Req() req: Request,
  ) {
    return this.service.updateMyProfile(
      user.id,
      dto,
      req.ip ?? 'unknown',
      req.headers['user-agent'] ?? '',
    );
  }
}
