import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreerConventionDto, RenouvelerConventionDto } from './dto/creer-convention.dto';

@Injectable()
export class ConventionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async lister(beneficiaireId?: string) {
    const where: Record<string, unknown> = {};
    if (beneficiaireId) where.beneficiaireId = beneficiaireId;

    return this.prisma.convention.findMany({
      where,
      include: {
        beneficiaires: true,
        baseJuridiqueVersions: { include: { basesJuridiques: true } },
        conventionEngagements: true,
      },
      orderBy: { dateFin: 'asc' as const },
    });
  }

  async trouverParId(id: string) {
    const convention = await this.prisma.convention.findUnique({
      where: { id },
      include: {
        beneficiaires: true,
        baseJuridiqueVersions: { include: { basesJuridiques: true } },
        conventionEngagements: true,
      },
    });
    if (!convention) throw new NotFoundException('Convention non trouvée');
    return convention;
  }

  async creer(dto: CreerConventionDto, utilisateurId: string) {
    const existante = await this.prisma.convention.findUnique({
      where: { reference: dto.reference },
    });
    if (existante) throw new ConflictException('Référence convention déjà utilisée');

    const convention = await this.prisma.convention.create({
      data: {
        reference: dto.reference,
        beneficiaireId: dto.beneficiaireId,
        baseJuridiqueVersionId: dto.baseJuridiqueVersionId,
        accordSiegeId: dto.accordSiegeId,
        regimeCode: dto.regimeCode,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        montantEstime: dto.montantEstime ? BigInt(dto.montantEstime) : null,
        emploisEngages: dto.emploisEngages ?? null,
        emploisCrees: dto.emploisCrees ?? null,
        zoneZfi: dto.zoneZfi ?? null,
        objet: dto.objet ?? null,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'CONVENTION_CREER',
      entite: 'Convention',
      entiteId: convention.id,
      nouvelleValeur: { reference: dto.reference, dateFin: dto.dateFin },
    });

    return convention;
  }

  async renouveler(id: string, dto: RenouvelerConventionDto, utilisateurId: string) {
    const convention = await this.prisma.convention.findUnique({ where: { id } });
    if (!convention) throw new NotFoundException('Convention non trouvée');

    const dateFin = new Date(dto.dateFin);
    if (dateFin <= new Date(convention.dateFin)) {
      throw new ConflictException('La nouvelle date de fin doit être postérieure');
    }

    const updated = await this.prisma.convention.update({
      where: { id },
      data: {
        dateFin,
        montantEstime: dto.montantEstime ? BigInt(dto.montantEstime) : convention.montantEstime,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'CONVENTION_RENOUVELER',
      entite: 'Convention',
      entiteId: id,
      ancienneValeur: { dateFin: convention.dateFin.toISOString() },
      nouvelleValeur: { dateFin: dto.dateFin },
    });

    return updated;
  }

  async verifierAlertesEcheance(utilisateurId: string) {
    const dans30Jours = new Date();
    dans30Jours.setDate(dans30Jours.getDate() + 30);

    const conventions = await this.prisma.convention.findMany({
      where: {
        statutCode: 'active',
        dateFin: { lte: dans30Jours },
      },
      include: { beneficiaires: true },
    });

    for (const convention of conventions) {
      await this.notifications.envoyer({
        utilisateurId,
        typeNotificationCode: 'convention_echeance_j30',
        canalCode: 'inapp',
        titre: 'Convention proche de l’échéance',
        corps: `La convention ${convention.reference} expire le ${convention.dateFin.toISOString().split('T')[0]}.`,
      });
    }

    return { alertes: conventions.length };
  }
}
