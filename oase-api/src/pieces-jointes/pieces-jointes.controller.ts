import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile as NestUploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { PiecesJointesService, LocalUploadedFile } from './pieces-jointes.service';
import { UploadPieceJointeDto } from './dto/upload-piece-jointe.dto';

@Controller('demandes/:demandeId/pieces-jointes')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PiecesJointesController {
  constructor(private service: PiecesJointesService) {}

  @Post()
  @Roles(Role.BENEFICIAIRE, Role.ADMIN_SI)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthUser,
    @Param('demandeId', ParseUUIDPipe) demandeId: string,
    @NestUploadedFile() file: LocalUploadedFile,
    @Body() dto: UploadPieceJointeDto,
  ) {
    if (!file) throw new BadRequestException({ code: 'FICHIER_MANQUANT' });
    return this.service.upload(user, demandeId, file, dto);
  }

  @Get()
  @Roles(
    Role.BENEFICIAIRE,
    Role.AGENT_CI,
    Role.AGENT_CDDI,
    Role.AGENT_DGBF,
    Role.AGENT_DGTCP,
    Role.AGENT_AGENCE,
    Role.AGENT_MAE,
    Role.AGENT_DGMG,
    Role.AGENT_MINISTERE,
    Role.DECIDEUR,
    Role.AGENT_CONEDEF,
    Role.AUDITEUR,
    Role.ADMIN_SI,
  )
  lister(@Param('demandeId', ParseUUIDPipe) demandeId: string) {
    return this.service.listerParDemande(demandeId);
  }

  @Patch(':pieceId/valider')
  @Roles(Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI)
  valider(
    @CurrentUser() user: AuthUser,
    @Param('pieceId', ParseUUIDPipe) pieceId: string,
    @Body('estValide') estValide: boolean,
    @Body('commentaire') commentaire?: string,
  ) {
    return this.service.valider(user, pieceId, estValide, commentaire);
  }

  @Patch(':pieceId/invalider')
  @Roles(Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI)
  invalider(
    @CurrentUser() user: AuthUser,
    @Param('pieceId', ParseUUIDPipe) pieceId: string,
    @Body('commentaire') commentaire?: string,
  ) {
    return this.service.valider(user, pieceId, false, commentaire);
  }
}
