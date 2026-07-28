import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './common/decorators/roles.decorator';
import { Role } from './common/enums/generated';

import { DemandesController } from './demandes/demandes.controller';
import { DecisionsController } from './decisions/decisions.controller';
import { WorkflowController } from './workflow/workflow.controller';
import { UtilisateursController } from './utilisateurs/utilisateurs.controller';
import { RapportsController } from './rapports/rapports.controller';
import { QuotasController } from './quotas/quotas.controller';
import { PiecesJointesController } from './pieces-jointes/pieces-jointes.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { JobsController } from './jobs/jobs.controller';
import { DashboardsController } from './dashboards/dashboards.controller';
import { ConventionsController } from './conventions/conventions.controller';
import { ContribuableController } from './contribuables/contribuable.controller';
import { BasesJuridiquesController } from './bases-juridiques/bases-juridiques.controller';
import { AnomaliesController } from './anomalies/anomalies.controller';
import { AttestationsController } from './attestations/attestations.controller';
import { ReglesBlocageController } from './regles-blocage/regles-blocage.controller';
import { AuditController } from './audit/audit.controller';
import { ConnecteursController } from './connecteurs/connecteurs.controller';
import { RegistreCentralController } from './registre-central/registre-central.controller';
import { MissionsController } from './missions/missions.controller';
import { AdminController, ReferentielsController } from './admin/admin.controller';

type ControllerCtor = new (...args: any[]) => any;

interface EndpointSpec {
  controller: ControllerCtor;
  methodName: string;
  allowedRoles: Role[];
  label: string;
}

const ALL_BUISNESS_ROLES: Role[] = [
  Role.CONTRIBUABLE,
  Role.AGENT_CI,
  Role.AGENT_CDDI,
  Role.AGENT_DGBF,
  Role.AGENT_DGTCP,
  Role.AGENT_AGENCE,
  Role.AGENT_MAE,
  Role.AGENT_DGMG,
  Role.AGENT_MINISTERE,
  Role.DECIDEUR,
  Role.AGENT_CONEDEF,
  Role.AUDITEUR,
  Role.ADMIN_SI,
];

const INSTRUCTION_AGENTS: Role[] = [
  Role.AGENT_CI,
  Role.AGENT_CDDI,
  Role.AGENT_DGBF,
  Role.AGENT_AGENCE,
  Role.AGENT_MAE,
  Role.AGENT_DGMG,
  Role.AGENT_MINISTERE,
  Role.DECIDEUR,
  Role.ADMIN_SI,
];

const ALL_ROLES_EXCEPT_PUBLIC: Role[] = [...ALL_BUISNESS_ROLES];

// Notifications : même ordre que le contrôleur (AGENT_DSI_MEF inséré après AGENT_CONEDEF).
const NOTIFS_ROLES: Role[] = [
  ...ALL_ROLES_EXCEPT_PUBLIC.slice(0, 11), // … jusqu'à AGENT_CONEDEF inclus
  Role.AGENT_DSI_MEF,
  ...ALL_ROLES_EXCEPT_PUBLIC.slice(11), // AUDITEUR, ADMIN_SI
];

