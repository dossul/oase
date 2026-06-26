import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GenererRapportDto } from './dto/generer-rapport.dto';

@Injectable()
export class RapportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister() {
    return this.prisma.reportingExecution.findMany({
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async trouverParId(id: string) {
    const rapport = await this.prisma.reportingExecution.findUnique({
      where: { id },
    });
    if (!rapport) throw new NotFoundException('Rapport non trouvé');
    return rapport;
  }

  async generer(dto: GenererRapportDto, utilisateurId: string) {
    const execution = await this.prisma.reportingExecution.create({
      data: {
        typeRapportCode: dto.typeRapportCode,
        periodeAnnee: dto.periodeAnnee,
        periodeMois: dto.periodeMois ?? null,
        parametres: { format: dto.format },
        statutCode: 'en_cours',
      },
    });

    try {
      const { contenu, contentType } = await this.construireRapport(dto);
      const fichierUrl = `data:${contentType};base64,${Buffer.from(contenu).toString('base64')}`;
      const hashFichier = this.sha256(contenu);

      const updated = await this.prisma.reportingExecution.update({
        where: { id: execution.id },
        data: {
          fichierUrl,
          hashFichier,
          statutCode: 'termine',
          dateFin: new Date(),
        },
      });

      await this.audit.createEntry({
        utilisateurId,
        action: 'RAPPORT_GENERER',
        entite: 'ReportingExecution',
        entiteId: execution.id,
        nouvelleValeur: { typeRapportCode: dto.typeRapportCode, format: dto.format },
      });

      return updated;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      await this.prisma.reportingExecution.update({
        where: { id: execution.id },
        data: { statutCode: 'echoue', messageErreur: message, dateFin: new Date() },
      });
      throw e;
    }
  }

  async openData() {
    const bases = await this.prisma.baseJuridique.findMany({});
    const versions = await this.prisma.baseJuridiqueVersion.findMany({
      where: { versionCouranteFlag: 1 },
      select: {
        baseJuridiqueId: true,
        libelle: true,
        impotConcerne: true,
        dateAdoption: true,
        dateAbrogation: true,
      },
    });

    const versionsParBase = new Map<string, (typeof versions)[0]>();
    for (const v of versions) {
      versionsParBase.set(v.baseJuridiqueId, v);
    }

    return bases.map((b) => ({
      codeMesure: b.codeMesure,
      version: versionsParBase.get(b.id) ?? null,
    }));
  }

  private async construireRapport(dto: GenererRapportDto) {
    if (dto.typeRapportCode === 'executif') {
      const rows = await this.prisma.demande.findMany({
        take: 1000,
        select: {
          id: true,
          reference: true,
          statutCode: true,
          montantFcfa: true,
          dateDepot: true,
        },
      });
      return this.formatter(rows, dto.format, ['id', 'reference', 'statutCode', 'montantFcfa', 'dateDepot']);
    }

    if (dto.typeRapportCode === 'fiscal') {
      const rows = await this.reportingAggregat(dto.periodeAnnee, dto.periodeMois);
      return this.formatter(rows, dto.format, ['periode', 'impot', 'montant', 'nombre']);
    }

    if (dto.typeRapportCode === 'opendata') {
      const rows = await this.openData();
      return this.formatter(rows, dto.format, ['codeMesure', 'version']);
    }

    throw new NotFoundException(`Type de rapport ${dto.typeRapportCode} non supporté`);
  }

  private async reportingAggregat(annee: number, mois?: number) {
    const debut = new Date(annee, (mois ?? 1) - 1, 1);
    const fin = mois ? new Date(annee, mois, 0, 23, 59, 59) : new Date(annee, 11, 31, 23, 59, 59);

    const demandes = await this.prisma.demande.findMany({
      where: { createdAt: { gte: debut, lte: fin }, statutCode: 'accordee' },
      include: { baseJuridiqueVersions: { select: { impotConcerne: true } } },
    });

    const agg: Record<string, { montant: bigint; nombre: number }> = {};
    for (const d of demandes) {
      const impot = d.baseJuridiqueVersions.impotConcerne ?? 'Inconnu';
      if (!agg[impot]) agg[impot] = { montant: 0n, nombre: 0 };
      agg[impot].montant += d.montantFcfa;
      agg[impot].nombre++;
    }

    return Object.entries(agg).map(([impot, v]) => ({
      periode: `${annee}${mois ? '-' + mois.toString().padStart(2, '0') : ''}`,
      impot,
      montant: v.montant.toString(),
      nombre: v.nombre,
    }));
  }

  private formatter(
    rows: Record<string, unknown>[],
    format: string,
    headers: string[],
  ): { contenu: string; contentType: string } {
    switch (format) {
      case 'csv':
      case 'xlsx':
        return {
          contenu: this.toCsv(rows, headers),
          contentType: 'text/csv',
        };
      case 'pdf':
        return {
          contenu: this.toPdf(rows, headers),
          contentType: 'application/pdf',
        };
      case 'json':
      default:
        return {
          contenu: JSON.stringify(rows, null, 2),
          contentType: 'application/json',
        };
    }
  }

  private toCsv(rows: Record<string, unknown>[], headers: string[]): string {
    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ];
    return lines.join('\n');
  }

  private toPdf(rows: Record<string, unknown>[], headers: string[]): string {
    const title = 'Rapport OASE';
    const table = [
      '<table border="1"><tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>',
      ...rows.map((row) => '<tr>' + headers.map((h) => `<td>${String(row[h] ?? '')}</td>`).join('') + '</tr>'),
      '</table>',
    ].join('');
    return `<html><head><title>${title}</title></head><body><h1>${title}</h1>${table}</body></html>`;
  }

  private sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }
}
