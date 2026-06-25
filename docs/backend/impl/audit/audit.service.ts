import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditDto {
  action: string;
  entite: string;
  entiteId: string;
  utilisateurId?: string;
  roleAuMoment?: string;
  institution?: string;
  demandeId?: string;
  ancienneValeur?: Record<string, unknown>;
  nouvelleValeur?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createEntry(dto: CreateAuditDto): Promise<void> {
    // Récupère le dernier hash pour le chaînage
    const last = await this.prisma.auditLog.findFirst({
      orderBy: { horodatage: 'desc' },
      select: { empreinteSha256: true },
    });

    const data = JSON.stringify({
      ...dto,
      horodatage: new Date().toISOString(),
      hashPrecedent: last?.empreinteSha256 ?? null,
    });

    const empreinte = createHash('sha256').update(data).digest('hex');

    await this.prisma.auditLog.create({
      data: {
        action: dto.action,
        entite: dto.entite,
        entiteId: dto.entiteId,
        utilisateurId: dto.utilisateurId ?? null,
        roleAuMoment: dto.roleAuMoment ?? null,
        institution: dto.institution ?? null,
        demandeId: dto.demandeId ?? null,
        ancienneValeur: dto.ancienneValeur ?? undefined,
        nouvelleValeur: dto.nouvelleValeur ?? undefined,
        ip: dto.ip ?? null,
        userAgent: dto.userAgent ?? null,
        hashPrecedent: last?.empreinteSha256 ?? null,
        empreinteSha256: empreinte,
      },
    });
  }

  /**
   * Vérifie l'intégrité de la chaîne SHA-256 (tous les enregistrements).
   * Retourne le nombre d'entrées vérifiées et les ruptures détectées.
   */
  async verifyChain(): Promise<{ verified: number; breaks: string[] }> {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { horodatage: 'asc' },
    });

    const breaks: string[] = [];
    let prevHash: string | null = null;

    for (const log of logs) {
      if (log.hashPrecedent !== prevHash) {
        breaks.push(`[${log.id}] hashPrecedent attendu: ${prevHash}, trouvé: ${log.hashPrecedent}`);
      }
      prevHash = log.empreinteSha256;
    }

    return { verified: logs.length, breaks };
  }
}
