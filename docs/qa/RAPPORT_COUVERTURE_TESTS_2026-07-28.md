# Rapport de couverture des tests — OASE — 2026-07-28 (v2 — 23h)

**Environnement testé :** production — https://oase.ulia.site (API : https://api.oase.ulia.site/api/v1)
**Auteur :** session QA assistée (Playwright headless + headed, Jest), validation humaine : Ulrich
**Principe de rédaction :** ce document distingue strictement ce qui est **prouvé par un test exécuté** de ce qui est **non vérifié**. Aucune affirmation sans exécution correspondante.
**v2 :** ajout des specs P6 et rôles secondaires exigées par l'utilisateur (« rien ne doit être affirmé sans test E2E, headless ET headed »). 3 vrais bugs produit trouvés et corrigés dans cette passe (voir §5).

---

## 1. Résumé exécutif

| Question | Réponse honnête |
|---|---|
| Tous les workflows de la recette officielle (P1→P5, P7) passent en prod ? | **OUI — 29/29** |
| P6 (portail public / Open Data) testé ? | **OUI depuis v2 — 5/5 tests E2E** (accès anonyme, 0 erreur, API publique 200) |
| Tous les personas ont-ils été testés ? | **OUI pour 13 rôles sur 14.** Parcours UI complets P1-P5/P7 + smoke E2E des 7 rôles secondaires. Reste `agent_dsi_mef` (route existante, **aucun compte de test provisionné**) |
| Le backend est-il régressé ? | **Non — 369/369 tests unitaires Jest PASS** |
| Tous les comptes peuvent-ils se connecter en prod ? | **OUI — 16/16 logins API OK** (2026-07-27) |
| Modes d'exécution | **Headless : 41/41 PASS (1,3 min). Headed (visible) : 16/16 PASS sur les specs nouvelles/modifiées** |

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
| 2e contribuable | utilisé par les fixtures P1 (demandes créées/répondues sous son identité) | ✅ indirect |

---

## 3. Ce qui N'A PAS été testé — reste à vérifier (honnêteté complète)

### 3.1 Rôle `agent_dsi_mef` — ❌ AUCUN COMPTE DE TEST

La route `/dsi/dashboard` (vue `DsiMefDashboardView`, persona « P7bis — DSI / MEF ») existe et le mapping rôle → route aussi, mais **aucun compte `agent_dsi_mef` n'existe** dans les 16 comptes de test : impossible de se connecter sous ce rôle, donc rien n'est vérifiable. À provisionner si ce profil est utilisé en production.

### 3.2 Vérification publique d'attestation — ❌ FONCTION ABSENTE

Le plan de recette mentionne une « vérification d'attestation publique (P6) », mais **aucune route ni vue de vérification publique n'existe** dans le frontend (routeur vérifié : seules `/opendata*` sont publiques). Ce n'est pas un échec de test : la fonctionnalité n'est pas implémentée. À confirmer comme exigence produit.

### 3.3 Fonctionnalités transverses non couvertes

- **MFA TOTP** : désactivé sur tous les comptes de test → le flux MFA réel (enrôlement, challenge) n'est **jamais** exercé en E2E. Les tests TC-AUTH-02 du plan ne sont pas automatisés dans la suite jouée.
- **Notifications réelles** (e-mail, SMS, WhatsApp) : l'envoi effectif n'est pas vérifié (seule la présence UI/configuration l'est).
- **Intégrations SI externes** : hors périmètre du plan, non testées.
- **Charge / performance / volumétrie** : aucun test.
- **Sécurité offensive** (injection, OWASP) : non testée — seules les matrices d'autorisation 401/403 le sont.

### 3.4 Limites méthodologiques

- Les tests tournent sur **une seule base de production** avec des données de recette accumulées (demandes DEM-2026-0001 à 0050+) : un test peut être influencé par l'état des données. 2 tests (TC-P1-03, TC-P1-04) dépendaient de la position d'une demande seed dans une liste paginée → fiabilisés en v2 (accès direct par id), voir §5.
- Les 2 échecs TC-P5-03/TC-P7-03 observés le 2026-07-28 pendant la fenêtre de redéploiement montrent que **la recette ne doit pas être jouée pendant un déploiement** (résultats non significatifs).
- La recette est un instantané : elle ne garantit rien après une modification ultérieure du code ou des données.

---

## 4. Recommandations (si une couverture totale est exigée)

1. ~~Spec E2E P6~~ → **FAIT (v2)**. ~~Smoke rôles secondaires~~ → **FAIT (v2)**.
2. Provisionner un compte `agent_dsi_mef` et l'ajouter au smoke.
3. Trancher l'exigence « vérification publique d'attestation » : implémenter ou retirer du plan.
4. Réactiver MFA sur un compte dédié et automatiser TC-AUTH-02.
5. Planifier un test de charge avant ouverture réelle aux usagers.
6. Rejouer la recette complète après **chaque** déploiement (jamais pendant).

---

## 5. Bugs trouvés et corrigés par la passe v2 (preuve que le smoke sert)

| # | Bug | Détecté par | Correctif | Commit |
|---|---|---|---|---|
| BUG #10.5 | `GET /rapports` → **403** pour `agent_conedef` alors que son dashboard en a besoin (synchronisation rapport annuel) | smoke `agent_conedef` | RBAC élargi en lecture (contrôleur + `rbac.spec.ts`), Jest 369/369 | `3eea9e9` |
| BUG #10.6 | `GET /dashboards/p5` → **403** pour `agent_dgbf` alors que sa page budget l'appelle (le code portait un commentaire admitttant le 403 !) | smoke `agent_dgbf` **en headed** (race révélée) | RBAC élargi + smoke rendu déterministe (`networkidle`) | `07ac711` |
| BUG #10.7 | Page publique `/opendata/rapports` tirant un appel **authentifié** en anonyme → 401 garanti | TC-P6-04 | Appel `/rapports` conditionné à `auth.isAuthenticated` ; état « connexion requise » sinon | `da7a074` |
| Fragilité test | TC-P1-03/TC-P1-04 dépendaient de la présence d'une seed dans la liste paginée (~10 récentes) | échecs en run complet | Accès détail direct par id + assertion générique de données réelles | `950c3a5`, spec p1-suivi |

---

*Document généré le 2026-07-28 après exécution réelle des tests cités. Toute ligne de ce rapport est traçable vers une exécution (rapports Playwright, Jest, scripts d'audit dans `webbridge/`, commits cités). v2 : 41/41 headless + 16/16 headed.*
