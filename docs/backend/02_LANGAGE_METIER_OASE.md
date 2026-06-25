# OASE-4 — Langage Métier Commun (Ubiquitous Language)

> **Issue Plane :** OASE-4 (Produire langage métier commun)  
> **Date :** 2026-06-16  
> **Sources :** types/index.ts, 04_DONNEES_MOCK.md, 06_WORKFLOWS.md, 08_FLUX_PAR_PERSONA.md, 01_INVENTAIRE_EXONERATIONS.md, TDR, CdC  
> **Objet :** Dictionnaire de référence partagé entre équipe métier, développeurs backend et développeurs frontend. Chaque terme a un nom canonique, un type de données, et sa traduction code.

---

## Règle d'or

> **Un concept = un nom. Ce document fait foi.** Toute déviation dans le code source, les API, les migrations SQL ou les communications client doit être corrigée pour s'aligner sur ce lexique.

---

## 1. Entités fondamentales

### `Demande`
- **Nom métier :** Dossier de demande d'exonération
- **Définition :** Formulaire numérique soumis par un bénéficiaire pour obtenir l'application d'une mesure d'exonération fiscale ou douanière. Passe par un circuit d'approbation avant de générer une attestation ou un arrêté.
- **Table SQL :** `demandes`
- **Attributs canoniques :**

| Attribut | Type SQL | Type TS | Valeurs / Format |
|---|---|---|---|
| `id` | UUID PK | `string` | UUID v4 |
| `reference` | VARCHAR(20) UNIQUE | `string` | `OASE-YYYY-NNNNNN` |
| `type` | ENUM | `ExoType` | voir §2.1 |
| `beneficiaire_id` | UUID FK | `string` | → `beneficiaires` |
| `nif` | VARCHAR(20) | `string` | `TG-XXX-YYYY-X` |
| `rccm` | VARCHAR(30) | `string` | `TG-LOM-YYYY-X-NNNN` |
| `statut` | ENUM | `StatutDemande` | voir §2.2 |
| `date_depot` | TIMESTAMP | `string` (ISO) | — |
| `date_echeance` | TIMESTAMP NULL | `string?` | — |
| `montant_fcfa` | BIGINT | `number` | en FCFA |
| `quota_consomme` | BIGINT NULL | `number?` | en FCFA ou unité |
| `quota_total` | BIGINT NULL | `number?` | en FCFA ou unité |
| `etape_actuelle` | VARCHAR(100) | `string` | libellé de l'étape workflow |
| `instructeur_id` | UUID FK NULL | `string?` | → `utilisateurs` |
| `secteur` | VARCHAR(100) | `string` | ex. `Industrie`, `Agriculture` |
| `base_juridique_id` | UUID FK | `string` | → `bases_juridiques` |
| `created_at` | TIMESTAMP | — | auto |
| `updated_at` | TIMESTAMP | — | auto |

---

### `Beneficiaire`
- **Nom métier :** Opérateur économique / Bénéficiaire de l'exonération
- **Définition :** Entreprise, organisme public, ONG ou institution diplomatique ayant déposé ou susceptible de déposer une demande d'exonération.
- **Table SQL :** `beneficiaires`

| Attribut | Type SQL | Remarque |
|---|---|---|
| `id` | UUID PK | — |
| `raison_sociale` | VARCHAR(200) | Nom légal |
| `nif` | VARCHAR(20) UNIQUE | Numéro d'Identification Fiscale |
| `rccm` | VARCHAR(30) | Registre du Commerce |
| `secteur` | VARCHAR(100) | Branche d'activité |
| `type_beneficiaire` | ENUM | voir §2.3 |
| `statut_fiscal` | ENUM | `conforme`, `dette_active`, `inconnu` |
| `region` | VARCHAR(100) | Région du Togo |
| `created_at` | TIMESTAMP | — |

---

### `BaseJuridique`
- **Nom métier :** Texte fondateur / Base juridique de l'exonération
- **Définition :** Loi, article de code, arrêté ou convention instituant une mesure dérogatoire fiscale ou douanière. Correspond à une ligne du MRD 2024.
- **Table SQL :** `bases_juridiques`

