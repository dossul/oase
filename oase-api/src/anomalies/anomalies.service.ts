import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreerAnomalieDto, TraiterAnomalieDto } from './dto/creer-anomalie.dto';
import { FiltrerAnomaliesDto } from './dto/filtrer-anomalies.dto';

@Injectable()
export class AnomaliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async lister(filtres: FiltrerAnomaliesDto) {
    const where: Record<string, unknown> = {};
    if (filtres.demandeId) where.demandeId = filtres.demandeId;
    if (filtres.categorieCode) where.categorieCode = filtres.categorieCode;
    if (filtres.graviteCode) where.graviteCode = filtres.graviteCode;
    if (filtres.statutCode) where.statutCode = filtres.statutCode;
    if (filtres.statut) where.statutCode = filtres.statut;

    return this.prisma.anomalie.findMany({
      where,
      include: {
        demandes: true,
        baseJuridiqueVersions: { include: { basesJuridiques: true } },
        conventions: true,
        utilisateurs: true,
        reglesAnomalie: true,
      },
      orderBy: { dateDetection: 'desc' as const },
    });
  }

  async trouverParId(id: string) {
    const anomalie = await this.prisma.anomalie.findUnique({
      where: { id },
      include: {
        demandes: true,
        baseJuridiqueVersions: { include: { basesJuridiques: true } },
        conventions: true,
        utilisateurs: true,
        reglesAnomalie: true,
      },
    });
    if (!anomalie) throw new NotFoundException('Anomalie non trouvée');
    return anomalie;
  }

  async creer(dto: CreerAnomalieDto, utilisateurId: string) {
    const anomalie = await this.prisma.anomalie.create({
      data: {
        categorieCode: dto.categorieCode,
        graviteCode: dto.graviteCode,
        description: dto.description,
        demandeId: dto.demandeId,
        baseJuridiqueVersionId: dto.baseJuridiqueVersionId,
        conventionId: dto.conventionId,
        utilisateurId: dto.utilisateurId ?? utilisateurId,
        detecteeParCode: 'manuel',
        regleId: dto.regleId,
        commentaire: dto.commentaire,
        statutCode: 'nouvelle',
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'ANOMALIE_CREER',
      entite: 'Anomalie',
      entiteId: anomalie.id,
      nouvelleValeur: {
        categorieCode: dto.categorieCode,
        graviteCode: dto.graviteCode,
      },
    });

    return anomalie;
  }

  async traiter(id: string, dto: TraiterAnomalieDto, utilisateurId: string) {
    const anomalie = await this.prisma.anomalie.findUnique({ where: { id } });
    if (!anomalie) throw new NotFoundException('Anomalie non trouvée');

    const data: {
      statutCode: string;
      commentaire?: string;
      dateResolution?: Date;
      utilisateurId?: string;
    } = {
      statutCode: dto.statut,
      commentaire: dto.commentaire ?? anomalie.commentaire ?? undefined,
      utilisateurId,
    };

    if (dto.statut === 'resolue') data.dateResolution = new Date();

    const updated = await this.prisma.anomalie.update({
      where: { id },
      data,
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'ANOMALIE_TRAITER',
      entite: 'Anomalie',
      entiteId: id,
      ancienneValeur: { statutCode: anomalie.statutCode },
      nouvelleValeur: { statutCode: dto.statut },
    });

    if (dto.statut === 'escaladee') {
      await this.notifications.envoyer({
        utilisateurId,
        typeNotificationCode: 'anomalie_escalade',
        canalCode: 'inapp',
        titre: 'Anomalie escaladée',
        corps: `L'anomalie ${id} a été escaladée pour traitement.`,
      });
    }

    return updated;
  }

  async detecterAutomatiquement(regleId: string, utilisateurId: string) {
    const anomalies: { message: string }[] = [];

    const demandes = await this.prisma.demande.findMany({
      where: { statutCode: 'en_instruction' },
      include: { beneficiaires: true, baseJuridiqueVersions: true },
    });

    for (const demande of demandes) {
      if (!demande.baseJuridiqueVersionId) continue;
      if (regleId === 'quota_depasse') {
        const quota = await this.prisma.quota.findFirst({
          where: {
            baseJuridiqueVersionId: demande.baseJuridiqueVersionId,
            beneficiaireId: demande.beneficiaireId,
          },
        });
        if (quota && quota.consomme >= quota.total) {
          await this.creer(
            {
              categorieCode: 'quota',
              graviteCode: 'elevee',
              description: 'Le quota pour cette demande est épuisé.',
              demandeId: demande.id,
              baseJuridiqueVersionId: demande.baseJuridiqueVersionId,
              regleId: 'quota_depasse',
            },
            utilisateurId,
          );
          anomalies.push({ message: `Anomalie quota détectée pour demande ${demande.id}` });
        }
      }
    }

    return { detectees: anomalies.length, details: anomalies };
  }
}
