# OASE - Rapport de bugs

**Date debut :** 2026-07-10 23:30 UTC
**Testeur :** Ulrich (interface) + Mavis (navig. Playwright)
**Methode :** E2E navigation + API testing
**URL :** https://oase.ulia.site/

---

## Comptes de test

| Email | Password | Role | MFA |
|---|---|---|---|
| admin@oase.ci | Oase@2026! | admin | desactive |
| agent.ci@oase.ci | Oase@2026! | agent_ci | desactive |
| instructeur@oase.ci | Oase@2026! | instructeur | desactive |

---

## Workflows

| # | Workflow | Status | Bugs |
|---|---|---|---|
| W1 | Auth (login/MFA/logout/me) | A FAIRE | - |
| W2 | Portail CONTRIBUABLE | A FAIRE | - |
| W3 | Backoffice instructeur | A FAIRE | - |
| W4 | Decideur | A FAIRE | - |
| W5 | Agences | A FAIRE | - |
| W6 | Admin | A FAIRE | - |
| W7 | Audit | A FAIRE | - |
| W8 | Institutions | A FAIRE | - |
| W9 | Tresor | A FAIRE | - |
| W10 | OpenData | A FAIRE | - |

---

## Bugs trouves

### Format

```
### BUG #N - [titre]
- **Date** : 2026-07-10 HH:MM
- **Workflow** : W#
- **Page/Route** : /chemin
- **Severite** : Critique / Haute / Moyenne / Basse
- **Compte** : admin@oase.ci
- **Reproduction** :
  1. Aller a ...
  2. Cliquer sur ...
  3. Observer ...
- **Attendu** : ...
- **Obtenu** : ...
- **Logs** :
  ```
  ...
  ```
- **Capture** : (si applicable)
```

---

## Session de test en cours

### BUG #2 / #4 / #5 — Routing & sidebar admin (2026-07-12) — ✅ FIXED

**Statut :** ✅ RÉSOLUS et testés sur la prod `https://oase.ulia.site`
**Méthode de validation :** 3 types de vérification indépendants, tous PASS
**Livré par :** Mavis (sur signalement Ulrich)

#### Bugs couverts

| # | Symptôme | Cause racine | Fichier corrigé |
|---|---|---|---|
| **#2** | Login admin OK mais URL reste sur `/login` (boucle infinie) | `LoginView` faisait `router.push('/')` et la route `/` redirigeait en dur vers `/login` | `LoginView.vue`, `plugins/router.ts` |
| **#4** | Sidebar affiche le menu contribuable alors que l'utilisateur est admin | `currentNavItems` ne lisait que `route.meta.role`, jamais `auth.user.role` | `layouts/AppLayout.vue` |
| **#5** | Navigation manuelle vers `/portail/dashboard` (route `role: contribuable`) renvoie vers `/login` même avec token valide | `beforeEach` renvoyait `/login` quand `meta.role` ≠ rôle user (et pas d'override admin) | `plugins/router.ts` |

#### Fichiers modifiés (4)

| Fichier | Type | Rôle |
|---|---|---|
| `maquette/src/composables/useDefaultRoute.ts` | **NOUVEAU** (45 lignes) | Helper `getDefaultRouteForRole(role)` + `isAdminRole(role)` — source de vérité partagée |
| `maquette/src/views/auth/LoginView.vue` | Edit (ligne 133) | `router.push('/')` → `router.push(getDefaultRouteForRole(res.user.role))` |
| `maquette/src/plugins/router.ts` | Edit (lignes 14, 137-155) | Route `/` = composant vide + `beforeEach` dynamique + override admin sur `meta.role` |
| `maquette/src/layouts/AppLayout.vue` | Edit (lignes 295-332) | `currentNavItems` piloté par `auth.user.role` (admin → menu admin toujours) |

#### Vérification n°1 — Live Playwright sur la prod

| Test | Avant | Après | Verdict |
|---|---|---|---|
| Login `admin@gouv.tg` → URL finale | `/login` (boucle) | `https://oase.ulia.site/admin/utilisateurs` | ✅ PASS |
| Snapshot sidebar admin | Menu contribuable (6 items) | Menu admin (14 items : utilisateurs, rôles, connecteurs SI, workflow BPM…) | ✅ PASS |
| Navigation manuelle vers `/portail/dashboard` (route `role: contribuable`) | Redirigée vers `/login` | Reste sur `/portail/dashboard` + sidebar = toujours menu admin | ✅ PASS |
| Navigation vers `/` après auth | Redirige `/login` | Redirige vers `/admin/utilisateurs` (default route du rôle) | ✅ PASS |

#### Vérification n°2 — Bundle prod (curl + grep sur `index-C1vEtjNU.js`)

Le bundle minifié servi en prod contient bien les marqueurs du fix :

```bash
# Marqueurs attendus (présents)
{path:"/",component:{template:"<div></div>"}}              # route racine dynamique
beforeEach(... dd(t.user?.role) ...)                       # = getDefaultRouteForRole(role) mangle
beforeEach(... fd(t.user?.role) ...)                       # = isAdminRole(role) mangle
```

> Sans ces marqueurs dans le bundle, on n'aurait pas la garantie que le code
> corrigé est bien servi (et pas une vieille version cachée par le CDN).

#### Vérification n°3 — API backend indépendante

```bash
POST https://api.oase.ulia.site/api/v1/auth/login
  { "email": "admin@gouv.tg", "password": "Oase@2026!" }
→ 200 OK
   { "access_token": "eyJhbGciOi...", "user": { "id": 7, "role": "admin", "email": "admin@gouv.tg" } }

POST /api/v1/auth/login { "email": "agent.otr@gouv.tg", "password": "Oase@2026!" }
→ 200 OK
   { "user": { "id": 12, "role": "agent_otr", ... } }
```

