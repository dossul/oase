# OASE — Modèle Logique de Données MySQL 8/9 (MLD v3)

> **Objectif :** couvrir 100 % du périmètre fonctionnel OASE avec un schéma relationnel corrigé, normalisé et prêt à exécuter sous MySQL 8/9.
>
> **Corrections majeures par rapport aux versions précédentes :**
> - SCD Type 2 réel sur `bases_juridiques` via une entité stable (`bases_juridiques`) et une table de versions (`base_juridique_versions`).
> - Workflow BPM décomposé en tables relationnelles (`workflow_templates`, `workflow_template_etapes`, `workflow_template_transitions`, `demande_workflow_instances`, `demande_workflow_etapes`) au lieu d’un JSON opaque.
> - Historisation des quotas via `quota_mouvements`.
> - Génération d’actes administratifs normalisée (`actes`) avec QR code et hash.
> - Audit log inaltérable protégé par triggers `BEFORE UPDATE/DELETE`.
> - Tous les enums remplacés par des tables `ref_*` normalisées.
> - Ajout des tables manquantes : templates de notification, préférences, file d’attente de jobs, logs connecteurs, agrégats Open Data, imports MRD, archivage, sessions/push mobile.

---

## Conventions

- Toutes les clés techniques sont des `CHAR(36)` avec `DEFAULT (UUID())`.
- Toutes les tables utilisent `ENGINE=InnoDB`, `CHARSET=utf8mb4`, `COLLATE=utf8mb4_unicode_ci`.
- Les enums métier sont externalisées dans des tables `ref_*` (code VARCHAR(50) PK, libelle, description, ordre, couleur, est_actif).
- Les champs JSON sont utilisés uniquement pour des données structurelles non interrogeables en SQL (payloads, préférences, configurations chiffrées).
- Les montants sont stockés en `BIGINT` centimes FCFA (ou unité physique définie dans `ref_unites_quota`).

---

## 1. Tables de référence (`ref_*`)

```sql
-- ============================================================
-- 1. TABLES DE REFERENCE
-- ============================================================

CREATE TABLE ref_types_institution (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_utilisateur (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_beneficiaire (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_fiscal (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_natures_mesure (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_portees_categorie (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_modes_instruction (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_organes_gestion (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_demande (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  is_final TINYINT(1) NOT NULL DEFAULT 0,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_etape (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_convention (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_anomalie (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_connecteur (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_rangs_piece (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_quota (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_unites_quota (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_categories_anomalie (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_gravites_anomalie (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_sources_detection (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_decision (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_regimes_convention (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_canaux_notification (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_accord_siege (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_sources_code (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_acte (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_mouvement_quota (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_notification (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_notification (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_etats_job (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_job (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_statuts_archivage (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_rapport (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_document (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_parametre (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_canaux_push (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ref_types_agrement (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. Données de référence métier

```sql
-- ============================================================
-- 2. DONNEES DE REFERENCE METIER
-- ============================================================

