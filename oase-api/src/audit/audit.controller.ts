import { Controller, Get, Post, Query, UseGuards, ParseUUIDPipe, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { AuditService } from './audit.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(Role.AUDITEUR, Role.DECIDEUR, Role.ADMIN_SI)
  async lister(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('utilisateurId') utilisateurId?: string,
    @Query('entite') entite?: string,
  ) {
    return this.audit.lister({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      action,
      utilisateurId,
      entite,
    });
  }

  @Get('verify-chain')
  @Roles(Role.AUDITEUR, Role.ADMIN_SI)
  async verifyChain() {
    return this.audit.verifyChain();
  }

  @Post('verify-chain')
  @Roles(Role.AUDITEUR, Role.ADMIN_SI)
  async verifyChainPost() {
    return this.audit.verifyChain();
  }

  @Get(':id')
  @Roles(Role.AUDITEUR, Role.DECIDEUR, Role.ADMIN_SI)
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.audit.trouverParId(id);
  }
}
