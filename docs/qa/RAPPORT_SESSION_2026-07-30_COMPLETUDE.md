# Rapport de session — Complétude du périmètre OASE (2026-07-30 → 31)

**Périmètre** : « corriger 100% tout ce qui est dans le périmètre » — tout ce qui était statique, mocké, simulé ou avec boutons morts a été rendu réel. Open Data et SI externes exclus (décision utilisateur confirmée).
**Règle appliquée** : chaque correction prouvée en 3 modes — tests Jest / E2E API, Playwright headless, Playwright headed (navigateur visible). Aucune affirmation sans exécution.
**Environnement** : production https://oase.ulia.site (API : https://oase.ulia.site/api/v1).

---

## 1. Livré dans cette session (7 chantiers, tous testés en 3 modes)

| # | Chantier | Avant | Après | Preuves |
|---|---|---|---|---|
| A | Reset / activation mot de passe | formulaires fictifs | Module `password-reset/` : code à 6 chiffres (table `mfa_challenges`), envoi SMTP réel o2switch, anti-énumération ; `ResetPasswordView` + `ActivateView` réécrites | TC-AUTH-03 : email réel lu par IMAP, faux code rejeté ; 10 Jest ; 2/2 headless + headed |
| B1 | Accords de siège (MAE) | vue statique | Module `accords-siege/` CRUD + RBAC ; 5 accords réels (PNUD, UNICEF, Ambassades France/Allemagne, UE) ; vue branchée | 8 Jest ; 3/3 headless + headed |
| B2 | Dashboards DSI / Ministères / CONEDEF | 3 vues statiques | DSI → `/connecteurs/status` + `/health` ; Ministères → `/demandes` + `/conventions` ; CONEDEF → rapports + conventions ; RBAC élargi en cohérence | 4/4 headless + headed |
| B3 | Simulation décideur | `setTimeout` simulé, export mort | calcul instantané réel + export rapport téléchargeable | 2/2 headless + headed |
| C | Rapprochements trésor (DGTCP) | coquille vide | `GET /rapprochements` : rapprochement réel demandes approuvées ↔ attestations ; vue + filtres + détail + relance | 6 Jest ; KPIs prod vérifiés (31/28/3) ; 2/2 headless + headed |
| D | Matrice RBAC admin | matrice locale **jamais persistée** (faux) + onglets fictifs | `GET /admin/rbac/matrice` dérivé des `@Roles` réels des 28 contrôleurs ; `RolesView` réécrite (lecture seule, filtre, export CSV réel) ; fictifs supprimés | prod vérifiée : 104 endpoints, 14 rôles, contribuable 403 ; 3/3 headless + headed |
| D | Dictionnaire O2 | 2 boutons morts | export CSV réel (téléchargement vérifié) ; bouton mort supprimé | couvert par TC-ADMIN-01 |

Vues admin vérifiées **déjà réelles** (aucune correction nécessaire) : règles de blocage, monitoring, gouvernance données, GED, paramètres/INSEED. `FormulairesView` laissée en états vides honnêtes (module prévu vague B, documenté).

## 2. Résultats du run final (30/07, production)

- **Jest backend : 474/474 — 33 suites**
- **E2E headless : 69/69 PASS** (auth, P1→P5, P7, extractif, notifications, rôles secondaires, accords-siège, dashboards, rapprochements, simulation, admin, MFA/reset isolés)
- **E2E headed : 15/15 PASS** (specs nouvelles/modifiées)
- Type-check frontend : 0 erreur · MFA global désactivé après tests
- `p6-opendata` non rejouée : hors périmètre (décision utilisateur)

## 3. Bugs trouvés et corrigés pendant la session

| # | Bug | Gravité | Correctif |
|---|---|---|---|
| #16 | Crash API (502) : cycle d'imports `RbacMatriceService ↔ RbacMatriceController` | bloquant prod | `forwardRef` dans le contrôleur ; détecté par smoke post-déploiement |
| #17 | Slash terminal fantôme (`@Post()` sans argument enregistre `/` chez NestJS) | matrice fausse | normalisation dans le service |
| — | Assertion figée `kpis.total=30` sur données de prod évolutives | fragilité test | assertion de cohérence (≥ 30, somme = total) |
| — | `@click:row` Vuetify non déclenché en test | fragilité test | clic sur le bouton d'action explicite |

## 4. Incident démonstration publique (31/07 ~2h) — 401 au login

**Faits, horodatés dans l'audit de production** :

- `01:59:46` — **un seul** `LOGIN_ECHEC` sur `kossiwa.amele@texlome.tg`, raison `password_incorrect`
- `02:01:43` — `LOGIN_SUCCES` du **même compte** avec `Oase@2026!`
- Retest immédiat des 8 comptes de démo : **8/8 → 200**

**Conclusion factuelle** : aucune panne, aucun verrouillage, aucun mot de passe altéré. Le backend a répondu correctement 401 à une saisie erronée (espace de copier-coller ou faute de frappe). Le même identifiant fonctionnait 2 minutes plus tard.

**Cause aggravante corrigée** : l'email était envoyé tel quel — un copier-coller entouré d'espaces échouait silencieusement. Correctif : **trim de l'email** à la soumission (mot de passe volontairement non trimmé), nouveau test `TC-AUTH-UI-03` (email avec espaces → login réussi) : **3/3 headless + 3/3 headed** contre la prod, déployé et poussé.

**Recommandation avant toute démo** : rejouer `auth-login-ui.spec.ts` contre la prod (~15 s, 3 tests) et ouvrir une session avec un compte vérifié dans la minute.

## 5. Commits

| Repo | Commit | Contenu |
|---|---|---|
| `dossul/oase` (main + branche) | `44eff97` | matrice RBAC réelle + docs v4 |
| `dossul/oase-maquette` (master) | `a88127a` | RolesView réelle + dictionnaire O2 + spec TC-ADMIN-01 |
| `dossul/oase-maquette` (master) | `e2b887a` | fix trim email login + TC-AUTH-UI-03 |
| `dossul/oase` (main + branche) | ce document + BUGS.md | rapport de session + incident démo |

---

*Document rédigé le 2026-07-31 après exécution réelle de tous les tests cités. Chaque ligne est traçable : rapports Playwright, Jest, journal d'audit de production, commits.*
