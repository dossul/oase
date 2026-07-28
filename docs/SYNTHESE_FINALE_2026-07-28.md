# OASE — Synthèse finale de la session (2026-07-28)

> Document de **clôture** — récapitule ce qui a été produit/corrigé/testé/déployé durant la session.
> Pour le détail exhaustif des bugs : `docs/BUGS.md`.
> Pour la recette E2E : `docs/qa/RAPPORT_RECETTE_2026-07-27.md`.
> Pour la méthode de mise à jour VPS : `docs/DEPLOIEMENT_VPS_RUNBOOK.md`.

---

## 1. Verdict global

| Catégorie | Local | Prod (oase.ulia.site) |
|---|---|---|
| **Recette E2E P1→P7 (29 tests)** | ✅ 29/29 (1.7m + 16s P4) | ✅ 29/29 (1.0m + 14s P4) |
| **Suite legacy mockée (30 tests)** | ✅ 30/30 (1.0m) | — |
| **Tests unitaires backend (367 tests)** | ✅ 367/367 (72s, 26 suites) | — |
| **Tests E2E API** | ✅ 36/36 | ✅ 16/16 logins |
| **Builds** | ✅ nest build + vite build + vue-tsc | ✅ bundle servi `index-CKUD8jN2.js` |
| **16/16 comptes seed** | ✅ login OK | ✅ login OK |

**Taux de conformité global : 100 %** sur le périmètre couvert (cœur métier P1→P7).

---

## 2. Ce qui a été livré pendant la session

### A. PDF attestation pro (mon correctif initial)

- **Symptôme** : attestation générée = simple liste de lignes sans en-tête officiel, structure ni blocs structurés.
- **Fix** (`oase-api/src/common/utils/simple-pdf.util.ts`) :
  - Refonte de `buildSimplePdf` avec en-tête République Togolaise, blocs label/valeur alignés, filets de séparation, pied de page avec référence + hash SHA-256 + mention légale.
  - Nouvelle fonction `buildAttestationPdf()` dédiée avec 5 sections (Identification contribuable, Référence demande, Base juridique, Décision, Authentification).
- **Fix** (`oase-api/src/attestations/attestations.service.ts`) :
  - Include Prisma corrigé : `demandes` (singulier, 1:N inverse), `baseJuridiqueVersions.basesJuridiques`, `decisions.utilisateurs`.
  - Récupération du signataire via `decisions.utilisateurs` (prénom + nom + role).
  - TypeScript compile : 0 erreur. PDF généré : 3803 bytes vs 1353 avant.

### B. Programme « 0 mocked data » (3 vagues, par agent coordonné)

**Vague A (frontend)** : démockage de ~30 vues sur endpoints existants ; suppression des urgences prod (fausse attestation DocumentViewer, fausse identité TOGO STEEL pré-remplie, faux KPIs 847,3 Mds/724 Mds, faux hashes TSA, faux logs HTTP connecteurs, date acte en dur). Règle : donnée API, calcul réel, ou état vide honnête + TODO(endpoint).

**Vague B (backend)** : 16 nouveaux endpoints adossés aux tables existantes + 1 migration (006 — module missions) :
- RBAC élargi : `agent_dgtcp` → conventions/rapports/stats ; `agent_ci/cddi` → conventions
- `GET /utilisateurs/annuaire`
- `GET /connecteurs` (+ status, logs)
- `GET+PUT /admin/parametres` (system_config)
- `GET /notifications/templates`
- `GET /registre-central/mesures` (agrégats réels)
- `GET /rapports/opendata` PUBLIC enrichi
- Module missions + migration 006
- `GET /admin/monitoring`
- Délai moyen traitement dans `/dashboards/p4`
- `GET+PUT /referentiels/inseed`
- 367/367 tests unitaires (vs 314 avant, +53 tests ajoutés).

**Vague C (frontend)** : câblage des vues sur les nouveaux endpoints (missions audit, connecteurs SI, registre central, paramètres, monitoring, trésor, opendata anonyme, simulation INSEED).

### C. Bugs critiques corrigés (sélection de la session #8 et #9)

Voir `docs/BUGS.md` pour l'exhaustivité (B1→B18 backend, F1→F10 frontend, #8.1→#8.14 prod, #9 vague mocks).

| # | Bug | Fix |
|---|---|---|
| #8.1 | Taxonomie rôles frontend ≠ backend → boucle de redirection | `useDefaultRoute.ts`, garde `router.ts`, sidebar alignés — 7/7 logins OK |
| #8.3 | **Fuite RLS** : lecture + transition cross-périmètre (200 au lieu de 403) | `demandeMatchesScope()` applique organe/agence/DGBF |
| #8.4 | **Contournement approbation** sans PIN/quota/acte | transition bloquée ; approbation via `decisions/approuver` |
| #8.10 | **Fuite mode démo en build Docker** : switcher persona actif en prod | `.dockerignore` racine + double garde `import.meta.env.DEV && VITE_DEMO_MODE` |
| #8.12 | Boucle 401 au boot en prod (page /login recharge infiniment) | `main.ts` mount après `router.isReady()` ; AppLayout conditionnel authentifié |
| #8.13 | EACCES `/app/uploads` en prod Docker (user non-root) | `Dockerfile` crée + chown ; volumes persistants `oase_uploads_data` / `oase_attestations_data` |
| #8.14 | Audit/DossiersView 100 % mock → vide en prod | câblage `GET /demandes` + `GET /demandes/:id/pieces-jointes` |

---

## 3. Déploiement VPS Hostinger (147.93.85.22)

### Méthode (runbook : `DEPLOIEMENT_VPS_RUNBOOK.md`)

