import { Controller, Get, Post, Param, UseGuards, ParseUUIDPipe, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { AttestationsService } from './attestations.service';

@Controller('attestations')
export class AttestationsController {
  constructor(private service: AttestationsService) {}

  @Post('actes/:acteId')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(Role.DECIDEUR, Role.ADMIN_SI)
  generer(@Param('acteId', ParseUUIDPipe) acteId: string) {
    return this.service.generer(acteId);
  }

  @Get('demandes/:demandeId/download')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(
    Role.CONTRIBUABLE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGBF,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.DECIDEUR,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  async telecharger(
    @CurrentUser() user: AuthUser,
    @Param('demandeId', ParseUUIDPipe) demandeId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fichier = await this.service.telechargerParDemande(user, demandeId);
    res.set({
      'Content-Type': fichier.mimeType,
      'Content-Disposition': `attachment; filename="${fichier.filename}"`,
    });
    return new StreamableFile(fichier.buffer);
  }

  @Get('verifier/:qrHash')
  verifier(@Param('qrHash') qrHash: string) {
    return this.service.verifier(qrHash);
  }
}
