-- ====================================================================
-- OASE - Migration 003 : creation de compte contribuable (Lot 1)
-- ====================================================================
-- Date       : 2026-07-14
-- Auteur     : Mavis (pour Ulrich)
-- Cible      : DB oase (locale wamp64, prod Hostinger, dev docker)
-- Feature    : Inscription self-service contribuable + OTP SMS + complétude profil
-- Lot 1      : schema uniquement (pas de code back, pas de code front)
-- Idempotent : OUI (peut etre rejoue)
-- ====================================================================
--
-- Ce que cette migration ajoute :
--   1. Table phone_otp_codes         : OTP SMS hashes (jamais en clair)
--   2. Colonne contribuables.profil_completude       (INT, default 0)
--   3. Colonne contribuables.profil_locked            (TINYINT, default 0)
--   4. Colonne contribuables.derniere_maj_completude  (DATETIME)
--   5. Colonne pieces_jointes.contribuable_id        (CHAR(36), NULL)
--   6. pieces_jointes.demande_id devient NULLABLE    (etait NOT NULL)
--   7. FK pieces_jointes.contribuable_id -> contribuables(id) ON DELETE CASCADE
--   8. Index idx_contribuable_id sur pieces_jointes
--
-- Pattern de l'equipe : le projet utilise deja des procedures
-- rename_col_if_old_exists / rename_index_if_exists (cf 002b). On etend le pattern
-- avec add_col_if_not_exists pour rester coherent.
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 0. Procedure utilitaire : add column si elle n'existe pas deja
-- ============================================================
DROP PROCEDURE IF EXISTS add_col_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_col_if_not_exists(
  IN p_table   VARCHAR(64),
  IN p_column  VARCHAR(64),
  IN p_def     TEXT
)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_def);
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT(p_table, '.', p_column, ' : ajoute OK') AS msg;
  ELSE
    SELECT CONCAT(p_table, '.', p_column, ' : deja present, skip') AS msg;
  END IF;
END //
DELIMITER ;

-- ============================================================
-- 0b. Procedure utilitaire : add index si elle n'existe pas deja
-- ============================================================
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_index_if_not_exists(
  IN p_table  VARCHAR(64),
  IN p_index  VARCHAR(64),
  IN p_def    TEXT
)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` ', p_def);
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT(p_table, '.', p_index, ' : index ajoute OK') AS msg;
  ELSE
    SELECT CONCAT(p_table, '.', p_index, ' : deja present, skip') AS msg;
  END IF;
END //
DELIMITER ;

-- ============================================================
-- 0c. Procedure utilitaire : add foreign key si elle n'existe pas
-- ============================================================
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_fk_if_not_exists(
  IN p_table      VARCHAR(64),
  IN p_constraint VARCHAR(64),
  IN p_def        TEXT
)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = p_constraint) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_constraint, '` ', p_def);
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT(p_table, '.', p_constraint, ' : FK ajoutee OK') AS msg;
  ELSE
    SELECT CONCAT(p_table, '.', p_constraint, ' : deja presente, skip') AS msg;
  END IF;
END //
DELIMITER ;

-- ============================================================
-- 1. TABLE phone_otp_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id            CHAR(36)     NOT NULL,
  telephone     VARCHAR(20)  NOT NULL,
  contexte      VARCHAR(30)  NOT NULL COMMENT 'SIGNUP | RESET_PWD | futur IMPORT_DGI',
  code_hash     CHAR(64)     NOT NULL COMMENT 'SHA-256(code_otp + sel) - jamais en clair',
  sel           VARCHAR(32)  NOT NULL COMMENT 'sel aleatoire par OTP',
  payload_json  JSON         NULL     COMMENT 'donnees contextuelles (email, passwordHash brouillé, etc.)',
  tentatives    SMALLINT     NOT NULL DEFAULT 0,
  expires_at    DATETIME(3)  NOT NULL,
  est_utilise   TINYINT(1)   NOT NULL DEFAULT 0,
  ip_origine    VARCHAR(45)  NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_phone_otp_actif (telephone, contexte, est_utilise),
  INDEX idx_phone_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='OTP SMS pour signup/reset/import contribuable. Code en clair JAMAIS stocke.';

