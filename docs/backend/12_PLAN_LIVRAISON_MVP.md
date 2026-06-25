# OASE-24 — Plan de livraison MVP

> **Issue Plane :** OASE-24  
> **Date :** 2026-06-16  
> **Source :** TDR §4 (5 phases), CdC §6, OASE-23 (PRD Backend)

---

## 1. Contraintes structurantes

- **Déploiement cible principal :** VM Ubuntu 22.04 (Nginx + PM2 cluster)
- **Déploiement démo :** cPanel avec Node.js App Manager (pas de Redis, MySQL)
- **Backend :** NestJS 10 + Prisma 5 — mono-repo sans micro-services
- **Équipe estimée :** 1 tech lead backend + 1 dev fullstack + 1 QA
- **Durée MVP :** 12 semaines (3 mois)
- **Données réelles :** MRD 2024 (1 316 mesures) disponible

---

## 2. Jalons et livrables

### Milestone 1 — Fondations (S1–S2)
**Objectif :** Backend opérationnel en mode demo, authentification fonctionnelle.

| # | Tâche | Livrable | Effort |
|---|---|---|---|
| 1.1 | Scaffolding NestJS + Prisma + config env | `src/` + `.env.example` | 1j |
| 1.2 | Migration Prisma initiale (19 tables) | `prisma/migrations/001_init` | 0.5j |
| 1.3 | Module Auth (JWT + MFA TOTP + PIN) | `AuthModule` + tests | 3j |
| 1.4 | Module Audit (interceptor global) | `AuditModule` | 1j |
| 1.5 | Seeds demo (institutions, users, MRD) | `prisma/seed.ts` | 1j |
| 1.6 | CI/CD pipeline (GitHub Actions) | `.github/workflows/` | 1j |
| 1.7 | Deploy demo cPanel avec data seeds | URL demo fonctionnelle | 1j |

**Critère de sortie :** Login MFA fonctionne, audit log enregistré, 7 personas authentifiables.

---

### Milestone 2 — Cœur métier demandes (S3–S5)
**Objectif :** Cycle complet d'une demande P1 → approbation P4.

| # | Tâche | Livrable | Effort |
|---|---|---|---|
| 2.1 | Module Beneficiaires (CRUD profil, statut fiscal E-TAX mock) | `BeneficiairesModule` | 2j |
| 2.2 | Module Demandes (CRUD, soumettre, cycle de vie) | `DemandesModule` | 4j |
| 2.3 | Module GED (upload S3, validation MIME + SHA-256) | `StorageModule` | 2j |
| 2.4 | Module Workflow (routing par type texte, étapes, transitions) | `WorkflowModule` | 3j |
| 2.5 | Génération attestation PDF + QR Code | `AttestationsModule` | 2j |
| 2.6 | Module Notifications (in-app + email) | `NotificationsModule` | 2j |
| 2.7 | Tests E2E parcours P1 complet | Playwright test suite | 2j |

**Critère de sortie :** P1 dépose → P2 instruit → P4 approuve → attestation PDF générée + lien QR valide.

---

### Milestone 3 — Backoffice complet (S6–S8)
**Objectif :** Tous les modules backoffice opérationnels.

| # | Tâche | Livrable | Effort |
|---|---|---|---|
| 3.1 | Module Quotas (alertes 80%, blocage 100%) | `QuotasModule` | 2j |
| 3.2 | Module Anomalies (détection, workflow) | `AnomaliesModule` | 2j |
| 3.3 | Module Bases Juridiques (import MRD CSV/JSON, SCD T2) | `BasesJuridiquesModule` | 2j |
| 3.4 | Module Conventions (accord siège, ZF, Code Inv., Minier) | `ConventionsModule` | 2j |
| 3.5 | Module Dashboards (stats, KPIs, exports) | `DashboardsModule` | 2j |
| 3.6 | Module Rapports (PDF exports, OpenData) | `RapportsModule` | 2j |
| 3.7 | Tests E2E instruction backoffice | Playwright suite | 2j |
| 3.8 | CRON jobs (alertes J-30/J-7/J0, quota, heartbeat SI) | `JobsModule` | 2j |

