import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreerPermisMinierDto, MajStatutPermisDto } from './dto/permis-minier.dto';

@Injectable()
export class PermisMiniersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async lister(filtres?: { contribuableId?: string; typePermis?: string; statut?: string }) {
    const where: Record<string, unknown> = {};
    if (filtres?.contribuableId) where.contribuableId = filtres.contribuableId;
    if (filtres?.typePermis) where.typePermis = filtres.typePermis;
    if (filtres?.statut) where.statut = filtres.statut;

    return this.prisma.permisMinier.findMany({
      where,
      include: {
        contribuables: { select: { id: true, nif: true, raisonSociale: true } },
        conventions: { select: { id: true, reference: true } },
      },
      orderBy: { dateOctroi: 'desc' as const },
    });
  }

  async trouverParId(id: string) {
    const permis = await this.prisma.permisMinier.findUnique({
      where: { id },
      include: {
        contribuables: { select: { id: true, nif: true, raisonSociale: true } },
        conventions: { select: { id: true, reference: true, dateFin: true } },
      },
    });
    if (!permis) throw new NotFoundException('Permis minier non trouvé');
    return permis;
  }

  async creer(dto: CreerPermisMinierDto, utilisateurId: string) {
    const existant = await this.prisma.permisMinier.findUnique({
      where: { reference: dto.reference },
    });
    if (existant) throw new ConflictException('Référence de permis déjà utilisée');

    const permis = await this.prisma.permisMinier.create({
      data: {
        reference: dto.reference,
        contribuableId: dto.contribuableId,
        conventionId: dto.conventionId ?? null,
        typePermis: dto.typePermis,
        substance: dto.substance,
        dateDemande: new Date(dto.dateDemande),
        dateOctroi: new Date(dto.dateOctroi),
        dureeAnnees: dto.dureeAnnees,
        superficieKm2: dto.superficieKm2 ?? null,
        localite: dto.localite ?? null,
        longitude: dto.longitude ?? null,
        latitude: dto.latitude ?? null,
        rapportEiePublic: dto.rapportEiePublic ?? false,
        lienRapportEie: dto.lienRapportEie ?? null,
        modeOctroi: dto.modeOctroi,
      },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'PERMIS_MINIER_CREER',
      entite: 'PermisMinier',
      entiteId: permis.id,
      nouvelleValeur: { reference: dto.reference, typePermis: dto.typePermis, substance: dto.substance },
    });

    return permis;
  }

  async majStatut(id: string, dto: MajStatutPermisDto, utilisateurId: string) {
    const permis = await this.prisma.permisMinier.findUnique({ where: { id } });
    if (!permis) throw new NotFoundException('Permis minier non trouvé');

    const updated = await this.prisma.permisMinier.update({
      where: { id },
      data: { statut: dto.statut },
    });

    await this.audit.createEntry({
      utilisateurId,
      action: 'PERMIS_MINIER_STATUT',
      entite: 'PermisMinier',
      entiteId: id,
      ancienneValeur: { statut: permis.statut },
      nouvelleValeur: { statut: dto.statut },
    });

    return updated;
  }
}
