# Rapport de couverture des tests — OASE — 2026-07-28/29 (v3 — 1h)

**Environnement testé :** production — https://oase.ulia.site (API : https://api.oase.ulia.site/api/v1)
**Auteur :** session QA assistée (Playwright headless + headed, Jest), validation humaine : Ulrich
**Principe de rédaction :** ce document distingue strictement ce qui est **prouvé par un test exécuté** de ce qui est **non vérifié**. Aucune affirmation sans exécution correspondante.
**v2 :** ajout des specs P6 et rôles secondaires exigées par l'utilisateur (« rien ne doit être affirmé sans test E2E, headless ET headed »). 3 vrais bugs produit trouvés et corrigés dans cette passe (voir §5).
**v3 :** MFA réel (TOTP testé E2E, email bloqué par credentials SMTP/IMAP invalides), notifications in-app réelles, rôle `agent_dsi_mef` provisionné et testé, Open Data/SI externes confirmés **volontairement hors scope** par l'utilisateur. 3 nouveaux bugs trouvés et corrigés (BUG #11 à #13, §5).

---

## 1. Résumé exécutif

| Question | Réponse honnête |
|---|---|
| Tous les workflows de la recette officielle (P1→P5, P7) passent en prod ? | **OUI — 29/29** |
| P6 (portail public / Open Data) testé ? | **OUI depuis v2 — 5/5 tests E2E** (accès anonyme, 0 erreur, API publique 200). Le volet « intégrations Open Data / SI externes » est **volontairement abandonné à cette étape** (décision utilisateur du 28/07) |
| Tous les personas ont-ils été testés ? | **OUI — 14/14 rôles depuis v3.** Parcours UI complets P1-P5/P7 + smoke E2E des 8 rôles secondaires dont `agent_dsi_mef` (compte provisionné en v3). ⚠️ La vue DSI est statique (aucun appel API) : le test prouve le rendu sans erreur, pas des données réelles |
| Le backend est-il régressé ? | **Non — 369/369 tests unitaires Jest PASS** |
| Tous les comptes peuvent-ils se connecter en prod ? | **OUI — 16/16 logins API OK** (2026-07-27) |
| MFA testé ? | **TOTP : OUI — API + UI, headless + headed (v3).** Email : backend SMTP réel livré et déployé, **E2E bloqué — credentials `no_reply@il7.info` refusés par o2switch** (vérifié IMAP 993 + SMTP 465, voir §3.3) |
| Notifications testées ? | **Canal in-app : OUI (v3)** — liste, compteur = base, marquage lu, isolation inter-utilisateurs, UI. Email de notification : log `[MOCK EMAIL]` assumé (seul le MFA utilise le SMTP) |
| Modes d'exécution | **Headless : 44/44 PASS (~1 min). Headed (visible) : 15/15 PASS sur les specs nouvelles/modifiées v3** (7 auth-mfa/notifications/p5 + 8 rôles secondaires) |

---

## 2. Ce qui A ÉTÉ testé (preuves datées)

### 2.1 Recette E2E en production — 29/29 PASS (2026-07-28)

Commande : `TEST_BASE_URL=https://oase.ulia.site TEST_API_URL=https://api.oase.ulia.site/api/v1 node node_modules/@playwright/test/cli.js test e2e/recette/`

| Persona | Rôle utilisé | Tests | Couverture |
|---|---|---|---|
| **P1** Contribuable | `kossiwa.amele@texlome.tg` | TC-P1-01 à TC-P1-06 | Dépôt demande, garde-fous soumission, suivi + stepper workflow, réponse complément, attestation PDF, profil entreprise |
| **P2** Agent instructeur | `fatima.ouattara@otr.tg` (agent_ci) | TC-P2-01 à TC-P2-05 | File d'attente, instruction + PIN, demande de complément, rejet motivé, filtrage RLS (agent_ci vs agent_dgbf) |
| **P3** Agence de promotion | `komlan.kodjo@api.tg` | TC-P3-01, TC-P3-02 | Dashboard agence, instruction dans périmètre, refus 403 hors périmètre |
| **P4** Décideur | `amevi.koffi@mef.tg` | TC-P4-01 à TC-P4-03 | Approbation finale PIN + attestation + notification, blocage quota 422, dashboards |
| **P5** Auditeur | `paul.adjovi@igf.tg` | TC-P5-01 à TC-P5-03 | Dashboard anomalies, journal d'audit chaîne SHA-256, consultation dossier lecture seule |
| **P7** Admin système | `kossi.sewavi@dgtcp.tg` | TC-P7-01 à TC-P7-04 + TC-P7-PERM-01 à 04 | Création/désactivation utilisateur, protection DERNIER_ADMIN (409), reset MFA/PIN, config workflows, matrice 401/403 et routes interdites |

