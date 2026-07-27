import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/auth.service';
import { Role } from '../enums/generated';

export type ResourceType =
  | 'demande'
  | 'contribuable'
  | 'convention'
  | 'audit_log'
  | 'utilisateur'
  | 'base_juridique'
  | 'opendata';

const ORGANE_CI = 'CI';
const ORGANE_CDDI = 'CDDI';
const ORGANE_CDDI_CI = 'CDDI_CI';

/** Types de texte relevant du périmètre des agences (SAZOF / API-ZF). */
const TYPES_TEXTE_AGENCE = ['Zone Franche', 'Code des Investissements', 'Code Investissements'];
/** Types de texte relevant du périmètre MAE (accords de siège). */
const TYPES_TEXTE_MAE = ['Accord de siège', 'Accord de siege'];
/** Types de texte relevant du périmètre DGMG (mines & hydrocarbures). */
const TYPES_TEXTE_DGMG = ['Code Minier', 'Code des Hydrocarbures'];

export interface ScopedWhere {
  [key: string]: any;
}

@Injectable()
export class ScopeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Construit la clause WHERE Prisma pour lister les ressources d'un type donné
   * selon le rôle et le périmètre de l'utilisateur connecté.
   */
  async buildWhereClause(user: AuthUser, resource: ResourceType): Promise<ScopedWhere> {
    const role = user.role as Role;

    switch (resource) {
      case 'demande':
        return this.buildDemandeScope(user, role);
      case 'contribuable':
        return this.buildContribuableScope(user, role);
      case 'base_juridique':
        return this.buildBaseJuridiqueScope(user, role);
      case 'convention':
        return this.buildConventionScope(user, role);
      case 'audit_log':
        return this.buildAuditLogScope(user, role);
      case 'utilisateur':
        return this.buildUtilisateurScope(user, role);
      case 'opendata':
        return {};
      default:
        return {};
    }
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource spécifique par ID.
   */
  async isAllowed(user: AuthUser, resource: ResourceType, resourceId: string): Promise<boolean> {
    try {
      switch (resource) {
        case 'demande':
          const demande = await this.prisma.demande.findUnique({
            where: { id: resourceId },
            include: { contribuables: true, baseJuridiqueVersions: true },
          });
          if (!demande) return false;
          return this.demandeMatchesScope(demande, user);
        case 'contribuable':
          const contribuable = await this.prisma.contribuable.findUnique({ where: { id: resourceId } });
          if (!contribuable) return false;
          return this.contribuableMatchesScope(contribuable, user);
        case 'utilisateur':
          if (user.role === Role.ADMIN_SI || user.role === Role.AUDITEUR) return true;
          return resourceId === user.id;
        case 'base_juridique':
          return true;
        default:
          return true;
      }
    } catch (err) {
      return false;
    }
  }

  private async buildDemandeScope(user: AuthUser, role: Role): Promise<ScopedWhere> {
    switch (role) {
      case Role.CONTRIBUABLE:
        return { contribuables: { userId: user.id } };
      case Role.AGENT_CI:
        return {
          baseJuridiqueVersions: { organeGestionCode: ORGANE_CI },
          statutCode: { not: 'brouillon' },
        };
      case Role.AGENT_CDDI:
        return {
          baseJuridiqueVersions: {
            organeGestionCode: { in: [ORGANE_CDDI, ORGANE_CDDI_CI] },
          },
          statutCode: { not: 'brouillon' },
        };
      case Role.AGENT_AGENCE:
        return {
          baseJuridiqueVersions: {
            typeTexte1: { in: TYPES_TEXTE_AGENCE },
          },
        };
      case Role.AGENT_MAE:
        return {
          baseJuridiqueVersions: {
            typeTexte1: { in: TYPES_TEXTE_MAE },
          },
        };
      case Role.AGENT_DGMG:
        return {
          baseJuridiqueVersions: {
            typeTexte1: { in: TYPES_TEXTE_DGMG },
          },
        };
      case Role.AGENT_MINISTERE:
        return {
          secteur: user.secteurAffecte,
          statutCode: 'en_instruction',
        };
      case Role.AGENT_DGBF:
        return {
          demandeWorkflowInstances: {
            demandeWorkflowEtapes: {
              some: {
                acteurRole: Role.AGENT_DGBF,
                statutCode: { in: ['en_attente', 'en_cours'] },
              },
            },
          },
        };
      case Role.DECIDEUR:
      case Role.AGENT_CONEDEF:
      case Role.AUDITEUR:
      case Role.ADMIN_SI:
        return {};
      default:
        return { id: '__FORBIDDEN__' };
    }
  }

  private async buildContribuableScope(user: AuthUser, role: Role): Promise<ScopedWhere> {
    if (role === Role.CONTRIBUABLE) {
      return { userId: user.id };
    }
    return {};
  }

  private async buildBaseJuridiqueScope(user: AuthUser, role: Role): Promise<ScopedWhere> {
    if (role === Role.CONTRIBUABLE) {
      return { estActive: true, conformiteDirectiveUemoa: { not: 'non' } };
    }
    return {};
  }

  private async buildConventionScope(user: AuthUser, role: Role): Promise<ScopedWhere> {
    if (role === Role.CONTRIBUABLE) {
      return { contribuables: { userId: user.id } };
    }
    return {};
  }

  private async buildAuditLogScope(user: AuthUser, role: Role): Promise<ScopedWhere> {
    if (role === Role.CONTRIBUABLE) {
      return { utilisateurId: user.id };
    }
    return {};
  }

  private async buildUtilisateurScope(user: AuthUser, role: Role): Promise<ScopedWhere> {
    if (role === Role.ADMIN_SI || role === Role.AUDITEUR) {
      return {};
    }
    return { id: user.id };
  }

  /**
   * Vérifie qu'une demande précise appartient au périmètre de l'agent.
   * Miroir de buildDemandeScope() : toutes les conditions du rôle doivent
   * être satisfaites (logique ET, jamais OU).
   * `demande` doit être chargée avec `contribuables` et `baseJuridiqueVersions`.
   */
  private async demandeMatchesScope(demande: any, user: AuthUser): Promise<boolean> {
    const role = user.role as Role;
    const bjv = demande.baseJuridiqueVersions;

    switch (role) {
      case Role.CONTRIBUABLE:
        return demande.contribuables?.userId === user.id;

      case Role.AGENT_CI:
        return bjv?.organeGestionCode === ORGANE_CI && demande.statutCode !== 'brouillon';

      case Role.AGENT_CDDI:
        return (
          [ORGANE_CDDI, ORGANE_CDDI_CI].includes(bjv?.organeGestionCode) &&
          demande.statutCode !== 'brouillon'
        );

      case Role.AGENT_AGENCE:
        return TYPES_TEXTE_AGENCE.includes(bjv?.typeTexte1);

      case Role.AGENT_MAE:
        return TYPES_TEXTE_MAE.includes(bjv?.typeTexte1);

      case Role.AGENT_DGMG:
        return TYPES_TEXTE_DGMG.includes(bjv?.typeTexte1);

      case Role.AGENT_MINISTERE:
        return demande.secteur === user.secteurAffecte && demande.statutCode === 'en_instruction';

      case Role.AGENT_DGBF: {
        // Le dossier doit avoir une étape de workflow en attente/en cours pour le rôle DGBF.
        const etape = await this.prisma.demandeWorkflowEtape.findFirst({
          where: {
            acteurRole: Role.AGENT_DGBF,
            statutCode: { in: ['en_attente', 'en_cours'] },
            demandeWorkflowInstances: { demandeId: demande.id },
          },
          select: { id: true },
        });
        return etape !== null;
      }

      case Role.DECIDEUR:
      case Role.AGENT_CONEDEF:
      case Role.AUDITEUR:
      case Role.ADMIN_SI:
        return true;

      default:
        return false;
    }
  }

  private async contribuableMatchesScope(contribuable: any, user: AuthUser): Promise<boolean> {
    if (user.role === Role.CONTRIBUABLE) {
      return contribuable.userId === user.id;
    }
    return true;
  }
}
