import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EtaxAdapter } from '../connecteurs/adapters/etax.adapter';
import { CreerBeneficiaireDto } from './dto/creer-beneficiaire.dto';
import { ModifierBeneficiaireDto } from './dto/modifier-beneficiaire.dto';
import { FiltrerBeneficiairesDto } from './dto/filtrer-beneficiaires.dto';
import { AuthUser } from '../auth/auth.service';

@Injectable()
export class BeneficiairesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private etax: EtaxAdapter,
  ) {}

  async creer(user: AuthUser, dto: CreerBeneficiaireDto) {
    const existing = await this.prisma.beneficiaire.findUnique({ where: { nif: dto.nif } });
    if (existing) {
      throw new ConflictException({ code: 'NIF_EXISTANT' });
    }

    const beneficiaire = await this.prisma.beneficiaire.create({
      data: {
        raisonSociale: dto.raisonSociale,
        nif: dto.nif,
        rccm: dto.rccm,
        typeBeneficiaireCode: dto.typeBeneficiaireCode,
        secteur: dto.secteur,
        region: dto.region,
        emailContact: dto.emailContact,
        telephone: dto.telephone,
        adresse: dto.adresse,
        userId: user.role === 'beneficiaire' ? user.id : null,
      },
      include: { utilisateurs: true },
    });

    await this.audit.createEntry({
      action: 'BENEFICIAIRE_CREE',
      entite: 'beneficiaires',
      entiteId: beneficiaire.id,
      utilisateurId: user.id,
      nouvelleValeur: { nif: dto.nif, typeBeneficiaireCode: dto.typeBeneficiaireCode },
    });

    return this.toResponse(beneficiaire);
  }

  async lister(user: AuthUser, dto: FiltrerBeneficiairesDto) {
    const where: any = {};
    if (dto.typeBeneficiaireCode) where.typeBeneficiaireCode = dto.typeBeneficiaireCode;
    if (dto.statutFiscalCode) where.statutFiscalCode = dto.statutFiscalCode;
    if (dto.secteur) where.secteur = dto.secteur;
    if (dto.search) {
      where.OR = [{ raisonSociale: { contains: dto.search } }, { nif: { contains: dto.search } }];
    }
    if (user.role === 'beneficiaire') {
      where.userId = user.id;
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.beneficiaire.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.beneficiaire.count({ where }),
    ]);

    return {
      data: items.map((b) => this.toResponse(b)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async detail(user: AuthUser, id: string) {
    const where: any = { id };
    if (user.role === 'beneficiaire') {
      where.userId = user.id;
    }
    const beneficiaire = await this.prisma.beneficiaire.findFirst({ where });
    if (!beneficiaire) throw new NotFoundException({ code: 'BENEFICIAIRE_INEXISTANT' });
    return this.toResponse(beneficiaire);
  }

  async modifier(user: AuthUser, id: string, dto: ModifierBeneficiaireDto) {
    const where: any = { id };
    if (user.role === 'beneficiaire') {
      where.userId = user.id;
    }
    const existing = await this.prisma.beneficiaire.findFirst({ where });
    if (!existing) throw new NotFoundException({ code: 'BENEFICIAIRE_INEXISTANT' });

    const updated = await this.prisma.beneficiaire.update({
      where: { id },
      data: {
        raisonSociale: dto.raisonSociale,
        emailContact: dto.emailContact,
        telephone: dto.telephone,
        adresse: dto.adresse,
        secteur: dto.secteur,
        region: dto.region,
      },
    });

    await this.audit.createEntry({
      action: 'BENEFICIAIRE_MODIFIE',
      entite: 'beneficiaires',
      entiteId: id,
      utilisateurId: user.id,
      nouvelleValeur: { ...dto } as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  async statutFiscal(user: AuthUser, id: string) {
    const beneficiaire = await this.detail(user, id);
    const statut = await this.etax.getStatutFiscal(beneficiaire.nif);
    return { nif: beneficiaire.nif, statutFiscal: statut, source: 'E-TAX (mock)' };
  }

  private toResponse(beneficiaire: any) {
    return {
      id: beneficiaire.id,
      raisonSociale: beneficiaire.raisonSociale,
      nif: beneficiaire.nif,
      rccm: beneficiaire.rccm,
      typeBeneficiaireCode: beneficiaire.typeBeneficiaireCode,
      statutFiscalCode: beneficiaire.statutFiscalCode,
      secteur: beneficiaire.secteur,
      region: beneficiaire.region,
      emailContact: beneficiaire.emailContact,
      telephone: beneficiaire.telephone,
      adresse: beneficiaire.adresse,
      userId: beneficiaire.userId,
      createdAt: beneficiaire.createdAt,
      updatedAt: beneficiaire.updatedAt,
    };
  }
}