CREATE TABLE institutions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(200) NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  est_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_type_code (type_code),
  INDEX idx_est_active (est_active),
  FOREIGN KEY (type_code) REFERENCES ref_types_institution(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accords_siege (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  institution VARCHAR(200) NOT NULL,
  type_institution_code VARCHAR(50) NOT NULL,
  texte_fondateur TEXT DEFAULT NULL,
  date_signature DATE DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_type_institution_code (type_institution_code),
  FOREIGN KEY (type_institution_code) REFERENCES ref_types_accord_siege(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entite stable du referentiel MRD. Le versionnage SCD Type 2 est dans base_juridique_versions.
CREATE TABLE bases_juridiques (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code_mesure VARCHAR(20) NOT NULL UNIQUE,
  code_mesure_mrd INT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_code_mesure (code_mesure),
  INDEX idx_code_mesure_mrd (code_mesure_mrd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SCD Type 2 : une ligne par version annuelle (ou a chaque modification).
CREATE TABLE base_juridique_versions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  base_juridique_id CHAR(36) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  libelle TEXT NOT NULL,
  impot_concerne VARCHAR(100) NOT NULL,
  nature_mesure_code VARCHAR(50) NOT NULL,
  type_texte_1 VARCHAR(100) DEFAULT NULL,
  type_texte_2 VARCHAR(50) DEFAULT NULL,
  support_juridique_base TEXT DEFAULT NULL,
  support_juridique_complem TEXT DEFAULT NULL,
  article VARCHAR(200) DEFAULT NULL,
  article_cgi_2025 VARCHAR(100) DEFAULT NULL,
  portee_categorie_code VARCHAR(50) NOT NULL DEFAULT 'Permanente',
  portee_duree_mois INT DEFAULT NULL,
  portee_description TEXT DEFAULT NULL,
  organe_gestion_code VARCHAR(50) DEFAULT NULL,
  organe_attribution VARCHAR(100) DEFAULT NULL,
  systeme_information VARCHAR(100) DEFAULT NULL,
  mode_instruction_code VARCHAR(50) NOT NULL DEFAULT 'manuel',
  objectif_type VARCHAR(50) DEFAULT NULL,
  branche_activite VARCHAR(100) DEFAULT NULL,
  type_beneficiaire_cible VARCHAR(100) DEFAULT NULL,
  est_depense_fiscale_2024 TINYINT(1) NOT NULL DEFAULT 0,
  est_evaluee_2024 TINYINT(1) NOT NULL DEFAULT 0,
  donnees_disponibles TINYINT(1) NOT NULL DEFAULT 0,
  fonction_budgetaire VARCHAR(100) DEFAULT NULL,
  conformite_texte_fondament VARCHAR(10) DEFAULT NULL,
  conformite_directive_uemoa VARCHAR(10) DEFAULT NULL,
  odd VARCHAR(20) DEFAULT NULL,
  programme_dotation VARCHAR(100) DEFAULT NULL,
  position_sh VARCHAR(50) DEFAULT NULL,
  est_active TINYINT(1) NOT NULL DEFAULT 1,
  date_adoption DATE DEFAULT NULL,
  date_abrogation DATE DEFAULT NULL,
  valid_from DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  valid_to DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_base_juridique_version (base_juridique_id, version),
  INDEX idx_base_juridique_id (base_juridique_id),
  INDEX idx_code_mesure_version (valid_from, valid_to),
  INDEX idx_type_texte_1 (type_texte_1),
  INDEX idx_organe_gestion_code (organe_gestion_code),
  INDEX idx_mode_instruction_code (mode_instruction_code),
  INDEX idx_impot_concerne (impot_concerne),
  INDEX idx_est_active_valid_to (est_active, valid_to),
  FOREIGN KEY (base_juridique_id) REFERENCES bases_juridiques(id) ON DELETE CASCADE,
  FOREIGN KEY (nature_mesure_code) REFERENCES ref_natures_mesure(code) ON DELETE RESTRICT,
  FOREIGN KEY (portee_categorie_code) REFERENCES ref_portees_categorie(code) ON DELETE RESTRICT,
  FOREIGN KEY (organe_gestion_code) REFERENCES ref_organes_gestion(code) ON DELETE SET NULL,
  FOREIGN KEY (mode_instruction_code) REFERENCES ref_modes_instruction(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE codes_additionnels (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  base_juridique_version_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  source_code VARCHAR(50) NOT NULL,
  est_principal TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_code_source (code, source_code),
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (source_code) REFERENCES ref_sources_code(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Identité, accès et sécurité

```sql
-- ============================================================
-- 3. IDENTITE, ACCES ET SECURITE
-- ============================================================

CREATE TABLE utilisateurs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  institution_id CHAR(36) NOT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'actif',
  mfa_active TINYINT(1) NOT NULL DEFAULT 1,
  mfa_secret_enc VARCHAR(500) DEFAULT NULL,
  pin_hash VARCHAR(60) DEFAULT NULL,
  secteur_affecte VARCHAR(100) DEFAULT NULL,
  telephone VARCHAR(20) DEFAULT NULL,
  derniere_connexion DATETIME(3) DEFAULT NULL,
  ip_derniere_cx VARCHAR(45) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_institution_id (institution_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_utilisateur(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles_permissions (
  role VARCHAR(50) NOT NULL,
  ressource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  perimetre VARCHAR(100) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (role, ressource, action),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  est_revoque TINYINT(1) NOT NULL DEFAULT 0,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions_utilisateur (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  jeton_session_hash CHAR(64) NOT NULL UNIQUE,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  pays VARCHAR(100) DEFAULT NULL,
  ville VARCHAR(100) DEFAULT NULL,
  date_connexion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  date_derniere_activite DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  date_deconnexion DATETIME(3) DEFAULT NULL,
  est_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_jeton_session_hash (jeton_session_hash),
  INDEX idx_est_active (est_active),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reset_password_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  est_utilise TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_utilisateur_id (utilisateur_id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mediatheque des bases juridiques : documents legaux associes a chaque version
CREATE TABLE base_juridique_documents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  base_juridique_version_id CHAR(36) NOT NULL,
  type_document VARCHAR(50) NOT NULL, -- 'loi', 'decret', 'circulaire', 'arrete', 'note_service'
  reference_document VARCHAR(200), -- Reference officielle (ex: "Loi n°2024-012 du 15/03/2024")
  date_document DATE, -- Date officielle du texte
  nom_fichier VARCHAR(300) NOT NULL,
  type_mime VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  taille_octets BIGINT,
  url_stockage VARCHAR(500) NOT NULL,
  hash_sha256 CHAR(64) NOT NULL,
  est_texte_fondateur TINYINT(1) NOT NULL DEFAULT 0, -- 1 = texte fondateur principal de la mesure
  est_public TINYINT(1) NOT NULL DEFAULT 1, -- 1 = visible portail Open Data
  uploaded_by_id CHAR(36),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_type_document (type_document),
  INDEX idx_date_document (date_document),
  INDEX idx_est_texte_fondateur (est_texte_fondateur),
  INDEX idx_est_public (est_public),
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Bénéficiaires et conventions

```sql
-- ============================================================
-- 4. BENEFICIAIRES ET CONVENTIONS
-- ============================================================

CREATE TABLE beneficiaires (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  raison_sociale VARCHAR(200) NOT NULL,
  nif VARCHAR(20) NOT NULL UNIQUE,
  rccm VARCHAR(30) DEFAULT NULL,
  type_beneficiaire_code VARCHAR(50) NOT NULL,
  statut_fiscal_code VARCHAR(50) NOT NULL DEFAULT 'inconnu',
  secteur VARCHAR(100) DEFAULT NULL,
  region VARCHAR(100) DEFAULT NULL,
  email_contact VARCHAR(200) DEFAULT NULL,
  telephone VARCHAR(20) DEFAULT NULL,
  adresse TEXT DEFAULT NULL,
  accord_siege_id CHAR(36) DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_nif (nif),
  INDEX idx_type_beneficiaire_code (type_beneficiaire_code),
  INDEX idx_statut_fiscal_code (statut_fiscal_code),
  INDEX idx_accord_siege_id (accord_siege_id),
  FOREIGN KEY (accord_siege_id) REFERENCES accords_siege(id) ON DELETE SET NULL,
  FOREIGN KEY (type_beneficiaire_code) REFERENCES ref_types_beneficiaire(code) ON DELETE RESTRICT,
  FOREIGN KEY (statut_fiscal_code) REFERENCES ref_statuts_fiscal(code) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conventions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reference VARCHAR(30) NOT NULL UNIQUE,
  beneficiaire_id CHAR(36) NOT NULL,
  base_juridique_version_id CHAR(36) DEFAULT NULL,
  accord_siege_id CHAR(36) DEFAULT NULL,
  regime_code VARCHAR(50) NOT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'active',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  montant_estime BIGINT DEFAULT NULL,
  emplois_engages INT DEFAULT NULL,
  emplois_crees INT DEFAULT NULL,
  zone_zfi VARCHAR(50) DEFAULT NULL,
  objet TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_accord_siege_id (accord_siege_id),
  INDEX idx_statut_code (statut_code),
  INDEX idx_date_fin (date_fin),
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE RESTRICT,
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (accord_siege_id) REFERENCES accords_siege(id) ON DELETE SET NULL,
  FOREIGN KEY (regime_code) REFERENCES ref_regimes_convention(code) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_convention(code) ON DELETE RESTRICT,
  CONSTRAINT chk_conventions_dates CHECK (date_fin > date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE convention_engagements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  convention_id CHAR(36) NOT NULL,
  type_engagement VARCHAR(50) NOT NULL,
  periode_annee INT DEFAULT NULL,
  objectif BIGINT DEFAULT NULL,
  realise BIGINT DEFAULT NULL,
  commentaire TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_convention_id (convention_id),
  INDEX idx_type_engagement (type_engagement),
  FOREIGN KEY (convention_id) REFERENCES conventions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE beneficiaire_historique_fiscal (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  beneficiaire_id CHAR(36) NOT NULL,
  statut_fiscal_code VARCHAR(50) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE DEFAULT NULL,
  source VARCHAR(100) DEFAULT NULL,
  connecteur_code VARCHAR(50) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  INDEX idx_statut_fiscal_code (statut_fiscal_code),
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE CASCADE,
  FOREIGN KEY (statut_fiscal_code) REFERENCES ref_statuts_fiscal(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agrements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reference VARCHAR(30) NOT NULL UNIQUE,
  beneficiaire_id CHAR(36) NOT NULL,
  type_agrement_code VARCHAR(50) NOT NULL,
  base_juridique_version_id CHAR(36) DEFAULT NULL,
  regime_code VARCHAR(50) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'active',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  montant_estime BIGINT DEFAULT NULL,
  objet TEXT DEFAULT NULL,
  document_url VARCHAR(500) DEFAULT NULL,
  hash_document CHAR(64) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  INDEX idx_type_agrement_code (type_agrement_code),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE RESTRICT,
  FOREIGN KEY (type_agrement_code) REFERENCES ref_types_agrement(code) ON DELETE RESTRICT,
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (regime_code) REFERENCES ref_regimes_convention(code) ON DELETE SET NULL,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_convention(code) ON DELETE RESTRICT,
  CONSTRAINT chk_agrements_dates CHECK (date_fin > date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agrement_beneficiaires (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  agrement_id CHAR(36) NOT NULL,
  beneficiaire_id CHAR(36) NOT NULL,
  role VARCHAR(50) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_agrement_beneficiaire (agrement_id, beneficiaire_id),
  INDEX idx_agrement_id (agrement_id),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  FOREIGN KEY (agrement_id) REFERENCES agrements(id) ON DELETE CASCADE,
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Demandes, pièces et compléments

```sql
-- ============================================================
-- 5. DEMANDES, PIECES ET COMPLEMENTS
-- ============================================================

CREATE TABLE demandes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reference VARCHAR(20) NOT NULL UNIQUE,
  base_juridique_version_id CHAR(36) NOT NULL,
  beneficiaire_id CHAR(36) NOT NULL,
  convention_id CHAR(36) DEFAULT NULL,
  instructeur_id CHAR(36) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'brouillon',
  date_depot DATETIME(3) DEFAULT NULL,
  date_echeance DATE DEFAULT NULL,
  date_archivage DATE DEFAULT NULL,
  montant_fcfa BIGINT NOT NULL DEFAULT 0,
  devise VARCHAR(3) NOT NULL DEFAULT 'XOF',
  quota_consomme BIGINT DEFAULT NULL,
  quota_total BIGINT DEFAULT NULL,
  secteur VARCHAR(100) DEFAULT NULL,
  etape_actuelle VARCHAR(200) DEFAULT NULL,
  motif_rejet TEXT DEFAULT NULL,
  declaration_honneur TINYINT(1) NOT NULL DEFAULT 0,
  est_urgente TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) DEFAULT NULL,
  INDEX idx_reference (reference),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  INDEX idx_instructeur_id (instructeur_id),
  INDEX idx_statut_code (statut_code),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_convention_id (convention_id),
  INDEX idx_created_at (created_at),
  INDEX idx_date_echeance (date_echeance),
  INDEX idx_date_archivage (date_archivage),
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE RESTRICT,
  FOREIGN KEY (convention_id) REFERENCES conventions(id) ON DELETE SET NULL,
  FOREIGN KEY (instructeur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_demande(code) ON DELETE RESTRICT,
  CONSTRAINT chk_demandes_montant_positif CHECK (montant_fcfa >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pieces_jointes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL,
  nom_fichier VARCHAR(300) NOT NULL,
  type_mime VARCHAR(100) NOT NULL,
  taille_octets BIGINT NOT NULL,
  rang_code VARCHAR(50) NOT NULL,
  categorie VARCHAR(100) NOT NULL,
  type_document_code VARCHAR(50) DEFAULT NULL,
  url_stockage VARCHAR(500) NOT NULL,
  hash_sha256 CHAR(64) NOT NULL,
  est_valide TINYINT(1) DEFAULT NULL,
  valide_par_id CHAR(36) DEFAULT NULL,
  date_validation DATETIME(3) DEFAULT NULL,
  commentaire_validation TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_rang_code (rang_code),
  INDEX idx_type_document_code (type_document_code),
  INDEX idx_hash_sha256 (hash_sha256),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (rang_code) REFERENCES ref_rangs_piece(code) ON DELETE RESTRICT,
  FOREIGN KEY (type_document_code) REFERENCES ref_types_document(code) ON DELETE SET NULL,
  FOREIGN KEY (valide_par_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE demande_complements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL,
  instructeur_id CHAR(36) NOT NULL,
  motif TEXT NOT NULL,
  pieces_attendues TEXT DEFAULT NULL,
  date_demande DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  date_reponse DATETIME(3) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_instructeur_id (instructeur_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (instructeur_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_etape(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Workflow BPM normalisé

```sql
-- ============================================================
-- 6. WORKFLOW BPM NORMALISE
-- ============================================================

CREATE TABLE workflow_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  base_juridique_version_id CHAR(36) DEFAULT NULL,
  type_texte_1 VARCHAR(100) NOT NULL,
  organe_gestion_code VARCHAR(50) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  version_template INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_type_texte_1 (type_texte_1),
  INDEX idx_organe_gestion_code (organe_gestion_code),
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (organe_gestion_code) REFERENCES ref_organes_gestion(code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workflow_template_etapes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  workflow_template_id CHAR(36) NOT NULL,
  nom_etape VARCHAR(200) NOT NULL,
  ordre INT NOT NULL,
  acteur_role VARCHAR(50) NOT NULL,
  institution_type_code VARCHAR(50) DEFAULT NULL,
  delai_cible_jours INT DEFAULT NULL,
  pin_requis TINYINT(1) NOT NULL DEFAULT 0,
  est_obligatoire TINYINT(1) NOT NULL DEFAULT 1,
  condition_activation TEXT DEFAULT NULL,
  action_declenchee VARCHAR(100) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_workflow_etape_ordre (workflow_template_id, ordre),
  INDEX idx_workflow_template_id (workflow_template_id),
  FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_type_code) REFERENCES ref_types_institution(code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE workflow_template_transitions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  workflow_template_id CHAR(36) NOT NULL,
  etape_source_ordre INT NOT NULL,
  etape_cible_ordre INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  condition_transition TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_workflow_template_id (workflow_template_id),
  FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE demande_workflow_instances (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL UNIQUE,
  workflow_template_id CHAR(36) NOT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'en_cours',
  date_debut DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  date_fin DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_workflow_template_id (workflow_template_id),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates(id) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_etape(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE demande_workflow_etapes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  instance_id CHAR(36) NOT NULL,
  template_etape_id CHAR(36) NOT NULL,
  nom_etape VARCHAR(200) NOT NULL,
  ordre INT NOT NULL,
  acteur_role VARCHAR(50) NOT NULL,
  acteur_id CHAR(36) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  date_debut DATETIME(3) DEFAULT NULL,
  date_fin DATETIME(3) DEFAULT NULL,
  delai_cible_jours INT DEFAULT NULL,
  commentaire TEXT DEFAULT NULL,
  pin_signe TINYINT(1) NOT NULL DEFAULT 0,
  decision_prise TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_instance_id (instance_id),
  INDEX idx_instance_id_ordre (instance_id, ordre),
  INDEX idx_acteur_id (acteur_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (instance_id) REFERENCES demande_workflow_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (template_etape_id) REFERENCES workflow_template_etapes(id) ON DELETE RESTRICT,
  FOREIGN KEY (acteur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_etape(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. Décisions et actes administratifs

```sql
-- ============================================================
-- 7. DECISIONS ET ACTES ADMINISTRATIFS
-- ============================================================

CREATE TABLE decisions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL,
  utilisateur_id CHAR(36) NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  date_decision DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  motif TEXT DEFAULT NULL,
  document_url VARCHAR(500) DEFAULT NULL,
  hash_sha256 CHAR(64) DEFAULT NULL,
  pin_hash VARCHAR(60) DEFAULT NULL,
  est_signe TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_type_code (type_code),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT,
  FOREIGN KEY (type_code) REFERENCES ref_types_decision(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE actes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL,
  decision_id CHAR(36) DEFAULT NULL,
  type_code VARCHAR(50) NOT NULL,
  reference VARCHAR(50) NOT NULL UNIQUE,
  beneficiaire_id CHAR(36) NOT NULL,
  montant_fcfa BIGINT DEFAULT NULL,
  date_effet DATE NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  hash_document CHAR(64) NOT NULL,
  qr_code_hash CHAR(64) NOT NULL,
  qr_code_image_url VARCHAR(500) DEFAULT NULL,
  est_revoke TINYINT(1) NOT NULL DEFAULT 0,
  date_revocation DATETIME(3) DEFAULT NULL,
  motif_revocation TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_decision_id (decision_id),
  INDEX idx_type_code (type_code),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  INDEX idx_qr_code_hash (qr_code_hash),
  INDEX idx_reference (reference),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE SET NULL,
  FOREIGN KEY (type_code) REFERENCES ref_types_acte(code) ON DELETE RESTRICT,
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. Quotas et historisation

```sql
-- ============================================================
-- 8. QUOTAS ET HISTORISATION
-- ============================================================

CREATE TABLE quotas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  base_juridique_version_id CHAR(36) NOT NULL,
  beneficiaire_id CHAR(36) DEFAULT NULL,
  convention_id CHAR(36) DEFAULT NULL,
  exercice_annuel INT DEFAULT NULL,
  type_quota_code VARCHAR(50) NOT NULL,
  unite_code VARCHAR(50) NOT NULL DEFAULT 'fcfa',
  total BIGINT NOT NULL,
  consomme BIGINT NOT NULL DEFAULT 0,
  alerte_seuil_pct INT NOT NULL DEFAULT 80,
  alerte_80_envoyee TINYINT(1) NOT NULL DEFAULT 0,
  alerte_100_envoyee TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_beneficiaire_id (beneficiaire_id),
  INDEX idx_convention_id (convention_id),
  INDEX idx_exercice_annuel (exercice_annuel),
  INDEX idx_type_quota_code (type_quota_code),
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaires(id) ON DELETE SET NULL,
  FOREIGN KEY (convention_id) REFERENCES conventions(id) ON DELETE SET NULL,
  FOREIGN KEY (type_quota_code) REFERENCES ref_types_quota(code) ON DELETE RESTRICT,
  FOREIGN KEY (unite_code) REFERENCES ref_unites_quota(code) ON DELETE RESTRICT,
  CONSTRAINT chk_quotas_total_positif CHECK (total > 0),
  CONSTRAINT chk_quotas_consomme CHECK (consomme >= 0),
  CONSTRAINT chk_quotas_alerte_seuil CHECK (alerte_seuil_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quota_mouvements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  quota_id CHAR(36) NOT NULL,
  demande_id CHAR(36) DEFAULT NULL,
  type_mouvement_code VARCHAR(50) NOT NULL,
  montant BIGINT NOT NULL,
  solde_avant BIGINT NOT NULL,
  solde_apres BIGINT NOT NULL,
  commentaire TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_quota_id (quota_id),
  INDEX idx_demande_id (demande_id),
  INDEX idx_type_mouvement_code (type_mouvement_code),
  FOREIGN KEY (quota_id) REFERENCES quotas(id) ON DELETE CASCADE,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL,
  FOREIGN KEY (type_mouvement_code) REFERENCES ref_types_mouvement_quota(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 9. Anomalies

```sql
-- ============================================================
-- 9. ANOMALIES
-- ============================================================

CREATE TABLE anomalies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  categorie_code VARCHAR(50) NOT NULL,
  gravite_code VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  demande_id CHAR(36) DEFAULT NULL,
  base_juridique_version_id CHAR(36) DEFAULT NULL,
  convention_id CHAR(36) DEFAULT NULL,
  date_detection DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  statut_code VARCHAR(50) NOT NULL DEFAULT 'nouvelle',
  detectee_par_code VARCHAR(50) NOT NULL,
  utilisateur_id CHAR(36) DEFAULT NULL,
  regle_id VARCHAR(100) DEFAULT NULL,
  commentaire TEXT DEFAULT NULL,
  date_resolution DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_base_juridique_version_id (base_juridique_version_id),
  INDEX idx_convention_id (convention_id),
  INDEX idx_gravite_code_statut_code (gravite_code, statut_code),
  INDEX idx_categorie_code (categorie_code),
  INDEX idx_detectee_par_code (detectee_par_code),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL,
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (convention_id) REFERENCES conventions(id) ON DELETE SET NULL,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (categorie_code) REFERENCES ref_categories_anomalie(code) ON DELETE RESTRICT,
  FOREIGN KEY (gravite_code) REFERENCES ref_gravites_anomalie(code) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_anomalie(code) ON DELETE RESTRICT,
  FOREIGN KEY (detectee_par_code) REFERENCES ref_sources_detection(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE regles_anomalie (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(100) NOT NULL UNIQUE,
  nom VARCHAR(200) NOT NULL,
  categorie_code VARCHAR(50) NOT NULL,
  gravite_code VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  expression TEXT NOT NULL,
  est_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_categorie_code (categorie_code),
  INDEX idx_gravite_code (gravite_code),
  FOREIGN KEY (categorie_code) REFERENCES ref_categories_anomalie(code) ON DELETE RESTRICT,
  FOREIGN KEY (gravite_code) REFERENCES ref_gravites_anomalie(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 10. Connecteurs SI et synchronisations

```sql
-- ============================================================
-- 10. CONNECTEURS SI ET SYNCHRONISATIONS
-- ============================================================

CREATE TABLE connecteurs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nom VARCHAR(50) NOT NULL,
  code_systeme VARCHAR(20) NOT NULL UNIQUE,
  institution_id CHAR(36) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'inactif',
  endpoint VARCHAR(500) NOT NULL,
  config_auth JSON NOT NULL,
  latence_ms INT NOT NULL DEFAULT 0,
  taux_erreur DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  dernier_sync DATETIME(3) DEFAULT NULL,
  volume_24h INT NOT NULL DEFAULT 0,
  fallback_manuel TINYINT(1) NOT NULL DEFAULT 0,
  timeout_s INT NOT NULL DEFAULT 10,
  failure_threshold INT NOT NULL DEFAULT 3,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_institution_id (institution_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_connecteur(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE connecteur_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  connecteur_id CHAR(36) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  payload_entrant JSON DEFAULT NULL,
  payload_sortant JSON DEFAULT NULL,
  statut_http INT DEFAULT NULL,
  duree_ms INT DEFAULT NULL,
  est_erreur TINYINT(1) NOT NULL DEFAULT 0,
  message_erreur TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_connecteur_id (connecteur_id),
  INDEX idx_operation (operation),
  INDEX idx_est_erreur (est_erreur),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (connecteur_id) REFERENCES connecteurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE demande_sync_externe (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL,
  connecteur_id CHAR(36) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  payload_envoye JSON DEFAULT NULL,
  reponse_recue JSON DEFAULT NULL,
  nombre_tentatives INT NOT NULL DEFAULT 0,
  date_derniere_tentative DATETIME(3) DEFAULT NULL,
  message_erreur TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_demande_id (demande_id),
  INDEX idx_connecteur_id (connecteur_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (connecteur_id) REFERENCES connecteurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 11. Notifications, templates et préférences

```sql
-- ============================================================
-- 11. NOTIFICATIONS, TEMPLATES ET PREFERENCES
-- ============================================================

CREATE TABLE notification_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(100) NOT NULL UNIQUE,
  type_notification_code VARCHAR(50) NOT NULL,
  canal_code VARCHAR(50) NOT NULL,
  sujet VARCHAR(200) NOT NULL,
  corps TEXT NOT NULL,
  variables TEXT DEFAULT NULL,
  est_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_type_notification_code (type_notification_code),
  INDEX idx_canal_code (canal_code),
  FOREIGN KEY (type_notification_code) REFERENCES ref_types_notification(code) ON DELETE RESTRICT,
  FOREIGN KEY (canal_code) REFERENCES ref_canaux_notification(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_preferences (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  type_notification_code VARCHAR(50) NOT NULL,
  canal_code VARCHAR(50) NOT NULL,
  est_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_user_type_canal (utilisateur_id, type_notification_code, canal_code),
  INDEX idx_utilisateur_id (utilisateur_id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (type_notification_code) REFERENCES ref_types_notification(code) ON DELETE RESTRICT,
  FOREIGN KEY (canal_code) REFERENCES ref_canaux_notification(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_queue (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  demande_id CHAR(36) DEFAULT NULL,
  type_notification_code VARCHAR(50) NOT NULL,
  canal_code VARCHAR(50) NOT NULL,
  sujet VARCHAR(200) NOT NULL,
  corps TEXT NOT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'pending',
  date_envoi DATETIME(3) DEFAULT NULL,
  date_lecture DATETIME(3) DEFAULT NULL,
  erreur TEXT DEFAULT NULL,
  nombre_tentatives INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_demande_id (demande_id),
  INDEX idx_statut_code (statut_code),
  INDEX idx_type_notification_code (type_notification_code),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL,
  FOREIGN KEY (type_notification_code) REFERENCES ref_types_notification(code) ON DELETE RESTRICT,
  FOREIGN KEY (canal_code) REFERENCES ref_canaux_notification(code) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_notification(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  demande_id CHAR(36) DEFAULT NULL,
  type_notification_code VARCHAR(50) NOT NULL,
  canal_code VARCHAR(50) NOT NULL,
  titre VARCHAR(200) NOT NULL,
  corps TEXT NOT NULL,
  est_lue TINYINT(1) NOT NULL DEFAULT 0,
  date_lecture DATETIME(3) DEFAULT NULL,
  queue_id CHAR(36) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_utilisateur_id_est_lue (utilisateur_id, est_lue),
  INDEX idx_demande_id (demande_id),
  INDEX idx_type_notification_code (type_notification_code),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL,
  FOREIGN KEY (type_notification_code) REFERENCES ref_types_notification(code) ON DELETE RESTRICT,
  FOREIGN KEY (canal_code) REFERENCES ref_canaux_notification(code) ON DELETE RESTRICT,
  FOREIGN KEY (queue_id) REFERENCES notification_queue(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 12. Audit log inaltérable

```sql
-- ============================================================
-- 12. AUDIT LOG INALTERABLE
-- ============================================================

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  horodatage DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  utilisateur_id CHAR(36) DEFAULT NULL,
  role_au_moment VARCHAR(50) DEFAULT NULL,
  institution VARCHAR(100) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entite VARCHAR(50) NOT NULL,
  entite_id CHAR(36) NOT NULL,
  demande_id CHAR(36) DEFAULT NULL,
  ancienne_valeur JSON DEFAULT NULL,
  nouvelle_valeur JSON DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  hash_precedent CHAR(64) DEFAULT NULL,
  empreinte_sha256 CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_entite_entite_id (entite, entite_id),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_horodatage (horodatage),
  INDEX idx_action (action),
  INDEX idx_demande_id (demande_id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs est append-only : mise a jour interdite';
END //

CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs est append-only : suppression interdite';
END //

DELIMITER ;
```

---

## 13. Reporting et Open Data

```sql
-- ============================================================
-- 13. REPORTING ET OPEN DATA
-- ============================================================

CREATE TABLE reporting_aggregats (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  periode_annee INT NOT NULL,
  periode_mois INT DEFAULT NULL,
  type_texte_1 VARCHAR(100) DEFAULT NULL,
  impot_concerne VARCHAR(100) DEFAULT NULL,
  nature_mesure_code VARCHAR(50) DEFAULT NULL,
  type_beneficiaire_code VARCHAR(50) DEFAULT NULL,
  regime_code VARCHAR(50) DEFAULT NULL,
  region VARCHAR(100) DEFAULT NULL,
  secteur VARCHAR(100) DEFAULT NULL,
  nb_demandes_soumis INT NOT NULL DEFAULT 0,
  nb_demandes_approuve INT NOT NULL DEFAULT 0,
  nb_demandes_rejete INT NOT NULL DEFAULT 0,
  montant_total_demandes BIGINT NOT NULL DEFAULT 0,
  montant_total_approuve BIGINT NOT NULL DEFAULT 0,
  delai_moyen_instruction_jours DECIMAL(8,2) DEFAULT NULL,
  nb_anomalies_critique INT NOT NULL DEFAULT 0,
  est_anonymise TINYINT(1) NOT NULL DEFAULT 1,
  date_calcul DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_periode (periode_annee, periode_mois),
  INDEX idx_type_texte_1 (type_texte_1),
  INDEX idx_impot_concerne (impot_concerne),
  INDEX idx_nature_mesure_code (nature_mesure_code),
  INDEX idx_est_anonymise (est_anonymise),
  FOREIGN KEY (nature_mesure_code) REFERENCES ref_natures_mesure(code) ON DELETE SET NULL,
  FOREIGN KEY (type_beneficiaire_code) REFERENCES ref_types_beneficiaire(code) ON DELETE SET NULL,
  FOREIGN KEY (regime_code) REFERENCES ref_regimes_convention(code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reporting_executions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type_rapport_code VARCHAR(50) NOT NULL,
  periode_annee INT NOT NULL,
  periode_mois INT DEFAULT NULL,
  parametres JSON DEFAULT NULL,
  fichier_url VARCHAR(500) DEFAULT NULL,
  hash_fichier CHAR(64) DEFAULT NULL,
  est_programme TINYINT(1) NOT NULL DEFAULT 0,
  date_debut DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  date_fin DATETIME(3) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'pending',
  message_erreur TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_type_rapport_code (type_rapport_code),
  INDEX idx_periode (periode_annee, periode_mois),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (type_rapport_code) REFERENCES ref_types_rapport(code) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_etats_job(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE opendata_publications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  periode_annee INT NOT NULL,
  periode_mois INT DEFAULT NULL,
  titre VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  fichier_url VARCHAR(500) DEFAULT NULL,
  donnees_json JSON DEFAULT NULL,
  est_publie TINYINT(1) NOT NULL DEFAULT 0,
  date_publication DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_periode (periode_annee, periode_mois),
  INDEX idx_est_publie (est_publie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 14. Administration système

```sql
-- ============================================================
-- 15. ADMINISTRATION SYSTEME
-- ============================================================

CREATE TABLE parametres_systeme (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(100) NOT NULL UNIQUE,
  type_parametre_code VARCHAR(50) NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  valeur TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  est_editable TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_type_parametre_code (type_parametre_code),
  FOREIGN KEY (type_parametre_code) REFERENCES ref_types_parametre(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE imports_mrd (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nom_fichier VARCHAR(300) NOT NULL,
  type_fichier VARCHAR(20) NOT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'pending',
  lignes_total INT DEFAULT NULL,
  lignes_importees INT DEFAULT NULL,
  lignes_rejetees INT DEFAULT NULL,
  rapport JSON DEFAULT NULL,
  fichier_erreurs_url VARCHAR(500) DEFAULT NULL,
  lance_par_id CHAR(36) NOT NULL,
  date_debut DATETIME(3) DEFAULT NULL,
  date_fin DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_statut_code (statut_code),
  INDEX idx_lance_par_id (lance_par_id),
  FOREIGN KEY (lance_par_id) REFERENCES utilisateurs(id) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_etats_job(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE archivages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type_entite VARCHAR(50) NOT NULL,
  entite_id CHAR(36) NOT NULL,
  demande_id CHAR(36) DEFAULT NULL,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  chemin_archive VARCHAR(500) DEFAULT NULL,
  hash_archive CHAR(64) DEFAULT NULL,
  declenche_par VARCHAR(50) NOT NULL DEFAULT 'systeme',
  date_archivage DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_type_entite_entite_id (type_entite, entite_id),
  INDEX idx_demande_id (demande_id),
  INDEX idx_statut_code (statut_code),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE SET NULL,
  FOREIGN KEY (statut_code) REFERENCES ref_statuts_archivage(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  niveau VARCHAR(20) NOT NULL,
  source VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  contexte JSON DEFAULT NULL,
  trace TEXT DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_niveau (niveau),
  INDEX idx_source (source),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_queue (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type_job_code VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  priorite INT NOT NULL DEFAULT 5,
  statut_code VARCHAR(50) NOT NULL DEFAULT 'pending',
  date_prevue DATETIME(3) DEFAULT NULL,
  date_debut DATETIME(3) DEFAULT NULL,
  date_fin DATETIME(3) DEFAULT NULL,
  resultat JSON DEFAULT NULL,
  erreur TEXT DEFAULT NULL,
  nombre_tentatives INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_type_job_code (type_job_code),
  INDEX idx_statut_code (statut_code),
  INDEX idx_date_prevue (date_prevue),
  INDEX idx_priorite (priorite),
  FOREIGN KEY (type_job_code) REFERENCES ref_types_job(code) ON DELETE RESTRICT,
  FOREIGN KEY (statut_code) REFERENCES ref_etats_job(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 15. Mobile

```sql
-- ============================================================
-- 15. MOBILE
-- ============================================================

CREATE TABLE push_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  utilisateur_id CHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  canal_push_code VARCHAR(50) NOT NULL,
  device_id VARCHAR(200) DEFAULT NULL,
  modele_appareil VARCHAR(200) DEFAULT NULL,
  systeme_exploitation VARCHAR(100) DEFAULT NULL,
  version_app VARCHAR(50) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  date_dernier_utilisation DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_canal_push_code (canal_push_code),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (canal_push_code) REFERENCES ref_canaux_push(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 16. Index additionnels et contraintes

```sql
-- ============================================================
-- 16. INDEX ADDITIONNELS ET CONTRAINTES
-- ============================================================

-- Index composites pour les requetes frequentes metier
CREATE INDEX idx_demandes_statut_created ON demandes(statut_code, created_at);
CREATE INDEX idx_demandes_beneficiaire_statut ON demandes(beneficiaire_id, statut_code);
CREATE INDEX idx_pieces_jointes_demande_rang ON pieces_jointes(demande_id, rang_code);
CREATE INDEX idx_decisions_demande_type ON decisions(demande_id, type_code);
CREATE INDEX idx_actes_demande_type ON actes(demande_id, type_code);
CREATE INDEX idx_quota_mouvements_quota_date ON quota_mouvements(quota_id, created_at);
CREATE INDEX idx_anomalies_demande_gravite ON anomalies(demande_id, gravite_code);
CREATE INDEX idx_base_juridique_versions_active ON base_juridique_versions(base_juridique_id, est_active, valid_to);
CREATE INDEX idx_workflow_template_etapes_template_ordre ON workflow_template_etapes(workflow_template_id, ordre);
CREATE INDEX idx_demande_workflow_etapes_instance_ordre ON demande_workflow_etapes(instance_id, ordre);
CREATE INDEX idx_connecteur_logs_connecteur_date ON connecteur_logs(connecteur_id, created_at);
CREATE INDEX idx_notification_queue_statut_date ON notification_queue(statut_code, created_at);
CREATE INDEX idx_audit_logs_action_entite ON audit_logs(action, entite);
```

---

## 17. Vues métier

```sql
-- ============================================================
-- 17. VUES METIER
-- ============================================================

-- Vue des versions actives des bases juridiques
CREATE OR REPLACE VIEW v_bases_juridiques_actives AS
SELECT *
FROM base_juridique_versions
WHERE est_active = 1 AND valid_to IS NULL;

-- Vue des dossiers en cours d instruction avec delai
CREATE OR REPLACE VIEW v_demandes_en_instruction AS
SELECT
  d.*,
  bj.code_mesure,
  bjv.libelle,
  bjv.organe_gestion_code,
  bjv.type_texte_1,
  b.nif,
  b.raison_sociale,
  u.nom AS instructeur_nom,
  u.prenom AS instructeur_prenom,
  DATEDIFF(CURRENT_DATE, d.date_depot) AS duree_jours
FROM demandes d
JOIN base_juridique_versions bjv ON bjv.id = d.base_juridique_version_id
JOIN bases_juridiques bj ON bj.id = bjv.base_juridique_id
JOIN beneficiaires b ON b.id = d.beneficiaire_id
LEFT JOIN utilisateurs u ON u.id = d.instructeur_id
WHERE d.statut_code = 'en_instruction';

-- Vue Open Data anonymisee
CREATE OR REPLACE VIEW v_opendata_stats AS
SELECT
  EXTRACT(YEAR FROM d.date_depot) AS annee,
  bjv.type_texte_1,
  bjv.impot_concerne,
  bjv.nature_mesure_code,
  b.type_beneficiaire_code,
  COUNT(d.id) AS nb_demandes,
  SUM(CASE WHEN d.statut_code = 'approuve' THEN 1 ELSE 0 END) AS nb_approuvees,
  SUM(CASE WHEN d.statut_code = 'approuve' THEN d.montant_fcfa ELSE 0 END) AS montant_approuve_fcfa
FROM demandes d
JOIN base_juridique_versions bjv ON bjv.id = d.base_juridique_version_id
JOIN beneficiaires b ON b.id = d.beneficiaire_id
WHERE d.statut_code NOT IN ('brouillon', 'archive')
GROUP BY annee, bjv.type_texte_1, bjv.impot_concerne, bjv.nature_mesure_code, b.type_beneficiaire_code;

-- Vue des alertes quotas
CREATE OR REPLACE VIEW v_alertes_quotas AS
SELECT
  q.*,
  bj.code_mesure,
  ROUND(q.consomme * 100.0 / q.total, 2) AS taux_consommation_pct,
  CASE
    WHEN q.consomme >= q.total THEN 'epuise'
    WHEN q.consomme * 100.0 / q.total >= q.alerte_seuil_pct THEN 'alerte'
    ELSE 'normal'
  END AS niveau_alerte
FROM quotas q
JOIN base_juridique_versions bjv ON bjv.id = q.base_juridique_version_id
JOIN bases_juridiques bj ON bj.id = bjv.base_juridique_id;
```

---

## 18. Seeds des tables de référence

```sql
-- ============================================================
-- 18. SEEDS — TABLES DE REFERENCE
-- ============================================================

INSERT INTO ref_types_institution (code, libelle, ordre, couleur) VALUES
('otr','Office Togolais des Recettes',1,'#2563eb'),
('dgbf','Direction Generale du Budget et des Finances',2,'#059669'),
('dgtcp','Direction Generale du Tresor et de la Comptabilite Publique',3,'#7c3aed'),
('agence','Agence de promotion',4,'#d97706'),
('dgmg','Direction Generale des Mines et de la Geologie',5,'#dc2626'),
('mae','Ministere des Affaires Etrangeres',6,'#4b5563'),
('ministere_sectoriel','Ministere sectoriel',7,'#6b7280'),
('igf','Inspection Generale des Finances',8,'#be123c'),
('cour_comptes','Cour des Comptes',9,'#881337'),
('upf','Unite de Politique Fiscale — MEF',10,'#1e40af'),
('dsi','Direction des Systemes d Information',11,'#4338ca'),
('conedef','Conseil Economique et Social',12,'#525252'),
('externe','Institution externe',99,'#9ca3af');

INSERT INTO ref_statuts_utilisateur (code, libelle, ordre, couleur) VALUES
('actif','Actif',1,'#16a34a'),
('inactif','Inactif',2,'#6b7280'),
('suspendu','Suspendu',3,'#dc2626');

INSERT INTO ref_types_beneficiaire (code, libelle, ordre, couleur) VALUES
('entreprise_privee','Entreprise privee',1,'#2563eb'),
('organisme_public','Organisme public',2,'#059669'),
('ong','ONG',3,'#d97706'),
('institution_diplomatique','Institution diplomatique',4,'#7c3aed'),
('organisation_internationale','Organisation internationale',5,'#db2777'),
('personne_physique','Personne physique',6,'#4b5563'),
('entreprises_et_menages','Entreprises et menages',7,'#6b7280'),
('autre','Autre',99,'#9ca3af');

INSERT INTO ref_statuts_fiscal (code, libelle, ordre, couleur) VALUES
('conforme','Conforme',1,'#16a34a'),
('dette_active','Dette fiscale active',2,'#dc2626'),
('inconnu','Inconnu / Non verifie',3,'#9ca3af');

INSERT INTO ref_natures_mesure (code, libelle, ordre, couleur) VALUES
('Exoneration','Exoneration',1,'#2563eb'),
('Exemption','Exemption',2,'#059669'),
('Abattement','Abattement',3,'#d97706'),
('Reduction_impot','Reduction d impot',4,'#7c3aed'),
('Taux_reduit','Taux reduit',5,'#db2777'),
('Credit_impot','Credit d impot',6,'#4b5563');

INSERT INTO ref_portees_categorie (code, libelle, ordre, couleur) VALUES
('Permanente','Permanente',1,'#16a34a'),
('Temporaire_Determinee','Temporaire determinee',2,'#d97706'),
('Temporaire_Phase','Temporaire par phase',3,'#f59e0b'),
('Liee_Convention','Liee a une convention',4,'#2563eb');

INSERT INTO ref_modes_instruction (code, libelle, ordre, couleur) VALUES
('automatique','Automatique',1,'#16a34a'),
('semi_automatique','Semi-automatique',2,'#d97706'),
('manuel','Manuel',3,'#dc2626');

INSERT INTO ref_organes_gestion (code, libelle, ordre, couleur) VALUES
('CI','Centre des Impots',1,'#2563eb'),
('CDDI','Centre des Douanes et du Droit Indirect',2,'#059669'),
('CDDI_CI','CDDI + CI conjoint',3,'#7c3aed'),
('OTR','OTR central',4,'#4b5563');

INSERT INTO ref_statuts_demande (code, libelle, ordre, couleur, is_final) VALUES
('brouillon','Brouillon',1,'#9ca3af',0),
('soumis','Soumis',2,'#3b82f6',0),
('en_instruction','En instruction',3,'#f59e0b',0),
('action_requise','Action requise',4,'#d97706',0),
('approuve','Approuve',5,'#16a34a',1),
('rejete','Rejete',6,'#dc2626',1),
('expire','Expire',7,'#6b7280',1),
('archive','Archive',8,'#374151',1);

INSERT INTO ref_statuts_etape (code, libelle, ordre, couleur) VALUES
('en_attente','En attente',1,'#9ca3af'),
('en_cours','En cours',2,'#f59e0b'),
('valide','Validee',3,'#16a34a'),
('rejete','Rejetee',4,'#dc2626'),
('annule','Annulee',5,'#6b7280');

INSERT INTO ref_statuts_convention (code, libelle, ordre, couleur) VALUES
('active','Active',1,'#16a34a'),
('suspendue','Suspendue',2,'#f59e0b'),
('resiliee','Resiliee',3,'#dc2626'),
('expiree','Expiree',4,'#6b7280');

INSERT INTO ref_statuts_anomalie (code, libelle, ordre, couleur) VALUES
('nouvelle','Nouvelle',1,'#dc2626'),
('en_examen','En examen',2,'#f59e0b'),
('traitee','Traitee',3,'#16a34a'),
('classee','Classee',4,'#6b7280');

INSERT INTO ref_statuts_connecteur (code, libelle, ordre, couleur) VALUES
('actif','Actif',1,'#16a34a'),
('erreur','En erreur',2,'#dc2626'),
('maintenance','En maintenance',3,'#f59e0b'),
('inactif','Inactif',4,'#9ca3af');

INSERT INTO ref_rangs_piece (code, libelle, ordre, couleur) VALUES
('premier','Rang 1 — Obligatoire',1,'#dc2626'),
('second','Rang 2 — Facultatif',2,'#059669');

INSERT INTO ref_types_quota (code, libelle, ordre, couleur) VALUES
('global_mesure','Global par mesure',1,'#2563eb'),
('par_beneficiaire','Par beneficiaire',2,'#059669'),
('par_convention','Par convention',3,'#d97706'),
('annuel','Annuel',4,'#7c3aed');

INSERT INTO ref_unites_quota (code, libelle, ordre, couleur) VALUES
('fcfa','FCFA',1,'#16a34a'),
('quantite_physique','Quantite physique',2,'#f59e0b'),
('nombre_operations','Nombre d operations',3,'#d97706');

INSERT INTO ref_categories_anomalie (code, libelle, ordre, couleur) VALUES
('juridique','Juridique',1,'#2563eb'),
('financiere','Financiere',2,'#059669'),
('temporelle','Temporelle',3,'#d97706'),
('procedurale','Procedurale',4,'#7c3aed');

INSERT INTO ref_gravites_anomalie (code, libelle, ordre, couleur) VALUES
('critique','Critique',1,'#dc2626'),
('elevee','Elevee',2,'#f59e0b'),
('moyenne','Moyenne',3,'#d97706'),
('faible','Faible',4,'#6b7280');

INSERT INTO ref_sources_detection (code, libelle, ordre, couleur) VALUES
('moteur_regles','Moteur de regles automatique',1,'#2563eb'),
('auditeur','Signalee par un auditeur',2,'#059669'),
('connecteur','Detectee par connecteur SI',3,'#d97706');

INSERT INTO ref_types_decision (code, libelle, ordre, couleur) VALUES
('approbation','Approbation',1,'#16a34a'),
('rejet','Rejet',2,'#dc2626'),
('demande_complement','Demande de complement',3,'#f59e0b');

INSERT INTO ref_regimes_convention (code, libelle, ordre, couleur) VALUES
('ZFI','Zone Franche Industrielle',1,'#2563eb'),
('ZES','Zone Economique Speciale',2,'#059669'),
('Code_Investissements','Code des Investissements',3,'#d97706'),
('Minier','Regime Minier',4,'#7c3aed'),
('Hydrocarbures','Regime Hydrocarbures',5,'#dc2626'),
('Siege','Accord de Siege',6,'#4b5563'),
('Autre','Autre regime',99,'#9ca3af');

INSERT INTO ref_canaux_notification (code, libelle, ordre, couleur) VALUES
('inapp','Notification in-app',1,'#2563eb'),
('email','Email',2,'#059669'),
('sms','SMS',3,'#d97706');

INSERT INTO ref_types_accord_siege (code, libelle, ordre, couleur) VALUES
('onu','ONU / Systeme des Nations Unies',1,'#2563eb'),
('union_africaine','Union Africaine',2,'#059669'),
('ambassade','Ambassade',3,'#d97706'),
('consulat','Consulat',4,'#7c3aed'),
('ong_internationale','ONG internationale',5,'#db2777'),
('autre','Autre',99,'#9ca3af');

INSERT INTO ref_sources_code (code, libelle, ordre, couleur) VALUES
('sydonia','Sydonia World',1,'#2563eb'),
('etax','E-TAX / SIGTAS',2,'#059669'),
('autre','Autre source',99,'#9ca3af');

INSERT INTO ref_types_acte (code, libelle, ordre, couleur) VALUES
('attestation','Attestation d exoneration',1,'#16a34a'),
('arrete','Arrete d exoneration',2,'#2563eb'),
('rejet','Decision de rejet',3,'#dc2626'),
('attestation_rejet','Attestation de rejet',4,'#6b7280');

INSERT INTO ref_types_mouvement_quota (code, libelle, ordre, couleur) VALUES
('consommation','Consommation sur demande approuvee',1,'#dc2626'),
('liberation','Liberation suite annulation',2,'#059669'),
('ajustement','Ajustement administratif',3,'#d97706'),
('report','Report d exercice',4,'#7c3aed');

INSERT INTO ref_statuts_notification (code, libelle, ordre, couleur) VALUES
('pending','En attente',1,'#9ca3af'),
('sent','Envoyee',2,'#16a34a'),
('failed','Echec',3,'#dc2626'),
('read','Lue',4,'#2563eb');

INSERT INTO ref_types_notification (code, libelle, ordre, couleur) VALUES
('SOUMISSION','Soumission de demande',1,'#2563eb'),
('INSTRUCTION','Prise en charge',2,'#059669'),
('COMPLEMENT','Demande de complement',3,'#d97706'),
('APPROBATION','Approbation',4,'#16a34a'),
('REJET','Rejet',5,'#dc2626'),
('ECHEANCE','Echeance proche',6,'#f59e0b'),
('QUOTA_ALERTE','Alerte quota',7,'#7c3aed'),
('ANOMALIE','Anomalie detectee',8,'#be123c'),
('SYSTEME','Notification systeme',9,'#4b5563');

INSERT INTO ref_etats_job (code, libelle, ordre, couleur) VALUES
('pending','En attente',1,'#9ca3af'),
('running','En cours',2,'#f59e0b'),
('completed','Termine',3,'#16a34a'),
('failed','Echec',4,'#dc2626'),
('cancelled','Annule',5,'#6b7280');

INSERT INTO ref_types_job (code, libelle, ordre, couleur) VALUES
('import_mrd','Import MRD',1,'#2563eb'),
('archivage','Archivage automatique',2,'#059669'),
('sync_connecteur','Synchronisation connecteur',3,'#d97706'),
('generation_acte','Generation d acte',4,'#7c3aed'),
('envoi_notification','Envoi de notification',5,'#16a34a'),
('calcul_aggregats','Calcul des aggregats',6,'#db2777'),
('verification_integrite','Verification integrite audit',7,'#4b5563');

INSERT INTO ref_statuts_archivage (code, libelle, ordre, couleur) VALUES
('en_attente','En attente',1,'#9ca3af'),
('archive','Archive',2,'#16a34a'),
('erreur','Erreur',3,'#dc2626');

INSERT INTO ref_types_rapport (code, libelle, ordre, couleur) VALUES
('executif','Rapport executif',1,'#2563eb'),
('fiscal','Rapport fiscal',2,'#059669'),
('controle','Rapport de controle',3,'#d97706'),
('agence','Rapport agence',4,'#7c3aed'),
('opendata','Publication Open Data',5,'#16a34a');

INSERT INTO ref_types_document (code, libelle, ordre, couleur) VALUES
('nif','NIF',1,'#2563eb'),
('rccm','RCCM',2,'#059669'),
('statuts','Statuts',3,'#d97706'),
('business_plan','Business plan',4,'#7c3aed'),
('convention','Convention',5,'#db2777'),
('facture','Facture',6,'#4b5563'),
('autre','Autre',99,'#9ca3af');

INSERT INTO ref_types_parametre (code, libelle, ordre, couleur) VALUES
('general','General',1,'#4b5563'),
('securite','Securite',2,'#dc2626'),
('notification','Notification',3,'#2563eb'),
('archivage','Archivage',4,'#059669'),
('connecteur','Connecteur',5,'#d97706'),
('quota','Quota',6,'#7c3aed');

INSERT INTO ref_canaux_push (code, libelle, ordre, couleur) VALUES
('fcm','Firebase Cloud Messaging',1,'#2563eb'),
('apns','Apple Push Notification Service',2,'#059669'),
('web_push','Web Push',3,'#d97706');

INSERT INTO ref_types_agrement (code, libelle, ordre, couleur) VALUES
('agrement_fiscal','Agrément fiscal',1,'#2563eb'),
('agrement_investissement','Agrément investissement',2,'#059669'),
('agrement_zfi','Agrément Zone Franche Industrielle',3,'#d97706'),
('agrement_minier','Agrément minier',4,'#7c3aed'),
('agrement_hydrocarbures','Agrément hydrocarbures',5,'#dc2626'),
('autre','Autre agrément',99,'#9ca3af');
```

---

## 19. Seeds métier (démonstration)

```sql
-- ============================================================
-- 19. SEEDS — DONNEES METIER DE DEMONSTRATION
-- ============================================================

INSERT INTO institutions (id, code, nom, type_code, est_active) VALUES
('inst-001','OTR-CI','Office Togolais des Recettes — Centre des Impots','otr',1),
('inst-002','OTR-CDDI','OTR — Centre des Douanes et du Droit Indirect','otr',1),
('inst-003','DGBF','Direction Generale du Budget et des Finances','dgbf',1),
('inst-004','DGTCP','Direction Generale du Tresor et de la Comptabilite Publique','dgtcp',1),
('inst-005','API','Agence de Promotion des Investissements','agence',1),
('inst-006','UPF','Unite de Politique Fiscale — MEF','upf',1),
('inst-007','IGF','Inspection Generale des Finances','igf',1),
('inst-008','MAE','Ministere des Affaires Etrangeres','mae',1),
('inst-009','DGMG','Direction Generale des Mines et de la Geologie','dgmg',1),
('inst-010','DSI','Direction des Systemes d Information','dsi',1);

INSERT INTO utilisateurs (id, nom, prenom, email, password_hash, role, institution_id, statut_code, mfa_active, pin_hash) VALUES
('user-001','Sewavi','Kossi','kossi.sewavi@dgtcp.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','admin_si','inst-010','actif',1,'$2b$12$fakehashforpin1234567890123456789012345678901234'),
('user-002','Ouattara','Fatima','fatima.ouattara@otr.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','agent_ci','inst-001','actif',1,'$2b$12$fakehashforpin1234567890123456789012345678901234'),
('user-003','Kodjo','Komlan','komlan.kodjo@api.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','agent_agence','inst-005','actif',1,'$2b$12$fakehashforpin1234567890123456789012345678901234'),
('user-004','Koffi','Amevi','amevi.koffi@mef.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','decideur','inst-006','actif',1,'$2b$12$fakehashforpin1234567890123456789012345678901234'),
('user-005','Adjovi','Paul','paul.adjovi@igf.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','auditeur','inst-007','actif',1,'$2b$12$fakehashforpin1234567890123456789012345678901234'),
('user-006','Amele','Kossiwa','kossiwa.amele@texlome.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','beneficiaire','inst-001','actif',0,NULL),
('user-007','Kossi','Amouzou','amouzou.kossi@togo-farms.tg','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G','beneficiaire','inst-001','actif',0,NULL);

INSERT INTO accords_siege (id, institution, type_institution_code, texte_fondateur, date_signature, est_actif) VALUES
('as-001','PNUD Togo','onu','Accord de siege ONU-Togo','1968-05-25',1),
('as-002','Ambassade de France','ambassade','Accord bilateral France-Togo','2010-01-01',1);

INSERT INTO beneficiaires (id, raison_sociale, nif, rccm, type_beneficiaire_code, statut_fiscal_code, secteur, region, email_contact, telephone, accord_siege_id, user_id) VALUES
('ben-001','TEXLOME SA — Textiles de Lome','TG-LOM-2018-B-0042','TG-LME-2018-0042','entreprise_privee','conforme','Industrie textile','Maritime','contact@texlome.tg','+228 90 12 34 56',NULL,'user-006'),
('ben-002','TOGOFARMS SARL','TG-KAR-2020-A-0115','TG-KAR-2020-0115','entreprise_privee','conforme','Agriculture','Kara','info@togofarms.tg','+228 90 23 45 67',NULL,'user-007'),
('ben-003','PNUD Togo','TG-INT-ONU-PNUD','','organisation_internationale','conforme','Developpement','Maritime','togo.office@undp.org','+228 22 21 70 00','as-001',NULL);

INSERT INTO bases_juridiques (id, code_mesure, code_mesure_mrd) VALUES
('bj-001','MRD-2024-0100',100),
('bj-002','MRD-2024-0101',101),
('bj-003','MRD-2024-0150',150),
('bj-004','MRD-2024-0200',200),
('bj-005','MRD-2024-0250',250);

INSERT INTO base_juridique_versions (id, base_juridique_id, version, libelle, impot_concerne, nature_mesure_code, type_texte_1, type_texte_2, portee_categorie_code, organe_gestion_code, organe_attribution, mode_instruction_code, est_active, valid_from) VALUES
('bjv-001','bj-001',1,'Exoneration TVA sur importation de produits alimentaires','TVA','Exoneration','CGI','Loi','Permanente','CI','OTR-CI','manuel',1,'2024-01-01 00:00:00.000'),
('bjv-002','bj-002',1,'Exoneration droits de douane sur materiel agricole','Droits de douane','Exoneration','CGI','Loi','Permanente','CDDI','OTR-CDDI','manuel',1,'2024-01-01 00:00:00.000'),
('bjv-003','bj-003',1,'Reduction IRPP des salaries des zones franches','IRPP','Reduction_impot','Code Investissements','Loi','Temporaire_Determinee','CI','OTR-CI','semi_automatique',1,'2024-01-01 00:00:00.000'),
('bjv-004','bj-004',1,'Exoneration totale IS accord de siege ONU','IS','Exoneration','Accord de siege','Convention internationale','Permanente','CDDI_CI','OTR-CDDI','manuel',1,'2024-01-01 00:00:00.000'),
('bjv-005','bj-005',1,'Exoneration TVA biens et services PNUD','TVA','Exoneration','Accord de siege','Convention internationale','Permanente','CI','OTR-CI','manuel',1,'2024-01-01 00:00:00.000');

INSERT INTO codes_additionnels (id, base_juridique_version_id, code, source_code, est_principal) VALUES
('ca-001','bjv-001','TVA-ALIM-001','sydonia',1),
('ca-002','bjv-002','DDI-AGRI-015','sydonia',1),
('ca-003','bjv-004','IS-SIEGE-ONU-001','etax',1);

INSERT INTO demandes (id, reference, base_juridique_version_id, beneficiaire_id, statut_code, date_depot, date_echeance, montant_fcfa, secteur, created_at) VALUES
('dem-001','OASE-2024-000001','bjv-001','ben-001','approuve','2024-09-10 08:30:00.000','2025-09-10',15000000,'Industrie textile','2024-09-10 08:30:00.000'),
('dem-002','OASE-2024-000002','bjv-002','ben-002','approuve','2024-10-05 09:15:00.000','2025-10-05',8200000,'Agriculture','2024-10-05 09:15:00.000'),
('dem-003','OASE-2025-000001','bjv-004','ben-003','approuve','2025-03-20 10:00:00.000','2026-03-20',25000000,'Developpement','2025-03-20 10:00:00.000'),
('dem-004','OASE-2026-000001','bjv-001','ben-001','soumis','2026-01-15 14:20:00.000','2027-01-15',12000000,'Industrie textile','2026-01-15 14:20:00.000'),
('dem-005','OASE-2026-000002','bjv-003','ben-002','en_instruction','2026-02-10 11:00:00.000','2027-02-10',9500000,'Agriculture','2026-02-10 11:00:00.000');

INSERT INTO quotas (id, base_juridique_version_id, exercice_annuel, type_quota_code, unite_code, total, consomme, alerte_seuil_pct) VALUES
('quo-001','bjv-001',2024,'global_mesure','fcfa',50000000000,15000000,80),
('quo-002','bjv-001',2025,'global_mesure','fcfa',50000000000,12000000,80),
('quo-003','bjv-002',2024,'global_mesure','fcfa',30000000000,8200000,80),
('quo-004','bjv-004',2025,'global_mesure','fcfa',100000000000,25000000,80);

INSERT INTO anomalies (id, categorie_code, gravite_code, description, demande_id, date_detection, statut_code, detectee_par_code) VALUES
('ano-001','procedurale','moyenne','Delai de traitement depasse de 5 jours pour la demande OASE-2024-000001','dem-001','2024-09-20 08:00:00.000','traitee','moteur_regles'),
('ano-002','financiere','elevee','Montant demande superieur au quota restant pour la mesure MRD-2024-0100','dem-004','2026-01-16 09:00:00.000','nouvelle','moteur_regles');

INSERT INTO connecteurs (id, nom, code_systeme, institution_id, statut_code, endpoint, config_auth, latence_ms, taux_erreur) VALUES
('conn-001','Sydonia World','SYDONIA','inst-002','actif','https://sydonia.otr.tg/api/v2','{"mock":true}',120,0.00),
('conn-002','E-TAX / SIGTAS','ETAX','inst-001','actif','https://etax.otr.tg/api/v1','{"mock":true}',85,0.00),
('conn-003','SIGFiP','SIGFIP','inst-003','inactif','https://sigfip.dgbf.fin.tg/ws','{"mock":true}',0,0.00),
('conn-004','GUDEF','GUDEF','inst-004','inactif','https://gudef.tresor.fin.tg/api','{"mock":true}',0,0.00),
('conn-005','Base DLFC (DAS)','DAS','inst-003','inactif','https://das.dgbf.fin.tg/soap','{"mock":true}',0,0.00);

INSERT INTO audit_logs (id, horodatage, utilisateur_id, role_au_moment, action, entite, entite_id, demande_id, nouvelle_valeur, empreinte_sha256) VALUES
('audit-001','2024-09-10 08:30:00.000','user-006','beneficiaire','SOUMETTRE_DEMANDE','demandes','dem-001','dem-001','{"statut":"soumis"}','a1b2c3d4e5f6789012345678901234567890abcd1234567890abcdef12345678'),
('audit-002','2024-09-12 10:15:00.000','user-002','agent_ci','VALIDER_ETAPE','demande_workflow_etapes','dwe-001','dem-001','{"statut":"valide"}','b2c3d4e5f6789012345678901234567890abcd1234567890abcdef1234567891'),
('audit-003','2024-09-15 14:00:00.000','user-004','decideur','APPROUVER_DEMANDE','demandes','dem-001','dem-001','{"statut":"approuve","montant":15000000}','c3d4e5f6789012345678901234567890abcd1234567890abcdef1234567892');

INSERT INTO roles_permissions (role, ressource, action, perimetre) VALUES
('admin_si','utilisateurs','create',NULL),
('admin_si','utilisateurs','read',NULL),
('admin_si','utilisateurs','update',NULL),
('admin_si','utilisateurs','delete',NULL),
('beneficiaire','demandes','create',NULL),
('beneficiaire','demandes','read','beneficiaire_id=self'),
('beneficiaire','demandes','update','beneficiaire_id=self'),
('agent_ci','demandes','read','organe_gestion_code=CI'),
('agent_ci','demandes','update','organe_gestion_code=CI'),
('agent_ci','demande_workflow_etapes','update','organe_gestion_code=CI'),
('decideur','demandes','read',NULL),
('decideur','demandes','update',NULL),
('decideur','decisions','create',NULL),
('auditeur','audit_logs','read',NULL),
('auditeur','anomalies','read',NULL),
('auditeur','anomalies','update',NULL),
('agent_agence','demandes','read','type_texte_1=Code Investissements'),
('agent_agence','demandes','update','type_texte_1=Code Investissements');

INSERT INTO parametres_systeme (id, code, type_parametre_code, libelle, valeur, description) VALUES
('param-001','ARCHIVAGE_DELAI_JOURS','archivage','365','Delai avant archivage automatique des demandes terminees','Nombre de jours apres lequel une demande approuvee/rejetee est archivee'),
('param-002','NOTIFICATION_ECHEANCE_J30','notification','30','Alerte echeance J-30','Nombre de jours avant echeance pour alerte J-30'),
('param-003','QUOTA_ALERTE_SEUIL_DEFAUT','quota','80','Seuil d alerte quota par defaut','Pourcentage de consommation declenchant une alerte'),
('param-004','CONNECTEUR_TIMEOUT_DEFAUT','connecteur','10','Timeout connecteur par defaut','Timeout en secondes pour les appels connecteurs');
```

---

## 20. Notes d'implémentation

### 20.1 SCD Type 2 — `bases_juridiques` / `base_juridique_versions`

- L’entité stable `bases_juridiques` porte le `code_mesure` unique.
- Chaque modification crée une nouvelle ligne dans `base_juridique_versions` avec `version` incrémenté et `valid_from` positionné ; la version précédente reçoit `valid_to = NOW()`.
- Les demandes stockent une FK vers la version en vigueur au moment du dépôt : pas de rétroactivité.
- La vue `v_bases_juridiques_actives` permet de récupérer la version courante d’une mesure.

### 20.2 Workflow normalisé

- `workflow_templates` remplace le JSON opaque. Chaque étape est une ligne dans `workflow_template_etapes`.
- Les transitions optionnelles sont dans `workflow_template_transitions`.
- À la soumission, une instance est créée dans `demande_workflow_instances` et ses étapes dans `demande_workflow_etapes`.
- Le statut d’une demande est mis à jour selon l’avancement de ses étapes.

### 20.3 Audit log inaltérable

- Les triggers `trg_audit_logs_no_update` et `trg_audit_logs_no_delete` interdisent toute modification ou suppression.
- L’empreinte SHA-256 doit être calculée par l’application en chaînant l’empreinte de la ligne précédente.

### 20.4 Quotas

- `quotas` conserve le solde courant.
- `quota_mouvements` historise chaque consommation, libération ou ajustement.
- La vue `v_alertes_quotas` calcule le taux de consommation en temps réel.

### 20.5 Actes

- Les actes administratifs (`actes`) sont générés après une décision finale.
- Le champ `qr_code_hash` est l’identifiant public vérifiable sur le portail Open Data (`/attestations/verifier`).
- Une révocation est possible mais conserve l’historique (champs `est_revoke`, `date_revocation`, `motif_revocation`).

### 20.6 Connecteurs

- `config_auth` stocke la configuration chiffrée (AES-256-GCM) sous forme JSON.
- `connecteur_logs` trace tous les appels entrants/sortants.
- `demande_sync_externe` gère les push asynchrones vers les SI externes avec retry.

---

*Fin du MLD OASE v3 — MySQL 8/9.*
