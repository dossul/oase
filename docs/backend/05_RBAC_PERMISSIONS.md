# OASE-8 — Rôles, permissions et matrice RBAC

> **Issue Plane :** OASE-8  
> **Date :** 2026-06-16  
> **Sources :** OASE-6 (Domain Model), OASE-7 (Transitions), 08_FLUX_PAR_PERSONA.md, types/index.ts, GAP V2, TDR §3.2, CdC §5.1  
> **Objet :** Définition exhaustive des rôles, permissions par ressource et action, règles de périmètre de données, et implémentation NestJS Guards.

---

## 1. Personas → Rôles techniques

| Persona | Code rôle | Institution | Description |
|---|---|---|---|
| P1 — Opérateur économique | `beneficiaire` | Externe | Dépose et suit ses propres demandes |
| P2 — Agent OTR (CI) | `agent_ci` | OTR — Centre des Impôts | Instruit les dossiers fiscaux |
| P2 — Agent OTR (CDDI) | `agent_cddi` | OTR — CDDI | Instruit les dossiers douaniers |
| P2 — Agent DGBF | `agent_dgbf` | DGBF / MEF | Visa budgétaire |
| P2 — Agent DGTCP/GUDEF | `agent_dgtcp` | DGTCP / Trésor | Rapprochement comptable |
| P3 — Agent agence (SAZOF) | `agent_agence` | SAZOF / API-ZF | Instruit les dossiers zone franche/investissement |
| P3 — Agent MAE | `agent_mae` | MAE | Instruit les accords de siège |
| P3 — Agent DGMG | `agent_dgmg` | DGMG | Instruit les dossiers extractifs/mines |
| P3 — Ministère sectoriel | `agent_ministere` | Ministère sectoriel | Avis technique sectoriel |
| P4 — Décideur UPF/MEF | `decideur` | UPF / MEF | Approbation finale, pilotage stratégique |
| P4 — CONEDEF | `agent_conedef` | CONEDEF | Évaluation dépenses fiscales |
| P5 — Auditeur/Contrôle | `auditeur` | IGF / Cour des comptes | Contrôle, anomalies, audit |
| P6 — Citoyen / Open Data | `public` | — | Consultation données publiques anonymisées |
| P7 — Administrateur SI | `admin_si` | DSI / MEF | Administration système, connecteurs, utilisateurs |
| — | `system` | — | Actions automatiques CRON/événements |

---

## 2. Matrice des permissions par ressource

Légende : `C` = Create · `R` = Read · `U` = Update · `D` = Delete · `X` = Action métier · `—` = interdit

### 2.1 `Demande`

| Action | beneficiaire | agent_ci | agent_cddi | agent_dgbf | agent_dgtcp | agent_agence | agent_mae | agent_dgmg | agent_ministere | decideur | agent_conedef | auditeur | public | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Créer (brouillon) | C | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Lire ses propres demandes | R | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Lire toutes demandes de son périmètre | — | R¹ | R² | R³ | R⁴ | R⁵ | R⁶ | R⁷ | R⁸ | R | R | R | — | R |
| Soumettre | X | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Prendre en charge | — | X¹ | X² | — | — | X⁵ | X⁶ | X⁷ | — | — | — | — | — | — |
| Demander complément | — | X | X | — | — | X | X | X | — | — | — | — | — | — |
| Compléter (P1) | X | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Approuver étape intermédiaire | — | X | X | X | — | X | X | X | X | — | — | — | — | — |
| Approuver (finale) | — | — | — | — | — | — | — | — | — | X | — | — | — | — |
| Rejeter | — | X | X | X | — | X | X | X | — | X | — | — | — | — |
| Archiver | — | — | — | — | — | — | — | — | — | — | — | — | — | X |
| Exporter PDF/Excel | — | X | X | X | X | X | X | X | X | X | X | X | — | X |

> ¹ CI : demandes de type CGI/impôts — périmètre = son guichet  
> ² CDDI : demandes de type douanes/Sydonia — périmètre = son guichet  
> ³ DGBF : toutes demandes en attente de visa budgétaire  
> ⁴ DGTCP : demandes approuvées pour rapprochement comptable  
> ⁵ Agence : demandes de type Zone Franche / Code Investissements  
> ⁶ MAE : demandes de type Accord de siège  
> ⁷ DGMG : demandes de type Code Minier / Hydrocarbures  
> ⁸ Ministère sectoriel : demandes de son secteur (lecture seule pour avis)

### 2.2 `BaseJuridique`

