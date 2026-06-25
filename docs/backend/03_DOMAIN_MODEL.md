# OASE-6 — Domain Model

> **Issue Plane :** OASE-6 (In Progress → Done)  
> **Date :** 2026-06-16  
> **Sources :** OASE-4 (langage métier), OASE-5 (corrections schéma), MRD 2024 (1 316 mesures), types/index.ts, GAP V2, TDR, CdC  
> **Objet :** Modèle objet métier complet. Ce document est la référence pour OASE-11 (Schéma relationnel Prisma) et OASE-10 (Modules NestJS).

---

## Principe de lecture

Chaque entité est décrite avec :
- ses **responsabilités** (ce qu'elle sait / ce qu'elle fait)
- ses **invariants** (règles qui ne peuvent jamais être violées)
- ses **relations** (agrégation, association, composition)
- son **cycle de vie** (états et transitions)

---

## 1. Carte d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGGREGATE: Demande                              │
│                                                                         │
│  Beneficiaire ──────── Demande ──────── BaseJuridique                   │
│       │                  │                    │                         │
│       │                  ├── PieceJointe       ├── CodeAdditionnel      │
│       │                  ├── EtapeWorkflow     └── TexteFondateur       │
│       │                  ├── Decision                                   │
│       │                  └── Notification                               │
│       │                                                                 │
│  Convention ──── Beneficiaire                                           │
│       └── BaseJuridique                                                 │
│                                                                         │
│  Utilisateur ──── Institution ──── Role                                 │
│       └── AuditLog                                                      │
│                                                                         │
│  Anomalie ──── Demande | BaseJuridique                                  │
│  Connecteur ──── Demande (sync SI externe)                              │
│  Quota ──── BaseJuridique | Beneficiaire                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entités du domaine

### 2.1 `Beneficiaire` (Aggregate Root)

**Responsabilités :**
- Représente une personne morale ou physique pouvant demander ou bénéficier d'une exonération.
- Détient son identité légale (NIF, RCCM) vérifiable par croisement OTR.
- Possède un statut fiscal calculé à partir des données SIGTAS/E-TAX.

**Invariants :**
- `nif` est unique et non modifiable après validation.
- Un bénéficiaire avec `statut_fiscal = 'dette_active'` ne peut pas déposer une nouvelle demande tant que la dette n'est pas résolue.
- `type_beneficiaire` ne peut pas être modifié après le premier dossier approuvé.

**Attributs clés :**
```
id                  UUID PK
raison_sociale      VARCHAR(200)   NOT NULL
nif                 VARCHAR(20)    UNIQUE NOT NULL
rccm                VARCHAR(30)    NULL
type_beneficiaire   ENUM           -- entreprise_privee | organisme_public | ong |
                                   -- institution_diplomatique | organisation_internationale |
                                   -- personne_physique | entreprises_et_menages | autre
statut_fiscal       ENUM           -- conforme | dette_active | inconnu
secteur             VARCHAR(100)
region              VARCHAR(100)
accord_siege_id     UUID FK NULL   → AccordSiege (si institution diplomatique)
created_at, updated_at
```

