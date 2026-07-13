import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EtaxAdapter } from '../connecteurs/adapters/etax.adapter';

export interface Blocage {
  code: string;
  bloque: boolean;
  libelle: string;
  details?: string;
  gravite: 'critique' | 'elevee' | 'moyenne' | 'faible';
}

@Injectable()
export class ReglesBlocageService {
  constructor(
    private prisma: PrismaService,
    private etax: EtaxAdapter,
  ) {}

  async evaluer(demandeId: string): Promise<Blocage[]> {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
      include: { contribuables: true, piecesJointes: true, anomalies: true, quotaMouvements: true },
    });
    if (!demande) return [{ code: 'bloc-inconnu', bloque: true, libelle: 'Demande introuvable', gravite: 'critique' }];

    const resultats: Blocage[] = [];

    const dette = await this.evaluerDetteFiscale(demande.contribuables.nif);
    resultats.push(dette);

    const anomalies = await this.evaluerAnomalies(demandeId);
    resultats.push(anomalies);

    const quota = await this.evaluerQuota(demande);
    resultats.push(quota);

    const expiration = await this.evaluerExpiration(demande.dateEcheance);
    resultats.push(expiration);

    const pieces = await this.evaluerPiecesManquantes(demandeId, demande.piecesJointes);
    resultats.push(pieces);

    return resultats;
  }

  async estBloque(demandeId: string): Promise<{ bloque: boolean; blocages: Blocage[] }> {
    const blocages = await this.evaluer(demandeId);
    return { bloque: blocages.some((b) => b.bloque && b.gravite === 'critique'), blocages };
  }

  private async evaluerDetteFiscale(nif: string): Promise<Blocage> {
    const statut = await this.etax.getStatutFiscal(nif);
    if (statut.statut === 'dette_active') {
      return {
        code: 'bloc-01',
        bloque: true,
        libelle: 'Dette fiscale active detectee',
        details: `Solde: ${statut.solde_dette_fcfa} FCFA`,
        gravite: 'critique',
      };
    }
    return { code: 'bloc-01', bloque: false, libelle: 'Situation fiscale conforme', gravite: 'faible' };
  }

  private async evaluerAnomalies(demandeId: string): Promise<Blocage> {
    const count = await this.prisma.anomalie.count({ where: { demandeId, statutCode: { not: 'resolu' } } });
    if (count > 0) {
      return {
        code: 'bloc-02',
        bloque: true,
        libelle: 'Anomalies non resolues',
        details: `${count} anomalie(s)`,
        gravite: 'elevee',
      };
    }
    return { code: 'bloc-02', bloque: false, libelle: 'Aucune anomalie bloquante', gravite: 'faible' };
  }

  private async evaluerQuota(demande: any): Promise<Blocage> {
    if (demande.quotaTotal && demande.quotaConsomme !== null && demande.quotaConsomme >= demande.quotaTotal) {
      return {
        code: 'bloc-03',
        bloque: true,
        libelle: 'Quota epuise',
        details: `${demande.quotaConsomme}/${demande.quotaTotal}`,
        gravite: 'critique',
      };
    }
    return { code: 'bloc-03', bloque: false, libelle: 'Quota disponible', gravite: 'faible' };
  }

  private async evaluerExpiration(dateEcheance: Date | null): Promise<Blocage> {
    if (dateEcheance && new Date() > dateEcheance) {
      return {
        code: 'bloc-04',
        bloque: true,
        libelle: 'Demande expiree',
        details: `Echeance: ${dateEcheance.toISOString()}`,
        gravite: 'critique',
      };
    }
    return { code: 'bloc-04', bloque: false, libelle: 'Echeance respectee', gravite: 'faible' };
  }

  private async evaluerPiecesManquantes(demandeId: string, pieces: any[]): Promise<Blocage> {
    const rangsRequis = ['premier', 'second'];
    const rangsManquants = rangsRequis.filter((r) => !pieces.some((p) => p.rangCode === r && p.estValide !== false));
    if (rangsManquants.length > 0) {
      return {
        code: 'bloc-05',
        bloque: true,
        libelle: 'Pieces manquantes ou invalides',
        details: `Rangs: ${rangsManquants.join(', ')}`,
        gravite: 'elevee',
      };
    }
    return { code: 'bloc-05', bloque: false, libelle: 'Pieces requises presentes', gravite: 'faible' };
  }
}
