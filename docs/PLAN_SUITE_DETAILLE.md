# OASE — Plan Détaillé de la Suite (Phase de Réalisation)

> **Date :** 17 juin 2026  
> **Auteur :** Pair-programming OASE  
> **Pré-requis atteints :** Documentation complète (OASE-2→53), MLD v3.3 audité (85 tables, 92/100), seeds démo, contrats API (51 endpoints), 41 écrans spécifiés.  
> **Objet :** Feuille de route opérationnelle pour passer de la **conception** à un **produit fonctionnel déployé**.

---

## 0. État actuel

| Domaine | État | Détail |
|---------|------|--------|
| **Documentation backend** | ✅ Complète | 13 docs + audits |
| **Base de données** | ✅ Livrée v3.3 | 85 tables, 15 rôles, seed démo |
| **Schéma Prisma** | ✅ Réconcilié | `schema.prisma` = 85 tables, migration `001_init_v33` OK |
| **Backend NestJS** | ✅ Bootstrap | `oase-api/`, Auth, RBAC, Demandes, Conventions, Anomalies, Dashboards, Jobs, Swagger |
| **Frontend Vue 3** | ✅ Phase E complète | Pinia, RBAC, login MFA, dashboards P1/P2/P3/P4/P5/P7, admin utilisateurs |
| **Tests E2E** | 🟡 En cours | Stratégie Playwright écrite, 0 test exécutable |
| **Connecteurs SI** | 🟡 Mocks | Sydonia, E-TAX, SIGFiP, GUDEF en mode mock avec circuit breaker |

> **🔴 Prochain verrou :** Stabiliser le produit pour réception client avant toute intégration SI réelle.

## 0.1. Reste à faire avant réception (sortie de Phase E)

| # | Tâche | Priorité | État |
|---|-------|----------|------|
| E-REV-1 | Tests E2E Playwright : login + parcours P1/P2/P4 | Haute | À faire |
| E-REV-2 | Revue fonctionnelle et correction des bugs dashboard | Haute | À faire |
| E-REV-3 | Responsive mobile sur les 41 écrans | Moyenne | À faire |
| E-REV-4 | Cohérence visuelle (`03_COHERENCE_VISUELLE.md`) | Moyenne | À faire |
| E-REV-5 | Build de démo + déploiement local prod-like | Moyenne | À faire |
| E-REV-6 | Documentation de livraison / guide utilisateur | Basse | À faire |


---

## PHASE A — Réconciliation Modèle de Données (S0, 3–4 jours) ✅

**Objectif :** Une seule source de vérité entre MySQL (`oase`) et Prisma.

| # | Tâche | Livrable | Effort | Dépendance | État |
|---|-------|----------|--------|------------|------|
| A.1 | Introspection Prisma sur la base `oase` v3.3 | `schema.prisma` (85 modèles) | 0.5j | DB v3.3 | ✅ |
| A.2 | Nettoyage : nommage PascalCase, relations, `@map` | `schema.prisma` propre | 1j | A.1 | ✅ |
| A.3 | Enums TypeScript dérivés des tables `ref_*` | `src/common/enums/generated.ts` | 1j | A.2 | ✅ |
| A.4 | Client Prisma + types | `@prisma/client` typé | 0.25j | A.2 | ✅ |
| A.5 | Baseline migration `001_init_v33` | `prisma/migrations/` | 0.5j | A.4 | ✅ |
| A.6 | Seed démo aligné sur 85 tables + 15 rôles | `prisma/seed.ts` | 1j | A.4 | ✅ |

**Critère de sortie :** ✅ `prisma migrate reset && prisma db seed` OK, `prisma generate` OK.

---

## PHASE B — Scaffolding NestJS (S1, 3 jours) ✅

**Objectif :** Squelette d'application exécutable, CI verte.

| # | Tâche | Livrable | État |
|---|-------|----------|------|
| B.1 | `nest new oase-api` + config | Projet bootable | ✅ |
| B.2 | `PrismaModule` global | Module DB injectable | ✅ |
| B.3 | Config typée + validation | Config sécurisée | ✅ |
| B.4 | Migration des `impl/` existants | Modules intégrés | ✅ |
| B.5 | Swagger + filtre d'exception + logger | Observabilité base | ✅ |
| B.6 | CI GitHub Actions | Pipeline vert | ✅ |

