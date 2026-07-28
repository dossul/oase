import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../common/services/scope.service';
import { AuthUser } from '../auth/auth.service';
import { buildAttestationPdf } from '../common/utils/simple-pdf.util';

const ATTESTATIONS_DIR = 'attestations';

export interface AttestationFichier {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

@Injectable()
export class AttestationsService {
  constructor(
    private prisma: PrismaService,
    private scope: ScopeService,
  ) {}

  async generer(acteId: string) {
    const acte = await this.prisma.acte.findUnique({
      where: { id: acteId },
      include: {
        demandes: {
          include: {
            contribuables: true,
            baseJuridiqueVersions: { include: { basesJuridiques: true } },
          },
        },
        decisions: { include: { utilisateurs: true } },
      },
    });
    if (!acte) throw new NotFoundException({ code: 'ACTE_INEXISTANT' });

    const reference = `ATTEST-${acte.reference}`;
    const qrPayload = {
      ref: reference,
      acte: acte.reference,
      demande: acte.demandes.reference,
      contribuable: acte.demandes.contribuables.nif,
      hash: acte.hashDocument,
    };
    const qrHash = createHash('sha256').update(JSON.stringify(qrPayload)).digest('hex');
    const documentHash = createHash('sha256').update(`${acte.id}:${qrHash}:${Date.now()}`).digest('hex');

    const bj = acte.demandes.baseJuridiqueVersions;
    const decisionUser = acte.decisions?.utilisateurs;
    const signataire = decisionUser
      ? (decisionUser.prenom ? decisionUser.prenom + ' ' : '') + decisionUser.nom
      : null;

    const pdf = buildAttestationPdf({
      reference,
      acte: {
        reference: acte.reference,
        dateEffet: acte.dateEffet,
        dateExpiration: null,
        typeActe: acte.typeCode,
        numeroOfficiel: acte.reference,
        signataireNom: signataire || decisionUser?.email || null,
        signataireQualite: decisionUser?.role || null,
        dateSignature: acte.createdAt,
      },
      demande: {
        reference: acte.demandes.reference,
        montantDemande: acte.demandes.montantFcfa
          ? Number(acte.demandes.montantFcfa)
          : null,
        devise: acte.demandes.devise,
        dateDepot: acte.demandes.dateDepot,
        secteur: acte.demandes.secteur,
      },
      contribuable: {
        raisonSociale: acte.demandes.contribuables.raisonSociale,
        nif: acte.demandes.contribuables.nif,
        rccm: acte.demandes.contribuables.rccm,
        formeJuridique: null,
        adresse: acte.demandes.contribuables.adresse,
      },
      baseJuridique: bj
        ? {
            code: bj.basesJuridiques?.codeMesure ?? null,
            libelle: bj.libelle,
            referenceTexte: bj.articleCgi2025 || bj.article || null,
          }
        : null,
      qrPayload: { hash: qrHash },
    });
    await mkdir(join(process.cwd(), ATTESTATIONS_DIR), { recursive: true });
    const documentUrl = join(ATTESTATIONS_DIR, `${reference}.pdf`);
    await writeFile(join(process.cwd(), documentUrl), pdf);

    await this.prisma.acte.update({
      where: { id: acteId },
      data: { qrCodeHash: qrHash, hashDocument: documentHash, documentUrl },
    });

    return {
      acteId,
      reference,
      documentUrl,
      hashSha256: documentHash,
      qrHash,
      qrPayload,
      verifiableUrl: `/api/v1/attestations/verifier/${qrHash}`,
    };
  }

  async verifier(qrHash: string) {
    const acte = await this.prisma.acte.findFirst({ where: { qrCodeHash: qrHash } });
    if (!acte) throw new NotFoundException({ code: 'ATTESTATION_NON_TROUVEE' });
    return {
      valide: true,
      acteReference: acte.reference,
      hashDocument: acte.hashDocument,
      qrHash: acte.qrCodeHash,
    };
  }

  /**
   * Téléchargement de l'attestation d'une demande approuvée.
   * Accessible au contribuable propriétaire et aux rôles internes dans leur périmètre.
   */
  async telechargerParDemande(user: AuthUser, demandeId: string): Promise<AttestationFichier> {
    const allowed = await this.scope.isAllowed(user, 'demande', demandeId);
    if (!allowed) throw new ForbiddenException({ code: 'PERIMETRE_NON_AUTORISE' });

    const acte = await this.prisma.acte.findFirst({
      where: { demandeId, typeCode: 'attestation', estRevoke: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!acte) throw new NotFoundException({ code: 'ATTESTATION_NON_TROUVEE' });

    // Chemin stocké en base, sinon chemin conventionnel dérivé de la référence.
    const relativePath =
      acte.documentUrl || join(ATTESTATIONS_DIR, `ATTEST-${acte.reference}.pdf`);
    const absolutePath = join(process.cwd(), relativePath);

    // Anti-traversée : le fichier doit rester dans le dossier attestations/.
    const attestationsRoot = join(process.cwd(), ATTESTATIONS_DIR);
    if (!absolutePath.startsWith(attestationsRoot)) {
      throw new NotFoundException({ code: 'ATTESTATION_NON_TROUVEE' });
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(absolutePath);
    } catch {
      throw new NotFoundException({ code: 'ATTESTATION_FICHIER_ABSENT' });
    }

    const filename = basename(absolutePath);
    const mimeType = extname(filename).toLowerCase() === '.pdf' ? 'application/pdf' : 'text/plain';
    return { buffer, filename, mimeType };
  }

}
