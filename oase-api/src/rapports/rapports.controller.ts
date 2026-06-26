import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RapportsService } from './rapports.service';
import { GenererRapportDto } from './dto/generer-rapport.dto';

@Controller('rapports')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RapportsController {
  constructor(private readonly service: RapportsService) {}

  @Get()
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AUDITEUR)
  async lister() {
    return this.service.lister();
  }

  @Get('opendata')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AUDITEUR, Role.PUBLIC)
  async openData() {
    return this.service.openData();
  }

  @Get(':id')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AUDITEUR)
  async trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(id);
  }

  @Post('generer')
  @Roles(Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR)
  async generer(@Body() dto: GenererRapportDto, @CurrentUser('id') utilisateurId: string) {
    return this.service.generer(dto, utilisateurId);
  }
}
