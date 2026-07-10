import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { UtilisateursService } from './utilisateurs.service';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';

@Controller('utilisateurs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class UtilisateursController {
  constructor(private service: UtilisateursService) {}

  @Post()
  @Roles(Role.ADMIN_SI)
  creer(@CurrentUser() admin: AuthUser, @Body() dto: CreerUtilisateurDto) {
    return this.service.creer(admin.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN_SI)
  lister(@Query() dto: FiltrerUtilisateursDto) {
    return this.service.lister(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.service.detail(user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN_SI)
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_SI)
  modifier(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierUtilisateurDto,
  ) {
    return this.service.modifier(admin.id, id, dto);
  }

  @Post(':id/reset-mfa')
  @Roles(Role.ADMIN_SI)
  resetMfa(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resetMfa(admin.id, id);
  }

  @Post(':id/reset-pin')
  @Roles(Role.ADMIN_SI)
  resetPin(@CurrentUser() admin: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resetPin(admin.id, id);
  }
}
