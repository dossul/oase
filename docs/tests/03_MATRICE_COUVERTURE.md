# OASE-53 — Matrice de couverture exigences → tests

> **Issue Plane :** OASE-53  
> **Date :** 2026-06-16  
> **Source :** CdC, TDR, OASE-23 (PRD), OASE-32→38 (User Stories)

---

## Légende

| Symbole | Signification |
|:---:|---|
| ✅ | Couvert (test E2E Playwright ou test unitaire existant) |
| 🔄 | Partiellement couvert (test unitaire backend uniquement) |
| ❌ | Non couvert (à implémenter) |

---

## Matrice — Exigences fonctionnelles (CdC §3)

| ID | Exigence | Source | Tests | Statut |
|:---:|---|---|---|:---:|
| F-01 | Authentification email + mot de passe | CdC §3.1 | `auth.spec.ts` login | ✅ |
| F-02 | MFA TOTP obligatoire P2→P7 | CdC §3.1 | `auth.spec.ts` MFA flow | ✅ |
| F-03 | PIN de signature avant approbation | CdC §3.1 | `instruction.spec.ts` approuver | ✅ |
| F-04 | Refresh token rotation | CdC §3.1 | `auth.spec.ts` refresh | 🔄 |
| F-05 | Blacklist révocation token | CdC §3.1 | `auth.spec.ts` logout | 🔄 |
| F-06 | Profil bénéficiaire (NIF, RCCM, type) | CdC §3.2 | `beneficiaire.spec.ts` | ✅ |
| F-07 | Statut fiscal temps réel (E-TAX) | CdC §3.2 | `beneficiaire.spec.ts` statut badge | 🔄 |
| F-08 | Dépôt demande en 3 étapes | CdC §3.3 | `beneficiaire.spec.ts` soumission | ✅ |
| F-09 | Sélection base juridique MRD | CdC §3.3 | `beneficiaire.spec.ts` step1 | ✅ |
| F-10 | Upload pièces jointes (PDF/JPG/PNG ≤10MB) | CdC §3.3 | `beneficiaire.spec.ts` upload | ✅ |
| F-11 | Brouillon auto-sauvegardé | CdC §3.3 | — | ❌ |
| F-12 | Soumission avec garde-fous (dette, quota, pièces) | CdC §3.3 | `beneficiaire.spec.ts` guards | 🔄 |
| F-13 | Suivi état demande (stepper workflow) | CdC §3.4 | `beneficiaire.spec.ts` détail | ✅ |
| F-14 | Notification email changement statut | CdC §3.4 | — (mock email) | ❌ |
| F-15 | Réponse à complément | CdC §3.5 | `beneficiaire.spec.ts` complément | ✅ |
| F-16 | File d'instruction filtrée par organe | CdC §3.6 | `instruction.spec.ts` file | ✅ |
| F-17 | Prise en charge dossier | CdC §3.6 | `instruction.spec.ts` | ✅ |
| F-18 | Validation étape workflow + PIN | CdC §3.6 | `instruction.spec.ts` valider | ✅ |
| F-19 | Demande de complément motivée | CdC §3.6 | `instruction.spec.ts` complément | ✅ |
| F-20 | Approbation finale avec PIN + commentaire | CdC §3.7 | `instruction.spec.ts` approuver | ✅ |
| F-21 | Rejet avec motif obligatoire | CdC §3.7 | `instruction.spec.ts` rejet | 🔄 |
| F-22 | Attestation PDF + QR Code | CdC §3.8 | `beneficiaire.spec.ts` téléchargement | 🔄 |
| F-23 | Vérification attestation publique | CdC §3.8 | `public.spec.ts` vérifier | ✅ |
| F-24 | Quota avec alertes 80% / blocage 100% | CdC §3.9 | `dashboards.spec.ts` quota | 🔄 |
| F-25 | Anomalies paramétrables | CdC §3.10 | — | ❌ |
| F-26 | Journal d'audit SHA-256 chaîné | CdC §3.11 | `public.spec.ts` audit | 🔄 |
| F-27 | Open Data statistiques anonymisées | CdC §3.12 | `public.spec.ts` stats | ✅ |
| F-28 | Tableaux de bord KPIs | CdC §3.13 | `dashboards.spec.ts` | ✅ |
| F-29 | Rapports PDF exécutifs | CdC §3.13 | `dashboards.spec.ts` export | ✅ |
| F-30 | Gestion utilisateurs CRUD (P7) | CdC §3.14 | `admin.spec.ts` | ✅ |
| F-31 | Gestion rôles et permissions | CdC §3.14 | `admin.spec.ts` | 🔄 |
| F-32 | Configuration workflows (P7) | CdC §3.14 | — | ❌ |
| F-33 | Import MRD (P7) | CdC §3.15 | — | ❌ |
| F-34 | Connecteur Sydonia (douane) | CdC §4.3 | `connecteurs/circuit-breaker` | 🔄 |
| F-35 | Connecteur E-TAX (fiscal) | CdC §4.3 | `connecteurs/circuit-breaker` | 🔄 |
| F-36 | Connecteur SIGFiP (budget) | CdC §4.3 | — | ❌ |
| F-37 | Connecteur GUDEF (comptable) | CdC §4.3 | — | ❌ |
| F-38 | Connecteur DAS (base annexes) | CdC §4.3 | — | ❌ |
| F-39 | Notifications in-app | CdC §3.4 | — | ❌ |
| F-40 | Alertes échéances J-30/J-7/J0 | TDR §3 | — | ❌ |
| F-41 | SCD Type 2 bases juridiques | OASE-6 | — | ❌ |
| F-42 | Chiffrement AES-256-GCM configs SI | OASE-19 | — | 🔄 |

