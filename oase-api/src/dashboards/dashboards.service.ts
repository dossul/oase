import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async kpisP4(dateDebut?: string, dateFin?: string) {
    const where = this.dateWhere(dateDebut, dateFin);

    const [totalDemandes, demandesParStatut, demandesTraiteesMois] = await Promise.all([
      this.prisma.demande.count({ where }),
      this.prisma.demande.groupBy({
        by: ['statutCode'],
        where,
        _count: { id: true },
      }),
      this.prisma.demande.groupBy({
        by: ['dateDepot'],
        where: { ...where, statutCode: { not: 'brouillon' } },
        _count: { id: true },
      }),
    ]);

    return {
      totalDemandes,
      repartitionParStatut: demandesParStatut,
      evolutionJournaliere: demandesTraiteesMois,
    };
  }

  async kpisP5(dateDebut?: string, dateFin?: string) {
    const where = this.dateWhere(dateDebut, dateFin);

    const demandesAccordees = await this.prisma.demande.findMany({
      where,
      include: {
        decisions: { where: { typeCode: 'accord' } },
        baseJuridiqueVersions: { select: { impotConcerne: true } },
      },
    });

    const montantParImpot: Record<string, bigint> = {};
    let montantTotalAccorde = 0n;

    for (const demande of demandesAccordees) {
      if (demande.decisions.length === 0) continue;
      const montant = demande.montantFcfa ?? 0n;
      const impot = demande.baseJuridiqueVersions.impotConcerne ?? 'Inconnu';
      montantTotalAccorde += montant;
      montantParImpot[impot] = (montantParImpot[impot] ?? 0n) + montant;
    }

    const nombreContribuables = await this.prisma.contribuable.count({});

    return {
      montantTotalAccorde: montantTotalAccorde.toString(),
      montantParImpot: Object.entries(montantParImpot).map(([impot, montant]) => ({
        impot,
        montant: montant.toString(),
      })),
      nombreContribuables,
    };
  }

  private dateWhere(dateDebut?: string, dateFin?: string): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) (where.createdAt as Record<string, unknown>).gte = new Date(dateDebut);
      if (dateFin) (where.createdAt as Record<string, unknown>).lte = new Date(dateFin);
    }
    return where;
  }
}
