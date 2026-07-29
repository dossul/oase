-- CreateTable : répertoire minier (Annexe 1.1 feuilles 16-17 — permis, titres et autorisations)
CREATE TABLE `permis_miniers` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `reference` VARCHAR(30) NOT NULL,
    `contribuable_id` CHAR(36) NOT NULL,
    `convention_id` CHAR(36) NULL,
    `type_permis` VARCHAR(30) NOT NULL,
    `substance` VARCHAR(100) NOT NULL,
    `date_demande` DATE NOT NULL,
    `date_octroi` DATE NOT NULL,
    `duree_annees` INT NOT NULL,
    `superficie_km2` DECIMAL(10,2) NULL,
    `localite` VARCHAR(200) NULL,
    `longitude` DECIMAL(10,6) NULL,
    `latitude` DECIMAL(10,6) NULL,
    `rapport_eie_public` BOOLEAN NOT NULL DEFAULT FALSE,
    `lien_rapport_eie` VARCHAR(500) NULL,
    `mode_octroi` VARCHAR(30) NOT NULL,
    `statut` VARCHAR(30) NOT NULL DEFAULT 'actif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reference`(`reference`),
    INDEX `idx_permis_contribuable`(`contribuable_id`),
    INDEX `idx_permis_convention`(`convention_id`),
    INDEX `idx_permis_type`(`type_permis`),
    INDEX `idx_permis_statut`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `permis_miniers` ADD CONSTRAINT `permis_miniers_ibfk_1` FOREIGN KEY (`contribuable_id`) REFERENCES `contribuables`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE `permis_miniers` ADD CONSTRAINT `permis_miniers_ibfk_2` FOREIGN KEY (`convention_id`) REFERENCES `conventions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
