import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Rapportage ITIE — phase E4.
 *
 * Règle d'honnêteté (cahier des charges + leçon recette) : ne sont exposées comme
 * « calculées » QUE les statistiques dérivables des données réellement présentes
 * dans OASE (conventions, permis, flux financiers E3). Tout indicateur exigeant
 * des sources externes (PIB INSEED, exportations nationales douanières, emploi
 * national, déclarations des régies) est déclaré dans `nonCalculables` avec la
 * source manquante — jamais remplacé par un chiffre fictif.
 */

export interface StatistiquesItie {
  annee: number;
  calculees: {
    societesPerimetre: number;
    conventionsActives: number;
    permisActifs: number;
    productionParSubstance: Array<{ substance: string; volumeT: number; valeurFcfa: number }>;
    exportationsParSubstance: Array<{ substance: string; volumeT: number; valeurFcfa: number }>;
    redevances: { montantDuFcfa: number; montantPayeFcfa: number; tauxRecouvrement: number };
    transfertsCfldr: { montantDuFcfa: number; montantEncaisseFcfa: number; tauxVersement: number };
    repartitionParEntite: Array<{
      nif: string;
      raisonSociale: string;
      volumeProductionT: number;
      valeurExportationsFcfa: number;
      redevanceDuFcfa: number;
      redevancePayeeFcfa: number;
      ecartRedevanceFcfa: number;
    }>;
  };
  nonCalculables: Array<{ indicateur: string; sourceRequise: string }>;
}

const NON_CALCULABLES = [
  { indicateur: 'Contribution du secteur extractif au PIB', sourceRequise: 'PIB national et valeur ajoutée sectorielle — INSEED / DGEAE' },
  { indicateur: 'Part du secteur dans les exportations nationales', sourceRequise: 'Statistiques douanières nationales — Office des Douanes' },
  { indicateur: 'Emploi total du secteur extractif', sourceRequise: 'Données emploi sectoriel — INSEED / DGMG' },
  { indicateur: 'Réconciliation paiements sociétés ↔ recettes régies', sourceRequise: 'Déclarations de recettes OTR / DGTCP rattachées au périmètre ITIE' },
];

const ECHAPPER_CSV = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

@Injectable()
export class ItieService {
  constructor(private readonly prisma: PrismaService) {}

  async statistiques(annee: number): Promise<StatistiquesItie> {
    const [conventions, permis, productions, exportations, redevances, transferts] = await Promise.all([
      this.prisma.convention.findMany({
        where: { statutCode: 'active' },
        include: { contribuables: { select: { id: true, nif: true, raisonSociale: true } } },
      }),
      this.prisma.permisMinier.findMany({ where: { statut: 'actif' } }),
      this.prisma.productionExtractive.findMany({
        where: { annee },
        include: { contribuables: { select: { id: true, nif: true, raisonSociale: true } } },
      }),
      this.prisma.exportationExtractive.findMany({
        where: { annee },
        include: { contribuables: { select: { id: true, nif: true, raisonSociale: true } } },
      }),
      this.prisma.redevanceMiniere.findMany({
        where: { annee },
        include: { contribuables: { select: { id: true, nif: true, raisonSociale: true } } },
      }),
      this.prisma.transfertCommuneCfldr.findMany({ where: { annee } }),
    ]);

    // Périmètre = sociétés titulaires d'une convention active
    const societes = new Map<string, { nif: string; raisonSociale: string }>();
    for (const c of conventions) {
      if (c.contribuables) societes.set(c.contribuableId, { nif: c.contribuables.nif, raisonSociale: c.contribuables.raisonSociale });
    }

    const agregat = <T extends { substance: string }>(
      lignes: T[],
      volume: (l: T) => number,
      valeur: (l: T) => number,
    ) => {
      const parSubstance = new Map<string, { volumeT: number; valeurFcfa: number }>();
      for (const l of lignes) {
        const entree = parSubstance.get(l.substance) ?? { volumeT: 0, valeurFcfa: 0 };
        entree.volumeT += volume(l);
        entree.valeurFcfa += valeur(l);
        parSubstance.set(l.substance, entree);
      }
      return [...parSubstance.entries()].map(([substance, v]) => ({ substance, ...v }));
    };

    const redevanceDu = redevances.reduce((s, r) => s + Number(r.montantDuFcfa ?? 0), 0);
    const redevancePayee = redevances.reduce((s, r) => s + Number(r.montantPayeFcfa ?? 0), 0);
    const cfldrDu = transferts.reduce((s, t) => s + Number(t.montantDuFcfa ?? 0), 0);
    const cfldrEncaisse = transferts.reduce((s, t) => s + Number(t.montantEncaisseFcfa ?? 0), 0);

    const repartitionParEntite = [...societes.entries()].map(([contribuableId, s]) => {
      const prod = productions.filter((p) => p.contribuableId === contribuableId);
      const exp = exportations.filter((e) => e.contribuableId === contribuableId);
      const red = redevances.filter((r) => r.contribuableId === contribuableId);
      const du = red.reduce((x, r) => x + Number(r.montantDuFcfa ?? 0), 0);
      const paye = red.reduce((x, r) => x + Number(r.montantPayeFcfa ?? 0), 0);
      return {
        nif: s.nif,
        raisonSociale: s.raisonSociale,
        volumeProductionT: prod.reduce((x, p) => x + Number(p.volumeProduitT ?? 0), 0),
        valeurExportationsFcfa: exp.reduce((x, e) => x + Number(e.valeurFcfa ?? 0), 0),
        redevanceDuFcfa: du,
        redevancePayeeFcfa: paye,
        ecartRedevanceFcfa: du - paye,
      };
    });

    return {
      annee,
      calculees: {
        societesPerimetre: societes.size,
        conventionsActives: conventions.length,
        permisActifs: permis.length,
        productionParSubstance: agregat(productions, (p) => Number(p.volumeProduitT ?? 0), (p) => Number(p.valeurMarchandeFcfa ?? 0)),
        exportationsParSubstance: agregat(exportations, (e) => Number(e.volumeT ?? 0), (e) => Number(e.valeurFcfa ?? 0)),
        redevances: {
          montantDuFcfa: redevanceDu,
          montantPayeFcfa: redevancePayee,
          tauxRecouvrement: redevanceDu > 0 ? Math.round((redevancePayee / redevanceDu) * 100) : 0,
        },
        transfertsCfldr: {
          montantDuFcfa: cfldrDu,
          montantEncaisseFcfa: cfldrEncaisse,
          tauxVersement: cfldrDu > 0 ? Math.round((cfldrEncaisse / cfldrDu) * 100) : 0,
        },
        repartitionParEntite,
      },
      nonCalculables: NON_CALCULABLES,
    };
  }

