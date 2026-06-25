# OASE-2 — Cartographie complète des sources documentaires

> **Issue Plane :** OASE-2 (Cartographier les sources OASE)  
> **Date :** 2026-06-16  
> **Méthode :** Analyse manuelle approfondie (Graphify non disponible — fallback analytique)

---

## 1. Inventaire des sources par dossier

### 1.1 `kb/` — Base de connaissances (sources brutes + extractions)

| Sous-dossier | Rôle | Contenu clé | Poids |
|---|---|---|---|
| `kb/donne_client/` | **Source de vérité officielle** | TDR.docx + Cahier des Charges.docx | Critique |
| `kb/outputs/_extracted_client/` | Versions markdown des sources officielles | TDR.md + CdC.md | Critique |
| `kb/outputs/` | **Livrables de cadrage produits par la mission** | 00_SYNTHESE.md, 01_INVENTAIRE_EXONERATIONS.md, 02_PROCESSUS_INSTITUTIONNELS.md, 03_DIAGNOSTIC.md, ACTEURS_OASE_CONSOLIDES.md | Critique |
| `kb/extracted/` | Documents d'entretien et méthodologie | Besoins_info.V1, Grilles_entretiens, Note_Methodologique, OASE_Interfaces_UI_UX | Moyen |
| `kb/downloads_organises/` | Classification de documents réglementaires | INDEX_GLOBAL.md, DOCUMENTS_OASE_UTILISES.md | Référentiel |
| `kb/donnee_collecte/` | Données brutes collectées (PDF, XLSX) | CGI 2025, MRD 2024, lois de finances | Brut |
| `kb/donnee_collecte_extracted/` | Extractions OCR/IA des documents bruts | ~500 fichiers texte extraits | Brut |

### 1.2 `comprehension/` — Documentation de la maquette interactive

| Fichier | Contenu | Usage backend |
|---|---|---|
| `00_INDEX.md` | Index + état global des 7 phases | Vue d'ensemble |
| `01_ARCHITECTURE.md` | Stack Vue3/Vite/TS/Vuetify + thème | Frontend only |
| `02_VUES_INVENTAIRE.md` | **41 vues avec routes, personas, fonctionnalités** | **Référence directe modules backend** |
| `03_COMPOSANTS.md` | Composants réutilisables (KpiCard, DocumentViewer…) | Frontend only |
| `04_DONNEES_MOCK.md` | **Types TS + données mock réalistes** | **Modèle de données référence** |
| `05_FONCTIONNALITES_AVANCEES.md` | DocumentViewer, IA OpenRouter, SI interconnexions, Workflow BPM, Moteur de règles | **Spécifications fonctionnelles avancées** |
| `06_WORKFLOWS.md` | **6 workflows métier détaillés** | **Logique métier workflows** |
| `07_CORRECTIONS_ET_BUG_FIXES.md` | Bugs corrigés | Référence qualité |
| `08_FLUX_PAR_PERSONA.md` | **Flux complets par les 7 personas** | **Spécifications UX → endpoints** |
| `PRD_OASE.md` | **Product Requirements Document** | **Vision + scope produit** |
| `plan.md` | Plan d'implémentation détaillé (41 vues) | Planning technique |

### 1.3 `elaboration_rapport/` — Analyses et rapports produits

| Fichier | Contenu | Usage backend |
|---|---|---|
| `GUIDE_WORKFLOW_COMPLET_MAQUETTE_OASE_PAR_PERSONA_ET_GLOSSAIRE.md` | Guide complet workflows + glossaire métier | Référentiel métier |
| `GAP_MAQUETTE_VS_TDR_DIAGNOSTIC_OASE_V2.md` | **Diagnostic gaps maquette vs TDR** | **Spécifications V2** |
| `Diagnostic_OASE_V2_document_final_complet.md` | Diagnostic complet V2 | Analyse fonctionnelle |

### 1.4 `maquette/` — Code source de la maquette

