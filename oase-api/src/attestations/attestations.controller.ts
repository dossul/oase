import { Controller, Get, Post, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { AttestationsService } from './attestations.service';

@Controller('api/v1/attestations')
export class AttestationsController {
  constructor(private service: AttestationsService) {}

  @Post('actes/:acteId')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles(Role.DECIDEUR, Role.ADMIN_SI)
  generer(@Param('acteId', ParseUUIDPipe) acteId: string) {
    return this.service.generer(acteId);
  }

  @Get('verifier/:qrHash')
  verifier(@Param('qrHash') qrHash: string) {
    return this.service.verifier(qrHash);
  }
}