| Action | beneficiaire | agent_* (P2/P3) | decideur | auditeur | admin_si | public |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Lire (liste + détail) | R (partiel)¹ | R | R | R | R | R (anonyme)² |
| Créer / importer | — | — | — | — | C | — |
| Modifier (nouvelle version SCD T2) | — | — | — | — | U | — |
| Désactiver | — | — | — | — | U | — |
| Gérer codes additionnels | — | — | — | — | C U D | — |

> ¹ P1 voit uniquement les mesures actives et conformes UEMOA — `conformite_directive_uemoa ≠ non`  
> ² Open Data : libellé, nature, impôt, portée — sans `article` ni `code_additionnel`

### 2.3 `Beneficiaire`

| Action | beneficiaire (soi) | agent_* | decideur | auditeur | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|
| Créer son profil | C | — | — | — | C |
| Lire son propre profil | R | — | — | — | R |
| Lire tous les bénéficiaires | — | R | R | R | R |
| Modifier ses coordonnées | U | — | — | — | U |
| Modifier `type_beneficiaire` | — | — | — | — | U¹ |
| Voir `statut_fiscal` | R (soi) | R | R | R | R |

> ¹ Uniquement avant le premier dossier approuvé (cf. invariant OASE-6)

### 2.4 `Convention`

| Action | beneficiaire | agent_agence / agent_mae / agent_dgmg | decideur | auditeur | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|
| Créer | — | C | C | — | C |
| Lire ses propres conventions | R | — | — | — | — |
| Lire toutes | — | R (périmètre) | R | R | R |
| Modifier statut (suspendre/résilier) | — | X (suspendre) | X | — | X |
| Exporter | — | X | X | X | X |

### 2.5 `Utilisateur` et `Institution`

| Action | beneficiaire | agent_* | decideur | auditeur | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|
| Créer un utilisateur | — | — | — | — | C |
| Lire son propre profil | R | R | R | R | R |
| Lire tous les utilisateurs | — | — | — | — | R |
| Modifier rôle/institution | — | — | — | — | U |
| Suspendre/activer compte | — | — | — | — | U |
| Gérer les institutions | — | — | — | — | C U D |
| Réinitialiser MFA/PIN | — | — | — | — | X |

### 2.6 `AuditLog`

| Action | beneficiaire | agent_* | decideur | auditeur | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|
| Lire ses propres entrées | R | — | — | — | — |
| Lire toutes les entrées | — | — | R (read-only) | R | R |
| Exporter | — | — | X | X | X |
| Écrire / modifier | — | — | — | — | — (interdit à tous) |

### 2.7 `Anomalie`

| Action | beneficiaire | agent_* | decideur | auditeur | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|
| Détecter (moteur règles) | — | — | — | — | system |
| Lire ses anomalies | R (liées à ses demandes) | R (périmètre) | R | R | R |
| Changer statut (examiner/traiter/classer) | — | — | — | X | — |
| Créer manuellement | — | — | — | X | — |

### 2.8 `Connecteur`

| Action | beneficiaire | agent_* | decideur | auditeur | admin_si |
|---|:---:|:---:|:---:|:---:|:---:|
| Voir statut connecteurs | — | — | — | — | R |
| Modifier config | — | — | — | — | U |
| Forcer maintenance | — | — | — | — | X |
| Voir logs de sync | — | — | — | X | R |

### 2.9 `Quota`

| Action | beneficiaire | agent_* | decideur | admin_si |
|---|:---:|:---:|:---:|:---:|
| Voir quotas actifs | R (soi) | R (périmètre) | R | R |
| Créer / définir quota | — | — | X | X |
| Modifier total | — | — | X | X |
| Voir historique consommation | — | R | R | R |

---

## 3. Règles de périmètre de données (Row-Level Security)

```
RLS-01 : beneficiaire
  SELECT WHERE beneficiaire_id = auth.uid()
  → Un bénéficiaire ne voit QUE ses propres demandes, pièces, quotas.

RLS-02 : agent_ci
  SELECT WHERE base_juridique.organe_gestion = 'CI'
     AND demande.statut ≠ 'brouillon'
  → Un agent CI ne voit que les dossiers CGI/impôts de son guichet.

RLS-03 : agent_cddi
  SELECT WHERE base_juridique.organe_gestion IN ('CDDI','CDDI/CI')
     AND demande.statut ≠ 'brouillon'

RLS-04 : agent_agence
  SELECT WHERE base_juridique.type_texte_1 IN (
    'Zone Franche','Code des Investissements'
  ) AND institution_id = auth.institution_id

RLS-05 : agent_mae
  SELECT WHERE base_juridique.type_texte_1 = 'Accord de siège'

RLS-06 : agent_dgmg
  SELECT WHERE base_juridique.type_texte_1 IN (
    'Code Minier','Code des Hydrocarbures'
  )

RLS-07 : agent_ministere
  SELECT WHERE demande.secteur = auth.secteur_affecte
     AND demande.statut = 'en_instruction'   -- lecture seule pour avis

RLS-08 : agent_dgbf
  SELECT WHERE EXISTS (
    SELECT 1 FROM etapes_workflow
    WHERE demande_id = demande.id
      AND acteur_role = 'agent_dgbf'
      AND statut IN ('en_attente','en_cours')
  )

RLS-09 : decideur / auditeur / admin_si
  → Accès toutes institutions, toutes demandes.
  EXCEPT : auditeur ne peut PAS modifier.

RLS-10 : public (open data)
  SELECT ON vue_opendata_anonymisee
  → Vue matérialisée sans PII (NIF, RCCM, raison sociale masqués ou agrégés).
```