**Relations :**
- 1 → N `Demande` (un bénéficiaire peut avoir plusieurs demandes)
- 1 → N `Convention` (plusieurs conventions d'investissement possibles)
- 0..1 → `AccordSiege`

---

### 2.2 `BaseJuridique` (Aggregate Root)

**Responsabilités :**
- Représente une mesure dérogatoire unique issue du MRD 2024.
- Porte toute l'information légale, fiscale et organisationnelle nécessaire au traitement d'une demande.
- Versionnée selon la stratégie SCD Type 2.

**Invariants :**
- `code_mesure` est immuable après création (format `MRD-2024-NNNN`).
- `code_mesure_mrd` (N° d'ordre MRD) est conservé pour traçabilité vers la source.
- Une `BaseJuridique` ne peut être désactivée que par création d'une nouvelle version, jamais par suppression.
- Si `mode_instruction = 'automatique'`, alors `systeme_information` doit être non nul.

**Attributs clés :**
```
id                         UUID PK
code_mesure                VARCHAR(20)   UNIQUE NOT NULL    -- MRD-2024-0042
code_mesure_mrd            INT           NULL               -- N° d'ordre MRD original
libelle                    TEXT          NOT NULL           -- Disposition légale MRD
impot_concerne             VARCHAR(100)  NOT NULL           -- Impôt, droit et taxes
nature_mesure              VARCHAR(50)   NOT NULL           -- Exonération|Exemption|Abattement|
                                                            -- Réduction d'impôt|Taux réduit|Crédit d'impôt
type_texte_1               VARCHAR(100)                    -- Accord de siège|CGI|Zone Franche...
type_texte_2               VARCHAR(50)                     -- Loi|Convention particulière|Arrêté...
support_juridique_base     TEXT                            -- Texte fondateur (accord, loi, décret)
support_juridique_complem  TEXT          NULL              -- Textes complémentaires
article                    VARCHAR(200)  NULL              -- Article brut MRD
article_cgi_2025           VARCHAR(100)  NULL              -- Article normalisé CGI 2025
portee_categorie           VARCHAR(50)   NOT NULL          -- Permanente|Temporaire_Determinee|
                                                           -- Temporaire_Phase|Liee_Convention
portee_duree_mois          INT           NULL
portee_description         TEXT          NULL              -- Valeur brute MRD
organe_gestion             VARCHAR(20)   NULL              -- CI|CDDI|CDDI/CI|OTR
organe_attribution         VARCHAR(100)  NULL              -- OTR|SAZOF|DGMG|Ministère mines
systeme_information        VARCHAR(100)  NULL              -- Sydonia World|E-TAX|Base DLFC|ND
mode_instruction           VARCHAR(20)   NOT NULL DEFAULT 'manuel'  -- automatique|semi_automatique|manuel
objectif_type              VARCHAR(50)   NULL              -- Economique|Social|Economique et social
branche_activite           VARCHAR(100)  NULL
type_beneficiaire_cible    VARCHAR(100)  NULL              -- Types de bénéficiaires MRD
est_depense_fiscale_2024   BOOLEAN       DEFAULT FALSE
est_evaluee_2024           BOOLEAN       DEFAULT FALSE
donnees_disponibles        BOOLEAN       DEFAULT FALSE
fonction_budgetaire        VARCHAR(100)  NULL
conformite_texte_fondament VARCHAR(10)   NULL              -- oui|non
conformite_directive_uemoa VARCHAR(10)   NULL              -- oui|non|N/A
est_active                 BOOLEAN       DEFAULT TRUE
date_adoption              DATE          NULL
date_abrogation            DATE          NULL
version                    INT           DEFAULT 1
valid_from                 TIMESTAMP     DEFAULT NOW()
valid_to                   TIMESTAMP     NULL
odd                        VARCHAR(20)   NULL
created_at, updated_at
```

**Relations :**
- 1 → N `CodeAdditionnel` (codes Sydonia / E-TAX — table dédiée, cf. OASE-5 Z-06)
- 1 → N `Demande`
- 1 → N `Convention`
- 1 → N `Anomalie`

---

### 2.3 `CodeAdditionnel`

**Responsabilités :**
- Stocke les codes techniques Sydonia World et E-TAX associés à une base juridique.
- Pivot de liaison entre OASE et les SI douanier/impôt.
- Une base juridique peut avoir 0, 1 ou plusieurs codes.

**Attributs clés :**
```
id                  UUID PK
base_juridique_id   UUID FK NOT NULL  → BaseJuridique
code                VARCHAR(50)  NOT NULL
source              ENUM         -- sydonia | etax | autre
est_principal       BOOLEAN      DEFAULT TRUE
created_at
```

---

### 2.4 `Demande` (Aggregate Root — cœur transactionnel)

**Responsabilités :**
- Représente un dossier de demande d'exonération du dépôt jusqu'à la décision finale.
- Orchestre le cycle de vie des pièces jointes, étapes de workflow et notifications.
- Consomme un quota si la mesure le requiert.

**Invariants :**
- `reference` est unique, générée à la soumission (format `OASE-YYYY-NNNNNN`), immuable.
- Une demande ne peut passer en `approuve` que si toutes les étapes du workflow de sa `BaseJuridique` ont un statut `valide`.
- Un bénéficiaire avec `statut_fiscal = 'dette_active'` ne peut pas soumettre (statut bloqué en `brouillon`).
- `montant_fcfa` doit être > 0 pour passer de `brouillon` à `en_cours`.
- Un `quota` consommé ne peut pas dépasser le quota total défini.

**Cycle de vie :**
```
[brouillon] ──soumettre──→ [soumis] ──prise_en_charge──→ [en_instruction]
     ↑                                                          │
     └──────────────────demander_complement──────────────────→ │
                                                               ↓
[expire] ←──expirer── [en_instruction] ──approuver──→ [approuve]
                              └──────────rejeter──────→ [rejete]
[approuve] ──archiver──→ [archive]
```

**Attributs clés :**
```
id                  UUID PK
reference           VARCHAR(20)   UNIQUE NOT NULL    -- OASE-2024-000001
base_juridique_id   UUID FK NOT NULL  → BaseJuridique
beneficiaire_id     UUID FK NOT NULL  → Beneficiaire
instructeur_id      UUID FK NULL      → Utilisateur
statut              ENUM NOT NULL     -- brouillon|soumis|en_instruction|action_requise|
                                      -- approuve|rejete|expire|archive
date_depot          TIMESTAMP NULL
date_echeance       TIMESTAMP NULL
montant_fcfa        BIGINT       NOT NULL DEFAULT 0
quota_consomme      BIGINT       NULL
quota_total         BIGINT       NULL
secteur             VARCHAR(100)
etape_actuelle      VARCHAR(200) NULL
motif_rejet         TEXT         NULL
attestation_url     VARCHAR(500) NULL   -- URL PDF généré post-approbation
qr_code_hash        CHAR(64)     NULL   -- SHA-256 de l'attestation
created_at, updated_at, deleted_at
```

**Relations :**
- N → 1 `BaseJuridique`
- N → 1 `Beneficiaire`
- N → 0..1 `Utilisateur` (instructeur)
- 1 → N `PieceJointe`
- 1 → N `EtapeWorkflow`
- 1 → N `Decision`
- 1 → N `Anomalie`
- 1 → N `Notification`
- 1 → N `AuditLog`

---

### 2.5 `PieceJointe`

**Responsabilités :**
- Stocke les documents déposés avec une demande (pièces de premier rang et second rang).
- Gardée immuable après validation (hash SHA-256 figé).

**Invariants :**
- `hash_sha256` est calculé à l'upload et ne peut jamais être modifié.
- Une pièce validée ne peut pas être supprimée, seulement archivée.
- Le `rang` détermine si la pièce est éliminatoire (`premier`) ou d'évaluation (`second`).

**Attributs clés :**
```
id                  UUID PK
demande_id          UUID FK NOT NULL  → Demande
nom_fichier         VARCHAR(300)
type_mime           VARCHAR(100)
taille_octets       BIGINT
rang                ENUM         -- premier | second
categorie           VARCHAR(100) -- NIF|RCCM|Statuts|Business_plan|Convention...
url_stockage        VARCHAR(500)
hash_sha256         CHAR(64)     NOT NULL
est_valide          BOOLEAN      NULL    -- NULL=non vérifié
valide_par_id       UUID FK NULL  → Utilisateur
date_validation     TIMESTAMP    NULL
created_at
```

---

### 2.6 `EtapeWorkflow`

**Responsabilités :**
- Représente une étape du circuit d'approbation d'une demande.
- La séquence d'étapes est définie par le `WorkflowTemplate` de la `BaseJuridique`.
- Chaque étape peut nécessiter une signature PIN.

**Attributs clés :**
```
id                  UUID PK
demande_id          UUID FK NOT NULL  → Demande
nom_etape           VARCHAR(200)      -- ex: "Contrôle CDDI", "Visa DGBF", "Approbation MEF"
ordre               INT  NOT NULL
acteur_role         VARCHAR(50)       -- role RBAC requis pour cette étape
acteur_id           UUID FK NULL      → Utilisateur   -- qui a traité
statut              ENUM  -- en_attente | en_cours | valide | rejete | annule
date_debut          TIMESTAMP NULL
date_fin            TIMESTAMP NULL
delai_cible_jours   INT  NULL
commentaire         TEXT NULL
pin_signe           BOOLEAN DEFAULT FALSE
created_at
```

---

### 2.7 `Decision`

**Responsabilités :**
- Enregistre la décision formelle (approbation ou rejet) sur une demande.
- Immuable après signature — constitue la preuve légale de la décision.

**Invariants :**
- Une décision ne peut être créée que sur une demande en statut `en_instruction`.
- `pin_hash` doit être présent et valide pour `type = 'approbation'`.
- `document_url` est obligatoire pour `type = 'approbation'` (attestation ou arrêté).

**Attributs clés :**
```
id                  UUID PK
demande_id          UUID FK NOT NULL  → Demande
utilisateur_id      UUID FK NOT NULL  → Utilisateur
type                ENUM  -- approbation | rejet | demande_complement
date_decision       TIMESTAMP NOT NULL
motif               TEXT NULL
document_url        VARCHAR(500) NULL  -- PDF attestation ou arrêté
hash_sha256         CHAR(64)     NULL
pin_hash            CHAR(60)     NULL  -- bcrypt du PIN saisi
created_at
```

---

### 2.8 `Convention` (Aggregate Root)

**Responsabilités :**
- Représente un accord formel entre l'État et un bénéficiaire (investissement, Zone Franche, accord de siège).
- Peut générer plusieurs demandes au fil du temps.
- A ses propres métriques (emplois engagés/créés, montant investi).

**Invariants :**
- `date_fin` > `date_debut`.
- Une convention `resiliee` ne peut plus générer de nouvelles demandes.
- Les engagements (`emplois_engages`) sont contractuels — toute déviation génère une `Anomalie`.

**Attributs clés :**
```
id                  UUID PK
reference           VARCHAR(30)   UNIQUE NOT NULL
beneficiaire_id     UUID FK NOT NULL  → Beneficiaire
base_juridique_id   UUID FK NULL      → BaseJuridique   -- régime juridique de base
regime              VARCHAR(50)       -- ZFI|ZES|Code_Investissements|Minier|Hydrocarbures|Siege
statut              ENUM  -- active | suspendue | resiliee | expiree
date_debut          DATE  NOT NULL
date_fin            DATE  NOT NULL
montant_estime      BIGINT NULL
emplois_engages     INT    NULL
emplois_crees       INT    NULL
zone_zfi            VARCHAR(50) NULL
accord_siege_id     UUID FK NULL   → AccordSiege
created_at, updated_at
```

---

### 2.9 `AccordSiege`

**Responsabilités :**
- Représente un accord de siège avec une institution diplomatique ou internationale.
- Regroupe les mesures permanentes accordées à l'institution ET à son personnel expatrié.

**Attributs clés :**
```
id                  UUID PK
institution         VARCHAR(200)  NOT NULL   -- PNUD, UNESCO, Ambassade France...
type_institution    ENUM  -- onu | union_africaine | ambassade | consulat | ong_internationale | autre
texte_fondateur     TEXT          NULL       -- ex: Accord ONU-Togo 25/05/1968
date_signature      DATE          NULL
est_actif           BOOLEAN       DEFAULT TRUE
created_at
```

---

### 2.10 `Quota`

**Responsabilités :**
- Définit un plafond d'utilisation pour une mesure donnée, selon le contexte (bénéficiaire, convention, exercice budgétaire).
- Déclenche une alerte et bloque les nouvelles demandes si `consomme >= total`.

**Invariants :**
- `total > 0`.
- `consomme` ne peut jamais dépasser `total`.
- `type_quota` détermine la règle de calcul.

**Attributs clés :**
```
id                  UUID PK
base_juridique_id   UUID FK NOT NULL  → BaseJuridique
beneficiaire_id     UUID FK NULL       → Beneficiaire  -- NULL = quota global mesure
convention_id       UUID FK NULL       → Convention
exercice_annuel     INT NULL                           -- si quota annuel
type_quota          ENUM  -- global_mesure | par_beneficiaire | par_convention | annuel
unite               ENUM  -- fcfa | quantite_physique | nombre_operations
total               BIGINT NOT NULL
consomme            BIGINT DEFAULT 0
alerte_seuil_pct    INT DEFAULT 80      -- alerte à 80% consommé
created_at, updated_at
```

---

### 2.11 `Utilisateur`

**Responsabilités :**
- Compte d'accès OASE d'une personne physique.
- Toutes les actions traçables sont liées à un utilisateur.
- Supporte MFA (TOTP) et PIN de signature (bcrypt).

**Invariants :**
- `email` unique et immuable.
- `mfa_active = true` obligatoire pour les rôles P2, P4, P5, P7.
- Un utilisateur `inactif` ne peut pas s'authentifier ni effectuer d'action.
- `pin_hash` requis pour signer une décision.

**Attributs clés :**
```
id                  UUID PK
nom                 VARCHAR(100)
prenom              VARCHAR(100)
email               VARCHAR(200)  UNIQUE NOT NULL
role                VARCHAR(50)   NOT NULL  -- voir §2.12
institution_id      UUID FK NOT NULL  → Institution
statut              ENUM  -- actif | inactif | suspendu
mfa_active          BOOLEAN DEFAULT TRUE
mfa_secret          VARCHAR(100) NULL   -- TOTP secret chiffré (AES-256)
pin_hash            CHAR(60)     NULL   -- bcrypt
derniere_connexion  TIMESTAMP    NULL
ip_derniere_cx      INET         NULL
created_at, updated_at
```

---

### 2.12 `Institution`

**Responsabilités :**
- Organisme institutionnel auquel appartient un ou plusieurs utilisateurs.
- Détermine le périmètre des données accessibles (RBAC par institution).

**Attributs clés :**
```
id                  UUID PK
code                VARCHAR(20)   UNIQUE   -- OTR_CI | OTR_CDDI | DGBF | SAZOF | DGMG...
nom                 VARCHAR(200)
type                ENUM  -- otr | dgbf | dgtcp | agence | dgmg | mae |
                          -- ministere_sectoriel | igf | cour_comptes | upf | dsi | externe
est_active          BOOLEAN DEFAULT TRUE
created_at
```

---

### 2.13 `Anomalie`

**Responsabilités :**
- Irrégularité détectée automatiquement (moteur de règles) ou manuellement (auditeur).
- Peut être rattachée à une demande, une base juridique, ou une convention.
- Cycle de vie géré par P5 (auditeur).

**Invariants :**
- Une anomalie `critique` bloque le traitement de la demande concernée jusqu'à résolution.
- `detectee_par` détermine si le workflow de traitement est automatique ou humain.

**Attributs clés :**
```
id                  UUID PK
categorie           ENUM  -- juridique | financiere | temporelle | procedurale
gravite             ENUM  -- critique | elevee | moyenne | faible
description         TEXT  NOT NULL
demande_id          UUID FK NULL      → Demande
base_juridique_id   UUID FK NULL      → BaseJuridique
convention_id       UUID FK NULL      → Convention
date_detection      TIMESTAMP NOT NULL
statut              ENUM  -- nouvelle | en_examen | traitee | classee
detectee_par        ENUM  -- moteur_regles | auditeur | connecteur
utilisateur_id      UUID FK NULL      → Utilisateur   -- si auditeur
regle_id            VARCHAR(100) NULL                 -- ID règle déclencheuse
created_at
```

---

### 2.14 `AuditLog`

**Responsabilités :**
- Journal inaltérable de toutes les actions sensibles du système.
- Chaque entrée est chaînée à la précédente via `empreinte_sha256` (hash de `hash_precedent || payload`).
- Lecture seule — aucune mise à jour ni suppression permise.

**Invariants :**
- `empreinte_sha256` est calculée à l'insertion et ne peut jamais être modifiée.
- La table est `append-only` — aucune opération UPDATE ou DELETE n'est autorisée (RLS Supabase ou trigger PostgreSQL).
- `utilisateur_id` est obligatoire sauf pour les actions système (`role = 'system'`).

**Attributs clés :**
```
id                  UUID PK
horodatage          TIMESTAMP NOT NULL DEFAULT NOW()
utilisateur_id      UUID FK NULL      → Utilisateur
role_au_moment      VARCHAR(50)       -- snapshot du rôle au moment de l'action
institution         VARCHAR(100)
action              VARCHAR(100) NOT NULL  -- SOUMETTRE_DEMANDE | APPROUVER | REJETER |
                                           -- CREER_UTILISATEUR | MODIFIER_WORKFLOW...
entite              VARCHAR(50)  NOT NULL  -- demandes | conventions | utilisateurs...
entite_id           UUID         NOT NULL
ancienne_valeur     JSONB NULL
nouvelle_valeur     JSONB NULL
ip                  VARCHAR(45)
user_agent          TEXT NULL
hash_precedent      CHAR(64) NULL     -- hash de l'entrée précédente
empreinte_sha256    CHAR(64) NOT NULL
```

---

### 2.15 `Connecteur`

**Responsabilités :**
- Représente une interface vers un SI externe (Sydonia, SIGTAS, SIGFiP, GUDEF, E-TAX).
- Surveille la santé de la connexion en temps réel.
- Stocke la configuration d'authentification chiffrée.

**Invariants :**
- `config_auth` est toujours chiffré (AES-256) avant stockage.
- Un connecteur en `erreur` active le mode `fallback_manuel`.
- `taux_erreur > 5%` pendant 15 min déclenche une alerte P7 (DSI).

**Attributs clés :**
```
id                  UUID PK
nom                 VARCHAR(50)  NOT NULL   -- SYDONIA World | SIGTAS | SIGFiP | GUDEF | E-TAX
code_systeme        VARCHAR(20)  UNIQUE     -- SYDONIA | SIGTAS | SIGFIP | GUDEF | ETAX
institution_id      UUID FK NULL   → Institution
statut              ENUM  -- actif | erreur | maintenance | inactif
endpoint            VARCHAR(500)
config_auth         JSONB NOT NULL   -- OAuth2 client_id/secret chiffré AES-256
latence_ms          INT  DEFAULT 0
taux_erreur         DECIMAL(5,2) DEFAULT 0
dernier_sync        TIMESTAMP NULL
volume_24h          INT DEFAULT 0
fallback_manuel     BOOLEAN DEFAULT FALSE
created_at, updated_at
```

---

### 2.16 `Notification`

**Responsabilités :**
- Message envoyé à un utilisateur suite à un événement système.
- Supporte les canaux : in-app, email, SMS (selon config).

**Attributs clés :**
```
id                  UUID PK
utilisateur_id      UUID FK NOT NULL  → Utilisateur
demande_id          UUID FK NULL      → Demande
type                VARCHAR(100)  -- SOUMISSION | INSTRUCTION | APPROBATION | REJET |
                                  -- COMPLEMENT | ECHEANCE | QUOTA_ALERTE | ANOMALIE
canal               ENUM  -- inapp | email | sms
titre               VARCHAR(200)
corps               TEXT
est_lue             BOOLEAN DEFAULT FALSE
date_lecture        TIMESTAMP NULL
created_at
```

---

## 3. Agrégats et frontières de transaction

| Agrégat | Root | Invariants transactionnels |
|---|---|---|
| **Demande** | `Demande` | Statut + étapes + pièces + décision cohérents |
| **Bénéficiaire** | `Beneficiaire` | NIF unique + statut fiscal synchronisé |
| **BaseJuridique** | `BaseJuridique` | Version SCD T2 + code immuable |
| **Convention** | `Convention` | Dates + engagements contractuels |
| **Audit** | `AuditLog` | Chaîne de hash intègre |
| **Quota** | `Quota` | consomme ≤ total |

---

## 4. Événements du domaine (Domain Events)

```
DemandeSoumise           { demandeId, beneficiaireId, baseJuridiqueId, timestamp }
DemandeInstruite         { demandeId, instructeurId, timestamp }
DemandeApprouvee         { demandeId, decisionId, attestationUrl, timestamp }
DemandeRejetee           { demandeId, decisionId, motif, timestamp }
ComplementDemande        { demandeId, instructeurId, motif, timestamp }
QuotaDepasse             { quotaId, demandeId, consomme, total, timestamp }
QuotaAlerte              { quotaId, pourcentage, timestamp }
AnomalieDetectee         { anomalieId, gravite, categorie, entiteId, timestamp }
ConnecteurEnErreur       { connecteurId, latence_ms, timestamp }
ConnecteurRétabli        { connecteurId, timestamp }
UtilisateurConnecte      { utilisateurId, ip, timestamp }
EcheanceProche           { demandeId | baseJuridiqueId, joursRestants, timestamp }
```

---

## 5. Services du domaine

| Service | Responsabilité |
|---|---|
| `WorkflowRouter` | Détermine la séquence d'étapes selon `BaseJuridique.type_texte_1` et `organe_gestion` |
| `QuotaManager` | Vérifie et incrémente les quotas lors de chaque approbation |
| `AnomalieDetector` | Moteur de règles paramétrables évalué à chaque changement de statut |
| `AttestationGenerator` | Génère le PDF + QR Code + SHA-256 post-approbation |
| `ConnecteurGateway` | Façade vers les SI externes avec circuit-breaker et retry |
| `AuditChainer` | Calcule et enregistre le hash chaîné pour chaque `AuditLog` |
| `MfaService` | Génère et vérifie les codes TOTP (RFC 6238) |
| `NotificationDispatcher` | Route les notifications vers in-app / email / SMS selon préférences |

---

## 6. Mapping modules NestJS → entités

| Module NestJS | Entités principales | Événements produits |
|---|---|---|
| `AuthModule` | Utilisateur, Institution | UtilisateurConnecte |
| `BeneficiaireModule` | Beneficiaire, AccordSiege | — |
| `DemandeModule` | Demande, PieceJointe, EtapeWorkflow | DemandeSoumise, DemandeApprouvee... |
| `DecisionModule` | Decision | DemandeApprouvee, DemandeRejetee |
| `BaseJuridiqueModule` | BaseJuridique, CodeAdditionnel | — |
| `ConventionModule` | Convention | — |
| `QuotaModule` | Quota | QuotaDepasse, QuotaAlerte |
| `AnomalieModule` | Anomalie | AnomalieDetectee |
| `AuditModule` | AuditLog | — (consomme tous les événements) |
| `ConnecteurModule` | Connecteur | ConnecteurEnErreur, ConnecteurRétabli |
| `NotificationModule` | Notification | — |
| `WorkflowModule` | EtapeWorkflow + templates | — |
| `OpenDataModule` | (vues agrégées anonymisées) | — |
| `AdminModule` | Utilisateur, Institution, Connecteur | — |

---

*Document produit dans le cadre de l'issue OASE-6 — Domain Model OASE.*  
*Alimente directement OASE-7 (statuts), OASE-8 (RBAC), OASE-11 (Prisma schema).*
