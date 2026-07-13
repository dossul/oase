-- ====================================================================
-- OASE - Migration manuelle 002b (complement de 002_rename_beneficiaire_to_contribuable)
-- ====================================================================
-- Date: 2026-07-13
-- Auteur: Mavis (deployee pour Ulrich)
-- But: La migration Prisma 002 a renomme les TABLES mais pas les COLONNES.
--      Le schema.prisma attend contribuable_id / type_contribuable_code.
-- ====================================================================
-- Cible: DB prod (oase) sur VPS Hostinger
-- Usage: docker exec -i oase-db mysql -u$DB_USER -p$DB_PASS oase < migration_002b.sql
-- Note:  IDEMPOTENT (peut etre rejoue plusieurs fois)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Procedure utilitaire: rename column si elle existe avec l'ancien nom
-- ============================================================
DROP PROCEDURE IF EXISTS rename_col_if_old_exists;
DELIMITER //
CREATE PROCEDURE rename_col_if_old_exists(
  IN p_table VARCHAR(64),
  IN p_old VARCHAR(64),
  IN p_new VARCHAR(64),
  IN p_type VARCHAR(64),
  IN p_nullable VARCHAR(8)
)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_old) > 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` CHANGE COLUMN `', p_old, '` `', p_new, '` ', p_type, ' ', p_nullable);
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT(p_table, '.', p_old, ' -> ', p_new, ' (', p_nullable, ') OK') AS msg;
  ELSE
    SELECT CONCAT(p_table, '.', p_old, ': deja renomme, skip') AS msg;
  END IF;
END //
DELIMITER ;

-- ============================================================
-- 1. RENOMMAGE DES COLONNES beneficiaire_id -> contribuable_id
-- ============================================================
CALL rename_col_if_old_exists('actes', 'beneficiaire_id', 'contribuable_id', 'CHAR(36)', 'NOT NULL');
CALL rename_col_if_old_exists('agrement_contribuables', 'beneficiaire_id', 'contribuable_id', 'CHAR(36)', 'NOT NULL');
CALL rename_col_if_old_exists('contribuable_historique_fiscal', 'beneficiaire_id', 'contribuable_id', 'CHAR(36)', 'NOT NULL');
CALL rename_col_if_old_exists('conventions', 'beneficiaire_id', 'contribuable_id', 'CHAR(36)', 'NOT NULL');
CALL rename_col_if_old_exists('demandes', 'beneficiaire_id', 'contribuable_id', 'CHAR(36)', 'NOT NULL');
CALL rename_col_if_old_exists('quotas', 'beneficiaire_id', 'contribuable_id', 'CHAR(36)', 'NULL');
CALL rename_col_if_old_exists('base_juridique_versions', 'type_beneficiaire_cible', 'type_contribuable_cible', 'VARCHAR(100)', 'NULL');
CALL rename_col_if_old_exists('contribuables', 'type_beneficiaire_code', 'type_contribuable_code', 'VARCHAR(50)', 'NOT NULL');
CALL rename_col_if_old_exists('reporting_aggregats', 'type_beneficiaire_code', 'type_contribuable_code', 'VARCHAR(50)', 'NULL');

-- ============================================================
-- 2. RENOMMAGE DES INDEX (idempotent)
-- ============================================================
DROP PROCEDURE IF EXISTS rename_index_if_exists;
DELIMITER //
CREATE PROCEDURE rename_index_if_exists(IN p_table VARCHAR(64), IN p_old VARCHAR(64), IN p_new VARCHAR(64))
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_old) > 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` RENAME INDEX `', p_old, '` TO `', p_new, '`');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT(p_table, '.', p_old, ' -> ', p_new, ' OK') AS msg;
  ELSE
    SELECT CONCAT(p_table, '.', p_old, ': deja renomme, skip') AS msg;
  END IF;
END //
DELIMITER ;

CALL rename_index_if_exists('actes', 'idx_beneficiaire_id', 'idx_contribuable_id');
CALL rename_index_if_exists('agrement_contribuables', 'idx_beneficiaire_id', 'idx_contribuable_id');
CALL rename_index_if_exists('agrement_contribuables', 'uk_agrement_beneficiaire', 'uk_agrement_contribuable');
CALL rename_index_if_exists('contribuable_historique_fiscal', 'idx_beneficiaire_id', 'idx_contribuable_id');
CALL rename_index_if_exists('contribuables', 'idx_type_beneficiaire_code', 'idx_type_contribuable_code');
CALL rename_index_if_exists('contribuables', 'ft_beneficiaires', 'ft_contribuables');
CALL rename_index_if_exists('conventions', 'idx_beneficiaire_id', 'idx_contribuable_id');
CALL rename_index_if_exists('demandes', 'idx_beneficiaire_id', 'idx_contribuable_id');
CALL rename_index_if_exists('demandes', 'idx_demandes_beneficiaire_statut', 'idx_demandes_contribuable_statut');
CALL rename_index_if_exists('quotas', 'idx_beneficiaire_id', 'idx_contribuable_id');

DROP PROCEDURE rename_index_if_exists;
DROP PROCEDURE rename_col_if_old_exists;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 3. VERIFICATION FINALE (doit retourner 0 partout)
-- ============================================================
SELECT 'RESTANT (doit etre 0):' AS section;
SELECT
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME LIKE '%beneficiaire%') AS colonnes_beneficiaire,
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME LIKE '%beneficiaire%') AS index_beneficiaire,
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_NAME LIKE '%beneficiaire%') AS fk_beneficiaire;
