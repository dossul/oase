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

  /**
   * Annuaire interne (rôles internes uniquement) : identité + rôle + institution,
   * sans aucune donnée sensible (pas d'email, téléphone, statut MFA…).
   */
  async annuaire() {
    const users = await this.prisma.utilisateur.findMany({
      where: { statutCode: 'actif' },
      select: {
        id: true,
        nom: true,
        prenom: true,
        role: true,
        institutions: { select: { id: true, nom: true, code: true } },
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return users.map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      role: u.role,
      institution: u.institutions
        ? { id: u.institutions.id, nom: u.institutions.nom, code: u.institutions.code }
        : null,
    }));
  }

  async modifier(adminId: string, id: string, dto: ModifierUtilisateurDto) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'UTILISATEUR_INEXISTANT' });

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.utilisateur.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException({ code: 'EMAIL_EXISTANT' });
    }

    await this.assertNotLastActiveAdmin(user, dto);

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

  /**
   * Garde-fou DERNIER_ADMIN : interdit de désactiver ou de rétrograder
   * le dernier administrateur actif (admin / admin_si) de la plateforme.
   * Le référentiel est le rôle canonique admin_si : un compte legacy 'admin'
   * ne suffit pas à garantir l'administration de la plateforme.
   */
  private async assertNotLastActiveAdmin(user: any, dto: ModifierUtilisateurDto) {
    const ADMIN_ROLES = ['admin', 'admin_si'];
    const isAdmin = ADMIN_ROLES.includes(user.role) && user.statutCode === 'actif';
    if (!isAdmin) return;

    const desactivation = dto.statutCode !== undefined && dto.statutCode !== 'actif';
    const retrogradation = dto.role !== undefined && !ADMIN_ROLES.includes(dto.role);
    if (!desactivation && !retrogradation) return;

    const autresAdminsActifs = await this.prisma.utilisateur.count({
      where: {
        id: { not: user.id },
        role: 'admin_si',
        statutCode: 'actif',
      },
    });

    if (autresAdminsActifs === 0) {
      throw new ConflictException({
        code: 'DERNIER_ADMIN',
        message: 'Impossible de désactiver ou rétrograder le dernier administrateur actif.',
      });
    }
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