| Élément | Technologie | Usage backend |
|---|---|---|
| `src/types/index.ts` | Interfaces TypeScript (Demande, Utilisateur, Anomalie, Convention, AuditLog) | **Modèle entités référence** |
| `src/mock/data.ts` | Données mock (12 demandes, 12 utilisateurs, 6 anomalies, 6 conventions) | **Seed data / fixtures** |
| `src/plugins/router.ts` | 41 routes avec guards RBAC mock | **Plan endpoints API** |
| `src/services/openrouter.ts` | Client IA + prompt builders | Module IA génération rapports |
| `src/views/` | 41 composants Vue organisés par persona | **Plan des modules API** |

---

## 2. Typologie des contenus

### 2.1 Par nature documentaire

```
Sources officielles client (contrat)     ─┐
├── TDR (Termes de Référence)              │ → Sources de vérité
├── Cahier des Charges                     │   juridique/fonctionnelle
                                           ┘
Livrables de cadrage mission (analyse)    ─┐
├── 00_SYNTHESE                            │
├── 01_INVENTAIRE_EXONERATIONS (MRD 2024)  │ → Intrants backend
├── 02_PROCESSUS_INSTITUTIONNELS           │   (MCD/MLD, workflows)
├── 03_DIAGNOSTIC_INSTITUTIONNEL           │
└── ACTEURS_OASE_CONSOLIDES                ┘

Documentation maquette (spécifications)  ─┐
├── PRD_OASE.md                            │
├── 02_VUES_INVENTAIRE.md                  │ → Spécifications
├── 04_DONNEES_MOCK.md                     │   fonctionnelles
├── 05_FONCTIONNALITES_AVANCEES.md         │
├── 06_WORKFLOWS.md                        │
└── 08_FLUX_PAR_PERSONA.md                 ┘

Code maquette (référence technique)       ─┐
├── types/index.ts                         │ → Modèle de données
├── mock/data.ts                           │   + plan API
└── router.ts                              ┘

Rapports d'analyse (décisions)           ─┐
├── GAP_MAQUETTE_VS_TDR_DIAGNOSTIC_OASE   │ → Feuille de route
└── Diagnostic_OASE_V2_document_final     ┘   évolutive
```

### 2.2 Par criticité pour le backend

| Criticité | Documents | Pourquoi |
|---|---|---|
| **Critique** | TDR, CdC, PRD, 02_VUES_INVENTAIRE, 06_WORKFLOWS, 08_FLUX_PAR_PERSONA, types/index.ts | Définissent scope, entités, workflows, personas |
| **Élevée** | 00_SYNTHESE, 01_INVENTAIRE, 02_PROCESSUS, 03_DIAGNOSTIC, 05_FONCTIONNALITES_AVANCEES, 04_DONNEES_MOCK | Intrants MCD, règles métier, mock data |
| **Moyenne** | ACTEURS_CONSOLIDES, GAP_DIAGNOSTIC, GUIDE_WORKFLOW | Contexte institutionnel, écarts |
| **Faible** | 01_ARCHITECTURE, 03_COMPOSANTS, 07_CORRECTIONS, plan.md | Frontend/contexte uniquement |

---

## 3. Cartographie des relations entre documents

### 3.1 Graphe de dépendances (source → cible)

```
TDR + CdC (client)
    │
    ├──► 00_SYNTHESE (livré Phase 1)
    │
    ├──► 01_INVENTAIRE_EXONERATIONS (MRD 2024 analysé)
    │       └──► 02_PROCESSUS_INSTITUTIONNELS (processus dérivés)
    │               └──► 03_DIAGNOSTIC (gaps identifiés)
    │                       └──► ACTEURS_OASE_CONSOLIDES
    │
    ├──► PRD_OASE.md (vision produit)
    │       │
    │       ├──► 02_VUES_INVENTAIRE (41 vues détaillées)
    │       │       ├──► 06_WORKFLOWS (workflows par vue)
    │       │       └──► 08_FLUX_PAR_PERSONA (flux par persona)
    │       │
    │       ├──► 04_DONNEES_MOCK (types + data)
    │       │       └──► mock/data.ts (implémentation code)
    │       │
    │       └──► 05_FONCTIONNALITES_AVANCEES
    │               ├──► DocumentViewer → Génération PDF
    │               ├──► IA OpenRouter → Rapport annuel IA
    │               ├──► SI interconnexions → Connecteurs API
    │               ├──► Workflow BPM → Moteur workflow
    │               └──► Moteur de règles → Business Rules Engine
    │
    └──► GAP_MAQUETTE_VS_TDR (écarts identifiés)
            └──► Plan évolutif V2
```