| Attribut | Type SQL | Remarque |
|---|---|---|
| `id` | UUID PK | — |
| `code_mesure` | VARCHAR(20) UNIQUE | ex. `MRD-0042` |
| `libelle` | TEXT | Intitulé complet |
| `type_texte` | VARCHAR(100) | Loi, Arrêté, Convention, CGI... |
| `article` | VARCHAR(100) | ex. `CGI Art. 215` |
| `code_additionnel_douane` | VARCHAR(20) NULL | Code SI Sydonia |
| `code_additionnel_impots` | VARCHAR(20) NULL | Code SI E-TAX |
| `portee` | ENUM | `Permanente`, `Temporaire` |
| `est_depense_fiscale` | BOOLEAN | Classée DF 2024 |
| `est_active` | BOOLEAN | En vigueur aujourd'hui |
| `date_adoption` | DATE NULL | Peut être inconnue |
| `date_abrogation` | DATE NULL | Si abrogée |
| `version` | INT DEFAULT 1 | Versioning SCD Type 2 |
| `conformite_texte_fondamental` | ENUM NULL | `oui`, `non` |
| `conformite_directive_uemoa` | ENUM NULL | `oui`, `non` |

---

### `Convention`
- **Nom métier :** Convention d'investissement / Agrément zone franche
- **Définition :** Accord signé entre l'État togolais et un opérateur économique, accordant un régime fiscal privilégié sur une durée déterminée, avec engagements sur emplois et investissements.
- **Table SQL :** `conventions`

| Attribut | Type SQL | Type TS | Remarque |
|---|---|---|---|
| `id` | UUID PK | `string` | — |
| `reference` | VARCHAR(30) UNIQUE | `string` | — |
| `beneficiaire_id` | UUID FK | `string` | — |
| `regime` | VARCHAR(50) | `string` | `ZFI`, `ZES`, `Code Investissements` |
| `statut` | ENUM | `Convention['statut']` | `active`, `suspendue`, `resiliee`, `expiree` |
| `date_debut` | DATE | `string` | — |
| `date_fin` | DATE | `string` | — |
| `montant_estime` | BIGINT | `number` | en FCFA |
| `emplois_engages` | INT | `number` | Engagement contractuel |
| `emplois_crees` | INT | `number` | Réalisé |
| `zone_zfi` | VARCHAR(50) NULL | — | Code zone ZFI/ZES |

---

### `Anomalie`
- **Nom métier :** Anomalie / Constat de contrôle
- **Définition :** Irrégularité détectée automatiquement par le moteur de règles ou manuellement par un auditeur, sur un dossier ou une mesure d'exonération.
- **Table SQL :** `anomalies`

| Attribut | Type SQL | Type TS | Valeurs |
|---|---|---|---|
| `id` | UUID PK | `string` | — |
| `categorie` | ENUM | `AnomalieCategorie` | voir §2.4 |
| `gravite` | ENUM | `AnomalieGravite` | voir §2.5 |
| `description` | TEXT | `string` | — |
| `demande_id` | UUID FK NULL | `string` | — |
| `base_juridique_id` | UUID FK NULL | — | — |
| `date_detection` | TIMESTAMP | `string` | — |
| `statut` | ENUM | `Anomalie['statut']` | `nouvelle`, `examinee`, `traitee` |
| `detectee_par` | ENUM | — | `moteur_regles`, `auditeur` |
| `utilisateur_id` | UUID FK NULL | — | Si détectée par auditeur |

---

### `AuditLog`
- **Nom métier :** Journal inaltérable / Trace d'audit
- **Définition :** Enregistrement horodaté de chaque action effectuée dans le système. Lecture seule. Protégé par empreinte SHA-256.
- **Table SQL :** `audit_logs`

| Attribut | Type SQL | Type TS | Remarque |
|---|---|---|---|
| `id` | UUID PK | `string` | — |
| `horodatage` | TIMESTAMP | `string` | Précision milliseconde |
| `utilisateur_id` | UUID FK | `string` | — |
| `structure` | VARCHAR(100) | `string` | OTR, DGBF, UPF... |
| `role` | VARCHAR(50) | `string` | Rôle au moment de l'action |
| `action` | VARCHAR(100) | `string` | ex. `APPROUVER_DEMANDE` |
| `entite` | VARCHAR(50) | `string` | ex. `demandes`, `conventions` |
| `entite_id` | UUID | — | ID de l'entité modifiée |
| `ancienne_valeur` | JSONB NULL | `string?` | Snapshot avant |
| `nouvelle_valeur` | JSONB NULL | `string?` | Snapshot après |
| `ip` | INET | `string` | Adresse IP client |
| `empreinte_sha256` | CHAR(64) | — | Hash chaîné |

---

### `Connecteur`
- **Nom métier :** Connecteur de système d'information / Adaptateur SI
- **Définition :** Interface technique permettant à OASE de communiquer avec un système externe (Sydonia World, SIGTAS, SIGFiP, GUDEF, E-TAX).
- **Table SQL :** `connecteurs`

