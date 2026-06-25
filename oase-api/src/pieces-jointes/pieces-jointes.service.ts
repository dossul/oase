import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.service';
import { UploadPieceJointeDto } from './dto/upload-piece-jointe.dto';

export interface LocalUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 10 * 1024 * 1024;
const UPLOAD_DIR = 'uploads';

@Injectable()
export class PiecesJointesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async upload(user: AuthUser, demandeId: string, file: LocalUploadedFile, dto: UploadPieceJointeDto) {
    if (!file) throw new BadRequestException({ code: 'FICHIER_MANQUANT' });
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException({ code: 'TYPE_MIME_NON_AUTORISE' });
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException({ code: 'FICHIER_TROP_VOLUMINEUX' });
    }

    const demande = await this.prisma.demande.findUnique({ where: { id: demandeId } });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });

    const hash = createHash('sha256').update(file.buffer).digest('hex');
    const ext = file.originalname.split('.').pop() || 'bin';
    const filename = `${Date.now()}-${hash.slice(0, 16)}.${ext}`;
    const relativePath = join(UPLOAD_DIR, demandeId, filename);
    const absolutePath = join(process.cwd(), relativePath);

    await mkdir(join(process.cwd(), UPLOAD_DIR, demandeId), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const piece = await this.prisma.pieceJointe.create({
      data: {
        demandeId,
        nomFichier: file.originalname,
        typeMime: file.mimetype,
        tailleOctets: BigInt(file.size),
        rangCode: dto.rangCode,
        categorie: dto.categorie ?? 'document',
        typeDocumentCode: dto.typeDocumentCode,
        urlStockage: relativePath,
        hashSha256: hash,
      },
    });

    await this.audit.createEntry({
      action: 'PIECE_JOINTE_UPLOADEE',
      entite: 'pieces_jointes',
      entiteId: piece.id,
      utilisateurId: user.id,
      demandeId,
      nouvelleValeur: { nomFichier: file.originalname, hashSha256: hash, tailleOctets: file.size },
    });

    return {
      id: piece.id,
      nomFichier: piece.nomFichier,
      typeMime: piece.typeMime,
      tailleOctets: Number(piece.tailleOctets),
      hashSha256: piece.hashSha256,
      urlStockage: piece.urlStockage,
      rangCode: piece.rangCode,
      categorie: piece.categorie,
      createdAt: piece.createdAt,
    };
  }

  async listerParDemande(demandeId: string) {
    const pieces = await this.prisma.pieceJointe.findMany({
      where: { demandeId },
      orderBy: { createdAt: 'desc' },
    });
    return pieces.map((p) => ({
      id: p.id,
      nomFichier: p.nomFichier,
      typeMime: p.typeMime,
      tailleOctets: Number(p.tailleOctets),
      hashSha256: p.hashSha256,
      rangCode: p.rangCode,
      categorie: p.categorie,
      estValide: p.estValide,
      createdAt: p.createdAt,
    }));
  }

  async valider(user: AuthUser, pieceId: string, estValide: boolean, commentaire?: string) {
    const piece = await this.prisma.pieceJointe.findUnique({ where: { id: pieceId } });
    if (!piece) throw new NotFoundException({ code: 'PIECE_JOINTE_INEXISTANTE' });

    const updated = await this.prisma.pieceJointe.update({
      where: { id: pieceId },
      data: {
        estValide,
        valideParId: user.id,
        dateValidation: new Date(),
        commentaireValidation: commentaire,
      },
    });

    await this.audit.createEntry({
      action: estValide ? 'PIECE_JOINTE_VALIDEE' : 'PIECE_JOINTE_INVALIDEE',
      entite: 'pieces_jointes',
      entiteId: pieceId,
      utilisateurId: user.id,
      demandeId: piece.demandeId,
      nouvelleValeur: { estValide, commentaireValidation: commentaire },
    });

    return updated;
  }
}