**Critère de sortie :** Tableaux de bord P4/P5/P7 avec données réelles seeds, exports PDF.

---

### Milestone 4 — Intégrations SI réelles (S9–S10)
**Objectif :** Remplacement des mocks par les connecteurs SI réels.

| # | Tâche | Livrable | Effort |
|---|---|---|---|
| 4.1 | Connecteur Sydonia (OAuth2, endpoint réel) | `SydoniaAdapter` | 3j |
| 4.2 | Connecteur E-TAX (API Key, endpoint réel) | `EtaxAdapter` | 2j |
| 4.3 | Connecteur SIGFiP (SOAP/REST) | `SigfipAdapter` | 3j |
| 4.4 | Connecteur GUDEF (REST) | `GudefAdapter` | 2j |
| 4.5 | Import MRD 2024 complet (1 316 mesures) | `POST /bases-juridiques/import/mrd` | 1j |
| 4.6 | Tests intégration connecteurs (staging) | Tests scripts | 2j |
| 4.7 | Audit de sécurité (OWASP top 10) | Rapport sécurité | 2j |

**Critère de sortie :** Vérification statut fiscal réel OTR, visa SIGFiP réel pour une demande test.

---

### Milestone 5 — Tests, sécurité, déploiement production (S11–S12)
**Objectif :** Backend production-ready sur VM MEF.

| # | Tâche | Livrable | Effort |
|---|---|---|---|
| 5.1 | Tests E2E complets (OASE-43 à 51) | 53 tests Playwright | 3j |
| 5.2 | Penetration testing (auth, RLS, upload) | Rapport pen-test | 2j |
| 5.3 | Configuration VM Ubuntu + Nginx + SSL | Infra prod | 1j |
| 5.4 | Migration données initiales (MRD, conventions, users) | DB prod peuplée | 1j |
| 5.5 | Déploiement PM2 cluster + monitoring | Backend live | 1j |
| 5.6 | Formation administrateurs OASE (P7) | Support utilisateurs | 1j |
| 5.7 | Documentation API Swagger finalisée | `/api/docs` live | 1j |

**Critère de sortie :** 0 erreur console, toutes les transitions demande OK, audit log vérifié, SSL A+.

---

## 3. Diagramme de Gantt simplifié

```
Semaine :  S1  S2  S3  S4  S5  S6  S7  S8  S9  S10 S11 S12
           ──────────────────────────────────────────────────
M1 Fond.   ████████
M2 Cœur            ████████████
M3 BkOffice                    ████████████
M4 Intégr.                                 ████████
M5 Deploy                                          ████████
```

---

## 4. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|:---:|:---:|---|
| SI externes (Sydonia, E-TAX) indisponibles | Haute | Moyen | Mode mock + Circuit Breaker → démo non bloquée |
| Décisions MOA en attente (OASE-5) | Moyenne | Élevé | Valeurs par défaut documentées, configurable |
| Accès infrastructure VM MEF tardif | Moyenne | Moyen | Deploy cPanel pour démo en attendant |
| Volume MRD > 1 316 mesures en production | Faible | Faible | Import batch + SCD T2 → pas de perte données |
| Budget révision quota dépassé | Faible | Moyen | Alertes 80% + blocage 100% configurable |

---

## 5. Critères d'acceptance MVP

- [ ] Les 7 personas peuvent se connecter (MFA pour P2→P7)
- [ ] Cycle complet demande P1→approbation P4 en < 5 clics
- [ ] Attestation PDF avec QR Code généré et vérifiable sur `/public/attestations/verifier`
- [ ] Audit log : 100% des mutations tracées, `verifyChain()` → 0 rupture
- [ ] Import MRD 1 316 mesures en < 60 secondes
- [ ] Tous les circuits Demande (6 types texte) routent vers le bon workflow
- [ ] API Swagger disponible à `/api/docs`
- [ ] 0 credential en dur dans le code source

---

*Plan de livraison OASE-24 — Version 1.0.0.*
