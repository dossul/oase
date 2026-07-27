-- ============================================================
-- OASE — Migration 004 : Éradication finale de « beneficiaire »
-- Renomme les valeurs d'enum, index et contraintes restants
-- Idempotente : utilise ALTER ... RENAME INDEX (MySQL 8+)
-- ============================================================

-- 1. Valeur d'enum ref_types_quota : par_beneficiaire → par_contribuable
UPDATE ref_types_quota SET code = 'par_contribuable', libelle = 'Par contribuable' WHERE code = 'par_beneficiaire';

-- 2. Données quotas : type_quota_code par_beneficiaire → par_contribuable
UPDATE quotas SET type_quota_code = 'par_contribuable' WHERE type_quota_code = 'par_beneficiaire';

-- 3. Renommage des index via ALTER TABLE ... RENAME INDEX (MySQL 8+)
-- 3a. Fulltext index sur contribuables (déjà renommé par migration 002b)
-- ALTER TABLE `contribuables` RENAME INDEX `ft_beneficiaires` TO `ft_contribuables`;

-- 3b. idx_beneficiaire_id → idx_contribuable_id (7 tables)
ALTER TABLE `actes` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;
ALTER TABLE `agrement_contribuables` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;
ALTER TABLE `agrements` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;
ALTER TABLE `contribuable_historique_fiscal` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;
ALTER TABLE `conventions` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;
ALTER TABLE `demandes` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;
ALTER TABLE `quotas` RENAME INDEX `idx_beneficiaire_id` TO `idx_contribuable_id`;

-- 3c. idx_demandes_beneficiaire_statut → idx_demandes_contribuable_statut
ALTER TABLE `demandes` RENAME INDEX `idx_demandes_beneficiaire_statut` TO `idx_demandes_contribuable_statut`;

-- 3d. idx_type_beneficiaire_code → idx_type_contribuable_code (contribuables)
ALTER TABLE `contribuables` RENAME INDEX `idx_type_beneficiaire_code` TO `idx_type_contribuable_code`;

-- 3e. type_beneficiaire_code → type_contribuable_code (reporting_aggregats)
ALTER TABLE `reporting_aggregats` RENAME INDEX `type_beneficiaire_code` TO `type_contribuable_code`;

-- 4. Contrainte unique uk_agrement_beneficiaire → uk_agrement_contribuable
ALTER TABLE `agrement_contribuables` RENAME INDEX `uk_agrement_beneficiaire` TO `uk_agrement_contribuable`;

-- 5. Bloc de vérification final — doit retourner 0 partout
-- SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'oase' AND INDEX_NAME LIKE '%beneficiaire%';
-- SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = 'oase' AND CONSTRAINT_NAME LIKE '%beneficiaire%';
-- SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'oase' AND COLUMN_NAME LIKE '%beneficiaire%';
-- SELECT COUNT(*) FROM ref_types_quota WHERE code LIKE '%beneficiaire%' OR libelle LIKE '%beneficiaire%';
-- SELECT COUNT(*) FROM ref_roles WHERE code LIKE '%beneficiaire%' OR libelle LIKE '%beneficiaire%';
-- SELECT COUNT(*) FROM utilisateurs WHERE role LIKE '%beneficiaire%';
