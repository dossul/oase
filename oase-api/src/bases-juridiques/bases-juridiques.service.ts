import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreerBaseJuridiqueDto,
  CreerBaseJuridiqueVersionDto,
  ImporterBasesJuridiquesDto,
} from './dto/creer-base-juridique.dto';
import { FiltrerBasesJuridiquesDto } from './dto/filtrer-bases-juridiques.dto';
import { Prisma } from '@prisma/client';

interface ImportedRow {
  codeMesure: string;
  codeMesureMrd?: string;
  libelle: string;
  impotConcerne: string;
  natureMesureCode: string;
  version?: number;
  [key: string]: unknown;
}

@Injectable()
export class BasesJuridiquesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister(filtres: FiltrerBasesJuridiquesDto) {
    const { page = 1, limit = 20, search, ...whereRest } = filtres;
    const where: Prisma.BaseJuridiqueVersionWhereInput = { validTo: null };

    if (search) {
      where.libelle = { contains: search };
    }
    if (whereRest.impotConcerne) where.impotConcerne = whereRest.impotConcerne;
    if (whereRest.natureMesureCode) where.natureMesureCode = whereRest.natureMesureCode;
    if (whereRest.organeGestionCode) where.organeGestionCode = whereRest.organeGestionCode;
    if (whereRest.estActive !== undefined) where.estActive = whereRest.estActive;
    if (whereRest.codeMesure) {
      where.basesJuridiques = { codeMesure: whereRest.codeMesure };
    }

    const [items, total] = await Promise.all([
      this.prisma.baseJuridiqueVersion.findMany({
        where,
        include: { basesJuridiques: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' as const },
      }),
      this.prisma.baseJuridiqueVersion.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async trouverParId(id: string) {
    const version = await this.prisma.baseJuridiqueVersion.findUnique({
      where: { id },
      include: { basesJuridiques: true, baseJuridiqueDocuments: true },
    });
    if (!version) throw new NotFoundException('Version non trouvée');
    return version;
  }

  async trouverParCodeMesure(codeMesure: string) {
    const base = await this.prisma.baseJuridique.findUnique({
      where: { codeMesure },
      include: { baseJuridiqueVersions: { orderBy: { version: 'desc' as const } } },
    });
    if (!base) throw new NotFoundException('Base juridique non trouvée');
    return base;
  }

  async creer(dto: CreerBaseJuridiqueDto, utilisateurId: string) {
    const existante = await this.prisma.baseJuridique.findUnique({
      where: { codeMesure: dto.codeMesure },
    });
    if (existante) throw new ConflictException('Code mesure déjà utilisé');

    const base = await this.prisma.baseJuridique.create({
      data: {
        codeMesure: dto.codeMesure,
        codeMesureMrd: dto.codeMesureMrd,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'BASE_JURIDIQUE_CREER',
      entite: 'BaseJuridique',
      entiteId: base.id,
      nouvelleValeur: { codeMesure: base.codeMesure },
    });

    return base;
  }

  async creerVersion(dto: CreerBaseJuridiqueVersionDto, utilisateurId: string) {
    const base = await this.prisma.baseJuridique.findUnique({
      where: { id: dto.baseJuridiqueId },
      include: { baseJuridiqueVersions: { orderBy: { version: 'desc' as const }, take: 1 } },
    });
    if (!base) throw new NotFoundException('Base juridique parente non trouvée');

    const derniereVersion = base.baseJuridiqueVersions[0]?.version ?? 0;
    const nouvelleVersion = derniereVersion + 1;

    const version = await this.prisma.$transaction(async (tx) => {
      await tx.baseJuridiqueVersion.updateMany({
        where: { baseJuridiqueId: base.id, validTo: null },
        data: { validTo: new Date(), versionCouranteFlag: null },
      });

      return tx.baseJuridiqueVersion.create({
        data: {
          ...dto,
          version: nouvelleVersion,
          versionCouranteFlag: 1,
          validFrom: new Date(),
          validTo: null,
        } as Prisma.BaseJuridiqueVersionUncheckedCreateInput,
      });
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'BASE_JURIDIQUE_VERSION_CREER',
      entite: 'BaseJuridiqueVersion',
      entiteId: version.id,
      nouvelleValeur: { version: nouvelleVersion },
    });

    return version;
  }

  async importer(dto: ImporterBasesJuridiquesDto, utilisateurId: string) {
    let rows: ImportedRow[] = [];

    if (dto.format === 'json') {
      try {
        rows = JSON.parse(dto.contenu) as ImportedRow[];
      } catch {
        throw new BadRequestException('JSON invalide');
      }
    } else if (dto.format === 'csv') {
      rows = this.parseCsv(dto.contenu);
    } else {
      throw new BadRequestException('Format non supporté');
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Aucune ligne à importer');
    }

    const result = { creees: 0, misesAJour: 0, erreurs: 0 };

    for (const row of rows) {
      try {
        const base = await this.prisma.baseJuridique.upsert({
          where: { codeMesure: row.codeMesure },
          update: {
            codeMesureMrd: row.codeMesureMrd ? Number(row.codeMesureMrd) : undefined,
            updatedAt: new Date(),
          },
          create: {
            codeMesure: row.codeMesure,
            codeMesureMrd: row.codeMesureMrd ? Number(row.codeMesureMrd) : null,
          },
        });

        await this.creerVersion(
          {
            baseJuridiqueId: base.id,
            libelle: row.libelle,
            impotConcerne: row.impotConcerne,
            natureMesureCode: row.natureMesureCode,
          } as CreerBaseJuridiqueVersionDto,
          utilisateurId,
        );

        result.creees++;
      } catch {
        result.erreurs++;
      }
    }

    await this.audit.createEntry({
      utilisateurId,
      action: 'BASE_JURIDIQUE_IMPORTER',
      entite: 'BaseJuridique',
      entiteId: 'IMPORT',
      nouvelleValeur: { format: dto.format, result },
    });

    return result;
  }

  private parseCsv(contenu: string): ImportedRow[] {
    const lignes = contenu.split(/\r?\n/).filter((l) => l.trim());
    if (lignes.length < 2) return [];
    const headers = lignes[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    return lignes.slice(1).map((ligne) => {
      const valeurs = ligne.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => (row[h] = valeurs[i]));
      return row as ImportedRow;
    });
  }
}