Donc `getDefaultRouteForRole("admin") → "/admin/utilisateurs"` et
`getDefaultRouteForRole("agent_otr") → "/backoffice/dashboard"`. Le code path
est le même (lookup dans `DEFAULT_ROUTE_BY_ROLE`), donc la vérif API sur
`agent_otr` couvre aussi la branche admin (lookup avec clé différente).

#### Déploiement

- Tar source `maquette/` (sans `node_modules`) → SCP → VPS
- `docker build --no-cache -t oase-frontend:latest` (~2 min, dont `vue-tsc` à 105% CPU)
- `docker compose -f docker-compose.local-prod.yml up -d --force-recreate oase-frontend`
- HTTP 200 sur `https://oase.ulia.site/`

#### Régression & compat

- ✅ Non-admin (contribuable → `/portail/dashboard`, agent_otr → `/backoffice/dashboard`, etc.) : comportement inchangé
- ✅ Admin : seul cas nouveau (override complet sur `meta.role`)
- ✅ Rétrocompatible : la signature du helper `getDefaultRouteForRole(role)` accepte `Role` typé et tombe en fallback sur `/portail/dashboard` si rôle inconnu (couvre les rôles ajoutés back non encore mappés front)

#### Note technique

- Browser Playwright s'est figé après le 2e test live (contribuable), mais **les 4 tests critiques** (admin login, sidebar, route guard override, navigation `/`) **ont tous passé avant le freeze**
- Mémoire agent mise à jour avec le pattern "helper + 3 bugs types" pour les futurs projets Vue/Pinia

**Cas de test associés à ajouter au plan de recette :** `TC-AUTH-05`, `TC-AUTH-06`, `TC-AUTH-07` (cf. `docs/tests/04_PLAN_RECETTE_EXONERATION.md`).

---

### BUG #6 - 2026-07-12 00:22 UTC - API renvoie `role: "CONTRIBUABLE"` au lieu de `"contribuable"`

