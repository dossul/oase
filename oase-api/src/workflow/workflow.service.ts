import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService, AuthUser } from '../auth/auth.service';
import { CreerWorkflowTemplateDto } from './dto/creer-workflow-template.dto';
import { ValiderEtapeDto } from './dto/valider-etape.dto';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private auth: AuthService,
  ) {}

  async creerTemplate(user: AuthUser, dto: CreerWorkflowTemplateDto) {
    const existing = await this.prisma.workflowTemplate.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException({ code: 'CODE_TEMPLATE_EXISTANT' });

    const template = await this.prisma.workflowTemplate.create({
      data: {
        code: dto.code,
        nom: dto.nom,
        description: dto.description,
        baseJuridiqueVersionId: dto.baseJuridiqueVersionId,
        typeTexte1: dto.typeTexte1,
        organeGestionCode: dto.organeGestionCode,
        estActif: dto.estActif ?? true,
        workflowTemplateEtapes: {
          create: dto.etapes.map((e) => ({
            nomEtape: e.nomEtape,
            ordre: e.ordre,
            acteurRole: e.acteurRole,
            institutionTypeCode: e.institutionTypeCode,
            delaiCibleJours: e.delaiCibleJours,
            pinRequis: e.pinRequis ?? false,
            estObligatoire: e.estObligatoire ?? true,
          })),
        },
      },
      include: { workflowTemplateEtapes: true },
    });

    await this.audit.createEntry({
      action: 'WORKFLOW_TEMPLATE_CREE',
      entite: 'workflow_templates',
      entiteId: template.id,
      utilisateurId: user.id,
      nouvelleValeur: { code: dto.code, etapes: dto.etapes.length },
    });

    return template;
  }

  async listerTemplates() {
    return this.prisma.workflowTemplate.findMany({
      where: { estActif: true },
      include: { workflowTemplateEtapes: { orderBy: { ordre: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async demarrerInstance(user: AuthUser, demandeId: string, templateId: string) {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id: templateId },
      include: { workflowTemplateEtapes: { orderBy: { ordre: 'asc' } } },
    });
    if (!template) throw new NotFoundException({ code: 'TEMPLATE_INEXISTANT' });

    const demande = await this.prisma.demande.findUnique({ where: { id: demandeId } });
    if (!demande) throw new NotFoundException({ code: 'DEMANDE_INEXISTANTE' });

    const instance = await this.prisma.demandeWorkflowInstance.create({
      data: {
        demandeId,
        workflowTemplateId: templateId,
        statutCode: 'en_cours',
        demandeWorkflowEtapes: {
          create: template.workflowTemplateEtapes.map((etape) => ({
            templateEtapeId: etape.id,
            nomEtape: etape.nomEtape,
            statutCode: etape.ordre === 1 ? 'en_cours' : 'en_attente',
            acteurRole: etape.acteurRole,
            ordre: etape.ordre,
            delaiCibleJours: etape.delaiCibleJours,
          })),
        },
      },
      include: { demandeWorkflowEtapes: { orderBy: { ordre: 'asc' } } },
    });

    await this.prisma.demande.update({
      where: { id: demandeId },
      data: { etapeActuelle: template.workflowTemplateEtapes[0]?.nomEtape ?? null },
    });

    await this.audit.createEntry({
      action: 'WORKFLOW_INSTANCE_DEMARREE',
      entite: 'demande_workflow_instances',
      entiteId: instance.id,
      utilisateurId: user.id,
      demandeId,
      nouvelleValeur: { templateId, etapes: template.workflowTemplateEtapes.length },
    });

    return instance;
  }

  async validerEtape(user: AuthUser, etapeId: string, dto: ValiderEtapeDto) {
    const etape = await this.prisma.demandeWorkflowEtape.findUnique({
      where: { id: etapeId },
      include: {
        demandeWorkflowInstances: { include: { workflowTemplates: { include: { workflowTemplateEtapes: true } } } },
      },
    });
    if (!etape) throw new NotFoundException({ code: 'ETAPE_INEXISTANTE' });

    const templateEtape = etape.demandeWorkflowInstances.workflowTemplates.workflowTemplateEtapes.find(
      (e) => e.id === etape.templateEtapeId,
    );
    if (templateEtape?.pinRequis) {
      const pinOk = await this.auth.verifyPin(user.id, dto.pin);
      if (!pinOk) throw new BadRequestException({ code: 'PIN_INVALIDE' });
    }

    const updated = await this.prisma.demandeWorkflowEtape.update({
      where: { id: etapeId },
      data: {
        statutCode: 'valide',
        acteurId: user.id,
        dateFin: new Date(),
        commentaire: dto.commentaire,
        pinSigne: templateEtape?.pinRequis ?? false,
        decisionPrise: true,
      },
      include: { demandeWorkflowInstances: true },
    });

    await this.audit.createEntry({
      action: 'WORKFLOW_ETAPE_VALIDEE',
      entite: 'demande_workflow_etapes',
      entiteId: etapeId,
      utilisateurId: user.id,
      demandeId: etape.demandeWorkflowInstances.demandeId,
      nouvelleValeur: { statutCode: 'valide', commentaire: dto.commentaire },
    });

    return updated;
  }

  async listerEtapesInstance(demandeId: string) {
    const instance = await this.prisma.demandeWorkflowInstance.findUnique({
      where: { demandeId },
      include: {
        demandeWorkflowEtapes: {
          orderBy: { ordre: 'asc' },
          include: { utilisateurs: { select: { id: true, nom: true, prenom: true } } },
        },
      },
    });
    if (!instance) throw new NotFoundException({ code: 'INSTANCE_INEXISTANTE' });
    return instance;
  }
}
