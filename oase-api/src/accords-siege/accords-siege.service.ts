import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreerAccordSiegeDto, ModifierAccordSiegeDto } from './dto/accord-siege.dto';

/**
 * Sous-registre des accords de siège (Processus n° 6 — MAE → OTR).
 * Organisations internationales, corps diplomatiques, ONG internationales :
 * la table accords_siege existait déjà (avec son référentiel de types) mais
 * aucun endpoint ne l'exposait — la vue MAE restait vide.
 */
@Injectable()
export class AccordsSiegeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister(typeInstitutionCode?: string) {
    const where: Record<string, unknown> = {};
    if (typeInstitutionCode) where.typeInstitutionCode = typeInstitutionCode;

    return this.prisma.accordSiege.findMany({
      where,
      include: {
        refTypesAccordSiege: true,
        _count: { select: { contribuables: true, conventions: true } },
      },
      orderBy: { institution: 'asc' },
    });
  }

  async trouverParId(id: string) {
    const accord = await this.prisma.accordSiege.findUnique({
      where: { id },
      include: {
        refTypesAccordSiege: true,
        contribuables: { select: { id: true, nif: true, raisonSociale: true } },
        conventions: { select: { id: true, reference: true, dateDebut: true, dateFin: true, statutCode: true } },
      },
    });
    if (!accord) throw new NotFoundException({ code: 'ACCORD_SIEGE_INTROUVABLE' });
    return accord;
  }

  async creer(dto: CreerAccordSiegeDto, utilisateurId: string) {
    await this.assertTypeExiste(dto.typeInstitutionCode);

    const doublon = await this.prisma.accordSiege.findFirst({
      where: { institution: dto.institution.trim(), estActif: true },
    });
    if (doublon) {
      throw new ConflictException({ code: 'ACCORD_SIEGE_DOUBLON', message: 'Un accord actif existe déjà pour cette institution' });
    }

    const accord = await this.prisma.accordSiege.create({
      data: {
        institution: dto.institution.trim(),
        typeInstitutionCode: dto.typeInstitutionCode,
        texteFondateur: dto.texteFondateur ?? null,
        dateSignature: dto.dateSignature ? new Date(dto.dateSignature) : null,
      },
      include: { refTypesAccordSiege: true },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'ACCORD_SIEGE_CREER',
      entite: 'accords_siege',
      entiteId: accord.id,
      nouvelleValeur: { institution: accord.institution, typeInstitutionCode: accord.typeInstitutionCode },
    });

    return accord;
  }

  async modifier(id: string, dto: ModifierAccordSiegeDto, utilisateurId: string) {
    const existant = await this.prisma.accordSiege.findUnique({ where: { id } });
    if (!existant) throw new NotFoundException({ code: 'ACCORD_SIEGE_INTROUVABLE' });

    if (dto.typeInstitutionCode) await this.assertTypeExiste(dto.typeInstitutionCode);

    const accord = await this.prisma.accordSiege.update({
      where: { id },
      data: {
        ...(dto.institution !== undefined ? { institution: dto.institution.trim() } : {}),
        ...(dto.typeInstitutionCode !== undefined ? { typeInstitutionCode: dto.typeInstitutionCode } : {}),
        ...(dto.texteFondateur !== undefined ? { texteFondateur: dto.texteFondateur } : {}),
        ...(dto.dateSignature !== undefined ? { dateSignature: new Date(dto.dateSignature) } : {}),
        ...(dto.estActif !== undefined ? { estActif: dto.estActif } : {}),
      },
      include: { refTypesAccordSiege: true },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'ACCORD_SIEGE_MODIFIER',
      entite: 'accords_siege',
      entiteId: id,
      ancienneValeur: {
        institution: existant.institution,
        typeInstitutionCode: existant.typeInstitutionCode,
        estActif: existant.estActif,
      },
      nouvelleValeur: dto as Record<string, unknown>,
    });

    return accord;
  }

  private async assertTypeExiste(code: string) {
    const type = await this.prisma.refTypeAccordSiege.findUnique({ where: { code } });
    if (!type || !type.estActif) {
      throw new BadRequestException({ code: 'TYPE_INSTITUTION_INCONNU', message: `Type d'institution inconnu : ${code}` });
    }
  }
}
