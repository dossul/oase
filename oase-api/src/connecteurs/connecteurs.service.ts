import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnecteursService {
  constructor(private prisma: PrismaService) {}

  /** Liste des connecteurs SI avec leur institution. */
  async lister() {
    return this.prisma.connecteur.findMany({
      include: { institutions: { select: { id: true, nom: true, code: true } } },
      orderBy: { nom: 'asc' },
    });
  }

  /** Journaux d'échange d'un connecteur (plus récents d'abord). */
  async logs(connecteurId: string, limit = 50) {
    return this.prisma.connecteurLog.findMany({
      where: { connecteurId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  }

  /**
   * État agrégé temps réel : dernier heartbeat (dernier sync ou dernier log),
   * nombre d'erreurs sur 24h (connecteur_logs), jobs en file.
   */
  async status() {
    const depuis24h = new Date(Date.now() - 24 * 3600 * 1000);

    const [connecteurs, erreurs24h, jobsActifs] = await Promise.all([
      this.prisma.connecteur.findMany({
        include: { institutions: { select: { id: true, nom: true, code: true } } },
        orderBy: { nom: 'asc' },
      }),
      this.prisma.connecteurLog.groupBy({
        by: ['connecteurId'],
        where: { estErreur: true, createdAt: { gte: depuis24h } },
        _count: { id: true },
      }),
      this.prisma.jobQueue.count({ where: { statutCode: { in: ['pending', 'running'] } } }),
    ]);

    const erreursParConnecteur = new Map(erreurs24h.map((e) => [e.connecteurId, e._count.id]));

    return {
      timestamp: new Date().toISOString(),
      jobsActifs,
      connecteurs: connecteurs.map((c) => ({
        id: c.id,
        nom: c.nom,
        codeSysteme: c.codeSysteme,
        institution: c.institutions ? { id: c.institutions.id, nom: c.institutions.nom, code: c.institutions.code } : null,
        statutCode: c.statutCode,
        dernierHeartbeat: c.dernierSync,
        latenceMs: c.latenceMs,
        tauxErreur: c.tauxErreur,
        erreurs24h: erreursParConnecteur.get(c.id) ?? 0,
        fallbackManuel: c.fallbackManuel,
      })),
    };
  }
}
