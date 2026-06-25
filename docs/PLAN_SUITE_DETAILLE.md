# OASE — Plan Détaillé de la Suite (Phase de Réalisation)

> **Date :** 17 juin 2026  
> **Auteur :** Pair-programming OASE  
> **Pré-requis atteints :** Documentation complète (OASE-2→53), MLD v3.3 audité (85 tables, 92/100), seeds démo, contrats API (51 endpoints), 41 écrans spécifiés.  
> **Objet :** Feuille de route opérationnelle pour passer de la **conception** à un **produit fonctionnel déployé**.

---

## 0. État des lieux (point de départ)

| Domaine | État | Détail |
|---------|------|--------|
| **Documentation backend** | ✅ Complète | 13 docs + audits (`AUDIT_MLD_V3_EXPERT.md`, `AUDIT_DOC_ANALYSE.md`) |
| **Base de données** | ✅ Livrée v3.3 | 85 tables MySQL, 124 FK, SCD2, audit inaltérable, 15 rôles canoniques |
| **Schéma Prisma** | ⚠️ **Désynchronisé** | `schema.prisma` = **19 tables** vs MLD réel = **85 tables** |
| **Implémentations référentielles** | 🟡 Partielles | `impl/` : Auth, Audit, Connecteurs (stubs) uniquement |
| **Projet NestJS réel** | ❌ Absent | Aucun `nest new` exécuté, pas de `package.json` racine |
| **Frontend Vue 3** | ❌ Absent | 41 écrans spécifiés mais 0 composant codé |
| **Tests E2E** | 🟡 Spécifiés | Stratégie Playwright écrite, 0 test exécutable |

> **🔴 Verrou n°1 :** Réconcilier `schema.prisma` avec le MLD v3.3 **avant** toute implémentation de module.

---

## PHASE A — Réconciliation Modèle de Données (S0, 3–4 jours)

**Objectif :** Une seule source de vérité entre MySQL (`oase`) et Prisma.

| # | Tâche | Livrable | Effort | Dépendance |
|---|-------|----------|--------|------------|
| A.1 | Introspection Prisma sur la base `oase` v3.3 (`prisma db pull`) | `schema.prisma` (85 modèles) | 0.5j | DB v3.3 |
| A.2 | Nettoyage : nommage PascalCase, relations, `@map` vers snake_case | `schema.prisma` propre | 1j | A.1 |
| A.3 | Mapper les 38 tables `ref_*` en modèles + enums TypeScript dérivés | `src/common/enums/` | 1j | A.2 |
| A.4 | Générer le client Prisma + types (`prisma generate`) | `@prisma/client` typé | 0.25j | A.2 |
| A.5 | Baseline migration (`migrate diff` → `001_init_v33`) | `prisma/migrations/` | 0.5j | A.4 |
| A.6 | Régénérer `seed-demo.ts` aligné sur 85 tables + 15 rôles | `prisma/seed.ts` | 1j | A.4 |

**Critère de sortie :** `prisma migrate reset && prisma db seed` recrée la base v3.3 à l'identique, `prisma generate` sans erreur.

---

## PHASE B — Scaffolding NestJS (S1, 3 jours)

**Objectif :** Squelette d'application exécutable, CI verte.

| # | Tâche | Livrable | Effort |
|---|-------|----------|--------|
| B.1 | `nest new oase-api` (monorepo, pnpm) + config ESLint/Prettier | Projet bootable | 0.5j |
| B.2 | `PrismaModule` global (`prisma.service.ts` + hooks shutdown) | Module DB injectable | 0.5j |
| B.3 | Config typée (`@nestjs/config` + validation Joi/Zod) + `.env.example` | Config sécurisée | 0.5j |
| B.4 | Migration des `impl/` existants (Auth, Audit, Connecteurs) | Modules intégrés | 1j |
| B.5 | Swagger (`/api/docs`) + filtre d'exception global + logger Pino | Observabilité base | 0.5j |
| B.6 | CI GitHub Actions (lint + build + test + prisma validate) | Pipeline vert | 0.5j |

**Critère de sortie :** `pnpm start:dev` démarre, `/api/docs` accessible, `/health` répond 200.

---

## PHASE C — Cœur Métier (S2–S5, ~4 semaines)

> Reprend **Milestone 2** du `12_PLAN_LIVRAISON_MVP.md`, recadré sur le MLD v3.3.

