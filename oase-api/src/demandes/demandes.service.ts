import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../common/services/scope.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { CreerDemandeDto } from './dto/creer-demande.dto';
import { FiltrerDemandesDto } from './dto/filtrer-demandes.dto';
import { StateMachineService, TransitionAction } from './state-machine.service';
import { WorkflowService } from '../workflow/workflow.service';
import { buildSimpleXlsx } from '../common/utils/simple-xlsx.util';
import { StatutDemande } from '../common/enums/generated';

@Injectable()
export class DemandesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private scope: ScopeService,
    private stateMachine: StateMachineService,
    private auth: AuthService,
    private workflow: WorkflowService,
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
    // SÉCURITÉ : l'approbation finale doit passer par POST /demandes/:id/decisions/approuver
    // (PIN de signature + règles de blocage + génération d'acte + notification).
    // La transition directe contournerait toute la chaîne de contrôle.
    if (action === 'approuver') {
      throw new BadRequestException({
        code: 'APPROBATION_VIA_DECISIONS',
        message: "L'approbation doit passer par POST /demandes/:id/decisions/approuver (PIN + contrôles requis).",
      });
    }

    const demande = await this.detail(user, id);
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });

    // DÉFENSE EN PROFONDEUR : le rejet engage la responsabilité de l'agent —
    // le PIN de signature est vérifié côté serveur (le frontend le vérifie déjà
    // via /auth/verify-pin, mais le client HTTP peut être contourné).
    if (action === 'rejeter') {
      const pin = payload?.pin;
      if (!pin) throw new BadRequestException({ code: 'PIN_REQUIS' });
      const pinOk = await this.auth.verifyPin(user.id, pin);
      if (!pinOk) throw new UnauthorizedException({ code: 'PIN_INVALIDE' });
    }

    const newStatut = this.stateMachine.transition(demande.statutCode as StatutDemande, action);

    const updateData: any = { statutCode: newStatut };
    if (action === 'prendre_en_charge') updateData.instructeurId = user.id;
    if (action === 'soumettre') updateData.dateDepot = new Date();
    if (action === 'rejeter') updateData.motifRejet = payload?.motifRejet;
    if (action === 'rejeter') updateData.dateArchivage = null;
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

    // US-P1-03 : la soumission définitive démarre le workflow d'instruction.
    // Idempotent : si une instance existe déjà (anciennes demandes corrigées
    // par script), on ne fait rien. Sans template actif correspondant, la
    // soumission reste valide et le workflow pourra être démarré manuellement.
    if (action === 'soumettre') {
      await this.demarrerWorkflowAutomatique(user, id, demande.baseJuridiqueVersionId);
    }

    return this.toResponse(updated);
  }

  /**
   * Démarre l'instance de workflow d'instruction après soumission.
   * Template choisi : actif, lié à la base juridique de la demande si possible,
   * sinon le premier template actif ayant des étapes (version la plus récente).
   */
  private async demarrerWorkflowAutomatique(user: AuthUser, demandeId: string, baseJuridiqueVersionId?: string | null) {
    const existante = await this.prisma.demandeWorkflowInstance.findUnique({ where: { demandeId } });
    if (existante) return;

    const template = await this.prisma.workflowTemplate.findFirst({
      where: {
        estActif: true,
        workflowTemplateEtapes: { some: {} },
        ...(baseJuridiqueVersionId ? { baseJuridiqueVersionId } : {}),
      },
      orderBy: { versionTemplate: 'desc' },
    });
    const templateFallback = template
      ? template
      : await this.prisma.workflowTemplate.findFirst({
          where: { estActif: true, workflowTemplateEtapes: { some: {} } },
          orderBy: { versionTemplate: 'desc' },
        });
    if (!templateFallback) return;

    await this.workflow.demarrerInstance(user, demandeId, templateFallback.id);
  }

  /**
   * US-P1-11 — Export serveur de la liste des demandes (CSV ou XLSX).
   * Périmètre : celui de l'utilisateur connecté (même scope que lister()).
   * Limite : 5 000 lignes. Nom de fichier : oase_demandes_P1_<userId>_<YYYYMMDD>.<ext>
   */
  async exporterMesDemandes(user: AuthUser, format: 'csv' | 'xlsx') {
    const scope = await this.scope.buildWhereClause(user, 'demande');
    const demandes = await this.prisma.demande.findMany({
      where: scope,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: { baseJuridiqueVersions: true },
    });

    const headers = ['N° demande', 'Type', 'Statut', 'Date dépôt', 'Date décision', 'Montant (FCFA)', 'Base juridique'];
    const rows = demandes.map((d) => {
      const bj = (d as any).baseJuridiqueVersions;
      return [
        d.reference,
        bj?.impotConcerne ?? '',
        d.statutCode,
        d.dateDepot ? new Date(d.dateDepot).toLocaleDateString('fr-FR') : '',
        (d as any).dateDecision ? new Date((d as any).dateDecision).toLocaleDateString('fr-FR') : '',
        Number(d.montantFcfa),
        bj ? `${bj.libelle}${bj.article ? ` — ${bj.article}` : ''}` : '',
      ] as (string | number)[];
    });

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `oase_demandes_P1_${user.id}_${date}.${format}`;

    await this.audit.createEntry({
      action: 'DEMANDES_EXPORTEES',
      entite: 'demandes',
      entiteId: user.id,
      utilisateurId: user.id,
      roleAuMoment: user.role,
      nouvelleValeur: { format, lignes: rows.length },
    });

    if (format === 'xlsx') {
      const buffer = buildSimpleXlsx(headers, rows);
      return {
        filename,
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    // CSV compatible Excel FR (séparateur ';' + BOM UTF-8)
    const escapeCsv = (v: string | number) => {
      const s = String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = '﻿' + [headers, ...rows].map((r) => r.map(escapeCsv).join(';')).join('\r\n');
    return { filename, buffer: Buffer.from(csv, 'utf8'), contentType: 'text/csv; charset=utf-8' };
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
