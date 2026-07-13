import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.service';

export interface EnvoyerNotificationDto {
  utilisateurId: string;
  demandeId?: string;
  typeNotificationCode: string;
  canalCode: string;
  titre: string;
  corps: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async envoyer(dto: EnvoyerNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        utilisateurId: dto.utilisateurId,
        demandeId: dto.demandeId ?? null,
        typeNotificationCode: dto.typeNotificationCode,
        canalCode: dto.canalCode,
        titre: dto.titre,
        corps: dto.corps,
        estLue: false,
      },
    });

    if (dto.canalCode === 'email') {
      this.logger.log(`[MOCK EMAIL] To: ${dto.utilisateurId} - ${dto.titre}\n${dto.corps}`);
    }

    return { id: notification.id, envoye: true, canal: dto.canalCode };
  }

  async notifierTransition(user: AuthUser, demandeId: string, action: string, statut: string) {
    const destinataires = await this.trouverDestinataires(demandeId);
    const notifications: any[] = [];
    for (const utilisateurId of destinataires) {
      const notif = await this.envoyer({
        utilisateurId,
        demandeId,
        typeNotificationCode: 'transition_demande',
        canalCode: 'inapp',
        titre: `Demande ${demandeId}: ${action}`,
        corps: `La demande est passee au statut ${statut} par ${user.email}.`,
      });
      notifications.push(notif);
    }
    return notifications;
  }

  async lister(user: AuthUser, lues?: boolean) {
    const where: any = { utilisateurId: user.id };
    if (lues !== undefined) where.estLue = lues;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async marquerLue(user: AuthUser, notificationId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id: notificationId, utilisateurId: user.id } });
    if (!notif) return null;
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { estLue: true, dateLecture: new Date() },
    });
  }

  private async trouverDestinataires(demandeId: string): Promise<string[]> {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
      select: { contribuableId: true, instructeurId: true },
    });
    if (!demande) return [];
    const ids: string[] = [];
    const contribuable = await this.prisma.contribuable.findUnique({
      where: { id: demande.contribuableId },
      select: { userId: true },
    });
    if (contribuable?.userId) ids.push(contribuable.userId);
    if (demande.instructeurId) ids.push(demande.instructeurId);
    return [...new Set(ids)];
  }
}
