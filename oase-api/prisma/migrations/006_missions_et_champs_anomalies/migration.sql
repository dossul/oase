-- CreateTable : missions de contrôle / audit
CREATE TABLE `missions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `reference` VARCHAR(20) NOT NULL,
    `titre` VARCHAR(200) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `statut` VARCHAR(20) NOT NULL DEFAULT 'planifiee',
    `organe` VARCHAR(100) NULL,
    `auditeur_id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NULL,
    `date_debut` DATE NULL,
    `date_fin` DATE NULL,
    `constats` TEXT NULL,
    `recommandations` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reference`(`reference`),
    INDEX `idx_missions_auditeur`(`auditeur_id`),
    INDEX `idx_missions_demande`(`demande_id`),
    INDEX `idx_missions_statut`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable : anomalies — montant en cause + base légale violée (nullable)
ALTER TABLE `anomalies`
    ADD COLUMN `montant_en_cause` BIGINT NULL,
    ADD COLUMN `base_legale_violee` VARCHAR(200) NULL;

-- AddForeignKey
ALTER TABLE `missions` ADD CONSTRAINT `missions_ibfk_1` FOREIGN KEY (`auditeur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE `missions` ADD CONSTRAINT `missions_ibfk_2` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