### 3.2 Matrice source → entité backend

| Source | Entités identifiées | Module backend |
|---|---|---|
| `types/index.ts` + `04_DONNEES_MOCK.md` | Demande, Utilisateur, Convention, Anomalie, AuditLog, Connecteur, KpiData | Core domain |
| `06_WORKFLOWS.md` | Workflow, Etape, Transition, Action | Workflow engine |
| `05_FONCTIONNALITES_AVANCEES.md` | RegleMoteur, Condition, ActionRegle | Rules engine |
| `02_VUES_INVENTAIRE.md` | 41 modules API correspondants | API surface |
| `08_FLUX_PAR_PERSONA.md` | Role, Permission, Espace, Persona | RBAC / Auth |
| `02_PROCESSUS_INSTITUTIONNELS.md` | Acteur, Processus, PointDonnee | Master data |
| `01_INVENTAIRE_EXONERATIONS.md` | BaseJuridique, MesureDerogatoire, Impot | Legal registry |
| TDR §Objectifs | TableauDeBord, Rapport, RequeteDynamique | BI / Reporting |

---

## 4. Concepts métier centraux (God Nodes)

### 4.1 Entités fondamentales (sources de vérité)

| Concept | Définition | Sources principales |
|---|---|---|
| **Demande d'exonération** | Formulaire dématérialisé + pièces justificatives + circuit d'approbation | TDR, CdC, PRD, 06_WORKFLOWS, 08_FLUX_P1 |
| **Bénéficiaire** | Entreprise/ONG/institution avec NIF, RCCM, secteur | TDR, 02_PROCESSUS, mock/data.ts |
| **Base juridique** | Texte fondateur (CGI, Code ZFI, Convention, Arrêté) | 01_INVENTAIRE, TDR |
| **Exonération** | Mesure dérogatoire active avec durée, quota, montant | 01_INVENTAIRE, PRD, mock/data.ts |
| **Workflow d'approbation** | Circuit de visas (agent → directeur → ministre) | 06_WORKFLOWS, PRD, TDR |
| **Rôle/Persona** | 7 profils avec permissions différenciées | 08_FLUX_PAR_PERSONA, PRD, 02_VUES |
| **Alerte** | Notification automatique (échéance, quota, anomalie) | 05_FONCTIONNALITES, TDR |
| **Audit Trail** | Journal inaltérable des actions (SHA-256) | PRD, 06_WORKFLOWS_P5 |
| **Interconnexion SI** | Connecteurs SYDONIA, SIGTAS, SIGFiP, GUDEF | 05_FONCTIONNALITES, TDR, 03_DIAGNOSTIC |
| **Dépense fiscale** | Coût budgétaire des exonérations (3% PIB) | 01_INVENTAIRE, 03_DIAGNOSTIC, TDR |

### 4.2 Connexions inattendues (Surprising Connections)

1. **Code additionnel douanier** = clé d'agrégation entre Sydonia et inventaire juridique (02_PROCESSUS.md §2.2) — un simple code technique devient le pont entre SI et droit.

2. **Arrêté n° 148/MEF/UPF du 29/05/2024** = pivot entre conformité juridique (texte fondamental) et conformité technique (critères éligibilité dans OASE) — loi → code.

3. **Persona P4 (Décideur stratégique)** utilise le **même modèle IA** (OpenRouter) que le **rapport annuel** → le décideur et le système de reporting partagent un moteur de génération.

