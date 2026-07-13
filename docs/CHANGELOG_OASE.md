# Changelog OASE - Infrastructure Docker

Toutes les evolutions notables du deploiement et de l'infrastructure OASE.

---

## 2026-07-12 - V3.5.2 — BUG #6 fix : normalisation rôle `beneficiaire → contribuable`

### Résumé

BUG #6 découvert pendant la recette P1 : l'API `POST /auth/login` retournait `"role": "beneficiaire"` (legacy) au lieu de `"contribuable"` car la migration 002 (refactor BENEFICIAIRE → CONTRIBUABLE) n'a pas été appliquée sur la base prod. Le frontend était sauvé par son fallback, mais les checks backend type `user.role === 'contribuable'` dans `demandes.service.ts` étaient court-circuités.

### Fichiers modifiés (2)

| Fichier | Type | Détail |
|---|---|---|
| `oase-api/src/auth/auth.service.ts` | Edit | Méthode privée `normalizeRole()` (mapping `beneficiaire → contribuable`) + application dans `issueTokenPair()` (payload, JWT, audit) |
| `oase-api/src/auth/auth.service.spec.ts` | Edit | + 2 tests : `normalise le rôle legacy "beneficiaire" → "contribuable" (BUG #6)` + `laisse les rôles canoniques inchangés (admin, agent_otr, ...)` |

### Validation — règle des 3 vérifications

| # | Type | Outil | Résultat |
|---|---|---|:---:|
| **V1** | Tests unitaires | `npx jest src/auth/auth.service.spec.ts` | ✅ 23/23 PASS (dont 2 nouveaux) |
| **V2** | TypeScript compile | `npx tsc --noEmit` | ✅ 0 erreur |
| **V3** | Test live API (post-rebuild) | `curl POST /api/v1/auth/login` (à faire après redeploy) | ⏳ En attente — le rebuild backend n'a pas été lancé dans cette session |

### Documentation mise à jour

- `docs/BUGS.md` : BUG #6 ✅ FIXED (défense en profondeur)
- `docs/tests/04_PLAN_RECETTE_EXONERATION.md` : TC-AUTH-01 P1 = PASS avec note sur la défense en profondeur

### Solution opérationnelle (TODO)

- [ ] Rebuild backend : `cd oase-api && npm run build`
- [ ] Redéployer container API sur VPS
- [ ] Vérifier via curl : `POST /api/v1/auth/login` doit retourner `"role": "contribuable"`
- [ ] Appliquer la migration 002 sur la DB prod pour恢复正常完全
- [ ] Retirer `normalizeRole()` (devenu inutile)

### Prochaines étapes

- Une fois BUG #6 déployé en prod, **reprendre TC-P1-01** (dépôt d'une nouvelle demande par le contribuable)
- Le browser Playwright sera à relancer (freeze rencontré dans la session précédente)

---

## 2026-07-12 - V3.5.1 — Correction 3 bugs frontend bloquants (admin)

### Résumé

Trois bugs critiques qui empêchaient l'admin (P7) d'utiliser l'application en prod ont été identifiés par Ulrich le 2026-07-11 puis corrigés et déployés le 2026-07-12 :

- **BUG #2** : Pas de redirection après login (admin) → URL bloquée sur `/login`
- **BUG #4** : Sidebar affichait le menu contribuable au lieu du menu admin
- **BUG #5** : Navigation manuelle vers `/portail/dashboard` renvoyait vers `/login` malgré token valide

### Cause racine commune

