import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { ConnecteursService } from './connecteurs.service';

@Controller('connecteurs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ConnecteursController {
  constructor(private service: ConnecteursService) {}

  @Get()
  @Roles(Role.ADMIN_SI, Role.AUDITEUR)
  lister() {
    return this.service.lister();
  }

  // NB : déclaré AVANT ':id/logs' pour éviter la capture par la route paramétrée.
  @Get('status')
  @Roles(Role.ADMIN_SI, Role.AUDITEUR)
  status() {
    return this.service.status();
  }

  @Get(':id/logs')
  @Roles(Role.ADMIN_SI, Role.AUDITEUR)
  logs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.logs(id, limit);
  }
}
