# OASE-23 — PRD Backend

> **Issue Plane :** OASE-23  
> **Date :** 2026-06-16  
> **Statut :** Référence consolidée — synthèse des livrables OASE-5 à OASE-22

---

## 1. Contexte et objectif

OASE (Outil Automatisé de Suivi des Exonérations) est le système d'information national de gestion des dépenses fiscales du Togo (MEF / OTR). Il couvre **1 316 mesures dérogatoires** issues du MRD 2024, implique **15 institutions** et sert **7 personas** distincts.

**Objectif du backend :** Fournir une API REST sécurisée, auditée et interopérable supportant l'intégralité du cycle de vie des demandes d'exonération — du dépôt P1 à l'approbation finale P4 — avec traçabilité inaltérable et conformité UEMOA.

---

## 2. Périmètre fonctionnel couvert

| Domaine | Couvert | Référence |
|---|:---:|---|
| Authentification JWT + MFA TOTP + PIN | ✅ | OASE-19 |
| RBAC 15 rôles + RLS périmètre | ✅ | OASE-8 |
| Cycle de vie Demande (8 statuts, toutes transitions) | ✅ | OASE-7 |
| Routage workflow par type de texte juridique (6 circuits) | ✅ | OASE-10 |
| Référentiel MRD 1 316 mesures (SCD Type 2) | ✅ | OASE-11 |
| GED pièces jointes (S3, SHA-256, validation) | ✅ | OASE-10 |
| Conventions (ZF, Code Investissements, Accord de siège, Minier) | ✅ | OASE-6 |
| Quotas et alertes de consommation | ✅ | OASE-7 |
| Audit log SHA-256 chaîné (inaltérable) | ✅ | OASE-20 |
| Moteur anomalies paramétrables | ✅ | OASE-10 |
| Interopérabilité Sydonia, E-TAX, SIGFiP, GUDEF, DAS | ✅ | OASE-21 |
| Circuit Breaker + fallback SI externes | ✅ | OASE-21 |
| CRON alertes (J-30/J-7/J0, quota 80%) | ✅ | OASE-10 |
| Attestations PDF + QR Code + vérification publique | ✅ | OASE-10 |
| Open Data public anonymisé | ✅ | OASE-10 |
| Notifications in-app / email | ✅ | OASE-10 |

---

## 3. Architecture technique retenue

```
Vue 3 (frontend) ──HTTPS──► Nginx ──► NestJS 10 (Node.js 20 LTS)
                                           │
                         ┌─────────────────┼──────────────────────┐
                         │                 │                      │
                    PostgreSQL 15      Redis (BullMQ)        MinIO (S3)
                    (Prisma ORM)       (queues + cache)      (GED + attestations)
```

**Stack validée :** NestJS 10 · Prisma 5 · PostgreSQL 15 · Redis · MinIO · PM2 cluster · Nginx · bcrypt · otplib · Puppeteer · BullMQ

---

## 4. Modèle de données — récapitulatif

**19 tables** · **22 enums** · Schéma complet : `docs/backend/schema.prisma`

Tables critiques : `demandes` (centre), `bases_juridiques` (SCD T2), `audit_logs` (hash chaîné), `etapes_workflow`, `quotas`

---

## 5. API — surface exposée

| Groupe | Endpoints | Sécurité |
|---|---|---|
| Auth | 6 | Public (login) + JWT |
| Bénéficiaires (P1) | 8 | JWT + RBAC |
| Instruction (P2/P3) | 12 | JWT + RBAC + ScopeGuard |
| Workflow / décisions | 6 | JWT + RBAC + PinGuard |
| Dashboards / stats | 5 | JWT + RBAC |
| Administration (P7) | 8 | JWT + RBAC admin_si |
| Open Data (public) | 6 | Rate limit 30/min |
| **Total** | **51 endpoints** | |

Contrat complet : `docs/backend/09_API_CONTRACTS.md`

---

## 6. Sécurité

