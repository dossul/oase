import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { ReglesBlocageService } from '../regles-blocage/regles-blocage.service';

@Injectable()
export class DecisionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private auth: AuthService,
    private regles: ReglesBlocageService,
  ) {}

  async approuver(user: AuthUser, demandeId: string, pin: string, motif?: string) {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
      include: { beneficiaires: true },
    });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });
    if (demande.statutCode !== 'en_instruction') {
      throw new BadRequestException({ code: 'STATUT_NON_INSTRUCTION' });
    }

    const blocage = await this.regles.estBloque(demandeId);
    if (blocage.bloque) {
      throw new BadRequestException({ code: 'DEMANDE_BLOQUEE', blocages: blocage.blocages });
    }

    const pinOk = await this.auth.verifyPin(user.id, pin);
    if (!pinOk) throw new BadRequestException({ code: 'PIN_INVALIDE' });

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

    const acte = await this.genererActe(demande, decision, 'attestation');

    await this.audit.createEntry({
      action: 'DECISION_APPROUVEE',
      entite: 'decisions',
      entiteId: decision.id,
      utilisateurId: user.id,
      demandeId,
      nouvelleValeur: { typeCode: 'approbation', estSigne: true },
    });

    return { decision, acte };
  }

  async rejeter(user: AuthUser, demandeId: string, pin: string, motif: string) {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
      include: { beneficiaires: true },
    });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });

    const pinOk = await this.auth.verifyPin(user.id, pin);
    if (!pinOk) throw new BadRequestException({ code: 'PIN_INVALIDE' });

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
        beneficiaireId: demande.beneficiaireId,
        montantFcfa: demande.montantFcfa,
        dateEffet: new Date(),
        documentUrl: `actes/${ref}.pdf`,
        hashDocument: hash,
        qrCodeHash: qrHash,
      },
    });
  }
}
