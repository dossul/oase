import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from '../auth/mfa.service';
import { AuditService } from '../audit/audit.service';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';
import { FiltrerUtilisateursDto } from './dto/filtrer-utilisateurs.dto';

@Injectable()
export class UtilisateursService {
  constructor(
    private prisma: PrismaService,
    private mfa: MfaService,
    private audit: AuditService,
  ) {}

  async creer(adminId: string, dto: CreerUtilisateurDto) {
    const existing = await this.prisma.utilisateur.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_EXISTANT' });
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const mfaGenerated = this.mfa.generateSecret();
    const mfaSecretEnc = this.mfa.encrypt(mfaGenerated.secret);

    const user = await this.prisma.utilisateur.create({
      data: {
        email: dto.email,
        nom: dto.nom,
        prenom: dto.prenom,
        role: dto.role,
        institutionId: dto.institutionId,
        telephone: dto.telephone,
        secteurAffecte: dto.secteurAffecte,
        passwordHash,
        mfaSecretEnc,
        mfaActive: true,
      },
      include: { institutions: true },
    });

    await this.audit.createEntry({
      action: 'UTILISATEUR_CREE',
      entite: 'utilisateurs',
      entiteId: user.id,
      utilisateurId: adminId,
      nouvelleValeur: { role: dto.role, institutionId: dto.institutionId },
    });

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      institutionId: user.institutionId,
      tempPassword,
      mfaSecret: mfaGenerated.secret,
      mfaQrCodeUri: mfaGenerated.otpauthUrl,
    };
  }

  async lister(dto: FiltrerUtilisateursDto) {
    const where: any = {};
    if (dto.role) where.role = dto.role;
    if (dto.statutCode) where.statutCode = dto.statutCode;
    if (dto.institutionId) where.institutionId = dto.institutionId;
    if (dto.search) {
      where.OR = [
        { email: { contains: dto.search } },
        { nom: { contains: dto.search } },
        { prenom: { contains: dto.search } },
      ];
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { institutions: { select: { id: true, nom: true, code: true } } },
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    return {
      data: items.map((u) => this.toResponse(u)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async detail(id: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: { institutions: { select: { id: true, nom: true, code: true } } },
    });
    if (!user) throw new NotFoundException({ code: 'UTILISATEUR_INEXISTANT' });
    return this.toResponse(user);
  }

  async modifier(adminId: string, id: string, dto: ModifierUtilisateurDto) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'UTILISATEUR_INEXISTANT' });

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.utilisateur.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException({ code: 'EMAIL_EXISTANT' });
    }

    const updated = await this.prisma.utilisateur.update({
      where: { id },
      data: { ...dto },
      include: { institutions: true },
    });

    await this.audit.createEntry({
      action: 'UTILISATEUR_MODIFIE',
      entite: 'utilisateurs',
      entiteId: id,
      utilisateurId: adminId,
      ancienneValeur: { role: user.role, institutionId: user.institutionId, statutCode: user.statutCode },
      nouvelleValeur: { role: dto.role, institutionId: dto.institutionId, statutCode: dto.statutCode },
    });

    return this.toResponse(updated);
  }

  async resetMfa(adminId: string, id: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'UTILISATEUR_INEXISTANT' });

    const mfaGenerated = this.mfa.generateSecret();
    const mfaSecretEnc = this.mfa.encrypt(mfaGenerated.secret);
    await this.prisma.utilisateur.update({
      where: { id },
      data: { mfaSecretEnc, mfaActive: true },
    });

    await this.audit.createEntry({
      action: 'MFA_RESET',
      entite: 'utilisateurs',
      entiteId: id,
      utilisateurId: adminId,
    });

    return { id, mfaSecret: mfaGenerated.secret, mfaQrCodeUri: mfaGenerated.otpauthUrl };
  }

  async resetPin(adminId: string, id: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'UTILISATEUR_INEXISTANT' });

    await this.prisma.utilisateur.update({
      where: { id },
      data: { pinHash: null },
    });

    await this.audit.createEntry({
      action: 'PIN_RESET',
      entite: 'utilisateurs',
      entiteId: id,
      utilisateurId: adminId,
    });

    return { id, reset: true };
  }

  private toResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      institutionId: user.institutionId,
      institution: user.institutions
        ? { id: user.institutions.id, nom: user.institutions.nom, code: user.institutions.code }
        : null,
      statutCode: user.statutCode,
      mfaActive: user.mfaActive,
      telephone: user.telephone,
      secteurAffecte: user.secteurAffecte,
      derniereConnexion: user.derniereConnexion,
      createdAt: user.createdAt,
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '!';
  }
}
