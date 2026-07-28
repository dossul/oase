import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreerMissionDto } from './dto/creer-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async lister(statut?: string, type?: string) {
    const where: any = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    return this.prisma.mission.findMany({
      where,
      include: {
        auditeur: { select: { id: true, nom: true, prenom: true, role: true } },
        demande: { select: { id: true, reference: true, statutCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detail(id: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: {
        auditeur: { select: { id: true, nom: true, prenom: true, role: true } },
        demande: { select: { id: true, reference: true, statutCode: true } },
      },
    });
    if (!mission) throw new NotFoundException({ code: 'MISSION_INEXISTANTE' });
    return mission;
  }

  async creer(adminId: string, dto: CreerMissionDto) {
    const existante = await this.prisma.mission.findUnique({ where: { reference: dto.reference } });
    if (existante) throw new ConflictException({ code: 'REFERENCE_EXISTANTE' });

    const auditeur = await this.prisma.utilisateur.findUnique({ where: { id: dto.auditeurId } });
    if (!auditeur) throw new NotFoundException({ code: 'AUDITEUR_INEXISTANT' });

    if (dto.demandeId) {
      const demande = await this.prisma.demande.findUnique({ where: { id: dto.demandeId } });
      if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });
    }

    const mission = await this.prisma.mission.create({
      data: {
        reference: dto.reference,
        titre: dto.titre,
        type: dto.type,
        statut: dto.statut ?? 'planifiee',
        organe: dto.organe,
        auditeurId: dto.auditeurId,
        demandeId: dto.demandeId ?? null,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
        constats: dto.constats,
        recommandations: dto.recommandations,
      },
      include: {
        auditeur: { select: { id: true, nom: true, prenom: true, role: true } },
        demande: { select: { id: true, reference: true, statutCode: true } },
      },
    });

    await this.audit.createEntry({
      action: 'MISSION_CREEE',
      entite: 'missions',
      entiteId: mission.id,
      utilisateurId: adminId,
      nouvelleValeur: { reference: dto.reference, type: dto.type, auditeurId: dto.auditeurId },
    });

    return mission;
  }
}