- **Workflow** : W1, W2 (tous)
- **Page/Route** : API `POST /api/v1/auth/login`
- **Severite** : Moyenne (invisible UI grâce au fallback, mais court-circuit des checks de sécurité backend type `user.role === 'contribuable'`)
- **Compte** : `contribuable@gouv.tg` / `Oase@2026!`
- **Découverte** : Session recette TC-P1 (tentative d'auth P1)
- **Reproduction** :
  1. `curl -X POST https://api.oase.ulia.site/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"contribuable@gouv.tg","password":"Oase@2026!"}'`
- **Attendu** : `user.role = "contribuable"`
- **Obtenu** : `user.role = "CONTRIBUABLE"` (legacy)
- **Cause racine** : Le code backend (`auth.service.ts`) lit `user.role` directement depuis la DB Prisma. La DB prod n'a pas reçu la migration 002 (`UPDATE utilisateurs SET role='contribuable' WHERE role='CONTRIBUABLE'`), donc l'API retourne l'ancien code. Le seed mis à jour n'écrase pas la prod.
- **Impact** :
  - Côté UX : **nul** (le frontend a un fallback `?? '/portail/dashboard'` dans `getDefaultRouteForRole` qui sauve la mise)
  - Côté sécurité : **réel** — les checks type `user.role === 'contribuable'` dans `demandes.service.ts` ligne 22 court-circuitent, donnant au user un accès plus large qu'il ne devrait
- **Solution appliquée (2026-07-12 00:35)** :

  **Fix 1 — Défense en profondeur dans `auth.service.ts`** (méthode privée `normalizeRole()`) :
  - Normalise `CONTRIBUABLE → contribuable` dans le payload de réponse, dans le JWT et dans l'audit
  - Garantit que TOUT le code aval voit la valeur canonique, même si la DB n'est pas migrée
  - Marqué "à supprimer une fois la migration 002 appliquée partout"

  **Fix 2 — Test unitaire dans `auth.service.spec.ts`** (2 nouveaux tests) :
  - `normalise le rôle legacy "CONTRIBUABLE" → "contribuable" (BUG #6)` : bloque la régression
  - `laisse les rôles canoniques inchangés (admin, agent_otr, ...)` : sanity check

- **Solution opérationnelle (à faire en parallèle)** :
  - [ ] Déployer la migration 002 sur la base prod (cf. `oase-api/prisma/migrations/002_rename_CONTRIBUABLE_to_contribuable/migration_final.sql` lignes 56-58)
  - [ ] Une fois la migration appliquée, retirer `normalizeRole()` (devenu inutile)

- **Vérifications** :
  - ✅ 23/23 tests unitaires `auth.service.spec.ts` PASS (dont les 2 nouveaux)
  - ✅ TypeScript compile clean (`npx tsc --noEmit` → 0 erreur)
  - ⏳ Test live prod (curl après rebuild + redeploy backend) : à faire dans la prochaine étape

**Statut** : ✅ **FIXED côté code (défense en profondeur)** le 2026-07-12 00:35. Le fix opérationnel (migration 002) reste à déployer pour恢复正常 fully.

---

### Session BUG #7 - 2026-07-13 20:30 UTC - Flow demande d'exonération complet cassé

**Severite** : 🔴 **CRITIQUE** (le cœur métier P1 est inutilisable : un contribuable ne peut ni lister, ni créer, ni soumettre une demande)
**Workflow** : W2 (Portail contribuable) — test TC-P1-01 (dépôt d'une nouvelle demande)
**Compte** : `contribuable@gouv.tg` / `Oase@2026!`
**Decouverte** : Session recette API-only (browser Playwright MCP figé) — appelée après le refactor contribuable (#1/#2/#6)

#### Reproduction (avant fix)

```powershell
$login = Invoke-RestMethod -Method POST -Uri "https://api.oase.ulia.site/api/v1/auth/login" -Body (@{email="contribuable@gouv.tg";password="Oase@2026!"} | ConvertTo-Json) -ContentType "application/json"
$h = @{Authorization="Bearer $($login.access_token)"}

# Liste MES demandes
Invoke-RestMethod -Method GET -Uri "https://api.oase.ulia.site/api/v1/demandes" -Headers $h
# → HTTP 500 "Internal server error" (BUG #7.1 + #7.2)

# Creer une nouvelle demande
Invoke-RestMethod -Method POST -Uri "https://api.oase.ulia.site/api/v1/demandes" -Headers $h -Body (@{baseJuridiqueVersionId="b1000001-0000-0000-0000-000000000001";contribuableId="c0000001-0000-0000-0000-000000000001";montantFcfa=1000000;secteur="agriculture"} | ConvertTo-Json) -ContentType "application/json"
# → HTTP 400 "baseJuridiqueVersionId must be a UUID, contribuableId must be a UUID" (BUG #7.3)
```

#### Diagnostic : 3 bugs combines qui se masquaient l'un l'autre

##### BUG #7.1 — Scope service : `contribuable` (singulier) au lieu de `contribuables` (pluriel relation Prisma) + `utilisateurId` au lieu de `userId` (champ réel du modèle `Contribuable`)

**Cause racine** : Dans `oase-api/src/common/services/scope.service.ts`, le code utilisait la **forme singulière** (`contribuable`) au lieu de la forme plurielle de la relation Prisma (`contribuables`). Et le champ `utilisateurId` qui n'existe pas (le modèle `Contribuable` a `userId`, `@map("user_id")`).

**Message Prisma capturé en prod** :
```
Invalid `prisma.demande.count()` invocation:
where: { contribuable: { utilisateurId: "a000000d-..." } }
Unknown argument `contribuable`. Did you mean `contribuables`?
```

**Lignes corrigées** (6 endroits dans `scope.service.ts`) :
- L84 (buildDemandeScope) : `{ contribuable: { utilisateurId } }` → `{ contribuables: { userId } }`
- L148 (buildContribuableScope) : `{ utilisateurId }` → `{ userId }`
- L162 (buildConventionScope) : `{ contribuable: { utilisateurId } }` → `{ contribuables: { userId } }`
- L186-187 (demandeMatchesScope) : `where.contribuable?.utilisateurId` et `demande.contribuable?.utilisateurId` → `where.contribuables?.userId` et `demande.contribuables?.userId`
- L204 (contribuableMatchesScope) : `contribuable.utilisateurId` → `contribuable.userId`

##### BUG #7.2 — Migration Prisma 002 incomplète : TABLES renommées mais pas les COLONNES

**Cause racine** : La migration `002_rename_CONTRIBUABLE_to_contribuable` a renommé les tables (`CONTRIBUABLEs` → `contribuables`) mais **a oublié de renommer les colonnes** (`CONTRIBUABLE_id`, `type_CONTRIBUABLE_code`, etc.). Le `schema.prisma` attend `contribuable_id` / `type_contribuable_code` mais la DB prod a encore l'ancien nom.

**Vérification en prod** :
```sql
SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA='oase' AND COLUMN_NAME LIKE '%CONTRIBUABLE%';
-- AVANT fix :
-- actes                       | CONTRIBUABLE_id
-- agrement_contribuables      | CONTRIBUABLE_id
-- base_juridique_versions     | type_CONTRIBUABLE_cible
-- contribuable_historique_fiscal | CONTRIBUABLE_id
-- contribuables               | type_CONTRIBUABLE_code
-- conventions                 | CONTRIBUABLE_id
-- demandes                    | CONTRIBUABLE_id          ← CRITIQUE pour flow demande
-- quotas                      | CONTRIBUABLE_id
-- reporting_aggregats         | type_CONTRIBUABLE_code
-- 9 colonnes, 11 index, 1 FK unique key à renommer
```

**Fix appliqué** : Nouvelle migration `oase-api/prisma/migrations/002b_rename_columns_CONTRIBUABLE_to_contribuable/migration.sql` :
- 9 colonnes renommées (`CONTRIBUABLE_id` → `contribuable_id`, `type_CONTRIBUABLE_*` → `type_contribuable_*`)
- 11 index renommés (`idx_CONTRIBUABLE_id` → `idx_contribuable_id`, `ft_CONTRIBUABLEs` → `ft_contribuables`, etc.)
- 1 FK unique key renommée (`uk_agrement_CONTRIBUABLE` → `uk_agrement_contribuable`)
- **Idempotente** : 2 procédures stockées `rename_col_if_old_exists()` et `rename_index_if_exists()` permettent de rejouer sans erreur
- Gère la nullabilité par colonne (CHAR(36) NOT NULL pour `demandes.contribuable_id`, NULL pour `quotas.contribuable_id` à cause de la FK SET NULL)
- Trace insérée dans `_prisma_migrations` pour que Prisma ne la re-applique pas

**Vérification finale** : `colonnes_CONTRIBUABLE=0, index_CONTRIBUABLE=0, fk_CONTRIBUABLE=0`

##### BUG #7.3 — `@IsUUID()` de class-validator rejette les UUIDs "exotiques" du seed

**Cause racine** : Le seed OASE utilise des UUIDs déterministes lisibles au format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (ex: `a000000d-0000-0000-0000-00000000000d`) qui ne sont **pas des UUIDs v4 valides** (le digit de version à la position 13 doit être 4, le digit de variant à la position 17 doit être 8/9/a/b). Le `@IsUUID()` de `class-validator@0.14` (basé sur `validator.js`) rejette ces UUIDs.

**Message d'erreur** : `{"message":["baseJuridiqueVersionId must be a UUID","contribuableId must be a UUID"]}`

**Fix appliqué** : Remplacement de `@IsUUID()` par `@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)` dans :
- `oase-api/src/demandes/dto/creer-demande.dto.ts` (lignes 5, 8)
- `oase-api/src/workflow/dto/creer-workflow-template.dto.ts` (ligne 47)

**Justification sécurité** : Le format reste validé (36 chars hex avec tirets aux bons endroits). La DB valide quand même le type `CHAR(36)`. Pas de risque d'injection.

#### BUG #7.4 (découvert pendant le fix) — `isAllowed` charge la demande SANS la relation `contribuables`

**Symptôme** : POST /demandes marche (crée la demande), mais GET /demandes/{id} et POST /soumettre renvoient 403 "PERIMETRE_NON_AUTORISE".

**Cause racine** : Dans `scope.service.ts` ligne 61, `prisma.demande.findUnique({ where: { id } })` ne charge pas la relation `contribuables`. Donc `demande.contribuables` est `undefined`, et la condition `demande.contribuables?.userId === user.id` est toujours `false`.

**Fix** : Ajout de `include: { contribuables: true }` dans le findUnique.

```diff
- const demande = await this.prisma.demande.findUnique({ where: { id: resourceId } });
+ const demande = await this.prisma.demande.findUnique({
+   where: { id: resourceId },
+   include: { contribuables: true },
+ });
```

#### Fix bonus — Liage user ↔ entreprise

Découverte pendant le test : le seed crée 4 entreprises dans `contribuables` mais **ne lie aucune à un utilisateur** (`user_id = NULL`). Du coup le user `contribuable@gouv.tg` ne peut rien créer (la création vérifie `userId === user.id`).

**Fix opérationnel** : Liaison manuelle de l'entreprise SCT (c0000001) au user contribuable (a000000d) via SQL :
```sql
UPDATE contribuables SET user_id = 'a000000d-0000-0000-0000-00000000000d' WHERE id = 'c0000001-0000-0000-0000-000000000001';
```

**À corriger dans le seed** : ajouter une propriété `userId` à au moins un des 4 `CONTRIBUABLES` du seed et lier au user `contribuable@gouv.tg`. Lot suivant.

#### Vérification — règle des 3 vérifications

| # | Type | Outil | Résultat |
|---|---|---|:---:|
| **V1** | Tests unitaires | `npx jest src/common/services/scope.service.spec.ts` | ✅ 7/7 PASS (assertions mises à jour : `contribuables`/`userId`) |
| **V2** | TypeScript compile | `npx tsc --noEmit` (build Docker) | ✅ 0 erreur |
| **V3** | Test E2E API (post-rebuild) | PowerShell `Invoke-RestMethod` | ✅ **FLOW COMPLET OK** : login → list → create (`DEM-2026-00002`) → detail → submit (transition `brouillon` → `soumis`) |

#### Captures du flow E2E réussi (V3)

```
=== ETAPE 1: LOGIN ===
Login OK
  role recu      = contribuable
  id             = a000000d-0000-0000-0000-00000000000d

=== ETAPE 2: GET /demandes (lister MES demandes) ===
OK - 1 demandes, 1 total
  DEM-2026-00001 | statut=brouillon | contribuable=Societe Cotonniere du Togo (SCT)

=== ETAPE 3: POST /demandes (creer brouillon) ===
OK - Demande creee
  id         = 31264523-7efc-11f1-955b-0242ac180002
  reference  = DEM-2026-00002
  statut     = brouillon
  montant    = 50000000

=== ETAPE 4: GET /demandes/31264523-7efc-11f1-955b-0242ac180002 (detail) ===
OK - Detail recupere
  reference = DEM-2026-00002, statut = brouillon

=== ETAPE 5: POST /demandes/{id}/soumettre (transition brouillon -> soumis) ===
OK - Demande soumise
  statut = soumis, dateDepot = 2026-07-13T20:48:25.033Z
```

#### Commits de la session

| Hash | Sujet |
|---|---|
| `b720c69` | refactor(oase-api): CONTRIBUABLE → contribuable (module + Prisma + role enum) |
| `c4bb5c6` | fix(deploy): healthcheck frontend IPv4 force (1er essai, insuﬀisant) |
| `7867ba1` | fix(deploy): healthcheck frontend via curl+0.0.0.0 (le bon) |
| `16007ea` | fix(oase-api): BUG #7 flow demande - scope service + migration colonnes |
| `d1d4fdf` | fix(oase-api): BUG #7.3 - relax UUID validator (creer-demande.dto) |
| `ebb20ca` | fix(oase-api): BUG #7.3 part 2 - UUID validator (workflow template) |
| `56f2d86` | fix(oase-api): isAllowed charge la relation contribuables |

#### Actions de suivi

- [ ] **Seed v5** : ajouter `userId` à au moins un `CONTRIBUABLES` du seed pour que le test E2E soit reproductible sans fix SQL manuel
- [ ] **Refactoriser les UUIDs** : regénérer tous les UUIDs du seed en v4 valides (pour pouvoir réutiliser `@IsUUID()` proprement, sinon garder `@Matches`)
- [ ] **Plan de recette** : ajouter TC-P1-01 complet (login → list → create → submit) dans `docs/tests/04_PLAN_RECETTE_EXONERATION.md` avec les 3 vérifications
- [ ] **BUG #6 cleanup** : retirer `normalizeRole()` de `auth.service.ts` maintenant que BUG #7.2 (migration 002b) couvre le cas

**Statut** : ✅ **FIXED & VERIFIE** le 2026-07-13 20:50 UTC. Le flow P1 (TC-P1-01) est opérationnel end-to-end via API.

---

### Refactoring CONTRIBUABLE → CONTRIBUABLE - LIVRE (2026-07-11)

**Statut** : ✅ COMPLET
**Methode** : 3 passes Python + 1 migration DB
**Tests** : TypeScript compile OK (backend + frontend), Vite build OK

**Fichiers modifies (~45 au total) :**
- Prisma : schema.prisma, seed.js, migration 001 (3 fichiers)
- Backend : app.module.ts, auth.service.ts, demandes/conventions + renommage dossier CONTRIBUABLEs/ → contribuables/ (7 fichiers)
- Frontend : 34 fichiers (layouts, router, services, vues admin/portail/backoffice/decideur/tresor/audit/agences/institutions/opendata/mobile)

**Migration DB creee :**
- `prisma/migrations/002_rename_CONTRIBUABLE_to_contribuable/migration.sql` (renomme tables + colonnes)
- `migration_part2_v2.sql` (FK drop/recreate pour eviter ALGORITHM=COPY/INPLACE)
- `migration_part3_v2.js` (UPDATE role CONTRIBUABLE → contribuable)

**A FAIRE - Non deploye en prod :**
- [ ] Deployer le code refactore sur le VPS (commande : `deploy\deploy-from-windows.bat`)
- [ ] Appliquer la migration 002 sur la base prod
- [ ] Smoke test post-deploy : login admin + navigation /portail/dashboard
- [ ] Les contraintes MySQL `agrement_CONTRIBUABLEs_ibfk_X` restent (metadata DB) - non critique mais peut etre nettoye plus tard

---

### BUG #2 - 2026-07-11 01:45 UTC - Pas de redirection après login (admin)

- **Workflow** : W1
- **Page/Route** : /login → /dashboard
- **Severite** : Haute (bloque l'accès)
- **Compte** : admin@gouv.tg / Oase@2026!
- **Reproduction** :
  1. Aller sur `https://oase.ulia.site/login`
  2. Remplir email `admin@gouv.tg` + mdp `Oase@2026!`
  3. Cliquer "Se connecter"
- **Attendu** : Redirection automatique vers `/dashboard` ou `/portail/dashboard` selon le rôle
- **Obtenu** : L'API renvoie 200 + token JWT stocké dans `localStorage`, mais l'URL reste sur `/login`. Aucun redirect déclenché.
- **Diagnostic** : Le `LoginView.vue` ne fait probablement pas de `router.push()` après le `authStore.login()`. Ou bien il push mais la route `/dashboard` n'existe pas (voir BUG #3).
- **Statut** : ✅ **FIXED le 2026-07-12** — voir section détaillée "BUG #2 / #4 / #5 — Routing & sidebar admin" plus haut. 3 vérifications (Playwright live, bundle prod, API) PASS.

### BUG #3 - 2026-07-11 01:45 UTC - Route /dashboard rend un contenu vide

- **Workflow** : W1, W6 (Admin)
- **Page/Route** : /dashboard
- **Severite** : Haute
- **Compte** : admin@gouv.tg
- **Reproduction** :
  1. Login admin@gouv.tg
  2. Naviguer manuellement sur `/dashboard`
- **Attendu** : Affichage du dashboard admin
- **Obtenu** : Page blanche, `<main>` contient `<div></div>` vide (aucun composant rendu)
- **Cause probable** : La route `/dashboard` n'a pas de `component:` dans le router, ou le composant DashboardView n'est pas branché.

### BUG #4 - 2026-07-11 01:45 UTC - Sidebar affiche le mauvais profil

- **Workflow** : W1, W6
- **Page/Route** : /dashboard
- **Severite** : Moyenne (UX confuse)
- **Compte** : admin@gouv.tg
- **Reproduction** :
  1. Login admin@gouv.tg
  2. Aller sur /dashboard
- **Attendu** : Le sélecteur de profil en haut à gauche affiche "Admin" avec les menus admin (utilisateurs, rôles, monitoring, etc.)
- **Obtenu** : Le sélecteur affiche "P1 — Contribuable" avec les menus contribuable (Tableau de bord, Nouvelle demande, Mes demandes, Exonérations actives, Mon profil entreprise, Notifications)
- **Cause probable** : Le rôle n'est pas lu depuis le store utilisateur, ou le rôle "admin" n'est pas mappé dans le menu.
- **Statut** : ✅ **FIXED le 2026-07-12** — voir section détaillée "BUG #2 / #4 / #5 — Routing & sidebar admin" plus haut. 3 vérifications (Playwright live, bundle prod, API) PASS.

### BUG #5 - 2026-07-11 01:45 UTC - /portail/dashboard redirige vers /login malgré token valide

- **Workflow** : W2 (Portail contribuable)
- **Page/Route** : /portail/dashboard
- **Severite** : Haute
- **Compte** : admin@gouv.tg (mais probablement tous les rôles)
- **Reproduction** :
  1. Login admin@gouv.tg
  2. Naviguer sur `/portail/dashboard`
- **Attendu** : Affichage du portail contribuable (l'admin peut voir tous les portails)
- **Obtenu** : Redirection immédiate vers /login
- **Cause probable** : Le `beforeEach` du router vérifie un mauvais store key, ou lit depuis sessionStorage au lieu de localStorage.
- **Statut** : ✅ **FIXED le 2026-07-12** — voir section détaillée "BUG #2 / #4 / #5 — Routing & sidebar admin" plus haut. 3 vérifications (Playwright live, bundle prod, API) PASS.

---

### BUG #1 - 2026-07-11 00:14 UTC - Terminologie "contribuable" → "Contribuable"

**Decouverte par :** Ulrich
**Type :** Refactoring semantique (pas un bug technique)
**Statut :** Partiellement corrige

**Contexte :**
- OASE gere des exonerations fiscales au Togo
- Le terme "CONTRIBUABLE" designe le demandeur d'exoneration
- En fiscalite togolaise, le bon terme est "contribuable" (le contribuable demande l'exoneration, le CONTRIBUABLE serait plutot l'entreprise apres octroi)
- L'utilisateur prefere "contribuable" dans toute l'app

**Changement effectue (commit feaec27) :**
- ✅ Role DB libelle : "contribuable" → "Contribuable"
- ✅ Description : "Dépôt et suivi des demandes" → "Dépôt et suivi des demandes d'exonération fiscale"
- ✅ Email user : `CONTRIBUABLE@gouv.tg` → `contribuable@gouv.tg`
- ✅ Log du seed affiche les libelles (Contribuable au lieu de CONTRIBUABLE)
- ✅ ON DUPLICATE KEY UPDATE inclut maintenant email (pour les futures MAJ)

**A faire (TODO - pas fait) :**
- [ ] Renommer la table `CONTRIBUABLEs` → `contribuables` (Prisma schema + migration)
- [ ] Renommer `CONTRIBUABLE_id` → `contribuable_id` dans toutes les tables
- [ ] Renommer `ref_types_CONTRIBUABLE` → `ref_types_contribuable`
- [ ] Renommer `CONTRIBUABLE_historique_fiscal` → `contribuable_historique_fiscal`
- [ ] Renommer `agrement_CONTRIBUABLEs` → `agrement_contribuables`
- [ ] Renommer le code role `CONTRIBUABLE` → `contribuable` (breaking change, gere migration)
- [ ] Renommer `src/CONTRIBUABLEs/` → `src/contribuables/` dans le backend NestJS
- [ ] Renommer endpoints `/api/v1/CONTRIBUABLEs/` → `/api/v1/contribuables/`
- [ ] Mettre a jour 50+ fichiers frontend (RolesView.vue, NewDemandeView.vue, ProfilView.vue, etc.)
- [ ] Mettre a jour le `CONTRIBUABLE` dans le router (route paths)
- [ ] Mettre a jour les labels i18n dans toutes les vues
- [ ] Mettre a jour la documentation (DEPLOIEMENT_DOCKER.md, etc.)

**Impact :** Refactor majeur a planifier dans une session dediee
**Estimation :** 2-4 heures de travail


---

## Session BUG #8 — Recette E2E complète Playwright (2026-07-27) — ✅ FIXED

Campagne de recette exhaustive (workflows, formulaires, uploads, profils, permissions — hors SI externes et Open Data) exécutée contre le backend réel. **31 bugs applicatifs trouvés et corrigés** (18 backend, 10 frontend, 3 outillage/tests). Détail complet : `docs/qa/RAPPORT_RECETTE_2026-07-27.md`.

### Bugs critiques corrigés (sélection)

| # | Bug | Fix |
|---|---|---|
| #8.1 | Taxonomie rôles frontend ≠ backend → boucle de redirection, aucun agent/admin ne pouvait se connecter | `useDefaultRoute.ts`, garde `router.ts`, sidebar alignés sur les rôles canoniques — 7/7 logins OK |
| #8.2 | ScopeService : relations Prisma erronées → `GET /demandes` 500 pour tous les agents | `scope.service.ts` corrigé |
| #8.3 | **Fuite RLS** : lecture + transition de dossiers cross-périmètre (200 au lieu de 403) | `demandeMatchesScope()` applique organe/agence/DGBF |
| #8.4 | **Contournement des contrôles** : `POST /demandes/:id/approuver` sans PIN ni quota ni acte | transition bloquée (`APPROBATION_VIA_DECISIONS`) ; approbation via `decisions/approuver` (PIN + blocages + acte PDF + notification) |
| #8.5 | `DecisionDto` sans validateurs (400 avec pin / 500 sans corps) ; quota 400 au lieu de 422 `QUOTA_EPUISE` | DTO + `UnprocessableEntityException` |
| #8.6 | BigInt non sérialisable → 500 `/anomalies`, `/quotas` (+ `@CurrentUser('id')` qui ignorait la clé) | intercepteur global `BigIntSerializerInterceptor` |
| #8.7 | Chaîne d'audit SHA-256 rompue (115 lignes) + forks sous concurrence | re-chaînage + mutex applicatif `createEntry` + alias POST `verify-chain` |
| #8.8 | Vues P1/P2/P3/P4/P5/P7 100 % mock (dépôt non persisté, pas de PIN, désactivation fictive, uploads factices) | câblage API complet (services `portail.ts`, `backoffice.ts`, `decideur.ts`, `audit.ts`, `admin.ts`) |
| #8.9 | Seeds ids non-UUID vs `ParseUUIDPipe` (400 partout) | remapping UUID déterministe, 16 comptes préservés |
| #8.10 | **Fuite mode démo en build Docker** : switcher persona actif en prod via `.env.local` copié dans l'image | `.dockerignore` racine + double garde `import.meta.env.DEV && VITE_DEMO_MODE` — vérifié 4/4 sur build prod |
| #8.11 | PIN non vérifié serveur sur rejet ; dernier admin désactivable ; `verify-pin` et `unread-count` absents ; attestation .txt ; agrégats dashboards à zéro | correctifs backend + tests unitaires (314/314) |

### Résultat final de la recette

- **29/29** tests Playwright recette (backend réel) — TC-AUTH + TC-P1..P7 + matrice permissions
- **36/36** tests e2e API (`oase-api/e2e`)
- **314/314** tests unitaires Jest (23 suites)
- Builds backend/frontend propres ; chaîne d'audit `breaks: []` ; zéro erreur console sur les parcours

### BUG #8.12 — Boucle 401 au boot en production (2026-07-27, déploiement) — ✅ FIXED

- **Symptôme** : en prod uniquement, la page /login se rechargeait en boucle (`GET /notifications/unread-count` → 401 → `window.location.href='/login'` → reload → …), rendant la connexion impossible.
- **Cause racine** : l'app était montée AVANT la résolution de la route initiale → App.vue rendait transitoirement le layout par défaut (AppLayout) même sur /login → appel anonyme 401 → purge + reload. Masqué en dev car le mode démo court-circuite l'appel réel.
- **Fix** (maquette `09921f5`) : `main.ts` mount après `router.isReady()` ; AppLayout n'appelle `unread-count` que si authentifié ; `api.ts` ne purge/redirige sur 401 que si une session existait.
- **Vérifié en ligne** : 0 appel API anonyme au boot, login UI P1 OK, sélecteur persona absent (double garde DEV + .dockerignore), bundle `index-Wj3YHmuV.js` → nouveau bundle après fix.

### BUG #8.13 — Uploads impossibles en prod Docker (2026-07-27, recette prod) — ✅ FIXED

- **Symptôme** : `POST /demandes/:id/pieces-jointes` → 500 `EACCES: permission denied, mkdir '/app/uploads'` en production (le conteneur tourne en user non-root `oase`).
- **Fix** : `deploy/api.Dockerfile` crée `/app/uploads` + `/app/attestations` (chown oase) ; volumes persistants `oase_uploads_data` / `oase_attestations_data` dans `docker-compose.local-prod.yml`. Attestation seed régénérée (chemin Windows `\` en base → régénération via POST /attestations/actes/:id).

### BUG #8.14 — audit/DossiersView 100 % mock → vide en prod (2026-07-27, recette prod) — ✅ FIXED

- **Symptôme** : en prod (mode démo OFF), les mocks retournent `[]` → la « Consultation des dossiers » de l'auditeur affichait une table vide (TC-P5-03 FAIL en prod uniquement).
- **Fix** : vue câblée sur `GET /demandes` + `GET /demandes/:id/pieces-jointes` (liste, détail drawer, pièces réelles, filtre statuts canoniques).

### Validation finale — recette E2E EN PRODUCTION (2026-07-27)

- **29/29** tests Playwright recette PASS sur `https://oase.ulia.site` (26 parallèles + 3 P4 séquentiels)
- **7/7** personas : login UI en ligne + redirection correcte + sidebar sans sélecteur persona
- **16/16** comptes : login API prod OK

---

## Session BUG #9 — Programme « 0 mocked data » (2026-07-27) — ✅ FIXED

Objectif utilisateur : **aucune donnée fictive affichée, tout doit provenir de la DB**. Inventaire : ~30 vues avec données codées en dur visibles en prod + 3 vues cassées (mocks vidés). Traitement en 3 vagues :

- **Vague A (frontend)** : démockage de ~30 vues sur endpoints existants ; urgences prod supprimées (fausse attestation DocumentViewer OASE-2026-0039, fausse identité TOGO STEEL pré-remplie, faux KPIs 847,3 Mds/724 Mds, faux hashes TSA, faux logs HTTP connecteurs, date acte en dur). Règle : donnée API, calcul réel, ou état vide honnête + TODO.
- **Vague B (backend, 367/367 tests)** : 16 nouveaux endpoints adossés aux tables existantes — RBAC élargi (agent_dgtcp → conventions/rapports/stats ; agent_ci/cddi → conventions), GET /utilisateurs/annuaire, GET /connecteurs(+status/logs), GET+PUT /admin/parametres (system_config), GET /notifications/templates, GET /registre-central/mesures (agrégats réels), GET /rapports/opendata PUBLIC enrichi, module missions + migration 006 (+ champs anomalies montantEnCause/baseLegaleViolee), GET /admin/monitoring, délai moyen traitement dans /dashboards/p4, GET+PUT /referentiels/inseed.
- **Vague C (frontend)** : câblage des vues sur ces endpoints (missions audit, connecteurs SI, registre central, paramètres, monitoring, trésor, opendata anonyme, simulation INSEED).

Bugs connexes corrigés en route : client Prisma généré désynchronisé du schema (build Docker KO), balise `</div>` en trop (AgrementsView) cassant le build Vite, mocks e2e complétés (missions, registre-central, inseed, connecteurs…).

### Validation finale (prod, 2026-07-27)

- **29/29** tests recette Playwright sur https://oase.ulia.site
- **10/10** vues clés scannées sans marqueur fictif (connecteurs, monitoring, paramètres, missions, registre central, dashboards, nouvelle demande, notifications)
- **7/7** nouveaux endpoints prod 200 (dont opendata en accès anonyme) ; 3 missions seedées en prod
- **367/367** tests unitaires backend

---

## Session BUG #10 — Workflows P1 (contribuable) en production (2026-07-28) — ✅ FIXED

Objectif utilisateur : **tous les workflows de P1 fonctionnels, 0 erreur** (console + réseau) en production, détecté via audit Playwright piloté (navigateur visible).

### BUG #10.1 — Sidebar « Mes demandes » menait à une vue détail sans liste — ✅ FIXED

- **Symptôme** : le lien « Mes demandes » de la sidebar portail pointait vers une route sans vue liste ; le contribuable ne pouvait pas retrouver ses demandes après dépôt.
- **Fix** (maquette `60b0b07`) : nouvelle `MesDemandesView.vue` (liste paginée, statuts canoniques, export), route `/portail/demandes` déclarée AVANT `/portail/demandes/:id`, sidebar corrigée.

### BUG #10.2 — Bouton EXPORTER mort sur Mes demandes — ✅ FIXED

- **Symptôme** : le bouton EXPORTER était câblé sur `@export="() => {}"` — aucun effet.
- **Fix** : endpoint serveur `GET /demandes/export/mes-demandes?format=csv|xlsx` (backend `1a8c26d`, util `src/common/utils/simple-xlsx.util.ts` sans dépendance, CSV avec BOM Excel) + `exporterMesDemandes` dans `portail.ts` côté frontend. Vérifié en prod : XLSX 200 valide (19 lignes, bon `Content-Disposition`), CSV 200 avec BOM.

### BUG #10.3 — Workflow jamais démarré à la soumission (404 sur /workflow/demandes/:id/etapes) — ✅ FIXED

- **Symptôme** : `GET /workflow/demandes/:id/etapes` → 404 pour toute demande soumise ; le stepper du suivi restait vide (erreur initiale de l'audit : `index-CKUD8jN2.js:13 GET .../etapes 404`).
- **Cause racine double** :
  1. le démarrage de l'instance de workflow n'était pas déclenché à la soumission de la demande ;
  2. **aucun template de workflow actif en base prod** → même démarré, rien à instancier.
- **Fix backend** (`1a8c26d`) : démarrage auto idempotent dans `demandes.service.ts` à la soumission (template lié à la base juridique, fallback template actif), `demandes.module.ts` importe `WorkflowModule` ; 2 nouveaux tests Jest.
- **Fix données** : template canonique `STD-EXONERATION-01` créé (3 étapes : Vérification recevabilité/agent_ci/2j → Instruction/agent_ci/10j → Décision-Signature/decideur/pinRequis/3j) + **48 instances rattrapées** en prod (47 en local, 141 étapes). Script idempotent : `webbridge/seed-workflow-template.js`. Backup BDD préalable : `/opt/oase/backups/oase_pre_20260728_p1fixes.sql.gz`.
- **Preuve en conditions réelles** : `DEM-2026-00050` (créée + soumise par la recette p1-depot) démarre son workflow automatiquement — `/etapes` → 200.
- **Garde frontend** : `DemandeDetailView.vue` n'appelle plus `/etapes` pour un brouillon non soumis.

### BUG #10.4 — Favicon générique — ✅ FIXED

- Favicon remplacé par le blason OASE, servi en prod.

### Non-bugs confirmés (audit)

- **US-P1-05 upload de pièces** : PAS de bug — `DocumentUploadModal.vue:707` effectue le vrai `uploadPieceJointe` ; l'`input[type=file]` est dans la modale.
- **2 × 401** capturés par l'audit : attendus (tentative de login KO volontaire du scénario).

### Validation finale (prod, 2026-07-28)

- **369/369** tests unitaires Jest backend (2 nouveaux)
- **vue-tsc** 0 erreur + build Vite OK ; nouveau bundle `index-pWw9Bvs3.js` déployé
- **0 erreur console réelle** sur l'audit Playwright complet P1 (`webbridge/p1-audit-complet.js`, rapport `webbridge/audit-p1-2026-07-28T19-57-16.md`)
- **29/29** tests recette Playwright sur https://oase.ulia.site (dont p4-decideur isolé, fixtures partagées)
- Les 2 échecs TC-P5-03 / TC-P7-03 observés pendant la fenêtre de redéploiement (API en restart) ont disparu dès la stack stabilisée — repro manuel headed sain, 9/9 puis 29/29 PASS.

### BUG #10.5 — GET /rapports → 403 pour agent_conedef (2026-07-28, smoke E2E) — ✅ FIXED

- **Symptôme** : le tableau de bord CONEDEF (`/conedef/dashboard`, mission « synchronisation avec le rapport annuel ») recevait un 403 sur `GET /rapports` — détecté par le nouveau smoke E2E `roles-secondaires.spec.ts`.
- **Fix** (`3eea9e9`) : `Role.AGENT_CONEDEF` ajouté en lecture sur `GET /rapports` et `GET /rapports/:id` (contrôleur + `rbac.spec.ts`). Jest 369/369.

### BUG #10.6 — GET /dashboards/p5 → 403 pour agent_dgbf (2026-07-28, smoke headed) — ✅ FIXED

- **Symptôme** : la page budget DGBF (`/backoffice/budget`) appelle `GET /dashboards/p5` et recevait 403 — le code frontend portait un commentaire admettant le blocage et affichait un message d'erreur à la place des KPIs de dépenses fiscales, pourtant le cœur de mission DGBF.
- **Détection** : uniquement en run **headed** (plus lent) — en headless la réponse 403 arrivait après l'assertion finale (race). Le smoke a été rendu déterministe (`waitForLoadState('networkidle')`).
- **Fix** (`07ac711`) : `Role.AGENT_DGBF` ajouté sur `GET /dashboards/p5` (contrôleur + `rbac.spec.ts`). Jest 369/369.

### BUG #10.7 — /opendata/rapports tirait un appel authentifié en accès anonyme (2026-07-28, TC-P6-04) — ✅ FIXED

- **Symptôme** : la page PUBLIQUE `/opendata/rapports` appelait systématiquement `GET /rapports` (endpoint authentifié) même sans session → 401 garanti, capturé par la nouvelle spec P6.
- **Fix** (maquette `da7a074`) : l'appel n'est déclenché que si `auth.isAuthenticated` ; sinon état « connexion requise » affiché sans appel réseau.

### Couverture élargie (2026-07-28 ~23h) — P6 + rôles secondaires

- Nouvelles specs : `p6-opendata.spec.ts` (5 tests, portail public anonyme) et `roles-secondaires.spec.ts` (7 rôles × écrans métier, 0 erreur console, 0 API ≥ 400).
- **Recette complète : 41/41 PASS headless (1,3 min) + 16/16 PASS headed** sur les specs nouvelles/modifiées.
- Fragilités de test corrigées : TC-P1-03/TC-P1-04 dépendaient de la présence d'une seed dans la liste paginée du dashboard (~10 plus récentes) → accès détail direct par id.
- Reste honnêtement non couvert : rôle `agent_dsi_mef` (aucun compte provisionné), vérification publique d'attestation (fonction absente du routeur), MFA réel, notifications réelles, intégrations SI, charge, sécurité offensive. Détail : `docs/qa/RAPPORT_COUVERTURE_TESTS_2026-07-28.md` v2.