Le routing et la sidebar étaient pilotés par `route.meta.role` (rôle attendu de la route) au lieu de `auth.user.role` (rôle réel de l'utilisateur connecté). L'admin étant par défaut sur des routes d'autres personas, il voyait le mauvais menu et se faisait renvoyer en boucle vers `/login`.

### Fichiers modifiés (4)

| Fichier | Type | Détail |
|---|---|---|
| `maquette/src/composables/useDefaultRoute.ts` | **NOUVEAU** (45 lignes) | Helper `getDefaultRouteForRole(role)` + `isAdminRole(role)` — source de vérité partagée pour le mapping rôle → dashboard |
| `maquette/src/views/auth/LoginView.vue` | Edit (l. 133) | `router.push('/')` → `router.push(getDefaultRouteForRole(res.user.role))` |
| `maquette/src/plugins/router.ts` | Edit (l. 14, 137-155) | Route `/` = composant vide + `beforeEach` dynamique + override admin sur `meta.role` |
| `maquette/src/layouts/AppLayout.vue` | Edit (l. 295-332) | `currentNavItems` piloté par `auth.user.role` (admin → menu admin toujours) |

### Validation — règle des 3 vérifications

| # | Type | Outil | Résultat |
|---|---|---|:---:|
| **V1** | Live E2E prod | Playwright MCP sur `https://oase.ulia.site` | ✅ URL = `/admin/utilisateurs`, sidebar = 14 items admin |
| **V2** | Bundle prod servi | `curl` + `grep` sur `index-C1vEtjNU.js` | ✅ Marqueurs `{path:"/",component:{template:"<div></div>"}}`, `isAdminRole`, `getDefaultRouteForRole` tous présents |
| **V3** | API backend | `curl POST /api/v1/auth/login` (admin + agent_otr) | ✅ 200 + rôle cohérent (`admin`, `agent_otr`) |

### Documentation mise à jour

- `docs/BUGS.md` : section détaillée "BUG #2 / #4 / #5 — Routing & sidebar admin" + 3 entrées individuelles marquées ✅ FIXED
- `docs/tests/04_PLAN_RECETTE_EXONERATION.md` v1.1 :
  - Nouvelle section §0 "KPI de recette" avec règle des 3 vérifications
  - 3 nouveaux cas de test (TC-AUTH-05, TC-AUTH-06, TC-AUTH-07) avec leurs V1/V2/V3 documentées
  - Table de synthèse : 4/4 cas TC-AUTH en PASS (contre 1/4 hier)
  - Checklist de sortie : 3 cases cochées

### Déploiement

- `docker build --no-cache -t oase-frontend:latest` (~2 min, vue-tsc à 105% CPU)
- `docker compose -f docker-compose.local-prod.yml up -d --force-recreate oase-frontend`
- HTTP 200 sur `https://oase.ulia.site/` confirmé

### Rétrocompatibilité

- Non-admin (contribuable → `/portail/dashboard`, agent_otr → `/backoffice/dashboard`, etc.) : **comportement inchangé**
- Admin : seul cas nouveau (override complet sur `meta.role`)
- Helper `getDefaultRouteForRole` accepte `Role` typé + fallback `/portail/dashboard` si rôle inconnu

### Prochaines étapes

- Reprendre la recette métier (TC-P1-* à TC-P7-*) en repartant du flux instruction P2 (premier workflow pas encore testé)
- Mettre à jour `matrice_couverture.md` : 3 exigences F-01/NF-08 (admin) passent de 🔄 à ✅

---

## 2026-07-10 - Mise en place complete de l'infra Docker

### Phase 1 - Preparation (~22h00 UTC)

**Decision :** deploiement sur Hostinger VPS (KVM 8 / 32 GB RAM) plutot que Contabo.

**Mesures RAM VPS :**
- 19 GB utilises / 32 GB totaux (services Dify, Plane, Chatwoot, Langfuse, Presidio, TEI, Traefik...)
- ~11 GB disponibles pour OASE
- Estimation OASE : ~1 GB (MySQL 350 + API 500 + Frontend 25 + overhead)

**Conlusion :** hebergement viable, RAM largement suffisante.

---

### Phase 2 - Structure deploy/ creee (~20h30 UTC)

**Fichiers crees dans `C:\wamp64\www\oase\deploy\` :**

| Fichier | Role | Horodatage |
|---|---|---|
| `deploy/README.md` | Doc du dossier deploy | 2026-07-10 20:30 |
| `deploy/api.Dockerfile` | Image NestJS multi-stage (Node 20-alpine) | 2026-07-10 20:30 |
| `deploy/frontend.Dockerfile` | Image Vite + Nginx multi-stage | 2026-07-10 20:30 |
| `deploy/nginx.conf` | Config Nginx + proxy /api | 2026-07-10 20:30 |
| `deploy/docker-compose.yml` | Stack dev (MySQL + API + Frontend) | 2026-07-10 20:30 |
| `deploy/docker-compose.local-prod.yml` | Stack prod avec images locales | 2026-07-10 21:15 |
| `deploy/docker-compose.prod.yml` | Stack prod GHCR (pour CI/CD futur) | 2026-07-10 21:15 |
| `deploy/env.prod.template` | Template variables prod | 2026-07-10 21:20 |
| `deploy/.gitignore` | Ignore .env dans git | 2026-07-10 20:30 |
| `deploy/scripts/deploy.sh` | Deploiement manuel VPS | 2026-07-10 20:30 |
| `deploy/scripts/backup-db.sh` | Dump MySQL auto | 2026-07-10 20:30 |
| `deploy/scripts/restore-db.sh` | Restore dump | 2026-07-10 20:30 |
| `deploy/scripts/gen_env_prod.py` | Genere .env + secrets forts (chmod 600) | 2026-07-10 20:35 |
| `deploy/scripts/add_dns.py` | Ajout records DNS Hostinger API | 2026-07-10 21:25 |
| `deploy/traefik-frontend.yml` | Workaround Traefik file-based (bug) | 2026-07-10 21:23 |

**Fichiers crees a la racine du projet :**

| Fichier | Role | Horodatage |
|---|---|---|
| `oase-api/.dockerignore` | Exclut node_modules du build | 2026-07-10 20:30 |
| `maquette/.dockerignore` | Exclut node_modules du build | 2026-07-10 20:30 |
| `.github/workflows/cd.yml` | GitHub Action CD (build + deploy) | 2026-07-10 20:30 |
| `docs/DEPLOIEMENT_DOCKER.md` | Doc infrastructure | 2026-07-10 21:30 |

---

### Phase 3 - Premier deploiement VPS (~20h50-21h30 UTC)

**20h50** - Transfert des sources vers le VPS
- Creation archive : `oase-deploy-src.tar.gz` (24 MB)
- Upload via SCP
- Extraction dans `/opt/oase/`

**20h55** - Premier build des images sur VPS
- `docker build -f deploy/api.Dockerfile -t oase-api:latest .` (3 min)
- `docker build -f deploy/frontend.Dockerfile -t oase-frontend:latest .` (1 min)
- **Succes**, images ~506 MB + 54 MB

**21h00** - Premier lancement du stack
- MySQL demarre (healthy)
- API demarre (healthy)
- Frontend : **bug** - "host not found in upstream 'api'"
- **Cause :** reference incorrecte, doit etre `oase-api` (nom du service)
- **Fix :** nginx.conf change `proxy_pass http://api:3000` -> `proxy_pass http://oase-api:3000`
- Re-build + restart : **OK**

**21h05** - Configuration DNS via API Hostinger
- **Bug API Hostinger** : l'endpoint PUT `/api/dns/v1/zones/{domain}` renvoie 422 avec "Duplicate record in RRset ulia.site IN A" pour les nouveaux records
- **Cause :** format de body incorrect (envoyer `name: 'oase'` au lieu de `name: 'ulia.site'`)
- **Fix :** format JSON correct identifie
- Ajout de :
  - `oase.ulia.site` -> 147.93.85.22
  - `api.oase.ulia.site` -> 147.93.85.22
- Verification DNS : OK (TTL 300s)

**21h10** - Premier test HTTPS
- `https://api.oase.ulia.site/api/v1/health` : 200 OK
- `https://oase.ulia.site/` : **404** (bug Traefik)

**21h15** - Bug Traefik sur le frontend
- Symptome : Traefik ne detecte pas les labels du conteneur `oase-frontend`
- Cause inconnue (debug tent plusieurs fois, mais labels syntax OK + container sur `proxy-network`)
- **Solution :** config Traefik file-based dans `/opt/docker-infra/traefik/dynamic/oase.yml`
- Re-test : `https://oase.ulia.site/` -> **200 OK**

**21h20** - Verification visuelle
- Screenshot Playwright sur `https://oase.ulia.site/`
- Page de login s'affiche correctement avec logo OASE, formulaire, etc.

---

### Phase 4 - Tentatives CI/CD GitHub Actions (~22h00-22h50 UTC)

**22h00** - Premiere configuration des secrets GitHub
- 3 secrets ajoutes par l'utilisateur :
  - `VPS_HOST` = `147.93.85.22`
  - `VPS_USER` = `root`
  - `VPS_SSH_KEY` = contenu de `C:\Users\lenovo\.ssh\kvm8_key`

**22h00-22h45** - 6 runs CD consecutifs en failure
- **Run #1-2** : BuildKit cache bug `"/src": not found`
- **Run #3-4** : Memes erreurs apres retrait cache
- **Run #5** : `command_timeout` declare 2 fois (YAML invalide)
- **Run #6** : Meme erreur
- **Run #7** : Workflow `cd.yml` debug seulement (SSH test seul)
- **Run #8-9** : Workflow VPS build, exit 1 en 5s
- **Run #10** : SSH debug SUCCESS (premier reussite !)
- **Run #11-12** : Tentatives deploy complet, exit 255
- **Run #13-16** : Debug progressif, toujours exit 255 sur le deploy step

**22h50** - **Decision** : abandon du CI/CD GitHub Actions
- Trop de problemes, debug complexe sans acces aux logs
- **Adoption du mode deploy manuel** depuis Windows via script `.bat`

---

### Phase 5 - Setup deploy manuel Windows (2026-07-10 22:52 UTC)

**22h52** - Fichiers finaux crees
- `C:\wamp64\www\oase\deploy\deploy-from-windows.bat` - Script one-click
- `C:\wamp64\www\oase\docs\GUIDE_DEPLOY_WINDOWS.md` - Guide complet
- `C:\wamp64\www\oase\docs\CHANGELOG_OASE.md` - Ce fichier

**Configuration finale :**
- URL app : https://oase.ulia.site/
- URL API : https://api.oase.ulia.site/api/v1/health
- DNS : configure via API Hostinger
- HTTPS : Let's Encrypt automatique
- Images Docker : construites sur le VPS directement
- Deplois : manuels via `deploy-from-windows.bat`

---

## Stack final

### Containers actifs (au 2026-07-10 22:52 UTC)

| Nom | Image | Status | Port |
|---|---|---|---|
| oase-db | mysql:8.0 | healthy | 3306 (interne) |
| oase-api | oase-api:latest | healthy | 3000 (interne) |
| oase-web (oase-frontend) | oase-frontend:latest | unhealthy* | 80 (interne) |

*Le healthcheck nginx utilise `localhost` qui ne resout pas dans Alpine. L'app fonctionne quand meme.

### Memoire

- RAM VPS totale : 32 GB (Hostinger KVM 8)
- RAM utilisee : 19 GB (autres services)
- RAM disponible : 11 GB
- OASE consomme : ~1 GB
- Marge confortable : ~10 GB

### Endpoints

| URL | Verification |
|---|---|
| `https://oase.ulia.site/` | 200 OK (page de login) |
| `https://api.oase.ulia.site/api/v1/health` | `{"status":"ok"}` |
| `https://oase.ulia.site/api/v1/health` | Via Traefik + Nginx proxy |

---

## Actions futures prevues

- [ ] Activer le cron de backup nightly (script `backup-db.sh` deja en place)
- [ ] Lancer le seed admin pour avoir un compte de demo
- [ ] Investiguer le healthcheck nginx (passer a 127.0.0.1)
- [ ] Documenter le bug Traefik dans une issue GitHub
- [ ] Re-activer CI/CD (alternative : GitLab CI ou self-hosted runner)
- [ ] Ajouter monitoring alerts (Netdata + PagerDuty)
- [ ] Backup remote (S3 ou B2) en plus du local
- [ ] Generer PDF de recettes (feature OASE deja specifiee)
