import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { ItieService } from './itie.service';

const ROLES_LECTURE = [
  Role.CONTRIBUABLE,
  Role.AGENT_CI,
  Role.AGENT_CDDI,
  Role.AGENT_DGTCP,
  Role.AGENT_AGENCE,
  Role.AGENT_MAE,
  Role.AGENT_DGMG,
  Role.DECIDEUR,
  Role.AUDITEUR,
  Role.ADMIN_SI,
];

@Controller('itie')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ItieController {
  constructor(private readonly service: ItieService) {}

  @Get('statistiques')
  @Roles(...ROLES_LECTURE)
  async statistiques(@Query('annee') annee?: string) {
    return this.service.statistiques(annee ? parseInt(annee, 10) : new Date().getFullYear());
  }

  @Get('export-declaration')
  @Roles(...ROLES_LECTURE)
  async exportDeclaration(@Query('annee') annee: string | undefined, @Res() res: Response) {
    const anneeCible = annee ? parseInt(annee, 10) : new Date().getFullYear();
    const csv = await this.service.exportDeclarationCsv(anneeCible);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="declaration-itie-${anneeCible}.csv"`,
    });
    res.send('﻿' + csv);
  }
}
