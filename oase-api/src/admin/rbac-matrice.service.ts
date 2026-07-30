import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/generated';

import { DemandesController } from '../demandes/demandes.controller';
import { DecisionsController } from '../decisions/decisions.controller';
import { WorkflowController } from '../workflow/workflow.controller';
import { UtilisateursController } from '../utilisateurs/utilisateurs.controller';
import { RapportsController } from '../rapports/rapports.controller';
import { QuotasController } from '../quotas/quotas.controller';
import { PiecesJointesController } from '../pieces-jointes/pieces-jointes.controller';
import { NotificationsController } from '../notifications/notifications.controller';
import { JobsController } from '../jobs/jobs.controller';
import { DashboardsController } from '../dashboards/dashboards.controller';
import { ConventionsController } from '../conventions/conventions.controller';
import { PermisMiniersController } from '../permis-miniers/permis-miniers.controller';
import { FluxExtractifsController } from '../flux-extractifs/flux-extractifs.controller';
import { ItieController } from '../itie/itie.controller';
import { ContribuableController } from '../contribuables/contribuable.controller';
import { BasesJuridiquesController } from '../bases-juridiques/bases-juridiques.controller';
import { AnomaliesController } from '../anomalies/anomalies.controller';
import { AttestationsController } from '../attestations/attestations.controller';
import { ReglesBlocageController } from '../regles-blocage/regles-blocage.controller';
import { AuditController } from '../audit/audit.controller';
import { ConnecteursController } from '../connecteurs/connecteurs.controller';
import { RegistreCentralController } from '../registre-central/registre-central.controller';
import { MissionsController } from '../missions/missions.controller';
import { AccordsSiegeController } from '../accords-siege/accords-siege.controller';
import { RapprochementsController } from '../rapprochements/rapprochements.controller';
import { AdminController, ReferentielsController } from './admin.controller';
import { RbacMatriceController } from './rbac-matrice.controller';

/** Contrôleurs protégés par @Roles — même périmètre que rbac.spec.ts. */
const CONTROLLERS = [
  DemandesController,
  DecisionsController,
  WorkflowController,
  UtilisateursController,
  RapportsController,
  QuotasController,
  PiecesJointesController,
  NotificationsController,
  JobsController,
  DashboardsController,
  ConventionsController,
  PermisMiniersController,
  FluxExtractifsController,
  ItieController,
  ContribuableController,
  BasesJuridiquesController,
  AnomaliesController,
  AttestationsController,
  ReglesBlocageController,
  AuditController,
  ConnecteursController,
  RegistreCentralController,
  MissionsController,
  AccordsSiegeController,
  RapprochementsController,
  AdminController,
  ReferentielsController,
  RbacMatriceController,
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'ALL'];

export interface EntreeMatrice {
  controleur: string;
  methode: string;
  http: string;
  chemin: string;
  roles: Role[];
}

/**
 * Matrice RBAC RÉELLE, dérivée des métadonnées @Roles des contrôleurs —
 * la même source de vérité que celle vérifiée par rbac.spec.ts.
 * Auto-cohérente : toute modification d'un @Roles se reflète immédiatement.
 */
@Injectable()
export class RbacMatriceService {
  private readonly reflector = new Reflector();

  matrice(): { roles: Role[]; entrees: EntreeMatrice[] } {
    const entrees: EntreeMatrice[] = [];

    for (const ctrl of CONTROLLERS) {
      const prefix: string = Reflect.getMetadata(PATH_METADATA, ctrl) ?? '';
      const proto = ctrl.prototype;

      for (const name of Object.getOwnPropertyNames(proto)) {
        if (name === 'constructor') continue;
        const handler = (proto as unknown as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;

        const roles = this.reflector.get<Role[]>(ROLES_KEY, handler);
        if (!roles) continue; // route publique (login, reset…) : hors matrice

        const methodPath: string = Reflect.getMetadata(PATH_METADATA, handler) ?? '';
        const methodCode: number = Reflect.getMetadata(METHOD_METADATA, handler) ?? 0;

        entrees.push({
          controleur: ctrl.name.replace(/Controller$/, ''),
          methode: name,
          http: HTTP_METHODS[methodCode] ?? 'GET',
          chemin: `/${[prefix, methodPath].filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/').replace(/\/$/, ''),
          roles,
        });
      }
    }

    entrees.sort((a, b) => a.chemin.localeCompare(b.chemin) || a.http.localeCompare(b.http));

    // Rôles réellement utilisés dans la matrice (hors PUBLIC/SYSTEM)
    const utilises = new Set<Role>();
    for (const e of entrees) for (const r of e.roles) utilises.add(r);

    return { roles: [...utilises], entrees };
  }
}