| Attribut | Type SQL | Type TS | Remarque |
|---|---|---|---|
| `id` | UUID PK | `string` | — |
| `nom` | VARCHAR(50) | `string` | ex. `SYDONIA World` |
| `systeme` | VARCHAR(50) | `string` | ex. `OTR Douanes` |
| `statut` | ENUM | `ConnecteurStatut` | voir §2.6 |
| `latence_ms` | INT | `number` | Mesurée en temps réel |
| `taux_erreur` | DECIMAL(5,2) | `number` | % sur 24h |
| `dernier_sync` | TIMESTAMP | `string` | — |
| `volume_24h` | INT | `number` | Nb transactions |
| `endpoint` | VARCHAR(500) | `string` | URL API cible |
| `config_auth` | JSONB | — | OAuth2 client_id/secret (chiffré) |

---

### `Utilisateur`
- **Nom métier :** Compte utilisateur / Agent
- **Définition :** Personne physique disposant d'un accès OASE avec un rôle défini, rattachée à une institution.
- **Table SQL :** `utilisateurs`

| Attribut | Type SQL | Type TS | Remarque |
|---|---|---|---|
| `id` | UUID PK | `string` | — |
| `nom` | VARCHAR(100) | `string` | — |
| `prenom` | VARCHAR(100) | `string` | — |
| `email` | VARCHAR(200) UNIQUE | `string` | — |
| `role` | ENUM | `Role` | voir §2.7 |
| `structure` | VARCHAR(100) | `string` | Institution d'appartenance |
| `statut` | ENUM | `Utilisateur['statut']` | `actif`, `inactif` |
| `derniere_connexion` | TIMESTAMP NULL | `string` | — |
| `mfa_active` | BOOLEAN DEFAULT true | — | MFA obligatoire P1-P5,P7 |
| `pin_hash` | CHAR(60) NULL | — | PIN signature électronique (bcrypt) |

---

## 2. Enums / Types énumérés

### 2.1 `ExoType` — Type d'exonération

| Valeur code | Libellé affiché | Description |
|---|---|---|
| `douaniere` | Exonération douanière | Franchise de droits de douane (DD, RS, TVA import.) |
| `fiscale_is` | Exonération IS | Dérogation impôt sur les sociétés |
| `fiscale_tva` | Exonération TVA | Dérogation taxe sur la valeur ajoutée |
| `zone_franche` | Régime Zone Franche | ZFI / ZES — exonérations multiples |
| `code_investissement` | Convention d'investissement | Code des Investissements |
| `sectorielle` | Exonération sectorielle | Codes miniers, agricoles, sanitaires... |

### 2.2 `StatutDemande` — Statut d'une demande

| Valeur code | Libellé affiché | Couleur | Signification |
|---|---|---|---|
| `brouillon` | Brouillon | Gris | Sauvegardée, non soumise |
| `en_cours` | En cours | Bleu | En cours d'instruction |
| `action_requise` | Action requise | Orange | P1 doit compléter le dossier |
| `approuve` | Approuvé | Vert | Circuit validé, attestation générée |
| `rejete` | Rejeté | Rouge | Refusé avec motif |
| `expire` | Expiré | Neutre | Date d'échéance dépassée |

### 2.3 `TypeBeneficiaire`

| Valeur | Description |
|---|---|
| `entreprise_privee` | Société privée (SA, SARL, SAS...) |
| `organisme_public` | Ministère, régie, établissement public |
| `ong` | Organisation non gouvernementale |
| `institution_diplomatique` | Ambassade, mission diplomatique |
| `organisation_internationale` | FMI, Banque Mondiale, ONU, UA... |
| `personne_physique` | Exploitant individuel |
| `autre` | Non classé |

### 2.4 `AnomalieCategorie`

| Valeur | Description |
|---|---|
| `juridique` | Non-conformité au texte fondateur ou directive UEMOA |
| `financiere` | Dépassement de quota ou montant incohérent |
| `temporelle` | Exonération utilisée après expiration |
| `procedurale` | Pièces manquantes, étapes non respectées |

### 2.5 `AnomalieGravite`

| Valeur | Couleur | Action requise |
|---|---|---|
| `critique` | Rouge | Blocage immédiat + alerte P5 + P4 |
| `elevee` | Orange | Traitement sous 48h |
| `moyenne` | Jaune | Traitement sous 5 jours ouvrés |
| `faible` | Bleu | À consigner pour audit annuel |

### 2.6 `ConnecteurStatut`

| Valeur | Icône | Signification |
|---|---|---|
| `actif` | ✅ | Connecteur opérationnel |
| `erreur` | ❌ | En erreur, fallback activé |
| `maintenance` | 🔧 | Maintenance planifiée |

