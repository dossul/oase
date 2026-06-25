import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreerQuotaDto } from './dto/creer-quota.dto';
import { MouvementQuotaDto } from './dto/mouvement-quota.dto';

@Injectable()
export class QuotasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async lister(baseJuridiqueVersionId?: string, beneficiaireId?: string) {
    const where: Record<string, unknown> = {};
    if (baseJuridiqueVersionId) where.baseJuridiqueVersionId = baseJuridiqueVersionId;
    if (beneficiaireId) where.beneficiaireId = beneficiaireId;

    return this.prisma.quota.findMany({
      where,
      include: {
        baseJuridiqueVersions: { include: { basesJuridiques: true } },
        beneficiaires: true,
        quotaMouvements: { orderBy: { createdAt: 'desc' as const }, take: 5 },
      },
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async trouverParId(id: string) {
    const quota = await this.prisma.quota.findUnique({
      where: { id },
      include: {
        baseJuridiqueVersions: { include: { basesJuridiques: true } },
        beneficiaires: true,
        quotaMouvements: { orderBy: { createdAt: 'desc' as const } },
      },
    });
    if (!quota) throw new NotFoundException('Quota non trouvé');
    return quota;
  }

  async creer(dto: CreerQuotaDto, utilisateurId: string) {
    const total = BigInt(dto.total);
    const existant = await this.prisma.quota.findFirst({
      where: {
        baseJuridiqueVersionId: dto.baseJuridiqueVersionId,
        beneficiaireId: dto.beneficiaireId ?? null,
        conventionId: dto.conventionId ?? null,
        exerciceAnnuel: dto.exerciceAnnuel ?? null,
        typeQuotaCode: dto.typeQuotaCode,
      },
    });
    if (existant) throw new ConflictException('Quota déjà existant pour ce critère');

    const quota = await this.prisma.quota.create({
      data: {
        baseJuridiqueVersionId: dto.baseJuridiqueVersionId,
        beneficiaireId: dto.beneficiaireId,
        conventionId: dto.conventionId,
        exerciceAnnuel: dto.exerciceAnnuel,
        typeQuotaCode: dto.typeQuotaCode,
        uniteCode: dto.uniteCode,
        total,
        consomme: 0n,
        alerteSeuilPct: dto.alerteSeuilPct ?? 80,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'QUOTA_CREER',
      entite: 'Quota',
      entiteId: quota.id,
      nouvelleValeur: { total: total.toString(), typeQuotaCode: dto.typeQuotaCode },
    });

    return quota;
  }

  async ajouterMouvement(dto: MouvementQuotaDto, utilisateurId: string) {
    const quota = await this.prisma.quota.findUnique({
      where: { id: dto.quotaId },
    });
    if (!quota) throw new NotFoundException('Quota non trouvé');

    const montant = BigInt(dto.montant);
    const nouveauSolde = quota.consomme + montant;
    if (nouveauSolde > quota.total) {
      throw new ConflictException('Quota dépassé');
    }

    const mouvement = await this.prisma.$transaction(async (tx) => {
      await tx.quota.update({
        where: { id: quota.id },
        data: { consomme: nouveauSolde },
      });
      return tx.quotaMouvement.create({
        data: {
          quotaId: quota.id,
          demandeId: dto.demandeId,
          typeMouvementCode: dto.typeMouvementCode,
          montant,
          soldeAvant: quota.consomme,
          soldeApres: nouveauSolde,
          commentaire: dto.commentaire,
        },
      });
    });

    await this.verifierSeuils(quota, nouveauSolde, utilisateurId);

    await this.audit.createEntry({
      utilisateurId,
      action: 'QUOTA_MOUVEMENT',
      entite: 'Quota',
      entiteId: quota.id,
      nouvelleValeur: { consomme: nouveauSolde.toString(), mouvement: mouvement.id },
    });

    return mouvement;
  }

  private async verifierSeuils(
    quota: {
      id: string;
      total: bigint;
      consomme: bigint;
      alerteSeuilPct: number;
      alerte80Envoyee: boolean;
      alerte100Envoyee: boolean;
      beneficiaireId: string | null;
    },
    consomme: bigint,
    utilisateurId: string,
  ) {
    const pct = Number((consomme * 100n) / quota.total);
    const alerte80 = !quota.alerte80Envoyee && pct >= quota.alerteSeuilPct && pct < 100;
    const alerte100 = !quota.alerte100Envoyee && pct >= 100;

    const update: { alerte80Envoyee?: boolean; alerte100Envoyee?: boolean } = {};
    if (alerte80) update.alerte80Envoyee = true;
    if (alerte100) update.alerte100Envoyee = true;

    if (Object.keys(update).length > 0) {
      await this.prisma.quota.update({ where: { id: quota.id }, data: update });
    }

    if (alerte80) {
      await this.notifications.envoyer({
        utilisateurId,
        typeNotificationCode: 'alerte_80_quota',
        canalCode: 'inapp',
        titre: `Quota à ${quota.alerteSeuilPct}% atteint`,
        corps: `Le quota ${quota.id} a atteint ${pct}% de son plafond.`,
      });
    }
    if (alerte100) {
      await this.notifications.envoyer({
        utilisateurId,
        typeNotificationCode: 'alerte_100_quota',
        canalCode: 'inapp',
        titre: 'Quota épuisé',
        corps: `Le quota ${quota.id} est épuisé (${consomme.toString()} / ${quota.total.toString()}).`,
      });
    }
  }
}