Détail dans `docs/qa/RAPPORT_RECETTE_2026-07-28.md`. p4-decideur rejoué isolément (fixtures partagées, per runbook).

### 2.2 Tests unitaires backend — 369/369 PASS (2026-07-28)

Inclut les 2 nouveaux tests du démarrage auto de workflow à la soumission (commit `1a8c26d`).

### 2.3 Audit console/réseau du parcours P1 — 0 erreur réelle (2026-07-28)

Navigation Playwright pilotée en navigateur visible (demande utilisateur) : tous les écrans P1, formulaires et flows parcourus, consoles récupérées. Résultat : **0 erreur réelle**, 2 × 401 attendus (tentative de login KO volontaire du scénario). Rapport : `webbridge/audit-p1-2026-07-28T19-57-16.md`.

### 2.4 Vérifications API ciblées en prod (2026-07-28)

- `GET /workflow/demandes/:id/etapes` → **200** (correction du 404 initial ; preuve en conditions réelles sur `DEM-2026-00050` créée par la recette)
- Export `GET /demandes/export/mes-demandes` : **XLSX 200 valide** (19 lignes), **CSV 200 avec BOM Excel**
- Favicon OASE servi

### 2.5 Vérifications antérieures toujours valables (2026-07-27, sessions BUG #8/#9)

- **16/16 comptes** (tous rôles canoniques) : login API prod OK 200
- **7/7 personas** : login UI en ligne + redirection correcte
- Endpoint Open Data public testé en accès anonyme (200) — **smoke test API uniquement**
- Chaîne d'audit : `breaks: []`

### 2.6 P6 — Portail public / Open Data — 5/5 E2E (v2, 2026-07-28 ~23h)

