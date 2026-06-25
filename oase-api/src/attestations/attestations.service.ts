import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

const ATTESTATIONS_DIR = 'attestations';

@Injectable()
export class AttestationsService {
  constructor(private prisma: PrismaService) {}

  async generer(acteId: string) {
    const acte = await this.prisma.acte.findUnique({
      where: { id: acteId },
      include: { demandes: { include: { beneficiaires: true } }, decisions: true },
    });
    if (!acte) throw new NotFoundException({ code: 'ACTE_INEXISTANT' });

    const reference = `ATTEST-${acte.reference}`;
    const qrPayload = {
      ref: reference,
      acte: acte.reference,
      demande: acte.demandes.reference,
      beneficiaire: acte.demandes.beneficiaires.nif,
      hash: acte.hashDocument,
    };
    const qrHash = createHash('sha256').update(JSON.stringify(qrPayload)).digest('hex');
    const documentHash = createHash('sha256').update(`${acte.id}:${qrHash}:${Date.now()}`).digest('hex');

    const content = this.buildAttestationContent(reference, acte, qrPayload);
    await mkdir(join(process.cwd(), ATTESTATIONS_DIR), { recursive: true });
    const documentUrl = join(ATTESTATIONS_DIR, `${reference}.txt`);
    await writeFile(join(process.cwd(), documentUrl), content);

    await this.prisma.acte.update({
      where: { id: acteId },
      data: { qrCodeHash: qrHash, hashDocument: documentHash },
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

  private buildAttestationContent(reference: string, acte: any, qrPayload: any): string {
    return [
      'ATTESTATION OASE',
      '================',
      `Reference: ${reference}`,
      `Acte: ${acte.reference}`,
      `Demande: ${acte.demandes.reference}`,
      `Beneficiaire NIF: ${acte.demandes.beneficiaires.nif}`,
      `Date d'effet: ${acte.dateEffet.toISOString()}`,
      `Hash QR: ${qrPayload.hash}`,
      'Cette attestation est verifiable via le QR code ou sur /api/v1/attestations/verifier/{qrHash}',
    ].join('\n');
  }
}