### 2.7 `Role` — Rôles RBAC

> Codes alignés sur `ref_roles` (base) et `05_RBAC_PERMISSIONS.md`.

| Valeur code | Persona | Institution |
|---|---|---|
| `beneficiaire` | P1 — Opérateur économique | Entreprise privée |
| `agent_ci` | P2 — OTR Centre des Impôts | OTR — Impôts internes |
| `agent_cddi` | P2 — OTR CDDI (douanes) | OTR — Douanes |
| `agent_dgbf` | P2 — Régie financière (budget) | DGBF / MEF |
| `agent_dgtcp` | P2 — Trésorerie | DGTCP / Trésor |
| `agent_agence` | P3 — Agence de promotion | API-ZF / SAZOF |
| `agent_mae` | P3 ext. — Affaires étrangères | MAE |
| `agent_dgmg` | P3 ext. — Mines et géologie | DGMG |
| `agent_ministere` | P2 ext. — Ministère technique | Mines, Agriculture... |
| `decideur` | P4 — Décideur stratégique | UPF / MEF |
| `agent_conedef` | P4 ext. — Évaluation DF | CONEDEF / OTR |
| `auditeur` | P5 — Organe de contrôle | IGF / Cour des Comptes |
| `public` | P6 — Citoyen / Open Data | — |
| `admin_si` | P7 — Administrateur SI | DSI / MEF |
| `system` | — Actions automatiques CRON | — |

---

## 3. Termes métier institutionnels

| Terme | Acronyme | Définition |
|---|---|---|
| Outil Automatisé de Suivi des Exonérations | **OASE** | Le système applicatif développé |
| Unité de Politique Fiscale | **UPF** | Maître d'ouvrage, propriétaire fonctionnel OASE |
| Office Togolais des Recettes | **OTR** | Régie douanes + impôts |
| Direction Générale du Budget et des Finances | **DGBF** | Suivi dépenses fiscales |
| Direction Générale du Trésor et de la Comptabilité Publique | **DGTCP** | Trésorerie |
| Agence de Promotion des Investissements et Zones Franches | **API-ZF** | Gestion zones franches |
| Société des Zones Franches | **SAZOF** | Opérateur ZFI Lomé |
| Direction Générale des Mines et de la Géologie | **DGMG** | Régime minier |
| Comité National d'Évaluation des Dépenses Fiscales | **CONEDEF** | Évaluation annuelle DF |
| Inspection Générale des Finances | **IGF** | Contrôle interne |
| Master Reference Document | **MRD 2024** | Base de 1 316 mesures dérogatoires |
| Dépense Fiscale | **DF** | Manque à gagner fiscal chiffré |
| Mesure Dérogatoire | **MD** | Toute mesure d'exonération |
| Loi de Finances Initiale | **LFI** | Budget voté annuellement |
| Zone Franche Industrielle | **ZFI** | Zone avec régime fiscal exceptionnel |
| Zone Économique Spéciale | **ZES** | Zone avec régime économique exceptionnel |
| Système de dédouanement de la CEDEAO | **SYDONIA World** | SI douanier principal |
| Système Intégré de Gestion des recettes | **SIGTAS** | SI impôts internes |
| Système Intégré de Gestion des Finances Publiques | **SIGFiP** | SI DGBF |
| Guichet Unique de Dépenses Fiscales | **GUDEF** | SI DGTCP |
| Arrêté n° 148/MEF/UPF du 29/05/2024 | **Arrêté 148** | Cadre critères éligibilité OASE |
| Accord de siège | — | Convention accordant exonérations à mission diplomatique |
| Code additionnel | — | Code technique Sydonia/E-TAX liant mesure juridique ↔ SI |
| Pièce de premier rang | — | Document éliminatoire (NIF, RCCM, base juridique) |
| Pièce de second rang | — | Document d'évaluation (business plan, emplois projetés) |
| Attestation d'exonération | — | Acte officiel généré après approbation (PDF + QR Code) |
| Arrêté d'exonération | — | Acte ministériel pour grandes conventions |
| Récépissé | — | Preuve de dépôt horodatée remise au bénéficiaire à la soumission |
| Quota | — | Volume autorisé d'exonération (douanière = valeur en FCFA ou unité) |
| Dépense fiscale/PIB | — | Ratio de référence OASE : ~3% PIB, ~18-20% recettes |

---

## 4. Termes techniques OASE