---

## 4. Implémentation NestJS

### 4.1 Décorateurs et Guards

```typescript
// roles.decorator.ts
export const Roles = (...roles: RoleCode[]) =>
  SetMetadata('roles', roles);

// rbac.guard.ts
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// scope.guard.ts — vérifie le périmètre de données
@Injectable()
export class ScopeGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: AuthUser = req.user;
    const resourceId: string = req.params.id;
    return this.scopeService.isAllowed(user, resourceId, req.method);
  }
}
```

### 4.2 Usage dans les controllers

```typescript
// demande.controller.ts
@Controller('demandes')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DemandeController {

  @Post()
  @Roles('beneficiaire')
  creer(@Body() dto: CreerDemandeDto, @CurrentUser() user: AuthUser) { ... }

  @Get()
  @Roles('agent_ci','agent_cddi','agent_dgbf','agent_dgtcp',
         'agent_agence','agent_mae','agent_dgmg','decideur',
         'auditeur','admin_si')
  listerTout(@CurrentUser() user: AuthUser) { ... }

  @Patch(':id/approuver')
  @Roles('decideur')
  @UseGuards(ScopeGuard, PinGuard, AllEtapesValidGuard)
  approuver(@Param('id') id: string, @Body() dto: ApprouverDto) { ... }

  @Patch(':id/rejeter')
  @Roles('agent_ci','agent_cddi','agent_agence','agent_mae','agent_dgmg','decideur')
  rejeter(@Param('id') id: string, @Body() dto: RejeterDto) { ... }
}
```

### 4.3 Table SQL `roles_permissions` (optionnel si RBAC dynamique)

```sql
CREATE TABLE roles_permissions (
  role        VARCHAR(50) NOT NULL,
  ressource   VARCHAR(50) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  perimetre   VARCHAR(100) NULL,   -- ex: 'organe_gestion=CI', 'type_texte_1=Zone Franche'
  PRIMARY KEY (role, ressource, action)
);

-- Exemple de données
INSERT INTO roles_permissions VALUES
  ('beneficiaire',  'demandes',        'CREATE',   NULL),
  ('beneficiaire',  'demandes',        'READ',     'beneficiaire_id=self'),
  ('agent_ci',      'demandes',        'READ',     'organe_gestion=CI'),
  ('agent_ci',      'demandes',        'PRENDRE_EN_CHARGE', 'organe_gestion=CI'),
  ('decideur',      'demandes',        'APPROUVER',NULL),
  ('admin_si',      'utilisateurs',    'MANAGE',   NULL),
  ('auditeur',      'audit_logs',      'READ',     NULL),
  ('public',        'opendata',        'READ',     'anonymise=true');
```

---

## 5. Récapitulatif des rôles par module maquette

| Route maquette | Rôle(s) autorisés |
|---|---|
| `/portail/*` | `beneficiaire` |
| `/backoffice/*` | `agent_ci`, `agent_cddi`, `agent_dgbf` |
| `/tresor/*` | `agent_dgtcp` |
| `/agences/*` | `agent_agence` |
| `/ministeres/*` | `agent_ministere` |
| `/mae/*` | `agent_mae` |
| `/extractif/*` | `agent_dgmg` |
| `/decideur/*` | `decideur` |
| `/conedef/*` | `agent_conedef` |
| `/audit/*` | `auditeur` |
| `/opendata` | `public` (non authentifié) |
| `/admin/*` | `admin_si` |
| `/mobile/*` | `beneficiaire`, `agent_ci`, `agent_cddi` |

---

*Livrable OASE-8 — Matrice RBAC. Alimente OASE-9 (Architecture NestJS), OASE-11 (table `roles_permissions` en seed), OASE-13 (tests de sécurité par rôle).*