| Mesure | Implémentation |
|---|---|
| JWT access 15min + refresh 7j rotation | `AuthService.issueTokenPair()` |
| MFA TOTP RFC 6238 obligatoire P2→P7 | `MfaService` + otplib |
| PIN bcrypt rounds=12 avant signature | `PinGuard` |
| AES-256-GCM secrets MFA + config SI | `MfaService.encrypt()` |
| Helmet + CORS strict + Rate limiting | `main.ts` + ThrottlerModule |
| RBAC + RLS périmètre institutionnel | `RbacGuard` + `ScopeGuard` |
| Audit log SHA-256 inaltérable | `AuditLogInterceptor` global |
| Upload MIME + taille + hash SHA-256 | `StorageService` |
| Refresh token blacklist | `RefreshToken` table + révocation |

---

## 7. Interopérabilité

5 connecteurs SI avec Circuit Breaker (CLOSED/OPEN/HALF_OPEN), fallback gracieux, mode mock pour demo. Voir `docs/backend/10_CONNECTEURS.md`.

---

## 8. Déploiement

| Env | Infra | DB | Queues |
|---|---|---|---|
| **Production** | VM Ubuntu 22.04, Nginx + PM2 cluster | PostgreSQL 15 | Redis + BullMQ |
| **Demo cPanel** | cPanel Node.js App Manager, PM2 | MySQL 8 | CRON cPanel (pas de Redis) |

Guide complet : `docs/backend/06_ARCHITECTURE_NESTJS.md`

---

## 9. Plan de livraison MVP

| Phase | Périmètre | Durée estimée |
|---|---|---|
| **M1 — Fondations** | Scaffolding NestJS, Prisma, Auth, Audit, Seeds | 2 semaines |
| **M2 — Cœur métier** | Demandes, Workflow, Pièces, Attestations | 3 semaines |
| **M3 — Backoffice** | Tous modules P2/P3/P4, Quotas, Anomalies | 3 semaines |
| **M4 — Intégrations** | Connecteurs SI réels, Open Data, Jobs CRON | 2 semaines |
| **M5 — Tests & Deploy** | E2E Playwright, sécurité, déploiement VM | 2 semaines |
| **Total MVP** | | **~12 semaines** |

---

## 10. Index des livrables backend OASE

| N° | Fichier | Contenu |
|---|---|---|
| OASE-5 | `docs/backend/00_POINTS_A_CLARIFIER.md` | Contradictions MRD / maquette |
| OASE-6 | `docs/backend/03_DOMAIN_MODEL.md` | Modèle domaine 16 entités |
| OASE-7 | `docs/backend/04_STATUTS_ET_TRANSITIONS.md` | Machine à états + diagrammes |
| OASE-8 | `docs/backend/05_RBAC_PERMISSIONS.md` | Matrice RBAC 15 rôles |
| OASE-9 | `docs/backend/06_ARCHITECTURE_NESTJS.md` | Stack + déploiement |
| OASE-10 | `docs/backend/07_MODULES_NESTJS.md` | 21 modules détaillés |
| OASE-11 | `docs/backend/schema.prisma` | Schéma Prisma complet |
| OASE-11 | `docs/backend/08_SCHEMA_RELATIONNEL.md` | Doc schéma + migrations |
| OASE-12/13 | `docs/backend/seed-demo.ts` | Seeds démonstration |
| OASE-14→18 | `docs/backend/09_API_CONTRACTS.md` | 51 endpoints documentés |
| OASE-19/20 | `docs/backend/impl/auth/` | Auth NestJS + Audit |
| OASE-21/22 | `docs/backend/impl/connecteurs/` | Circuit Breaker + adapters |
| OASE-23 | `docs/backend/11_PRD_BACKEND.md` | Ce document |

---

*PRD Backend OASE — Version 1.0.0.*  
*Alimente OASE-24 (plan de livraison), OASE-25/26 (déploiement), OASE-32→38 (user stories).*
