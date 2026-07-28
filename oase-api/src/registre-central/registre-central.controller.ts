import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { RegistreCentralService } from './registre-central.service';

@Controller('registre-central')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RegistreCentralController {
  constructor(private service: RegistreCentralService) {}

  @Get('mesures')
  @Roles(Role.DECIDEUR, Role.AUDITEUR, Role.ADMIN_SI)
  mesures() {
    return this.service.mesures();
  }
}