### Sprint C1 — Identité & Accès (S2)
| # | Tâche | Effort |
|---|-------|--------|
| C1.1 | Finaliser `AuthModule` (JWT access/refresh, MFA TOTP, PIN) sur tables réelles | 2j |
| C1.2 | `RbacGuard` + `@Roles()` sur les **15 rôles** `ref_roles` | 1j |
| C1.3 | `ScopeGuard` (RLS applicatif : RLS-01→10 de `05_RBAC_PERMISSIONS.md`) | 2j |
| C1.4 | `UtilisateursModule` (CRUD, reset MFA/PIN — P7) | 1j |

### Sprint C2 — Demandes & GED (S3)
| # | Tâche | Effort |
|---|-------|--------|
| C2.1 | `BeneficiairesModule` (profil, statut fiscal via mock E-TAX) | 2j |
| C2.2 | `DemandesModule` (CRUD + machine d'état 8 statuts de `04`) | 3j |
| C2.3 | `StorageModule` (upload S3/MinIO, MIME + SHA-256, rangs 1/2) | 2j |

### Sprint C3 — Workflow & Décision (S4)
| # | Tâche | Effort |
|---|-------|--------|
| C3.1 | `WorkflowModule` (templates, instances, étapes, transitions) | 3j |
| C3.2 | Moteur de règles de blocage `bloc-01→05` (dette, anomalie, quota, expiration, pièces) | 2j |
| C3.3 | `DecisionsModule` + `ActesModule` (PIN, signature) | 2j |

### Sprint C4 — Sortie & Notifications (S5)
| # | Tâche | Effort |
|---|-------|--------|
| C4.1 | `AttestationsModule` (PDF + QR Code + hash, vérif publique) | 2j |
| C4.2 | `NotificationsModule` (in-app + email, queue) | 2j |
| C4.3 | Tests E2E parcours P1→P4 complet (Playwright) | 2j |

**Critère de sortie Phase C :** P1 dépose → P2 instruit → P4 approuve → attestation PDF + QR vérifiable. `audit_logs.verifyChain()` = 0 rupture.

---

## PHASE D — Backoffice & Référentiels (S6–S8, ~3 semaines)

> Reprend **Milestone 3**.

| # | Module | Tâche clé | Effort |
|---|--------|-----------|--------|
| D.1 | `BasesJuridiquesModule` | Import MRD CSV/JSON + SCD T2 (garde version active) | 2j |
| D.2 | `QuotasModule` | Alertes 80% / blocage 100% + `quota_mouvements` | 2j |
| D.3 | `AnomaliesModule` | Détection (moteur règles) + workflow traitement | 2j |
| D.4 | `ConventionsModule` | Accord siège / ZF / Code Inv. / Minier + alertes J-30 | 2j |
| D.5 | `DashboardsModule` | KPIs P4/P5, stats par statut/impôt/secteur | 2j |
| D.6 | `RapportsModule` | Exports PDF/Excel + publications Open Data | 2j |
| D.7 | `JobsModule` | CRON (échéances J-30/J-7/J0, heartbeat SI, archivage) | 2j |
| D.8 | Tests E2E backoffice (P2/P4/P5/P7) | Playwright | 2j |

**Critère de sortie :** Tableaux de bord avec données réelles, import MRD 1 316 mesures < 60s.

---

## PHASE E — Frontend Vue 3 (S6–S10, en parallèle de D, ~5 semaines)

**Objectif :** Les 41 écrans de `frontend/01_INVENTAIRE_ECRANS.md` fonctionnels.

| # | Lot | Écrans | Effort |
|---|-----|--------|--------|
| E.1 | Socle (Vite + Vue 3 + Pinia + Vue Router + design system) | Layout, thème, garde RBAC | 3j |
| E.2 | Auth (A-01→A-03) | Login, MFA, reset | 2j |
| E.3 | Portail bénéficiaire P1 (B-01→B-07) | Dépôt 3 étapes, suivi, profil | 5j |
| E.4 | Back-office P2 (C-01→C-09) | File, instruction, décision, audit | 6j |
| E.5 | Agences P3 + Décideurs P4 (D + E) | Dashboards, rapports | 4j |
| E.6 | Contrôle P5 + Open Data P6 (F + G) | Audit lecture, portail public | 3j |
| E.7 | Admin P7 (H-01→H-06) | Users, workflows, connecteurs, import, logs | 4j |
| E.8 | Intégration API + états (loading/erreur/vide) | Client typé, intercepteurs | 3j |

**Critère de sortie :** 0 erreur console, responsive, cohérence visuelle (`03_COHERENCE_VISUELLE.md`).

---

## PHASE F — Intégrations SI Réelles (S9–S10, ~2 semaines)

> Reprend **Milestone 4**.

| # | Connecteur | Tâche | Effort |
|---|-----------|-------|--------|
| F.1 | Sydonia | OAuth2, endpoint réel, circuit breaker | 3j |
| F.2 | E-TAX | API Key, vérif statut fiscal réel | 2j |
| F.3 | SIGFiP | SOAP/REST visa budgétaire | 3j |
| F.4 | GUDEF | REST rapprochement comptable | 2j |
| F.5 | Import MRD 2024 réel (1 316 mesures) | 1j |
| F.6 | Tests d'intégration staging | 2j |

**Critère de sortie :** vérification statut fiscal réel OTR + visa SIGFiP réel sur une demande test.

---

## PHASE G — Qualité, Sécurité & Déploiement (S11–S12, ~2 semaines)

> Reprend **Milestone 5**.

| # | Tâche | Livrable | Effort |
|---|-------|----------|--------|
| G.1 | Suite E2E complète (OASE-43→51) | 53 specs Playwright vertes | 3j |
| G.2 | Pen-test (auth, RLS, upload, OWASP Top 10) | Rapport sécurité | 2j |
| G.3 | Durcissement DB prod (partitionnement logs, backups, `get_advisors`) | Checklist sécurité | 1j |
| G.4 | VM Ubuntu 22.04 + Nginx + SSL A+ + PM2 cluster | Infra prod | 2j |
| G.5 | Migration données initiales (MRD, conventions, users) | DB prod peuplée | 1j |
| G.6 | Monitoring (logs, métriques, alertes) + Swagger final | Observabilité | 1j |
| G.7 | Formation P7 + documentation d'exploitation | Support livré | 1j |

**Critère de sortie :** `Definition of Done` (`tests/02_DEFINITION_OF_DONE.md`) satisfaite à 100%.

---

## 2. Chronologie consolidée (Gantt)

```
Semaine :  S0 S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12
           ─────────────────────────────────────────────
A Réconc.  ██
B Scaffold    ██
C Cœur          ████████████
D Backoff                   ████████
E Frontend            ███████████████████
F Intégr.                            ██████
G Qualité                                   ██████
```
**Durée totale estimée :** 12–13 semaines (≈ 3 mois) avec 1 lead backend + 1 dev fullstack + 1 dev frontend + 1 QA.

---

## 3. Dépendances critiques (chemin critique)

```
A (Prisma) ──► B (Scaffold) ──► C1 (Auth/RBAC) ──► C2 (Demandes) ──► C3 (Workflow) ──► C4 (Attestation)
                                      │
                                      └──► E (Frontend, dès que API C2 disponible)
D (Backoffice) dépend de C2/C3 · F (SI réels) remplace les mocks de C/D · G clôt tout.
```

---

## 4. Risques additionnels (post-conception)

| Risque | Prob. | Impact | Mitigation |
|--------|:---:|:---:|------------|
| Dérive Prisma ↔ MySQL après A | Moyenne | Élevé | `prisma migrate` = seule voie de modif schéma ; interdire DDL manuel |
| 85 tables → complexité modules | Moyenne | Moyen | Regrouper par domaine (≈14 modules), pas 1 module/table |
| RLS applicatif insuffisant | Moyenne | Élevé | Tests de sécurité par rôle (OASE-43) systématiques |
| Frontend en retard sur backend | Haute | Moyen | Démarrer E.1 dès B fini, mock API si besoin |
| Volume audit_logs en prod | Faible | Moyen | Partitionnement par année (cf. `AUDIT_MLD_V3_EXPERT.md` A12) |

---

## 5. Toute première action recommandée (cette semaine)

1. **A.1** — Lancer `prisma db pull` sur `oase` v3.3 pour régénérer les 85 modèles.
2. **A.6** — Réaligner `seed-demo.ts` (15 rôles, médiathèque, codes additionnels).
3. **B.1** — `nest new oase-api` et intégrer `impl/` existant.
4. **Plane** — Créer les épopées de réalisation (Phases A→G) et lier aux issues OASE existantes.

---

## 6. Definition of Done global (rappel)

- [ ] `schema.prisma` = 85 tables, `prisma validate` OK
- [ ] Les 15 rôles authentifiables, RBAC + RLS testés
- [ ] Cycle demande P1→P4 < 5 clics, attestation QR vérifiable
- [ ] `audit_logs.verifyChain()` = 0 rupture
- [ ] Import MRD 1 316 mesures < 60s
- [ ] 53 tests E2E verts, 0 erreur console
- [ ] SSL A+, 0 credential en dur, Swagger live
- [ ] Connecteurs SI réels avec fallback Circuit Breaker

---

*Plan détaillé de la suite — à mettre à jour à chaque fin de phase. Référence : `12_PLAN_LIVRAISON_MVP.md`, `SUIVI_LIVRABLES_2026-06-16.md`.*
