import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreerProductionDto,
  CreerExportationDto,
  CreerRedevanceDto,
  CreerTransfertCommuneDto,
} from './dto/flux-extractifs.dto';

const INCLUDE_CONTRIBUABLE = {
  contribuables: { select: { id: true, nif: true, raisonSociale: true } },
} as const;

@Injectable()
export class FluxExtractifsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------- Productions

  async listerProductions(filtres?: { contribuableId?: string; annee?: number }) {
    const where: Record<string, unknown> = {};
    if (filtres?.contribuableId) where.contribuableId = filtres.contribuableId;
    if (filtres?.annee) where.annee = filtres.annee;
    return this.prisma.productionExtractive.findMany({
      where,
      include: {
        ...INCLUDE_CONTRIBUABLE,
        permisMiniers: { select: { id: true, reference: true } },
      },
      orderBy: [{ annee: 'desc' as const }, { mois: 'desc' as const }],
    });
  }

  async creerProduction(dto: CreerProductionDto, utilisateurId: string) {
    const existante = await this.prisma.productionExtractive.findUnique({
      where: {
        contribuableId_annee_mois_substance: {
          contribuableId: dto.contribuableId,
          annee: dto.annee,
          mois: dto.mois,
          substance: dto.substance,
        },
      },
    });
    if (existante) throw new ConflictException('Production déjà déclarée pour cette période et substance');

    const production = await this.prisma.productionExtractive.create({
      data: {
        contribuableId: dto.contribuableId,
        permisId: dto.permisId ?? null,
        annee: dto.annee,
        mois: dto.mois,
        substance: dto.substance,
        volumeProduitT: dto.volumeProduitT ?? null,
        volumeVenduT: dto.volumeVenduT ?? null,
        volumeTraiteT: dto.volumeTraiteT ?? null,
        valeurMarchandeFcfa: dto.valeurMarchandeFcfa != null ? BigInt(dto.valeurMarchandeFcfa) : null,
        valeurMarchandeUsd: dto.valeurMarchandeUsd != null ? BigInt(dto.valeurMarchandeUsd) : null,
        chiffreAffairesFcfa: dto.chiffreAffairesFcfa != null ? BigInt(dto.chiffreAffairesFcfa) : null,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'FLUX_PRODUCTION_CREER',
      entite: 'ProductionExtractive',
      entiteId: production.id,
      nouvelleValeur: { annee: dto.annee, mois: dto.mois, substance: dto.substance },
    });
    return production;
  }

  // ---------------------------------------------------------- Exportations

  async listerExportations(filtres?: { contribuableId?: string; annee?: number }) {
    const where: Record<string, unknown> = {};
    if (filtres?.contribuableId) where.contribuableId = filtres.contribuableId;
    if (filtres?.annee) where.annee = filtres.annee;
    return this.prisma.exportationExtractive.findMany({
      where,
      include: INCLUDE_CONTRIBUABLE,
      orderBy: [{ annee: 'desc' as const }, { mois: 'desc' as const }],
    });
  }

  async creerExportation(dto: CreerExportationDto, utilisateurId: string) {
    const existante = await this.prisma.exportationExtractive.findUnique({
      where: {
        contribuableId_annee_mois_substance: {
          contribuableId: dto.contribuableId,
          annee: dto.annee,
          mois: dto.mois,
          substance: dto.substance,
        },
      },
    });
    if (existante) throw new ConflictException('Exportation déjà déclarée pour cette période et substance');

    const exportation = await this.prisma.exportationExtractive.create({
      data: {
        contribuableId: dto.contribuableId,
        annee: dto.annee,
        mois: dto.mois,
        substance: dto.substance,
        volumeT: dto.volumeT ?? null,
        valeurFcfa: dto.valeurFcfa != null ? BigInt(dto.valeurFcfa) : null,
        valeurUsd: dto.valeurUsd != null ? BigInt(dto.valeurUsd) : null,
        destination: dto.destination ?? null,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'FLUX_EXPORTATION_CREER',
      entite: 'ExportationExtractive',
      entiteId: exportation.id,
      nouvelleValeur: { annee: dto.annee, mois: dto.mois, substance: dto.substance },
    });
    return exportation;
  }

  // ---------------------------------------------------------- Redevances

  async listerRedevances(filtres?: { contribuableId?: string; annee?: number }) {
    const where: Record<string, unknown> = {};
    if (filtres?.contribuableId) where.contribuableId = filtres.contribuableId;
    if (filtres?.annee) where.annee = filtres.annee;
    return this.prisma.redevanceMiniere.findMany({
      where,
      include: INCLUDE_CONTRIBUABLE,
      orderBy: [{ annee: 'desc' as const }, { trimestre: 'desc' as const }],
    });
  }

  async creerRedevance(dto: CreerRedevanceDto, utilisateurId: string) {
    const existante = await this.prisma.redevanceMiniere.findUnique({
      where: {
        contribuableId_annee_trimestre_substance: {
          contribuableId: dto.contribuableId,
          annee: dto.annee,
          trimestre: dto.trimestre,
          substance: dto.substance,
        },
      },
    });
    if (existante) throw new ConflictException('Redevance déjà déclarée pour ce trimestre et substance');

    const redevance = await this.prisma.redevanceMiniere.create({
      data: {
        contribuableId: dto.contribuableId,
        annee: dto.annee,
        trimestre: dto.trimestre,
        substance: dto.substance,
        baseAssietteFcfa: dto.baseAssietteFcfa != null ? BigInt(dto.baseAssietteFcfa) : null,
        taux: dto.taux ?? null,
        montantDuFcfa: dto.montantDuFcfa != null ? BigInt(dto.montantDuFcfa) : null,
        montantPayeFcfa: dto.montantPayeFcfa != null ? BigInt(dto.montantPayeFcfa) : null,
        datePaiement: dto.datePaiement ? new Date(dto.datePaiement) : null,
        referencePaiement: dto.referencePaiement ?? null,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'FLUX_REDEVANCE_CREER',
      entite: 'RedevanceMiniere',
      entiteId: redevance.id,
      nouvelleValeur: { annee: dto.annee, trimestre: dto.trimestre, substance: dto.substance },
    });
    return redevance;
  }

  // ---------------------------------------------------------- Transferts communes (CFLDR)

  async listerTransferts(filtres?: { contribuableId?: string; annee?: number }) {
    const where: Record<string, unknown> = {};
    if (filtres?.contribuableId) where.contribuableId = filtres.contribuableId;
    if (filtres?.annee) where.annee = filtres.annee;
    return this.prisma.transfertCommuneCfldr.findMany({
      where,
      include: INCLUDE_CONTRIBUABLE,
      orderBy: [{ annee: 'desc' as const }, { commune: 'asc' as const }],
    });
  }

  async creerTransfert(dto: CreerTransfertCommuneDto, utilisateurId: string) {
    const existant = await this.prisma.transfertCommuneCfldr.findUnique({
      where: {
        contribuableId_annee_commune: {
          contribuableId: dto.contribuableId,
          annee: dto.annee,
          commune: dto.commune,
        },
      },
    });
    if (existant) throw new ConflictException('Transfert déjà déclaré pour cette année et commune');

    const transfert = await this.prisma.transfertCommuneCfldr.create({
      data: {
        contribuableId: dto.contribuableId,
        annee: dto.annee,
        commune: dto.commune,
        chiffreAffairesAnnuelFcfa:
          dto.chiffreAffairesAnnuelFcfa != null ? BigInt(dto.chiffreAffairesAnnuelFcfa) : null,
        montantDuFcfa: dto.montantDuFcfa != null ? BigInt(dto.montantDuFcfa) : null,
        montantEncaisseFcfa: dto.montantEncaisseFcfa != null ? BigInt(dto.montantEncaisseFcfa) : null,
        dateEncaissement: dto.dateEncaissement ? new Date(dto.dateEncaissement) : null,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'FLUX_TRANSFERT_COMMUNE_CREER',
      entite: 'TransfertCommuneCfldr',
      entiteId: transfert.id,
      nouvelleValeur: { annee: dto.annee, commune: dto.commune },
    });
    return transfert;
  }
}