4. **P6 (Citoyen)** sans authentification accède aux données agrégées qui sont **produites par P4** → chaîne de valeur : données brutes → P2 instruit → P4 agrège → P6 consulte.

5. **274 mesures MRD sans SI** (~21%) nécessitent soit un canal OASE direct, soit une suppression → découverte métier majeure pour la priorisation du développement.

---

## 5. Questions exploratoires pour le backend

### 5.1 Questions critiques (à résoudre avant MCD)

1. **Comment modéliser le workflow BPM paramétrable ?** Chaque type d'exonération a un circuit de visas différent. Faut-il un modèle de données de workflow générique (workflow + étapes + transitions) ou des workflows codés en dur par type ?

2. **Comment gérer les 9 libellés de SI différents** pour 5 systèmes réels (variantes orthographiques) ? Table de mapping en base ou normalisation à l'ingestion ?

3. **Quelle stratégie pour les 274 mesures sans SI** ? Créer un canal de saisie direct dans OASE, ou marquer comme "hors périmètre numérique" ?

4. **Comment modéliser les quotas** (consommation vs autorisé) avec alertes 80% et expiration 30j ? Compteur temps réel ou batch périodique ?

5. **Quelle architecture pour les connecteurs SI** ? API Gateway + adaptateurs par SI, ou ESB centralisé ? Le cahier des charges mentionne "API REST/JSON + OAuth2".

### 5.2 Questions de conception

6. **RBAC :** 7 personas × N rôles × M permissions. Modèle Role-Based (rôles prédéfinis) ou Attribute-Based (permissions granulaires par attribut) ? La maquette simule un RBAC complet avec guards de route.

7. **Versionning des bases juridiques :** les lois de finances modifient les exonérations chaque année. Faut-il un historique temporel des mesures (SCD Type 2) ou écrasement avec log ?

8. **Multi-tenant ou mono-tenant ?** Les différentes institutions (OTR, DGBF, SAZOF) ont-elles des bases séparées ou partagent-elles une base unique avec isolation par rôle ?

9. **Génération de documents PDF :** les actes (attestation, arrêté) sont générés avec QR Code. Template-based (PDFKit) ou headless browser (Puppeteer) ?

10. **IA / LLM :** le rapport annuel utilise OpenRouter (GPT-4o-mini, Claude, Gemini). C'est un module externe optionnel ou intégré au backend ? Quelle gestion des prompts et du contexte ?

---

## 6. Feuille de route lecture → livrable backend

| Priorité | Source | Livrable backend | Dépendance |
|---|---|---|---|
| P0 | `types/index.ts` + `04_DONNEES_MOCK.md` | Modèle entités (Prisma schema) | — |
| P0 | `06_WORKFLOWS.md` | Workflow engine spec | Entités |
| P0 | `08_FLUX_PAR_PERSONA.md` | RBAC + Auth spec | Entités |
| P1 | `02_VUES_INVENTAIRE.md` | Plan API endpoints | Entités + RBAC |
| P1 | `05_FONCTIONNALITES_AVANCEES.md` | Rules engine + Connectors spec | Entités |
| P1 | `02_PROCESSUS_INSTITUTIONNELS.md` | Master data model | Entités |
| P2 | `01_INVENTAIRE_EXONERATIONS.md` | Legal registry module | Master data |
| P2 | `03_DIAGNOSTIC.md` | Data quality + Migration plan | Legal registry |
| P2 | TDR + CdC | Non-functional requirements (NFR) | Toutes |

---

## 7. Résumé exécutif

**Corpus analysé :** 20+ documents structurés + code source maquette  
**Sources de vérité :** TDR, CdC, PRD (3 documents)  
**Entités identifiées :** 10 concepts fondamentaux + 41 vues + 6 workflows  
**Questions critiques :** 10 questions à résoudre avant MCD  
**Point d'attention :** 274 mesures sans SI identifié (~21% du stock) = risque/fonctionnalité à arbitrer  

---

*Document produit dans le cadre de l'issue OASE-2 — Cartographier les sources OASE.*