| Étape | Commande | Effet |
|---|---|---|
| Sync backend + docs | `tar czf - --exclude=node_modules ... \| ssh tar xzf - -C /opt/oase` | Code synchro sans toucher au repo local du VPS |
| Sync frontend | `ssh git reset --hard origin/master` dans `/opt/oase/maquette` | Frontend à jour depuis le repo git |
| Build images | `docker build -t oase-api -f deploy/api.Dockerfile .` + idem frontend | Images reconstruites avec le dernier code |
| Redémarrage | `docker compose -f docker-compose.local-prod.yml up -d --force-recreate` | Containers recréés, migrations auto, seeds idempotentes |
| Vérifications V1/V2/V3 | recette Playwright 29/29 + hash bundle + health + 16/16 logins | Validation prod |

### État final prod (2026-07-28)

| Container | Status | Endpoint |
|---|---|---|
| `oase-db` | Up (healthy) | MySQL 8.0, 90 tables |
| `oase-api` | Up (healthy) | `https://api.oase.ulia.site` |
| `oase-web` | Up (healthy) | `https://oase.ulia.site` |

| Image | Taille | Créée |
|---|---|---|
| `oase-api:latest` | 575 MB | 2026-07-28 |
| `oase-frontend:latest` | 54.2 MB | 2026-07-28 |

| Endpoint vague B | Code prod |
|---|---|
| `GET /admin/monitoring` | 200 |
| `GET /admin/parametres` | 200 |
| `GET /utilisateurs/annuaire` | 200 |
| `GET /registre-central/mesures` | 200 |
| `GET /rapports/opendata` (anonyme) | 200 |
| `GET /connecteurs` | 200 |

---

## 4. Périmètre couvert vs hors périmètre

### ✅ Couvert (recette 29/29 PASS)

- Auth + MFA + RBAC 15 rôles + RLS (cross-périmètre bloqué)
- Portail P1 contribuable : dépôt, suivi, attestation PDF, profil
- Backoffice P2 : prise en charge, validation PIN, complément, rejet
- Agences P3 : conventions, instruction périmètre agence
- Décideur P4 : approbation PIN + PDF + notification, quota 422, dashboards
- Audit P5 : anomalies, chaîne d'audit SHA-256, lecture seule
- Admin P7 : utilisateurs, rôles, workflow, monitoring, connecteurs, paramètres
- Notifications, audit chain, multi-devises, profils complétude

### ❌ Volontairement hors périmètre (à planifier)

- **Connecteurs SI externes** : Sydonia, E-TAX, SIGFiP, GUDEF, DAS (mocks en place, attente credentials/API)
- **Open Data (P6)** : portail public en place mais pas de campagne de tests dédiée
- **Import MRD** : 1 316 mesures à charger (script d'import prêt, pas exécuté)
- **Rapports IA** : génération rapports LLM
- **Mobile** : responsive mobile à valider sur 41 vues

---

## 5. Reste à faire (optionnel)

| # | Item | Effort | Priorité |
|---|---|---|---|
| 1 | Mutex DB chaîne d'audit (GET_LOCK MySQL) si multi-instances | 0.5j | 🟠 |
| 2 | `PUT/PATCH /workflow/templates` (éditeur admin BPM en lecture seule actuellement) | 0.5j | 🟡 |
| 3 | Fix vues SQL `v_demandes_en_instruction` / `v_alertes_quotas` (cassées mais inutilisées) | 0.5j | 🟡 |
| 4 | Migration 002 appliquée en prod + retrait `normalizeRole()` (code défensif actuel) | 0.5j | 🟡 |
| 5 | Pen-test OWASP manuel (auth/RLS/upload) | 1j | 🟠 |
| 6 | Responsive mobile sur 41 vues | 1-2j | 🟡 |
| 7 | Documentation livraison / guide utilisateur | 0.5j | 🟢 |
| 8 | Formation P7 (admin SI) | 0.5j | 🟢 |

**Effet total restant : 4–6 jours-homme** pour atteindre 100 % production + hardening.

---

## 6. Commandes de recette (à rejouer à tout moment)

### Local

```bash
# Backend local sur :3001, frontend test sur :5174
cd /opt/oase/maquette
TEST_BASE_URL=http://localhost:5174 npx playwright test e2e/recette/p1-depot.spec.ts \
  e2e/recette/p1-suivi.spec.ts \
  e2e/recette/p2-instruction.spec.ts \
  e2e/recette/p3-agences.spec.ts \
  e2e/recette/p5-audit.spec.ts \
  e2e/recette/p7-administration.spec.ts \
  e2e/recette/p7-permissions.spec.ts
# P4 séquentiel (fixtures partagées) :
TEST_BASE_URL=http://localhost:5174 npx playwright test e2e/recette/p4-decideur.spec.ts
# Unitaires backend :
cd /opt/oase/oase-api && npx jest
```

### Prod

```bash
cd /opt/oase/maquette
TEST_BASE_URL=https://oase.ulia.site \
TEST_API_URL=https://api.oase.ulia.site/api/v1 \
  npx playwright test e2e/recette  # puis p4-decideur.spec.ts isolément
```

---

## 7. Crédits

Travail accompli par **deux agents en parallèle** sur le VPS Hostinger + Windows local :
- Agent principal (moi) : PDF attestation pro, exploration, investigations, vérifications finales
- Agent swarm : sync VPS, build Docker, déploiement, vague A/B/C mocks, recette prod, runbook

**Date de clôture : 2026-07-28**
**État : PROD READY sur le cœur métier, hors connecteurs SI et Open Data**.
