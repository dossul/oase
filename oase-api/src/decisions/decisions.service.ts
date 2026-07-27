import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { ReglesBlocageService } from '../regles-blocage/regles-blocage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AttestationsService } from '../attestations/attestations.service';

@Injectable()
export class DecisionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private auth: AuthService,
    private regles: ReglesBlocageService,
    private notifications: NotificationsService,
    private attestations: AttestationsService,
  ) {}

  async approuver(user: AuthUser, demandeId: string, pin?: string, motif?: string) {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
      include: { contribuables: true },
    });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });
    if (demande.statutCode !== 'en_instruction') {
      throw new BadRequestException({ code: 'STATUT_NON_INSTRUCTION' });
    }

    // 1. Règles de blocage AVANT le PIN : un quota épuisé doit répondre
    //    422 QUOTA_EPUISE même si le corps est vide (contrat de recette).
    const blocage = await this.regles.estBloque(demandeId);
    if (blocage.bloque) {
      const quotaEpuise = blocage.blocages.some((b) => b.code === 'bloc-03' && b.bloque);
      if (quotaEpuise) {
        throw new UnprocessableEntityException({ code: 'QUOTA_EPUISE', blocages: blocage.blocages });
      }
      throw new BadRequestException({ code: 'DEMANDE_BLOQUEE', blocages: blocage.blocages });
    }

    // 2. PIN de signature obligatoire.
    if (!pin) throw new BadRequestException({ code: 'PIN_REQUIS' });
    const pinOk = await this.auth.verifyPin(user.id, pin);
    if (!pinOk) throw new UnauthorizedException({ code: 'PIN_INVALIDE' });

    const pinHash = await bcrypt.hash(pin, 12);
    const decision = await this.prisma.decision.create({
      data: {
        demandeId,
        utilisateurId: user.id,
        typeCode: 'approbation',
        motif,
        pinHash,
        estSigne: true,
        hashSha256: createHash('sha256').update(`DECISION:${demandeId}:${Date.now()}`).digest('hex'),
      },
    });

    await this.prisma.demande.update({
      where: { id: demandeId },
      data: { statutCode: 'approuve', etapeActuelle: 'decision' },
    });

    const acteCree = await this.genererActe(demande, decision, 'attestation');

    // 3. Génération du document d'attestation (PDF + QR de vérification).
    const gen = await this.attestations.generer(acteCree.id);
    const acte = {
      ...acteCree,
      documentUrl: gen.documentUrl,
      qrCodeHash: gen.qrHash,
      hashDocument: gen.hashSha256,
    };

    await this.audit.createEntry({
      action: 'DECISION_APPROUVEE',
      entite: 'decisions',
      entiteId: decision.id,
      utilisateurId: user.id,
      demandeId,
      nouvelleValeur: { typeCode: 'approbation', estSigne: true },
    });

    // 4. Notification du contribuable propriétaire.
    await this.notifierContribuable(demande, decision);

    return { decision, acte };
  }

  async rejeter(user: AuthUser, demandeId: string, pin: string | undefined, motif: string) {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
      include: { contribuables: true },
    });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });

    if (!pin) throw new BadRequestException({ code: 'PIN_REQUIS' });
    const pinOk = await this.auth.verifyPin(user.id, pin);
    if (!pinOk) throw new UnauthorizedException({ code: 'PIN_INVALIDE' });

    const pinHash = await bcrypt.hash(pin, 12);
    const decision = await this.prisma.decision.create({
      data: {
        demandeId,
        utilisateurId: user.id,
        typeCode: 'rejet',
        motif,
        pinHash,
        estSigne: true,
        hashSha256: createHash('sha256').update(`DECISION:${demandeId}:${Date.now()}:REJET`).digest('hex'),
      },
    });

    await this.prisma.demande.update({
      where: { id: demandeId },
      data: { statutCode: 'rejete', motifRejet: motif },
    });

    const acte = await this.genererActe(demande, decision, 'rejet');

    await this.audit.createEntry({
      action: 'DECISION_REJETEE',
      entite: 'decisions',
      entiteId: decision.id,
      utilisateurId: user.id,
      demandeId,
      nouvelleValeur: { typeCode: 'rejet', estSigne: true },
    });

    return { decision, acte };
  }

  async listerParDemande(demandeId: string) {
    return this.prisma.decision.findMany({
      where: { demandeId },
      include: { actes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Notification in-app du contribuable propriétaire après approbation. */
  private async notifierContribuable(demande: any, decision: any) {
    const userId = demande.contribuables?.userId;
    if (!userId) return;
    await this.notifications.envoyer({
      utilisateurId: userId,
      demandeId: demande.id,
      typeNotificationCode: 'APPROBATION',
      canalCode: 'inapp',
      titre: `Demande ${demande.reference} approuvée`,
      corps: `Votre demande ${demande.reference} a été approuvée. L'attestation d'exonération est disponible au téléchargement.`,
    });
  }

  private async genererActe(demande: any, decision: any, type: 'attestation' | 'rejet') {
    const ref = `ACTE-${type.toUpperCase()}-${Date.now()}`;
    const content = `ACTE ${type.toUpperCase()} - Demande ${demande.reference} - Decision ${decision.id}`;
    const hash = createHash('sha256').update(content).digest('hex');
    const qrHash = createHash('sha256')
      .update(`${decision.id}:${randomBytes(8).toString('hex')}`)
      .digest('hex');

    return this.prisma.acte.create({
      data: {
        demandeId: demande.id,
        decisionId: decision.id,
        typeCode: type,
        reference: ref,
        contribuableId: demande.contribuableId,
        montantFcfa: demande.montantFcfa,
        dateEffet: new Date(),
        documentUrl: '',
        hashDocument: hash,
        qrCodeHash: qrHash,
      },
    });
  }
}