| Terme | Définition | Technologie |
|---|---|---|
| **Moteur de règles** | Évaluateur de conditions métier paramétrables (quota, dette, expiration) | Laravel + JSON rules |
| **Workflow BPM** | Éditeur visuel de circuits d'approbation par type d'exonération | Laravel workflow engine |
| **Connecteur SI** | Adaptateur API vers un système externe (Sydonia, SIGTAS…) | REST/JSON + OAuth2 |
| **RBAC** | Contrôle d'accès basé sur les rôles | Laravel Gates + Policies |
| **MFA** | Authentification multi-facteurs (OTP 6 chiffres, 30s) | TOTP (RFC 6238) |
| **Signature PIN** | Code personnel 4-6 chiffres pour valider un visa ou approuver un dossier | Bcrypt hash |
| **Audit Trail** | Journal chainé et inaltérable, SHA-256 par entrée | PostgreSQL append-only |
| **DocumentViewer** | Visualiseur inline de PDF avec génération de documents | PDFKit / Puppeteer |
| **Open Data** | Portail public avec données agrégées et API Swagger | API REST publique |
| **OpenRouter** | Passerelle multi-modèles IA (GPT-4o, Claude, Gemini) pour génération rapport | REST API externe |
| **SCD Type 2** | Stratégie de versionning historique des bases juridiques | PostgreSQL + `version` + `valid_from/to` |
| **Circuit breaker** | Protection anti-cascade sur appels SI externes | Guzzle + retry policy |
| **Saga pattern** | Orchestration de transactions distribuées (ex: push Sydonia + SIGTAS) | Laravel Job + Compensating actions |

---

## 5. Conventions de nommage

### 5.1 Base de données (SQL)
- Tables : `snake_case` pluriel → `demandes`, `bases_juridiques`, `audit_logs`
- Clés primaires : `id` UUID
- Clés étrangères : `{table_singulier}_id` → `beneficiaire_id`, `instructeur_id`
- Timestamps : `created_at`, `updated_at`, `deleted_at` (soft delete)
- Booléens : préfixe `est_` ou `is_` → `est_active`, `est_depense_fiscale`
- Enums : `snake_case` → `en_cours`, `zone_franche`

### 5.2 API REST (Laravel)
- Routes : `kebab-case` → `GET /api/demandes`, `POST /api/demandes/{id}/approuver`
- Ressources : `PascalCase` → `DemandeResource`, `BeneficiaireResource`
- Actions non-CRUD : verbe-objet → `/approuver`, `/rejeter`, `/soumettre`, `/notifier-otr`
- Réponses : `camelCase` dans JSON → `dateDepot`, `montantFCFA`

### 5.3 Code TypeScript (frontend)
- Interfaces : `PascalCase` → `Demande`, `Utilisateur`, `AuditLog`
- Enums/types union : `PascalCase` → `StatutDemande`, `ExoType`, `Role`
- Variables : `camelCase` → `dateDepot`, `quotaConsomme`
- Constantes d'affichage : `MAJUSCULE_SNAKE` → `STATUT_LABELS`, `EXO_TYPE_LABELS`
- Composants Vue : `PascalCase` → `DemandeDetailView.vue`, `KpiCard.vue`

---

## 6. Traçabilité source → code

| Terme métier | Fichier source | Ligne(s) | Implémentation |
|---|---|---|---|
| `StatutDemande` | `maquette/src/types/index.ts` | 1 | `type StatutDemande = 'en_cours' \| ...` |
| `ExoType` | `maquette/src/types/index.ts` | 2 | `type ExoType = 'douaniere' \| ...` |
| `Role` | `maquette/src/types/index.ts` | 3-16 | `type Role = 'beneficiaire' \| ...` |
| `Demande` | `maquette/src/types/index.ts` | 48-65 | `interface Demande { ... }` |
| `Convention` | `maquette/src/types/index.ts` | 109-120 | `interface Convention { ... }` |
| `AuditLog` | `maquette/src/types/index.ts` | 122-133 | `interface AuditLog { ... }` |
| `Connecteur` | `maquette/src/types/index.ts` | 76-86 | `interface Connecteur { ... }` |
| Données mock réalistes | `maquette/src/mock/data.ts` | — | Seed data de référence |
| STATUT_COLORS | `maquette/src/types/index.ts` | 21-28 | Couleurs Vuetify par statut |
| Code additionnel | `comprehension/04_DONNEES_MOCK.md` | §Connecteurs SI | Colonne MRD pivot SI |
| Arrêté 148 critères | `kb/outputs/02_PROCESSUS*.md` | §1.2 | Règles métier paramétrables |

---

*Document produit dans le cadre de l'issue OASE-4 — Langage métier commun.*
