import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../common/services/scope.service';
import { AuthUser } from '../auth/auth.service';
import { CreerDemandeDto } from './dto/creer-demande.dto';
import { FiltrerDemandesDto } from './dto/filtrer-demandes.dto';
import { StateMachineService, TransitionAction } from './state-machine.service';
import { StatutDemande } from '../common/enums/generated';

@Injectable()
export class DemandesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private scope: ScopeService,
    private stateMachine: StateMachineService,
  ) {}

  async creer(user: AuthUser, dto: CreerDemandeDto) {
    const contribuable = await this.prisma.contribuable.findFirst({
      where: user.role === 'contribuable' ? { id: dto.contribuableId, userId: user.id } : { id: dto.contribuableId },
    });
    if (!contribuable) throw new NotFoundException({ code: 'CONTRIBUABLE_INEXISTANT' });

    const reference = await this.generateReference();
    const demande = await this.prisma.demande.create({
      data: {
        reference,
        baseJuridiqueVersionId: dto.baseJuridiqueVersionId,
        contribuableId: dto.contribuableId,
        montantFcfa: BigInt(dto.montantFcfa),
        secteur: dto.secteur,
        dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
        estUrgente: dto.estUrgente ?? false,
        statutCode: StatutDemande.BROUILLON,
      },
      include: { contribuables: true, baseJuridiqueVersions: true },
    });

    await this.audit.createEntry({
      action: 'DEMANDE_CREEE',
      entite: 'demandes',
      entiteId: demande.id,
      utilisateurId: user.id,
      nouvelleValeur: { reference, montantFcfa: dto.montantFcfa, statutCode: StatutDemande.BROUILLON },
    });

    return this.toResponse(demande);
  }

  async lister(user: AuthUser, dto: FiltrerDemandesDto) {
    const scope = await this.scope.buildWhereClause(user, 'demande');
    const where: any = { ...scope };
    if (dto.statutCode) where.statutCode = dto.statutCode;
    if (dto.contribuableId) where.contribuableId = dto.contribuableId;
    if (dto.baseJuridiqueVersionId) where.baseJuridiqueVersionId = dto.baseJuridiqueVersionId;
    if (dto.instructeurId) where.instructeurId = dto.instructeurId;
    if (dto.secteur) where.secteur = dto.secteur;
    if (dto.search) {
      where.OR = [{ reference: { contains: dto.search } }];
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.demande.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contribuables: true, baseJuridiqueVersions: true, utilisateurs: true },
      }),
      this.prisma.demande.count({ where }),
    ]);

    return {
      data: items.map((d) => this.toResponse(d)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async detail(user: AuthUser, id: string) {
    const allowed = await this.scope.isAllowed(user, 'demande', id);
    if (!allowed) throw new ForbiddenException({ code: 'PERIMETRE_NON_AUTORISE' });

    const demande = await this.prisma.demande.findUnique({
      where: { id },
      include: { contribuables: true, baseJuridiqueVersions: true, utilisateurs: true },
    });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });
    return this.toResponse(demande);
  }

  async transition(user: AuthUser, id: string, action: TransitionAction, payload?: any) {
    const demande = await this.detail(user, id);
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });

    const newStatut = this.stateMachine.transition(demande.statutCode as StatutDemande, action);

    const updateData: any = { statutCode: newStatut };
    if (action === 'prendre_en_charge') updateData.instructeurId = user.id;
    if (action === 'soumettre') updateData.dateDepot = new Date();
    if (action === 'rejeter') updateData.motifRejet = payload?.motifRejet;
    if (action === 'approuver' || action === 'rejeter') updateData.dateArchivage = null;
    if (action === 'archiver') updateData.dateArchivage = new Date();

    const updated = await this.prisma.demande.update({
      where: { id },
      data: updateData,
      include: { contribuables: true, baseJuridiqueVersions: true, utilisateurs: true },
    });

    await this.audit.createEntry({
      action: `DEMANDE_${action.toUpperCase()}`,
      entite: 'demandes',
      entiteId: id,
      utilisateurId: user.id,
      roleAuMoment: user.role,
      ancienneValeur: { statutCode: demande.statutCode },
      nouvelleValeur: { statutCode: newStatut, ...payload },
    });

    return this.toResponse(updated);
  }

  async statsParStatut(user: AuthUser) {
    const scope = await this.scope.buildWhereClause(user, 'demande');
    const result = await this.prisma.demande.groupBy({
      by: ['statutCode'],
      where: scope,
      _count: { statutCode: true },
    });
    return result.map((r) => ({ statutCode: r.statutCode, count: r._count.statutCode }));
  }

  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.demande.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `DEM-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private toResponse(demande: any) {
    return {
      id: demande.id,
      reference: demande.reference,
      statutCode: demande.statutCode,
      baseJuridiqueVersionId: demande.baseJuridiqueVersionId,
      contribuableId: demande.contribuableId,
      contribuable: demande.contribuables
        ? {
            id: demande.contribuables.id,
            raisonSociale: demande.contribuables.raisonSociale,
            nif: demande.contribuables.nif,
          }
        : null,
      instructeurId: demande.instructeurId,
      instructeur: demande.utilisateurs
        ? { id: demande.utilisateurs.id, nom: demande.utilisateurs.nom, prenom: demande.utilisateurs.prenom }
        : null,
      montantFcfa: demande.montantFcfa.toString(),
      secteur: demande.secteur,
      dateDepot: demande.dateDepot,
      dateEcheance: demande.dateEcheance,
      motifRejet: demande.motifRejet,
      estUrgente: demande.estUrgente,
      createdAt: demande.createdAt,
      updatedAt: demande.updatedAt,
    };
  }
}