Spec `e2e/recette/p6-opendata.spec.ts`, exécutée **headless ET headed** contre la prod, **sans authentification** :
- TC-P6-01 : accueil `/opendata` accessible anonymement, KPIs réels (« Mesures publiées », « Montant total accordé »), pas de redirection /login
- TC-P6-02 : tableaux de bord publics
- TC-P6-03 : jeux de données + extrait réel du 1er enregistrement API affiché
- TC-P6-04 : bibliothèque des rapports (état « connexion requise » honnête en anonyme — voir BUG #10.7)
- TC-P6-05 : `GET /rapports/opendata` → **200 sans token**, payload non vide
- Critère transversal : **0 erreur console, 0 réponse API ≥ 400** sur chaque page publique

### 2.7 Rôles secondaires — smoke E2E 7/7 (v2, 2026-07-28 ~23h)

Spec `e2e/recette/roles-secondaires.spec.ts`, **headless ET headed**. Pour chaque rôle : session réelle → route par défaut vérifiée → écrans métier principaux → **0 erreur console, 0 réponse API ≥ 400** (un 403 sur un écran autorisé = bug, pas tolérance) :

| Rôle | Écrans vérifiés | Résultat |
|---|---|---|
| `agent_cddi` | /backoffice/dashboard, /backoffice/dossiers, /backoffice/workflow-cddi | ✅ |
| `agent_dgbf` | /backoffice/dashboard, /backoffice/budget | ✅ (après BUG #10.6) |
| `agent_dgtcp` | /tresor/dashboard, /tresor/rapprochements, /tresor/archives | ✅ |
| `agent_mae` | /mae/accords-siege | ✅ |
| `agent_dgmg` | /extractif/dashboard | ✅ |
| `agent_ministere` | /ministeres/dashboard | ✅ |
| `agent_conedef` | /conedef/dashboard | ✅ (après BUG #10.5) |
| `agent_dsi_mef` | /dsi/dashboard | ✅ (v3 — compte provisionné ; vue statique sans appel API, voir §3.1) |
| 2e contribuable | utilisé par les fixtures P1 (demandes créées/répondues sous son identité) | ✅ indirect |

### 2.8 MFA réel — TOTP testé E2E (v3, 2026-07-29 ~0h30)

Specs `e2e/recette/auth-mfa.spec.ts` (TOTP) et `auth-mfa-email.spec.ts` (email), exécution **isolée obligatoire** (`--workers=1`) car elles togglent la config MFA globale, avec remise à zéro garantie en `afterEach`. Compte dédié `no_reply@il7.info` (contribuable de test).

- **API TOTP** : `login → mfa_required + mfa_token (pas d'access_token)` → faux code **401** → vrai code (généré RFC 6238 côté test) **200 + paire de tokens utilisable immédiatement** (`/utilisateurs/me` 200)
- **UI TOTP** : formulaire login → redirection `/mfa` → saisie dans le v-otp-input → dashboard du rôle, 0 erreur console — **headless ET headed** (après BUG #11 et #12)
- **Email** : backend nodemailer branché sur SMTP o2switch réel (plus de placeholder log) — **E2E bloqué, voir §3.3**
- **Post-tests** : MFA global **désactivé** (`GET /admin/mfa/config → enabled:false` vérifié par API) ; réactivation prévue depuis Admin → Paramètres (toggle livré, non encore couvert par un test E2E dédié — §3.3)

### 2.9 Notifications in-app réelles (v3, 2026-07-29 ~1h)

Spec `e2e/recette/notifications.spec.ts`, **headless ET headed**, compte p1b (`amouzou.kossi@togo-farms.tg`, 24 notifications réelles en base au moment du test) :

- `GET /notifications` → liste non vide, **cohérente avec la base**
- `GET /notifications/unread-count` → **exactement** le nombre de non lues (`estLue=false`)
- `PATCH /notifications/:id/lue` → compteur décrémenté **d'exactement 1**
- **Isolation inter-utilisateurs** : p1 ne peut pas marquer une notification de p1b → **404 uniforme** (après BUG #13)
- UI `/notifications` : liste réelle affichée (pas l'état vide), 0 erreur JS, 0 API ≥ 400

---

## 3. Ce qui N'A PAS été testé — reste à vérifier (honnêteté complète)

### 3.1 Rôle `agent_dsi_mef` — ✅ TESTÉ EN v3 (avec limite)

Compte provisionné (`agent.dsi.mef@oase.tg`), rôle inséré en base + enum backend, RBAC notifications ouvert, smoke E2E `/dsi/dashboard` PASS headless et headed. **Limite honnête : la vue `DsiMefDashboardView` est statique (aucun appel API)** — le smoke prouve le rendu sans erreur console, pas l'affichage de données réelles. Si ce dashboard doit consommer des endpoints, ils restent à développer puis à tester.

### 3.2 Vérification publique d'attestation — ❌ FONCTION ABSENTE

Le plan de recette mentionne une « vérification d'attestation publique (P6) », mais **aucune route ni vue de vérification publique n'existe** dans le frontend (routeur vérifié : seules `/opendata*` sont publiques). Ce n'est pas un échec de test : la fonctionnalité n'est pas implémentée. À confirmer comme exigence produit.

### 3.3 Fonctionnalités transverses non couvertes

- **MFA email — E2E bloqué (credentials invalides)** : le backend SMTP réel (nodemailer, `kilo.o2switch.net:465`) est livré et déployé, la spec `auth-mfa-email.spec.ts` est écrite (lecture IMAP réelle de la boîte), MAIS les credentials fournis pour `no_reply@il7.info` sont **refusés par le serveur o2switch** — `[AUTHENTICATIONFAILED]` Dovecot en IMAP (993) et `535 Incorrect authentication data` Exim en SMTP (465), reproduit via imapflow ET via curl indépendamment (2 outils, 2 protocoles). Le mot de passe doit être vérifié/réinitialisé dans le cPanel o2switch, puis la spec rejouée (elle passera sans modification si les credentials sont valides). **Tant que ce test n'a pas tourné, le MFA email n'est PAS affirmé fonctionnel.**
- **Toggle MFA dans Admin → Paramètres** : livré (`updateMfaConfig` + UI switch/select) mais pas couvert par un test E2E dédié — vérifié indirectement par les specs MFA qui pilotent `PATCH /admin/mfa/config` en API (200).
- **Notifications email** : log `[MOCK EMAIL]` assumé à ce stade (seul le MFA email utilise le SMTP). SMS/WhatsApp : non implémentés (config `whatsappEnabled:false`).
- **Intégrations Open Data / SI externes** : **volontairement abandonnées à cette étape du projet** (décision utilisateur 28/07) — hors scope assumé, pas un oubli.
- **Charge / performance / volumétrie** : aucun test.
- **Sécurité offensive** (injection, OWASP) : non testée — seules les matrices d'autorisation 401/403 le sont.

### 3.4 Limites méthodologiques

- Les tests tournent sur **une seule base de production** avec des données de recette accumulées (demandes DEM-2026-0001 à 0050+) : un test peut être influencé par l'état des données. 2 tests (TC-P1-03, TC-P1-04) dépendaient de la position d'une demande seed dans une liste paginée → fiabilisés en v2 (accès direct par id), voir §5.
- Les 2 échecs TC-P5-03/TC-P7-03 observés le 2026-07-28 pendant la fenêtre de redéploiement montrent que **la recette ne doit pas être jouée pendant un déploiement** (résultats non significatifs).
- La recette est un instantané : elle ne garantit rien après une modification ultérieure du code ou des données.

---

## 4. Recommandations (si une couverture totale est exigée)

1. ~~Spec E2E P6~~ → **FAIT (v2)**. ~~Smoke rôles secondaires~~ → **FAIT (v2)**.
2. ~~Provisionner un compte `agent_dsi_mef`~~ → **FAIT (v3)**. Reste : brancher la vue DSI sur de vrais endpoints si le métier l'exige.
3. Trancher l'exigence « vérification publique d'attestation » : implémenter ou retirer du plan.
4. ~~Réactiver MFA sur un compte dédié et automatiser TC-AUTH-02~~ → **FAIT pour TOTP (v3)**. Reste : **fournir des credentials o2switch valides pour `no_reply@il7.info`** et rejouer `auth-mfa-email.spec.ts`.
5. Ajouter un test E2E du toggle MFA dans Admin → Paramètres (actuellement couvert en API seulement).
6. Planifier un test de charge avant ouverture réelle aux usagers.
7. Rejouer la recette complète après **chaque** déploiement (jamais pendant). Commande :
   - run principal : `test e2e/recette/` **en excluant** `auth-mfa.spec.ts` et `auth-mfa-email.spec.ts`
   - specs MFA : à rejouer **isolément** `--workers=1` (elles togglent la config MFA globale)

---

## 5. Bugs trouvés et corrigés par les passes v2/v3 (preuve que le smoke sert)

| # | Bug | Détecté par | Correctif | Commit |
|---|---|---|---|---|
| BUG #10.5 | `GET /rapports` → **403** pour `agent_conedef` alors que son dashboard en a besoin (synchronisation rapport annuel) | smoke `agent_conedef` | RBAC élargi en lecture (contrôleur + `rbac.spec.ts`), Jest 369/369 | `3eea9e9` |
| BUG #10.6 | `GET /dashboards/p5` → **403** pour `agent_dgbf` alors que sa page budget l'appelle (le code portait un commentaire admitttant le 403 !) | smoke `agent_dgbf` **en headed** (race révélée) | RBAC élargi + smoke rendu déterministe (`networkidle`) | `07ac711` |
| BUG #10.7 | Page publique `/opendata/rapports` tirant un appel **authentifié** en anonyme → 401 garanti | TC-P6-04 | Appel `/rapports` conditionné à `auth.isAuthenticated` ; état « connexion requise » sinon | `da7a074` |
| Fragilité test | TC-P1-03/TC-P1-04 dépendaient de la présence d'une seed dans la liste paginée (~10 récentes) | échecs en run complet | Accès détail direct par id + assertion générique de données réelles | `950c3a5`, spec p1-suivi |
| BUG #11 | Flux MFA UI cassé : LoginView testait `res.user` (absent de la réponse MFA) → faux « identifiants incorrects » ; MfaView était un mock sans appel API | première exécution réelle de `auth-mfa.spec.ts` | LoginView stocke `oase_mfa_token` + route `/mfa` ; MfaView appelle `POST /auth/mfa/verify` | maquette `8c13ab7` |
| BUG #12 | Route `/mfa` non publique → le garde rebouclait vers `/login` (pas de session avant vérification) | TC-AUTH-02 UI | `'mfa'` ajouté aux `publicRoutes` | maquette `4115b65` |
| BUG #13 | `PATCH /notifications/:id/lue` sur la notification d'un AUTRE utilisateur → `200 + null` (fuite d'existence ; isolation base déjà correcte) | `notifications.spec.ts` (isolation) | `NotFoundException` uniforme quand le service renvoie null | `843097c` |
| Fragilité test | TC-P5-03 cliquait la ligne placeholder « Loading items… » (première ligne du tbody pendant le chargement) | échec flaky en run complet | Attente d'une vraie ligne `hasText: 'DEM-'` | maquette `8b1199d` |
| Fausse hypothèse test | `notifications.spec.ts` supposait que p1 avait des notifications — en base seul p1b en avait (24) | échec au 1er run réel | Spec basculée sur p1b + isolation croisée inversée | maquette `8b1199d` |

---

*Document généré le 2026-07-28, mis à jour le 2026-07-29 ~1h après exécution réelle des tests cités. Toute ligne de ce rapport est traçable vers une exécution (rapports Playwright, Jest, commits cités). v2 : 41/41 headless + 16/16 headed. v3 : 44/44 headless + 15/15 headed + Jest 369/369 ; MFA TOTP prouvé, MFA email bloqué par credentials o2switch invalides (non affirmé tant que non testé).*
