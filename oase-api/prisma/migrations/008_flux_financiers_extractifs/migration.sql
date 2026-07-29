-- CreateTable : flux financiers extractifs (Annexe 1.1 ITIE feuilles 3 à 6)

-- Feuille 4 : production minière mensuelle par société / substance
CREATE TABLE `productions_extractives` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `contribuable_id` CHAR(36) NOT NULL,
    `permis_id` CHAR(36) NULL,
    `annee` INT NOT NULL,
    `mois` INT NOT NULL,
    `substance` VARCHAR(100) NOT NULL,
    `volume_produit_t` DECIMAL(14,2) NULL,
    `volume_vendu_t` DECIMAL(14,2) NULL,
    `volume_traite_t` DECIMAL(14,2) NULL,
    `valeur_marchande_fcfa` BIGINT NULL,
    `valeur_marchande_usd` BIGINT NULL,
    `chiffre_affaires_fcfa` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_production_periode`(`contribuable_id`, `annee`, `mois`, `substance`),
    INDEX `idx_production_permis`(`permis_id`),
    INDEX `idx_production_annee`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Feuille 3 : exportations minières mensuelles
CREATE TABLE `exportations_extractives` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `contribuable_id` CHAR(36) NOT NULL,
    `annee` INT NOT NULL,
    `mois` INT NOT NULL,
    `substance` VARCHAR(100) NOT NULL,
    `volume_t` DECIMAL(14,2) NULL,
    `valeur_fcfa` BIGINT NULL,
    `valeur_usd` BIGINT NULL,
    `destination` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_exportation_periode`(`contribuable_id`, `annee`, `mois`, `substance`),
    INDEX `idx_exportation_annee`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Feuille 5 : redevances minières trimestrielles (assiette, taux, dû vs payé)
CREATE TABLE `redevances_minieres` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `contribuable_id` CHAR(36) NOT NULL,
    `annee` INT NOT NULL,
    `trimestre` INT NOT NULL,
    `substance` VARCHAR(100) NOT NULL,
    `base_assiette_fcfa` BIGINT NULL,
    `taux` DECIMAL(5,2) NULL,
    `montant_du_fcfa` BIGINT NULL,
    `montant_paye_fcfa` BIGINT NULL,
    `date_paiement` DATE NULL,
    `reference_paiement` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_redevance_periode`(`contribuable_id`, `annee`, `trimestre`, `substance`),
    INDEX `idx_redevance_annee`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Feuille 6 : transferts aux communes — CFLDR 0,75 % du CA annuel
CREATE TABLE `transferts_communes_cfldr` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `contribuable_id` CHAR(36) NOT NULL,
    `annee` INT NOT NULL,
    `commune` VARCHAR(100) NOT NULL,
    `chiffre_affaires_annuel_fcfa` BIGINT NULL,
    `montant_du_fcfa` BIGINT NULL,
    `montant_encaisse_fcfa` BIGINT NULL,
    `date_encaissement` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_transfert_periode`(`contribuable_id`, `annee`, `commune`),
    INDEX `idx_transfert_annee`(`annee`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `productions_extractives` ADD CONSTRAINT `productions_extractives_ibfk_1` FOREIGN KEY (`contribuable_id`) REFERENCES `contribuables`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE `productions_extractives` ADD CONSTRAINT `productions_extractives_ibfk_2` FOREIGN KEY (`permis_id`) REFERENCES `permis_miniers`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE `exportations_extractives` ADD CONSTRAINT `exportations_extractives_ibfk_1` FOREIGN KEY (`contribuable_id`) REFERENCES `contribuables`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE `redevances_minieres` ADD CONSTRAINT `redevances_minieres_ibfk_1` FOREIGN KEY (`contribuable_id`) REFERENCES `contribuables`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE `transferts_communes_cfldr` ADD CONSTRAINT `transferts_communes_cfldr_ibfk_1` FOREIGN KEY (`contribuable_id`) REFERENCES `contribuables`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