-- ============================================================
-- 2. COLONNES profil_completude / profil_locked / derniere_maj_completude
--    sur la table contribuables
-- ============================================================
CALL add_col_if_not_exists('contribuables', 'profil_completude',       'INT          NOT NULL DEFAULT 0  COMMENT "Score 0..100"');
CALL add_col_if_not_exists('contribuables', 'profil_locked',           'TINYINT(1)   NOT NULL DEFAULT 0  COMMENT "Verrouille les demandes si score < 100"');
CALL add_col_if_not_exists('contribuables', 'derniere_maj_completude', 'DATETIME(3)  NULL                 COMMENT "Dernier calcul du score"');

-- Index sur profil_locked pour accelerer le check a la creation de demande
CALL add_index_if_not_exists('contribuables', 'idx_profil_locked', '(profil_locked)');

-- ============================================================
-- 3. pieces_jointes : rendre demande_id NULLABLE + ajouter contribuable_id
-- ============================================================

-- 3a. Rendre demande_id NULLABLE (idempotent)
SET @col_nullable := (
  SELECT IS_NULLABLE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pieces_jointes' AND COLUMN_NAME = 'demande_id'
);
SET @sql := IF(@col_nullable = 'NO',
  'ALTER TABLE `pieces_jointes` MODIFY COLUMN `demande_id` CHAR(36) NULL',
  'SELECT "pieces_jointes.demande_id : deja nullable, skip" AS msg'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3b. Ajouter la colonne contribuable_id
CALL add_col_if_not_exists('pieces_jointes', 'contribuable_id', 'CHAR(36) NULL COMMENT "PJ de profil (null si PJ de demande)"');

-- 3c. Index sur contribuable_id
CALL add_index_if_not_exists('pieces_jointes', 'idx_contribuable_id', '(contribuable_id)');

-- 3d. FK contribuable_id -> contribuables(id) ON DELETE CASCADE
CALL add_fk_if_not_exists('pieces_jointes', 'pieces_jointes_ibfk_5',
  'FOREIGN KEY (contribuable_id) REFERENCES contribuables(id) ON DELETE CASCADE ON UPDATE NO ACTION');

-- ============================================================
-- 4. Nettoyage des procedures
-- ============================================================
DROP PROCEDURE add_col_if_not_exists;
DROP PROCEDURE add_index_if_not_exists;
DROP PROCEDURE add_fk_if_not_exists;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 5. VERIFICATION FINALE (tout doit etre OK ci-dessous)
-- ============================================================
SELECT '--- VERIFICATION ---' AS section;

SELECT
  (SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phone_otp_codes') AS table_phone_otp_codes_existe,

  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contribuables' AND COLUMN_NAME = 'profil_completude') AS col_profil_completude,

  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contribuables' AND COLUMN_NAME = 'profil_locked') AS col_profil_locked,

  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contribuables' AND COLUMN_NAME = 'derniere_maj_completude') AS col_derniere_maj_completude,

  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pieces_jointes' AND COLUMN_NAME = 'contribuable_id') AS col_pj_contribuable_id,

  (SELECT IS_NULLABLE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pieces_jointes' AND COLUMN_NAME = 'demande_id') AS pj_demande_id_nullable,

  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pieces_jointes'
     AND CONSTRAINT_NAME = 'pieces_jointes_ibfk_5' AND CONSTRAINT_TYPE = 'FOREIGN KEY') AS fk_pj_contribuable_ok,

  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pieces_jointes' AND INDEX_NAME = 'idx_contribuable_id') AS idx_pj_contribuable_ok;