**Critère de sortie :** ✅ `start:dev` OK, Swagger accessible, `/health` 200.

---

## PHASE C — Cœur Métier (S2–S5, ~4 semaines) ✅

> Reprend **Milestone 2** du `12_PLAN_LIVRAISON_MVP.md`.

| Sprint | Tâche | État |
|--------|-------|------|
| C1 | Auth JWT/refresh/MFA/PIN + RBAC 15 rôles + Utilisateurs | ✅ |
| C2 | Bénéficiaires + Demandes + Storage | ✅ |
| C3 | Workflow + Décisions + Actes | ✅ |
| C4 | Attestations + Notifications | ✅ |

**Critère de sortie :** ✅ Cycle P1→P2→P4 attestation géré, audit chain actif.

---

## PHASE D — Backoffice & Référentiels (S6–S8, ~3 semaines) ✅

> Reprend **Milestone 3**.

| # | Module | État |
|---|--------|------|
| D.1 | Bases juridiques | ✅ |
| D.2 | Quotas | ✅ |
| D.3 | Anomalies | ✅ |
| D.4 | Conventions | ✅ |
| D.5 | Dashboards | ✅ |
| D.6 | Rapports | ✅ |
| D.7 | Jobs | ✅ |
| D.8 | Tests E2E backoffice | 🟡 |

**Critère de sortie :** ✅ Dashboards backend avec données réelles.

---

## PHASE E — Frontend Vue 3 (S6–S10, en parallèle de D, ~5 semaines) ✅

**Objectif :** Les 41 écrans de `frontend/01_INVENTAIRE_ECRANS.md` fonctionnels.

| # | Lot | État | Écrans |
|---|-----|------|--------|
| E.1 | Socle | ✅ | Layout, thème, garde RBAC |
| E.2 | Auth | ✅ | Login, MFA, reset |
| E.3 | Portail bénéficiaire P1 | ✅ | Dashboard P1 connecté API |
| E.4 | Back-office P2 | ✅ | Dashboard P2 connecté API |
| E.5 | Agences P3 + Décideurs P4 | ✅ | Dashboards conventions + KPIs |
| E.6 | Contrôle P5 + Open Data P6 | ✅ | Dashboard audit anomalies |
| E.7 | Admin P7 | ✅ | Gestion utilisateurs connectée API |
| E.8 | Intégration API + états | ✅ | Client typé, états loading/erreur |

**Critère de sortie :** ✅ Build OK, 0 erreur console, états API gérés.

---

## PHASE F — Intégrations SI Réelles (S9–S10, ~2 semaines) 🚫 En attente

> **Bloqué jusqu'à réception client du produit fonctionnel.**

| # | Connecteur | Tâche | Effort | État |
|---|-----------|-------|--------|------|
| F.1 | Sydonia | OAuth2, endpoint réel, circuit breaker | 3j | En attente |
| F.2 | E-TAX | API Key, vérif statut fiscal réel | 2j | En attente |
| F.3 | SIGFiP | SOAP/REST visa budgétaire | 3j | En attente |
| F.4 | GUDEF | REST rapprochement comptable | 2j | En attente |
| F.5 | Import MRD 2024 réel (1 316 mesures) | 1j | En attente |
| F.6 | Tests d'intégration staging | 2j | En attente |

---

## PHASE G — Qualité, Sécurité & Déploiement (S11–S12, ~2 semaines) 🟡 Partiel

| # | Tâche | Livrable | Effort | État |
|---|-------|----------|--------|------|
| G.1 | Suite E2E complète (OASE-43→51) | 53 specs Playwright vertes | 3j | 🟡 À faire |
| G.2 | Pen-test (auth, RLS, upload, OWASP Top 10) | Rapport sécurité | 2j | En attente |
| G.3 | Durcissement DB prod | Checklist sécurité | 1j | En attente |
| G.4 | VM Ubuntu 22.04 + Nginx + SSL A+ | Infra prod | 2j | En attente |
| G.5 | Migration données initiales | DB prod peuplée | 1j | En attente |
| G.6 | Monitoring + Swagger final | Observabilité | 1j | En attente |
| G.7 | Formation P7 + documentation | Support livré | 1j | En attente |

**Critère de sortie :** `Definition of Done` satisfaite à 100%.

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