  /**
   * Export CSV du formulaire de déclaration — format Annexe 1.1 feuille 1 :
   * réf ; nomenclature flux ; payé à / reçu par ; montant FCFA ; montant devise ; commentaires.
   * Lignes construites depuis les paiements réels (redevances + transferts CFLDR).
   */
  async exportDeclarationCsv(annee: number): Promise<string> {
    const [redevances, transferts] = await Promise.all([
      this.prisma.redevanceMiniere.findMany({
        where: { annee },
        include: { contribuables: { select: { nif: true, raisonSociale: true } } },
        orderBy: [{ trimestre: 'asc' as const }],
      }),
      this.prisma.transfertCommuneCfldr.findMany({
        where: { annee },
        include: { contribuables: { select: { nif: true, raisonSociale: true } } },
      }),
    ]);

    const lignes = [
      'ref;nomenclature_flux;paye_a_recu_par;montant_fcfa;montant_devise;commentaires',
      ...redevances.map((r) =>
        [
          ECHAPPER_CSV(r.referencePaiement ?? `RED-${annee}-T${r.trimestre}`),
          ECHAPPER_CSV(`Redevance minière ${r.substance} T${r.trimestre} ${annee}`),
          ECHAPPER_CSV(`${r.contribuables.raisonSociale} (NIF ${r.contribuables.nif}) → Trésor Public`),
          String(Number(r.montantPayeFcfa ?? 0)),
          '',
          ECHAPPER_CSV(`Dû ${Number(r.montantDuFcfa ?? 0)} FCFA — taux ${r.taux ?? 'n/a'} %`),
        ].join(';'),
      ),
      ...transferts.map((t) =>
        [
          ECHAPPER_CSV(`CFLDR-${annee}-${t.commune}`),
          ECHAPPER_CSV(`Transfert CFLDR 0,75 % CA — ${t.commune} ${annee}`),
          ECHAPPER_CSV(`${t.contribuables.raisonSociale} (NIF ${t.contribuables.nif}) → Commune ${t.commune}`),
          String(Number(t.montantEncaisseFcfa ?? 0)),
          '',
          ECHAPPER_CSV(`Dû ${Number(t.montantDuFcfa ?? 0)} FCFA`),
        ].join(';'),
      ),
    ];
    return lignes.join('\n');
  }
}
