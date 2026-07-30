import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type StatutRapprochement = 'reconcile' | 'en_ecart' | 'a_justifier';

export interface LigneRapprochement {
  id: string;
  reference: string;
  contribuable: string;
  nif: string;
  flux: string;
  systeme: string;
  statut: StatutRapprochement;
  impact: 'Budgetaire' | 'Documentaire';
  montantDemande: number;
  montantAtteste: number;
  ecart: number;
  dateDecision: string | null;
  justification: string;
}

/**
 * Rapprochement RÉEL interne OASE (DGTCP) : cohérence demandes approuvées
 * ↔ actes d'attestation émis (montants, présence).
 *
 * Règles de rapprochement :
 *  - a_justifier : demande approuvée SANS acte d'attestation (documentaire)
 *  - en_ecart    : somme des actes non révoqués ≠ montant de la demande (budgétaire)
 *  - reconcile   : acte(s) présent(s) et montants concordants
 *
 * Les rapprochements avec les SI externes (GUDEF, SIGFiP, Sydonia, E-TAX)
 * sont volontairement hors périmètre à cette étape du projet (décision client).
 */
@Injectable()
export class RapprochementsService {
  constructor(private readonly prisma: PrismaService) {}

  async lister() {
    const demandes = await this.prisma.demande.findMany({
      where: { statutCode: 'approuve' },
      include: {
        contribuables: { select: { raisonSociale: true, nif: true } },
        actes: {
          where: { typeCode: 'attestation' },
          select: { id: true, montantFcfa: true, estRevoke: true, dateEffet: true },
        },
        decisions: {
          where: { typeCode: 'approbation' },
          select: { dateDecision: true },
          orderBy: { dateDecision: 'desc' },
          take: 1,
        },
      },
      orderBy: { reference: 'asc' },
    });

    const lignes: LigneRapprochement[] = demandes.map((d) => {
      const montantDemande = Number(d.montantFcfa ?? 0);
      const actesValides = d.actes.filter((a) => !a.estRevoke);
      const montantAtteste = actesValides.reduce((s, a) => s + Number(a.montantFcfa ?? 0), 0);
      const ecart = montantAtteste - montantDemande;

      let statut: StatutRapprochement;
      let impact: 'Budgetaire' | 'Documentaire';
      let justification: string;

      if (actesValides.length === 0) {
        statut = 'a_justifier';
        impact = 'Documentaire';
        justification =
          'Demande approuvée sans acte d’attestation émis. Vérifier la génération de l’acte et la chaîne de signature avant la clôture budgétaire.';
      } else if (ecart !== 0) {
        statut = 'en_ecart';
        impact = 'Budgetaire';
        justification = `Écart de ${ecart > 0 ? '+' : ''}${ecart.toLocaleString('fr-FR')} FCFA entre le montant approuvé (${montantDemande.toLocaleString('fr-FR')}) et le montant attesté (${montantAtteste.toLocaleString('fr-FR')}). Rapprocher avec la décision d’approbation et les pièces rattachées.`;
      } else {
        statut = 'reconcile';
        impact = 'Budgetaire';
        justification = 'Montants concordants entre la demande approuvée et l’acte d’attestation.';
      }

      return {
        id: d.id,
        reference: d.reference,
        contribuable: d.contribuables?.raisonSociale ?? '—',
        nif: d.contribuables?.nif ?? '—',
        flux: 'Demande approuvée → Attestation',
        systeme: 'OASE',
        statut,
        impact,
        montantDemande,
        montantAtteste,
        ecart,
        dateDecision: d.decisions[0]?.dateDecision?.toISOString() ?? null,
        justification,
      };
    });

    const kpis = {
      total: lignes.length,
      reconciles: lignes.filter((l) => l.statut === 'reconcile').length,
      enEcart: lignes.filter((l) => l.statut === 'en_ecart').length,
      aJustifier: lignes.filter((l) => l.statut === 'a_justifier').length,
      montantEcarts: lignes.filter((l) => l.statut === 'en_ecart').reduce((s, l) => s + Math.abs(l.ecart), 0),
    };

    return { data: lignes, kpis };
  }
}
