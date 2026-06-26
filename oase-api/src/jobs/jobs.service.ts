import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConventionsService } from '../conventions/conventions.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private lastHeartbeat = new Date();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly conventions: ConventionsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async tacheEcheancesConventions() {
    this.logger.log('CRON: vérification des échéances conventions');
    const systemUser = await this.getSystemUser();
    await this.conventions.verifierAlertesEcheance(systemUser);
    this.lastHeartbeat = new Date();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async tacheArchivageQuotidien() {
    this.logger.log('CRON: archivage quotidien des demandes anciennes');
    const systemUser = await this.getSystemUser();
    await this.archiverDemandesAncienne(systemUser);
    this.lastHeartbeat = new Date();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async tacheHeartbeat() {
    this.logger.log('CRON: heartbeat');
    this.lastHeartbeat = new Date();
  }

  async archiverDemandesAncienne(utilisateurId: string, jours = 365) {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - jours);

    const demandes = await this.prisma.demande.findMany({
      where: {
        statutCode: { in: ['accordee', 'rejetee'] },
        updatedAt: { lte: dateLimite },
        dateArchivage: null,
      },
      take: 100,
    });

    const archivages = [];
    for (const demande of demandes) {
      const archivage = await this.prisma.archivage.create({
        data: {
          typeEntite: 'Demande',
          entiteId: demande.id,
          demandeId: demande.id,
          statutCode: 'archive',
          cheminArchive: `/archives/demandes/${demande.id}.json`,
          hashArchive: '0'.repeat(64),
          declenchePar: 'systeme',
          dateArchivage: new Date(),
        },
      });
      await this.prisma.demande.update({
        where: { id: demande.id },
        data: { dateArchivage: new Date() },
      });
      archivages.push(archivage);
    }

    await this.notifications.envoyer({
      utilisateurId,
      typeNotificationCode: 'archivage_termine',
      canalCode: 'inapp',
      titre: 'Archivage terminé',
      corps: `${archivages.length} demandes archivées.`,
    });

    return { archives: archivages.length };
  }

  async getHeartbeat() {
    return { lastHeartbeat: this.lastHeartbeat.toISOString(), healthy: true };
  }

  private async getSystemUser(): Promise<string> {
    const system = await this.prisma.utilisateur.findFirst({
      where: { role: 'system' },
    });
    return system?.id ?? 'system';
  }
}