---

## Matrice — Exigences non-fonctionnelles (CdC §5)

| ID | Exigence | Source | Tests | Statut |
|:---:|---|---|---|:---:|
| NF-01 | Disponibilité ≥ 99% | CdC §5.1 | Monitoring PM2 | ❌ |
| NF-02 | Temps réponse < 2s (95e percentile) | CdC §5.1 | — | ❌ |
| NF-03 | Upload fichier ≤ 15MB | CdC §5.1 | `beneficiaire.spec.ts` upload | ✅ |
| NF-04 | 1 000 utilisateurs simultanés | CdC §5.1 | Load test k6 | ❌ |
| NF-05 | Données chiffrées au repos (AES-256) | CdC §5.2 | — | 🔄 |
| NF-06 | JWT access 15min / refresh 7j | CdC §5.2 | `auth.spec.ts` | 🔄 |
| NF-07 | Audit log inaltérable | CdC §5.2 | `public.spec.ts` verify chain | 🔄 |
| NF-08 | RBAC + RLS institutionnel | CdC §5.2 | `auth.spec.ts` 403 | ✅ |
| NF-09 | Conformité UEMOA / CEDEAO | CdC §5.3 | — | ❌ |
| NF-10 | Référentiel MRD à jour | CdC §5.3 | — | ❌ |
| NF-11 | Export FEC / MRE | CdC §5.3 | — | ❌ |
| NF-12 | Interface FR + EN | CdC §5.4 | `i18n` test | ❌ |

---

## Résumé de couverture

| Catégorie | Total | ✅ Couvert | 🔄 Partiel | ❌ Non couvert |
|---|---:|---:|---:|---:|
| Fonctionnelles | 42 | 17 | 12 | 13 |
| Non-fonctionnelles | 12 | 3 | 2 | 7 |
| **Total** | **54** | **20** | **14** | **20** |

**Taux de couverture :** 37.0% complètement couvert · 25.9% partiellement couvert · 37.0% non couvert

### Mise à jour 2026-07-12 (V3.5.1)

Avec la résolution des BUG #2 / #4 / #5, les exigences suivantes évoluent :

- **F-01** (Auth email + mdp) : 🔄 → ✅ *PASS pour tous les rôles y compris admin* (TC-AUTH-05)
- **NF-08** (RBAC + RLS) : 🔄 → ✅ *Override admin sur les routes cross-persona vérifié* (TC-AUTH-07)
- Nouvelle exigence implicite *"Sidebar pilotée par rôle utilisateur"* : ✅ couvert par TC-AUTH-06 (auparavant implicite, jamais testé pour l'admin)

Voir `docs/BUGS.md` section "BUG #2 / #4 / #5" et `docs/tests/04_PLAN_RECETTE_EXONERATION.md` §0 + TC-AUTH-05/06/07.

> Objectif MVP : 100% des exigences critiques (F-01 à F-23, NF-05 à NF-08) couvertes avant déploiement production.

---

*Livrable OASE-53 — Matrice de couverture exigences → tests.*
