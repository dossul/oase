import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

/** Clés de paramétrage plateforme créées par défaut si absentes. */
const PARAMETRES_DEFAUT: Record<string, string> = {
  'securite.session.duree_minutes': '15',
  'securite.session.refresh_jours': '7',
  'securite.verrouillage.tentatives_max': '5',
  'securite.verrouillage.duree_minutes': '15',
  'securite.mdp.longueur_min': '10',
  'securite.mdp.expiration_jours': '90',
  'smtp.host': '',
  'smtp.port': '587',
  'smtp.user': '',
  'smtp.from': 'no-reply@oase.gouv.tg',
  'sms.provider': '',
  'sms.api_key': '',
  'whatsapp.enabled': 'false',
  'whatsapp.template': 'Votre code de vérification OASE est: {code}',
  'notifications.regles_globales': '{"echeance_j30":true,"quota_alerte_80":true,"quota_alerte_100":true}',
};

/** Paramètres du référentiel INSEED (simulation / évaluation d'impact). */
const INSEED_DEFAUT: Record<string, string> = {
  'inseed.pib_milliards_fcfa': '4900',
  'inseed.annee_reference': '2024',
  'inseed.multiplicateurs_sectoriels': '{"industrie":1.8,"agriculture":1.2,"services":1.5,"mines":2.1,"tourisme":1.4}',
  'inseed.meta_import': '{"source":"INSEED Togo","dateImport":null,"version":"1.0"}',
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /** GET /admin/parametres : toutes les clés (défauts créés si absents). */
  async parametres() {
    await this.ensureDefaults(PARAMETRES_DEFAUT);
    const rows = await this.prisma.systemConfig.findMany({
      where: { key: { in: Object.keys(PARAMETRES_DEFAUT) } },
      orderBy: { key: 'asc' },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  /** PUT /admin/parametres : upsert des clés fournies. */
  async majParametres(updates: Record<string, string>) {
    await this.upsertAll(updates);
    return this.parametres();
  }

  /** GET /referentiels/inseed. */
  async inseed() {
    await this.ensureDefaults(INSEED_DEFAUT);
    const rows = await this.prisma.systemConfig.findMany({
      where: { key: { startsWith: 'inseed.' } },
      orderBy: { key: 'asc' },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  /** PUT /referentiels/inseed (admin). */
  async majInseed(updates: Record<string, string>) {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => k.startsWith('inseed.')),
    );
    await this.upsertAll(filtered);
    return this.inseed();
  }

  /** GET /admin/monitoring : agrégat santé plateforme. */
  async monitoring() {
    const depuis24h = new Date(Date.now() - 24 * 3600 * 1000);
    let version = 'unknown';
    try {
      version = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')).version;
    } catch {
      /* ignore */
    }

    const [actifs24h, erreurs500_24h, jobsActifs, jobsEchoues24h] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { horodatage: { gte: depuis24h }, utilisateurId: { not: null } },
        select: { utilisateurId: true },
        distinct: ['utilisateurId'],
      }),
      this.prisma.systemLog.count({
        where: { createdAt: { gte: depuis24h }, niveau: { in: ['error', 'fatal'] } },
      }),
      this.prisma.jobQueue.count({ where: { statutCode: { in: ['pending', 'running'] } } }),
      this.prisma.jobQueue.count({ where: { statutCode: 'failed', updatedAt: { gte: depuis24h } } }),
    ]);

    return {
      timestamp: new Date().toISOString(),
      version,
      uptimeSecondes: Math.floor(process.uptime()),
      utilisateursActifs24h: actifs24h.length,
      erreurs500_24h: erreurs500_24h,
      jobs: { actifs: jobsActifs, echoues24h: jobsEchoues24h },
    };
  }

  private async ensureDefaults(defauts: Record<string, string>) {
    const existantes = await this.prisma.systemConfig.findMany({
      where: { key: { in: Object.keys(defauts) } },
      select: { key: true },
    });
    const presentes = new Set(existantes.map((r) => r.key));
    const manquantes = Object.entries(defauts).filter(([k]) => !presentes.has(k));
    if (manquantes.length > 0) {
      await this.prisma.systemConfig.createMany({
        data: manquantes.map(([key, value]) => ({ key, value })),
      });
    }
  }

  private async upsertAll(updates: Record<string, string>) {
    for (const [key, value] of Object.entries(updates)) {
      await this.prisma.systemConfig.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
    }
  }
}
