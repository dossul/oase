import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MesureRegistre {
  baseJuridiqueId: string;
  codeMesure: string;
  libelle: string | null;
  impotConcerne: string | null;
  typeTexte1: string | null;
  organeGestionCode: string | null;
  estActive: boolean | null;
  nombreDemandes: number;
  nombreApprouvees: number;
  montantTotalAccorde: string;
  derniereDecision: { typeCode: string; date: Date } | null;
}

/**
 * Registre central des mesures : vue consolidée par base juridique avec
 * agrégats réels calculés depuis demandes / decisions / actes.
 */
@Injectable()
export class RegistreCentralService {
  constructor(private prisma: PrismaService) {}

  async mesures(): Promise<MesureRegistre[]> {
    const [bases, versions, demandes, decisions] = await Promise.all([
      this.prisma.baseJuridique.findMany({ orderBy: { codeMesure: 'asc' } }),
      this.prisma.baseJuridiqueVersion.findMany({ where: { versionCouranteFlag: 1 } }),
      this.prisma.demande.findMany({
        where: { deletedAt: null },
        select: { id: true, baseJuridiqueVersionId: true, statutCode: true, montantFcfa: true },
      }),
      this.prisma.decision.findMany({
        select: { demandeId: true, typeCode: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const versionParId = new Map(versions.map((v) => [v.id, v]));
    const versionCouranteParBase = new Map(versions.map((v) => [v.baseJuridiqueId, v]));

    // Demande → base juridique (via sa version)
    const demandeParBase = new Map<string, string>();
    for (const d of demandes) {
      const v = versionParId.get(d.baseJuridiqueVersionId);
      if (v) demandeParBase.set(d.id, v.baseJuridiqueId);
    }

    // Dernière décision par base (decisions déjà triées desc)
    const derniereDecisionParBase = new Map<string, { typeCode: string; date: Date }>();
    for (const dec of decisions) {
      const baseId = demandeParBase.get(dec.demandeId);
      if (baseId && !derniereDecisionParBase.has(baseId)) {
        derniereDecisionParBase.set(baseId, { typeCode: dec.typeCode, date: dec.createdAt });
      }
    }

    // Agrégats par base
    const agg = new Map<string, { nombre: number; approuvees: number; montant: bigint }>();
    for (const d of demandes) {
      const baseId = demandeParBase.get(d.id);
      if (!baseId) continue;
      const a = agg.get(baseId) ?? { nombre: 0, approuvees: 0, montant: 0n };
      a.nombre++;
      if (d.statutCode === 'approuve') {
        a.approuvees++;
        a.montant += d.montantFcfa ?? 0n;
      }
      agg.set(baseId, a);
    }

    return bases.map((b) => {
      const v = versionCouranteParBase.get(b.id);
      const a = agg.get(b.id) ?? { nombre: 0, approuvees: 0, montant: 0n };
      return {
        baseJuridiqueId: b.id,
        codeMesure: b.codeMesure,
        libelle: v?.libelle ?? null,
        impotConcerne: v?.impotConcerne ?? null,
        typeTexte1: v?.typeTexte1 ?? null,
        organeGestionCode: v?.organeGestionCode ?? null,
        estActive: v?.estActive ?? null,
        nombreDemandes: a.nombre,
        nombreApprouvees: a.approuvees,
        montantTotalAccorde: a.montant.toString(),
        derniereDecision: derniereDecisionParBase.get(b.id) ?? null,
      };
    });
  }
}