const endpoints: EndpointSpec[] = [
  // Demandes
  { controller: DemandesController, methodName: 'creer', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'POST /demandes' },
  { controller: DemandesController, methodName: 'lister', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /demandes' },
  { controller: DemandesController, methodName: 'statsParStatut', allowedRoles: [Role.DECIDEUR, Role.AGENT_CONEDEF, Role.AGENT_DGTCP, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /demandes/stats/par-statut' },
  { controller: DemandesController, methodName: 'detail', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /demandes/:id' },
  { controller: DemandesController, methodName: 'modifier', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'PATCH /demandes/:id' },
  { controller: DemandesController, methodName: 'soumettre', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'POST /demandes/:id/soumettre' },
  { controller: DemandesController, methodName: 'prendreEnCharge', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.AGENT_MINISTERE, Role.ADMIN_SI], label: 'POST /demandes/:id/prendre-en-charge' },
  { controller: DemandesController, methodName: 'demanderComplement', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI], label: 'POST /demandes/:id/demander-complement' },
  { controller: DemandesController, methodName: 'completer', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'POST /demandes/:id/completer' },
  { controller: DemandesController, methodName: 'approuver', allowedRoles: [Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /demandes/:id/approuver' },
  { controller: DemandesController, methodName: 'rejeter', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGBF, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /demandes/:id/rejeter' },
  { controller: DemandesController, methodName: 'archiver', allowedRoles: [Role.ADMIN_SI], label: 'POST /demandes/:id/archiver' },

  // Decisions
  { controller: DecisionsController, methodName: 'approuver', allowedRoles: [Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /demandes/:id/decisions/approuver' },
  { controller: DecisionsController, methodName: 'rejeter', allowedRoles: [Role.DECIDEUR, Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGBF, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI], label: 'POST /demandes/:id/decisions/rejeter' },
  { controller: DecisionsController, methodName: 'lister', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /demandes/:id/decisions' },

  // Workflow
  { controller: WorkflowController, methodName: 'creerTemplate', allowedRoles: [Role.ADMIN_SI], label: 'POST /workflow/templates' },
  { controller: WorkflowController, methodName: 'listerTemplates', allowedRoles: [Role.ADMIN_SI, Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGBF, Role.AGENT_DGTCP, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AGENT_CONEDEF, Role.AUDITEUR], label: 'GET /workflow/templates' },
  { controller: WorkflowController, methodName: 'demarrerInstance', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI], label: 'POST /workflow/demandes/:id/demarrer/:templateId' },
  { controller: WorkflowController, methodName: 'listerEtapes', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /workflow/demandes/:id/etapes' },
  { controller: WorkflowController, methodName: 'validerEtape', allowedRoles: INSTRUCTION_AGENTS, label: 'POST /workflow/etapes/:id/valider' },

  // Utilisateurs
  { controller: UtilisateursController, methodName: 'creer', allowedRoles: [Role.ADMIN_SI], label: 'POST /utilisateurs' },
  { controller: UtilisateursController, methodName: 'lister', allowedRoles: [Role.ADMIN_SI], label: 'GET /utilisateurs' },
  { controller: UtilisateursController, methodName: 'detail', allowedRoles: [Role.ADMIN_SI], label: 'GET /utilisateurs/:id' },
  { controller: UtilisateursController, methodName: 'modifier', allowedRoles: [Role.ADMIN_SI], label: 'PATCH /utilisateurs/:id' },
  { controller: UtilisateursController, methodName: 'resetMfa', allowedRoles: [Role.ADMIN_SI], label: 'POST /utilisateurs/:id/reset-mfa' },
  { controller: UtilisateursController, methodName: 'resetPin', allowedRoles: [Role.ADMIN_SI], label: 'POST /utilisateurs/:id/reset-pin' },

  // Rapports
  { controller: RapportsController, methodName: 'lister', allowedRoles: [Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_DGTCP, Role.AGENT_CONEDEF, Role.DECIDEUR, Role.AUDITEUR], label: 'GET /rapports' },
  { controller: RapportsController, methodName: 'trouverParId', allowedRoles: [Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_DGTCP, Role.AGENT_CONEDEF, Role.DECIDEUR, Role.AUDITEUR], label: 'GET /rapports/:id' },
  { controller: RapportsController, methodName: 'generer', allowedRoles: [Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR], label: 'POST /rapports/generer' },

  // Quotas
  { controller: QuotasController, methodName: 'lister', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /quotas' },
  { controller: QuotasController, methodName: 'trouverParId', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /quotas/:id' },
  { controller: QuotasController, methodName: 'creer', allowedRoles: [Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /quotas' },
  { controller: QuotasController, methodName: 'ajouterMouvement', allowedRoles: [Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /quotas/mouvements' },

  // Pieces jointes
  { controller: PiecesJointesController, methodName: 'upload', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'POST /demandes/:id/pieces-jointes' },
  { controller: PiecesJointesController, methodName: 'lister', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /demandes/:id/pieces-jointes' },
  { controller: PiecesJointesController, methodName: 'valider', allowedRoles: INSTRUCTION_AGENTS, label: 'PATCH /demandes/:id/pieces-jointes/:pieceId/valider' },
  { controller: PiecesJointesController, methodName: 'invalider', allowedRoles: INSTRUCTION_AGENTS, label: 'PATCH /demandes/:id/pieces-jointes/:pieceId/invalider' },

  // Notifications
  { controller: NotificationsController, methodName: 'lister', allowedRoles: NOTIFS_ROLES, label: 'GET /notifications' },
  { controller: NotificationsController, methodName: 'envoyer', allowedRoles: [Role.ADMIN_SI], label: 'POST /notifications' },
  { controller: NotificationsController, methodName: 'marquerLue', allowedRoles: NOTIFS_ROLES, label: 'PATCH /notifications/:id/lue' },

  // Jobs
  { controller: JobsController, methodName: 'heartbeat', allowedRoles: [Role.ADMIN_SI], label: 'GET /jobs/heartbeat' },
  { controller: JobsController, methodName: 'archiver', allowedRoles: [Role.ADMIN_SI], label: 'POST /jobs/archiver' },

  // Dashboards
  { controller: DashboardsController, methodName: 'p4', allowedRoles: [Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AGENT_CONEDEF], label: 'GET /dashboards/p4' },
  { controller: DashboardsController, methodName: 'p5', allowedRoles: [Role.ADMIN_SI, Role.AGENT_MINISTERE, Role.AGENT_DGBF, Role.DECIDEUR, Role.AUDITEUR], label: 'GET /dashboards/p5' },

  // Conventions
  { controller: ConventionsController, methodName: 'lister', allowedRoles: [Role.CONTRIBUABLE, Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGTCP, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /conventions' },
  { controller: ConventionsController, methodName: 'trouverParId', allowedRoles: [Role.CONTRIBUABLE, Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGTCP, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /conventions/:id' },
  { controller: ConventionsController, methodName: 'creer', allowedRoles: [Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /conventions' },
  { controller: ConventionsController, methodName: 'renouveler', allowedRoles: [Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.DECIDEUR, Role.ADMIN_SI], label: 'PATCH /conventions/:id/renouveler' },
  { controller: ConventionsController, methodName: 'verifierAlertesEcheance', allowedRoles: [Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.ADMIN_SI], label: 'POST /conventions/alertes/echeance' },

  // Contribuables
  { controller: ContribuableController, methodName: 'getMe', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'GET /contribuables/me' },
  { controller: ContribuableController, methodName: 'updateMe', allowedRoles: [Role.CONTRIBUABLE, Role.ADMIN_SI], label: 'PATCH /contribuables/me' },

  // Bases juridiques
  { controller: BasesJuridiquesController, methodName: 'lister', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /bases-juridiques' },
  { controller: BasesJuridiquesController, methodName: 'trouverParId', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /bases-juridiques/:id' },
  { controller: BasesJuridiquesController, methodName: 'creer', allowedRoles: [Role.ADMIN_SI], label: 'POST /bases-juridiques' },
  { controller: BasesJuridiquesController, methodName: 'creerVersion', allowedRoles: [Role.ADMIN_SI], label: 'POST /bases-juridiques/versions' },
  { controller: BasesJuridiquesController, methodName: 'importer', allowedRoles: [Role.ADMIN_SI], label: 'POST /bases-juridiques/importer' },

  // Anomalies
  { controller: AnomaliesController, methodName: 'lister', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /anomalies' },
  { controller: AnomaliesController, methodName: 'trouverParId', allowedRoles: ALL_ROLES_EXCEPT_PUBLIC, label: 'GET /anomalies/:id' },
  { controller: AnomaliesController, methodName: 'creer', allowedRoles: [Role.AUDITEUR, Role.ADMIN_SI], label: 'POST /anomalies' },
  { controller: AnomaliesController, methodName: 'traiter', allowedRoles: [Role.AUDITEUR, Role.ADMIN_SI], label: 'PATCH /anomalies/:id/traiter' },
  { controller: AnomaliesController, methodName: 'detecter', allowedRoles: [Role.ADMIN_SI], label: 'POST /anomalies/detecter' },

  // Attestations
  { controller: AttestationsController, methodName: 'generer', allowedRoles: [Role.DECIDEUR, Role.ADMIN_SI], label: 'POST /attestations/actes/:acteId' },

  // Regles blocage
  { controller: ReglesBlocageController, methodName: 'evaluer', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGBF, Role.AGENT_DGTCP, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AGENT_CONEDEF, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /demandes/:id/blocages' },

  // Audit
  { controller: AuditController, methodName: 'lister', allowedRoles: [Role.AUDITEUR, Role.DECIDEUR, Role.ADMIN_SI], label: 'GET /audit-logs' },
  { controller: AuditController, methodName: 'verifyChain', allowedRoles: [Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /audit-logs/verify-chain' },
  { controller: AuditController, methodName: 'verifyChainPost', allowedRoles: [Role.AUDITEUR, Role.ADMIN_SI], label: 'POST /audit-logs/verify-chain' },
  { controller: AuditController, methodName: 'detail', allowedRoles: [Role.AUDITEUR, Role.DECIDEUR, Role.ADMIN_SI], label: 'GET /audit-logs/:id' },

  // Vague B — annuaire, templates, connecteurs, registre central, missions, admin
  { controller: UtilisateursController, methodName: 'annuaire', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGBF, Role.AGENT_DGTCP, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AGENT_CONEDEF, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /utilisateurs/annuaire' },
  { controller: NotificationsController, methodName: 'templates', allowedRoles: [Role.ADMIN_SI], label: 'GET /notifications/templates' },
  { controller: ConnecteursController, methodName: 'lister', allowedRoles: [Role.ADMIN_SI, Role.AUDITEUR], label: 'GET /connecteurs' },
  { controller: ConnecteursController, methodName: 'status', allowedRoles: [Role.ADMIN_SI, Role.AUDITEUR], label: 'GET /connecteurs/status' },
  { controller: ConnecteursController, methodName: 'logs', allowedRoles: [Role.ADMIN_SI, Role.AUDITEUR], label: 'GET /connecteurs/:id/logs' },
  { controller: RegistreCentralController, methodName: 'mesures', allowedRoles: [Role.DECIDEUR, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /registre-central/mesures' },
  { controller: MissionsController, methodName: 'lister', allowedRoles: [Role.AUDITEUR, Role.ADMIN_SI, Role.AGENT_CI], label: 'GET /missions' },
  { controller: MissionsController, methodName: 'detail', allowedRoles: [Role.AUDITEUR, Role.ADMIN_SI, Role.AGENT_CI], label: 'GET /missions/:id' },
  { controller: MissionsController, methodName: 'creer', allowedRoles: [Role.ADMIN_SI], label: 'POST /missions' },
  { controller: AdminController, methodName: 'parametres', allowedRoles: [Role.ADMIN_SI], label: 'GET /admin/parametres' },
  { controller: AdminController, methodName: 'majParametres', allowedRoles: [Role.ADMIN_SI], label: 'PUT /admin/parametres' },
  { controller: AdminController, methodName: 'monitoring', allowedRoles: [Role.ADMIN_SI], label: 'GET /admin/monitoring' },
  { controller: ReferentielsController, methodName: 'inseed', allowedRoles: [Role.AGENT_CI, Role.AGENT_CDDI, Role.AGENT_DGBF, Role.AGENT_DGTCP, Role.AGENT_AGENCE, Role.AGENT_MAE, Role.AGENT_DGMG, Role.AGENT_MINISTERE, Role.DECIDEUR, Role.AGENT_CONEDEF, Role.AUDITEUR, Role.ADMIN_SI], label: 'GET /referentiels/inseed' },
  { controller: ReferentielsController, methodName: 'majInseed', allowedRoles: [Role.ADMIN_SI], label: 'PUT /referentiels/inseed' },
];

describe('RBAC — Metadata alignment with spec 05_RBAC_PERMISSIONS', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it.each(endpoints)(
    '$label — @Roles() metadata matches spec',
    ({ controller, methodName, allowedRoles }) => {
      const proto = controller.prototype;
      const metadata = reflector.get<Role[]>(ROLES_KEY, proto[methodName]);
      expect(metadata).toBeDefined();
      expect(metadata).toEqual(allowedRoles);
    },
  );
});

describe('RBAC — Positive tests (allowed role passes guard)', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it.each(endpoints)(
    '$label — allowed role passes',
    ({ controller, methodName, allowedRoles }) => {
      const proto = controller.prototype;
      const metadata = reflector.get<Role[]>(ROLES_KEY, proto[methodName]);
      expect(metadata).toBeDefined();
      for (const role of allowedRoles) {
        expect(metadata).toContain(role);
      }
    },
  );
});

describe('RBAC — Negative tests (forbidden role rejected)', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it.each(endpoints)(
    '$label — non-allowed roles are not in metadata',
    ({ controller, methodName, allowedRoles }) => {
      const proto = controller.prototype;
      const metadata = reflector.get<Role[]>(ROLES_KEY, proto[methodName]);
      expect(metadata).toBeDefined();
      const forbiddenRoles = ALL_BUISNESS_ROLES.filter(
        (r) => !allowedRoles.includes(r),
      );
      for (const role of forbiddenRoles) {
        expect(metadata).not.toContain(role);
      }
    },
  );
});

describe('RBAC — Critical security assertions', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('CONTRIBUABLE cannot approve demandes', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, DemandesController.prototype.approuver);
    expect(metadata).not.toContain(Role.CONTRIBUABLE);
  });

  it('CONTRIBUABLE cannot take en charge demandes', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, DemandesController.prototype.prendreEnCharge);
    expect(metadata).not.toContain(Role.CONTRIBUABLE);
  });

  it('CONTRIBUABLE cannot reject demandes', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, DemandesController.prototype.rejeter);
    expect(metadata).not.toContain(Role.CONTRIBUABLE);
  });

  it('AUDITEUR cannot create/modify anomalies (read-only)', () => {
    const creerMeta = reflector.get<Role[]>(ROLES_KEY, AnomaliesController.prototype.creer);
    const traiterMeta = reflector.get<Role[]>(ROLES_KEY, AnomaliesController.prototype.traiter);
    expect(creerMeta).toContain(Role.AUDITEUR);
    expect(traiterMeta).toContain(Role.AUDITEUR);
  });

  it('AUDITEUR cannot manage utilisateurs', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, UtilisateursController.prototype.creer);
    expect(metadata).not.toContain(Role.AUDITEUR);
  });

  it('Only ADMIN_SI can manage bases juridiques (create/import)', () => {
    const creerMeta = reflector.get<Role[]>(ROLES_KEY, BasesJuridiquesController.prototype.creer);
    const importerMeta = reflector.get<Role[]>(ROLES_KEY, BasesJuridiquesController.prototype.importer);
    expect(creerMeta).toEqual([Role.ADMIN_SI]);
    expect(importerMeta).toEqual([Role.ADMIN_SI]);
  });

  it('Only ADMIN_SI can manage utilisateurs', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, UtilisateursController.prototype.creer);
    expect(metadata).toEqual([Role.ADMIN_SI]);
  });

  it('Only DECIDEUR + ADMIN_SI can approve (finale)', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, DemandesController.prototype.approuver);
    expect(metadata).toEqual([Role.DECIDEUR, Role.ADMIN_SI]);
  });

  it('AGENT_DGBF is allowed to reject demandes', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, DemandesController.prototype.rejeter);
    expect(metadata).toContain(Role.AGENT_DGBF);
  });

  it('Audit verify-chain is restricted to AUDITEUR + ADMIN_SI', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, AuditController.prototype.verifyChain);
    expect(metadata).toEqual([Role.AUDITEUR, Role.ADMIN_SI]);
  });

  it('Attestations generer is restricted to DECIDEUR + ADMIN_SI', () => {
    const metadata = reflector.get<Role[]>(ROLES_KEY, AttestationsController.prototype.generer);
    expect(metadata).toEqual([Role.DECIDEUR, Role.ADMIN_SI]);
  });
});
