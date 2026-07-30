import { Controller, forwardRef, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { RbacMatriceService } from './rbac-matrice.service';

/**
 * Matrice RBAC réelle (lecture seule), dérivée des métadonnées @Roles —
 * utilisée par la vue Admin > Rôles & habilitations.
 * NB : forwardRef car le service référence ce contrôleur dans sa liste
 * (la matrice se liste elle-même) — cycle cassé côté injection.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/rbac')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RbacMatriceController {
  constructor(
    @Inject(forwardRef(() => RbacMatriceService))
    private readonly service: RbacMatriceService,
  ) {}

  @Get('matrice')
  @Roles(Role.ADMIN_SI, Role.AUDITEUR)
  @ApiOperation({ summary: 'Matrice RBAC réelle : endpoints × rôles, dérivée des métadonnées @Roles des contrôleurs' })
  matrice() {
    return this.service.matrice();
  }
}
