-- CreateTable
CREATE TABLE `accords_siege` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `institution` VARCHAR(200) NOT NULL,
    `type_institution_code` VARCHAR(50) NOT NULL,
    `texte_fondateur` TEXT NULL,
    `date_signature` DATE NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_type_institution_code`(`type_institution_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `actes` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `demande_id` CHAR(36) NOT NULL,
    `decision_id` CHAR(36) NULL,
    `type_code` VARCHAR(50) NOT NULL,
    `reference` VARCHAR(50) NOT NULL,
    `beneficiaire_id` CHAR(36) NOT NULL,
    `montant_fcfa` BIGINT NULL,
    `date_effet` DATE NOT NULL,
    `document_url` VARCHAR(500) NOT NULL,
    `hash_document` CHAR(64) NOT NULL,
    `qr_code_hash` CHAR(64) NOT NULL,
    `qr_code_image_url` VARCHAR(500) NULL,
    `est_revoke` BOOLEAN NOT NULL DEFAULT false,
    `date_revocation` DATETIME(3) NULL,
    `motif_revocation` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reference`(`reference`),
    INDEX `idx_actes_demande_type`(`demande_id`, `type_code`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    INDEX `idx_decision_id`(`decision_id`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_qr_code_hash`(`qr_code_hash`),
    INDEX `idx_reference`(`reference`),
    INDEX `idx_type_code`(`type_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `agrement_beneficiaires` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `agrement_id` CHAR(36) NOT NULL,
    `beneficiaire_id` CHAR(36) NOT NULL,
    `role` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_agrement_id`(`agrement_id`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    UNIQUE INDEX `uk_agrement_beneficiaire`(`agrement_id`, `beneficiaire_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `agrements` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `reference` VARCHAR(30) NOT NULL,
    `beneficiaire_id` CHAR(36) NOT NULL,
    `type_agrement_code` VARCHAR(50) NOT NULL,
    `base_juridique_version_id` CHAR(36) NULL,
    `regime_code` VARCHAR(50) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'active',
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NOT NULL,
    `montant_estime` BIGINT NULL,
    `objet` TEXT NULL,
    `document_url` VARCHAR(500) NULL,
    `hash_document` CHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reference`(`reference`),
    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `idx_type_agrement_code`(`type_agrement_code`),
    INDEX `regime_code`(`regime_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `anomalies` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `categorie_code` VARCHAR(50) NOT NULL,
    `gravite_code` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `demande_id` CHAR(36) NULL,
    `base_juridique_version_id` CHAR(36) NULL,
    `convention_id` CHAR(36) NULL,
    `date_detection` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'nouvelle',
    `detectee_par_code` VARCHAR(50) NOT NULL,
    `utilisateur_id` CHAR(36) NULL,
    `regle_id` VARCHAR(100) NULL,
    `commentaire` TEXT NULL,
    `date_resolution` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_anomalies_regle`(`regle_id`),
    INDEX `idx_anomalies_demande_gravite`(`demande_id`, `gravite_code`),
    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_categorie_code`(`categorie_code`),
    INDEX `idx_convention_id`(`convention_id`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_detectee_par_code`(`detectee_par_code`),
    INDEX `idx_gravite_code_statut_code`(`gravite_code`, `statut_code`),
    INDEX `statut_code`(`statut_code`),
    INDEX `utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `archivages` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `type_entite` VARCHAR(50) NOT NULL,
    `entite_id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    `chemin_archive` VARCHAR(500) NULL,
    `hash_archive` CHAR(64) NULL,
    `declenche_par` VARCHAR(50) NOT NULL DEFAULT 'systeme',
    `date_archivage` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `idx_type_entite_entite_id`(`type_entite`, `entite_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `horodatage` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `utilisateur_id` CHAR(36) NULL,
    `role_au_moment` VARCHAR(50) NULL,
    `institution` VARCHAR(100) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entite` VARCHAR(50) NOT NULL,
    `entite_id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NULL,
    `ancienne_valeur` JSON NULL,
    `nouvelle_valeur` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `hash_precedent` CHAR(64) NULL,
    `empreinte_sha256` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_action`(`action`),
    INDEX `idx_audit_logs_action_entite`(`action`, `entite`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_entite_entite_id`(`entite`, `entite_id`),
    INDEX `idx_horodatage`(`horodatage`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `base_juridique_documents` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `base_juridique_version_id` CHAR(36) NOT NULL,
    `type_document` VARCHAR(50) NOT NULL,
    `reference_document` VARCHAR(200) NULL,
    `date_document` DATE NULL,
    `nom_fichier` VARCHAR(300) NOT NULL,
    `type_mime` VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    `taille_octets` BIGINT NULL,
    `url_stockage` VARCHAR(500) NOT NULL,
    `hash_sha256` CHAR(64) NOT NULL,
    `est_texte_fondateur` BOOLEAN NOT NULL DEFAULT false,
    `est_public` BOOLEAN NOT NULL DEFAULT true,
    `uploaded_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_date_document`(`date_document`),
    INDEX `idx_est_public`(`est_public`),
    INDEX `idx_est_texte_fondateur`(`est_texte_fondateur`),
    INDEX `idx_type_document`(`type_document`),
    INDEX `uploaded_by_id`(`uploaded_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `base_juridique_versions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `base_juridique_id` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `libelle` TEXT NOT NULL,
    `impot_concerne` VARCHAR(100) NOT NULL,
    `nature_mesure_code` VARCHAR(50) NOT NULL,
    `type_texte_1` VARCHAR(100) NULL,
    `type_texte_2` VARCHAR(50) NULL,
    `support_juridique_base` TEXT NULL,
    `support_juridique_complem` TEXT NULL,
    `article` VARCHAR(200) NULL,
    `article_cgi_2025` VARCHAR(100) NULL,
    `portee_categorie_code` VARCHAR(50) NOT NULL DEFAULT 'Permanente',
    `portee_duree_mois` INTEGER NULL,
    `portee_description` TEXT NULL,
    `organe_gestion_code` VARCHAR(50) NULL,
    `organe_attribution` VARCHAR(100) NULL,
    `systeme_information` VARCHAR(100) NULL,
    `mode_instruction_code` VARCHAR(50) NOT NULL DEFAULT 'manuel',
    `objectif_type` VARCHAR(50) NULL,
    `branche_activite` VARCHAR(100) NULL,
    `type_beneficiaire_cible` VARCHAR(100) NULL,
    `est_depense_fiscale_2024` BOOLEAN NOT NULL DEFAULT false,
    `est_evaluee_2024` BOOLEAN NOT NULL DEFAULT false,
    `donnees_disponibles` BOOLEAN NOT NULL DEFAULT false,
    `fonction_budgetaire` VARCHAR(100) NULL,
    `conformite_texte_fondament` VARCHAR(10) NULL,
    `conformite_directive_uemoa` VARCHAR(10) NULL,
    `odd` VARCHAR(20) NULL,
    `programme_dotation` VARCHAR(100) NULL,
    `position_sh` VARCHAR(50) NULL,
    `est_active` BOOLEAN NOT NULL DEFAULT true,
    `date_adoption` DATE NULL,
    `date_abrogation` DATE NULL,
    `valid_from` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valid_to` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version_courante_flag` TINYINT NULL,

    INDEX `idx_base_juridique_id`(`base_juridique_id`),
    INDEX `idx_base_juridique_versions_active`(`base_juridique_id`, `est_active`, `valid_to`),
    INDEX `idx_code_mesure_version`(`valid_from`, `valid_to`),
    INDEX `idx_est_active_valid_to`(`est_active`, `valid_to`),
    INDEX `idx_impot_concerne`(`impot_concerne`),
    INDEX `idx_mode_instruction_code`(`mode_instruction_code`),
    INDEX `idx_organe_gestion_code`(`organe_gestion_code`),
    INDEX `idx_type_texte_1`(`type_texte_1`),
    INDEX `nature_mesure_code`(`nature_mesure_code`),
    INDEX `portee_categorie_code`(`portee_categorie_code`),
    UNIQUE INDEX `uk_base_juridique_version`(`base_juridique_id`, `version`),
    UNIQUE INDEX `uk_une_seule_version_active`(`base_juridique_id`, `version_courante_flag`),
    FULLTEXT INDEX `ft_bjv_libelle`(`libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `bases_juridiques` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `code_mesure` VARCHAR(20) NOT NULL,
    `code_mesure_mrd` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code_mesure`(`code_mesure`),
    INDEX `idx_code_mesure`(`code_mesure`),
    INDEX `idx_code_mesure_mrd`(`code_mesure_mrd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `beneficiaire_historique_fiscal` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `beneficiaire_id` CHAR(36) NOT NULL,
    `statut_fiscal_code` VARCHAR(50) NOT NULL,
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NULL,
    `source` VARCHAR(100) NULL,
    `connecteur_code` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_histofiscal_connecteur`(`connecteur_code`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    INDEX `idx_statut_fiscal_code`(`statut_fiscal_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `beneficiaires` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `raison_sociale` VARCHAR(200) NOT NULL,
    `nif` VARCHAR(20) NOT NULL,
    `rccm` VARCHAR(30) NULL,
    `type_beneficiaire_code` VARCHAR(50) NOT NULL,
    `statut_fiscal_code` VARCHAR(50) NOT NULL DEFAULT 'inconnu',
    `secteur` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `email_contact` VARCHAR(200) NULL,
    `telephone` VARCHAR(20) NULL,
    `adresse` TEXT NULL,
    `accord_siege_id` CHAR(36) NULL,
    `user_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `nif`(`nif`),
    UNIQUE INDEX `user_id`(`user_id`),
    INDEX `idx_accord_siege_id`(`accord_siege_id`),
    INDEX `idx_nif`(`nif`),
    INDEX `idx_statut_fiscal_code`(`statut_fiscal_code`),
    INDEX `idx_type_beneficiaire_code`(`type_beneficiaire_code`),
    FULLTEXT INDEX `ft_beneficiaires`(`raison_sociale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `codes_additionnels` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `base_juridique_version_id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `source_code` VARCHAR(50) NOT NULL,
    `est_principal` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_code_source`(`code`, `source_code`),
    INDEX `source_code`(`source_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `connecteur_logs` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `connecteur_id` CHAR(36) NOT NULL,
    `direction` VARCHAR(10) NOT NULL,
    `operation` VARCHAR(100) NOT NULL,
    `payload_entrant` JSON NULL,
    `payload_sortant` JSON NULL,
    `statut_http` INTEGER NULL,
    `duree_ms` INTEGER NULL,
    `est_erreur` BOOLEAN NOT NULL DEFAULT false,
    `message_erreur` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_connecteur_id`(`connecteur_id`),
    INDEX `idx_connecteur_logs_connecteur_date`(`connecteur_id`, `created_at`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_est_erreur`(`est_erreur`),
    INDEX `idx_operation`(`operation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `connecteurs` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nom` VARCHAR(50) NOT NULL,
    `code_systeme` VARCHAR(20) NOT NULL,
    `institution_id` CHAR(36) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'inactif',
    `endpoint` VARCHAR(500) NOT NULL,
    `config_auth` JSON NOT NULL,
    `latence_ms` INTEGER NOT NULL DEFAULT 0,
    `taux_erreur` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `dernier_sync` DATETIME(3) NULL,
    `volume_24h` INTEGER NOT NULL DEFAULT 0,
    `fallback_manuel` BOOLEAN NOT NULL DEFAULT false,
    `timeout_s` INTEGER NOT NULL DEFAULT 10,
    `failure_threshold` INTEGER NOT NULL DEFAULT 3,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code_systeme`(`code_systeme`),
    INDEX `idx_institution_id`(`institution_id`),
    INDEX `idx_statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `convention_engagements` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `convention_id` CHAR(36) NOT NULL,
    `type_engagement` VARCHAR(50) NOT NULL,
    `periode_annee` INTEGER NULL,
    `objectif` BIGINT NULL,
    `realise` BIGINT NULL,
    `commentaire` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_convention_id`(`convention_id`),
    INDEX `idx_type_engagement`(`type_engagement`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `conventions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `reference` VARCHAR(30) NOT NULL,
    `beneficiaire_id` CHAR(36) NOT NULL,
    `base_juridique_version_id` CHAR(36) NULL,
    `accord_siege_id` CHAR(36) NULL,
    `regime_code` VARCHAR(50) NOT NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'active',
    `date_debut` DATE NOT NULL,
    `date_fin` DATE NOT NULL,
    `montant_estime` BIGINT NULL,
    `emplois_engages` INTEGER NULL,
    `emplois_crees` INTEGER NULL,
    `zone_zfi` VARCHAR(50) NULL,
    `objet` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reference`(`reference`),
    INDEX `idx_accord_siege_id`(`accord_siege_id`),
    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    INDEX `idx_date_fin`(`date_fin`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `regime_code`(`regime_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `decisions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `demande_id` CHAR(36) NOT NULL,
    `utilisateur_id` CHAR(36) NOT NULL,
    `type_code` VARCHAR(50) NOT NULL,
    `date_decision` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motif` TEXT NULL,
    `document_url` VARCHAR(500) NULL,
    `hash_sha256` CHAR(64) NULL,
    `pin_hash` VARCHAR(60) NULL,
    `est_signe` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_decisions_demande_type`(`demande_id`, `type_code`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_type_code`(`type_code`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `demande_complements` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `demande_id` CHAR(36) NOT NULL,
    `instructeur_id` CHAR(36) NOT NULL,
    `motif` TEXT NOT NULL,
    `pieces_attendues` TEXT NULL,
    `date_demande` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_reponse` DATETIME(3) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_instructeur_id`(`instructeur_id`),
    INDEX `idx_statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `demande_sync_externe` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `demande_id` CHAR(36) NOT NULL,
    `connecteur_id` CHAR(36) NOT NULL,
    `operation` VARCHAR(100) NOT NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    `payload_envoye` JSON NULL,
    `reponse_recue` JSON NULL,
    `nombre_tentatives` INTEGER NOT NULL DEFAULT 0,
    `date_derniere_tentative` DATETIME(3) NULL,
    `message_erreur` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_connecteur_id`(`connecteur_id`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `demande_workflow_etapes` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `instance_id` CHAR(36) NOT NULL,
    `template_etape_id` CHAR(36) NOT NULL,
    `nom_etape` VARCHAR(200) NOT NULL,
    `ordre` INTEGER NOT NULL,
    `acteur_role` VARCHAR(50) NOT NULL,
    `acteur_id` CHAR(36) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    `date_debut` DATETIME(3) NULL,
    `date_fin` DATETIME(3) NULL,
    `delai_cible_jours` INTEGER NULL,
    `commentaire` TEXT NULL,
    `pin_signe` BOOLEAN NOT NULL DEFAULT false,
    `decision_prise` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_acteur_id`(`acteur_id`),
    INDEX `idx_demande_workflow_etapes_instance_ordre`(`instance_id`, `ordre`),
    INDEX `idx_instance_id`(`instance_id`),
    INDEX `idx_instance_id_ordre`(`instance_id`, `ordre`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `template_etape_id`(`template_etape_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `demande_workflow_instances` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `demande_id` CHAR(36) NOT NULL,
    `workflow_template_id` CHAR(36) NOT NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'en_cours',
    `date_debut` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_fin` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `demande_id`(`demande_id`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_workflow_template_id`(`workflow_template_id`),
    INDEX `statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `demandes` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `reference` VARCHAR(20) NOT NULL,
    `base_juridique_version_id` CHAR(36) NOT NULL,
    `beneficiaire_id` CHAR(36) NOT NULL,
    `convention_id` CHAR(36) NULL,
    `instructeur_id` CHAR(36) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'brouillon',
    `date_depot` DATETIME(3) NULL,
    `date_echeance` DATE NULL,
    `date_archivage` DATE NULL,
    `montant_fcfa` BIGINT NOT NULL DEFAULT 0,
    `devise` VARCHAR(3) NOT NULL DEFAULT 'XOF',
    `quota_consomme` BIGINT NULL,
    `quota_total` BIGINT NULL,
    `secteur` VARCHAR(100) NULL,
    `etape_actuelle` VARCHAR(200) NULL,
    `motif_rejet` TEXT NULL,
    `declaration_honneur` BOOLEAN NOT NULL DEFAULT false,
    `est_urgente` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `reference`(`reference`),
    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    INDEX `idx_convention_id`(`convention_id`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_date_archivage`(`date_archivage`),
    INDEX `idx_date_echeance`(`date_echeance`),
    INDEX `idx_demandes_beneficiaire_statut`(`beneficiaire_id`, `statut_code`),
    INDEX `idx_demandes_statut_created`(`statut_code`, `created_at`),
    INDEX `idx_instructeur_id`(`instructeur_id`),
    INDEX `idx_reference`(`reference`),
    INDEX `idx_statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `imports_mrd` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nom_fichier` VARCHAR(300) NOT NULL,
    `type_fichier` VARCHAR(20) NOT NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `lignes_total` INTEGER NULL,
    `lignes_importees` INTEGER NULL,
    `lignes_rejetees` INTEGER NULL,
    `rapport` JSON NULL,
    `fichier_erreurs_url` VARCHAR(500) NULL,
    `lance_par_id` CHAR(36) NOT NULL,
    `date_debut` DATETIME(3) NULL,
    `date_fin` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_lance_par_id`(`lance_par_id`),
    INDEX `idx_statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `institutions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `code` VARCHAR(20) NOT NULL,
    `nom` VARCHAR(200) NOT NULL,
    `type_code` VARCHAR(50) NOT NULL,
    `est_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_est_active`(`est_active`),
    INDEX `idx_type_code`(`type_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `job_queue` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `type_job_code` VARCHAR(50) NOT NULL,
    `payload` JSON NOT NULL,
    `priorite` INTEGER NOT NULL DEFAULT 5,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `date_prevue` DATETIME(3) NULL,
    `date_debut` DATETIME(3) NULL,
    `date_fin` DATETIME(3) NULL,
    `resultat` JSON NULL,
    `erreur` TEXT NULL,
    `nombre_tentatives` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_date_prevue`(`date_prevue`),
    INDEX `idx_priorite`(`priorite`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `idx_type_job_code`(`type_job_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `type_notification_code` VARCHAR(50) NOT NULL,
    `canal_code` VARCHAR(50) NOT NULL,
    `est_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `canal_code`(`canal_code`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    INDEX `type_notification_code`(`type_notification_code`),
    UNIQUE INDEX `uk_user_type_canal`(`utilisateur_id`, `type_notification_code`, `canal_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `notification_queue` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NULL,
    `type_notification_code` VARCHAR(50) NOT NULL,
    `canal_code` VARCHAR(50) NOT NULL,
    `sujet` VARCHAR(200) NOT NULL,
    `corps` TEXT NOT NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `date_envoi` DATETIME(3) NULL,
    `date_lecture` DATETIME(3) NULL,
    `erreur` TEXT NULL,
    `nombre_tentatives` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `canal_code`(`canal_code`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_notification_queue_statut_date`(`statut_code`, `created_at`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `idx_type_notification_code`(`type_notification_code`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `code` VARCHAR(100) NOT NULL,
    `type_notification_code` VARCHAR(50) NOT NULL,
    `canal_code` VARCHAR(50) NOT NULL,
    `sujet` VARCHAR(200) NOT NULL,
    `corps` TEXT NOT NULL,
    `variables` TEXT NULL,
    `est_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_canal_code`(`canal_code`),
    INDEX `idx_type_notification_code`(`type_notification_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NULL,
    `type_notification_code` VARCHAR(50) NOT NULL,
    `canal_code` VARCHAR(50) NOT NULL,
    `titre` VARCHAR(200) NOT NULL,
    `corps` TEXT NOT NULL,
    `est_lue` BOOLEAN NOT NULL DEFAULT false,
    `date_lecture` DATETIME(3) NULL,
    `queue_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `canal_code`(`canal_code`),
    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_type_notification_code`(`type_notification_code`),
    INDEX `idx_utilisateur_id_est_lue`(`utilisateur_id`, `est_lue`),
    INDEX `queue_id`(`queue_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `opendata_publications` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `periode_annee` INTEGER NOT NULL,
    `periode_mois` INTEGER NULL,
    `titre` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `fichier_url` VARCHAR(500) NULL,
    `donnees_json` JSON NULL,
    `est_publie` BOOLEAN NOT NULL DEFAULT false,
    `date_publication` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_est_publie`(`est_publie`),
    INDEX `idx_periode`(`periode_annee`, `periode_mois`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `parametres_systeme` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `code` VARCHAR(100) NOT NULL,
    `type_parametre_code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `valeur` TEXT NOT NULL,
    `description` TEXT NULL,
    `est_editable` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_type_parametre_code`(`type_parametre_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `pieces_jointes` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `demande_id` CHAR(36) NOT NULL,
    `nom_fichier` VARCHAR(300) NOT NULL,
    `type_mime` VARCHAR(100) NOT NULL,
    `taille_octets` BIGINT NOT NULL,
    `rang_code` VARCHAR(50) NOT NULL,
    `categorie` VARCHAR(100) NOT NULL,
    `type_document_code` VARCHAR(50) NULL,
    `url_stockage` VARCHAR(500) NOT NULL,
    `hash_sha256` CHAR(64) NOT NULL,
    `est_valide` BOOLEAN NULL,
    `valide_par_id` CHAR(36) NULL,
    `date_validation` DATETIME(3) NULL,
    `commentaire_validation` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_hash_sha256`(`hash_sha256`),
    INDEX `idx_pieces_jointes_demande_rang`(`demande_id`, `rang_code`),
    INDEX `idx_rang_code`(`rang_code`),
    INDEX `idx_type_document_code`(`type_document_code`),
    INDEX `valide_par_id`(`valide_par_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `push_tokens` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `canal_push_code` VARCHAR(50) NOT NULL,
    `device_id` VARCHAR(200) NULL,
    `modele_appareil` VARCHAR(200) NULL,
    `systeme_exploitation` VARCHAR(100) NULL,
    `version_app` VARCHAR(50) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `date_dernier_utilisation` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `token`(`token`(200)),
    INDEX `idx_canal_push_code`(`canal_push_code`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `quota_mouvements` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `quota_id` CHAR(36) NOT NULL,
    `demande_id` CHAR(36) NULL,
    `type_mouvement_code` VARCHAR(50) NOT NULL,
    `montant` BIGINT NOT NULL,
    `solde_avant` BIGINT NOT NULL,
    `solde_apres` BIGINT NOT NULL,
    `commentaire` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_demande_id`(`demande_id`),
    INDEX `idx_quota_id`(`quota_id`),
    INDEX `idx_quota_mouvements_quota_date`(`quota_id`, `created_at`),
    INDEX `idx_type_mouvement_code`(`type_mouvement_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `quotas` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `base_juridique_version_id` CHAR(36) NOT NULL,
    `beneficiaire_id` CHAR(36) NULL,
    `convention_id` CHAR(36) NULL,
    `exercice_annuel` INTEGER NULL,
    `type_quota_code` VARCHAR(50) NOT NULL,
    `unite_code` VARCHAR(50) NOT NULL DEFAULT 'fcfa',
    `total` BIGINT NOT NULL,
    `consomme` BIGINT NOT NULL DEFAULT 0,
    `alerte_seuil_pct` INTEGER NOT NULL DEFAULT 80,
    `alerte_80_envoyee` BOOLEAN NOT NULL DEFAULT false,
    `alerte_100_envoyee` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_beneficiaire_id`(`beneficiaire_id`),
    INDEX `idx_convention_id`(`convention_id`),
    INDEX `idx_exercice_annuel`(`exercice_annuel`),
    INDEX `idx_type_quota_code`(`type_quota_code`),
    INDEX `unite_code`(`unite_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_canaux_notification` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_canaux_push` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_categories_anomalie` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_etats_job` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_gravites_anomalie` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_modes_instruction` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_natures_mesure` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_organes_gestion` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_portees_categorie` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_rangs_piece` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_regimes_convention` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_roles` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_sources_code` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_sources_detection` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_anomalie` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_archivage` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_connecteur` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_convention` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_demande` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `is_final` BOOLEAN NOT NULL DEFAULT false,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_etape` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_fiscal` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_notification` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_statuts_utilisateur` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_accord_siege` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_acte` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_agrement` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_beneficiaire` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_decision` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_document` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_institution` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_job` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_mouvement_quota` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_notification` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_parametre` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_quota` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_types_rapport` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `ref_unites_quota` (
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `couleur` VARCHAR(7) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `est_revoque` BOOLEAN NOT NULL DEFAULT false,
    `ip` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `token_hash`(`token_hash`),
    INDEX `idx_expires_at`(`expires_at`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `regles_anomalie` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `code` VARCHAR(100) NOT NULL,
    `nom` VARCHAR(200) NOT NULL,
    `categorie_code` VARCHAR(50) NOT NULL,
    `gravite_code` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `expression` TEXT NOT NULL,
    `est_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_categorie_code`(`categorie_code`),
    INDEX `idx_gravite_code`(`gravite_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `reporting_aggregats` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `periode_annee` INTEGER NOT NULL,
    `periode_mois` INTEGER NULL,
    `type_texte_1` VARCHAR(100) NULL,
    `impot_concerne` VARCHAR(100) NULL,
    `nature_mesure_code` VARCHAR(50) NULL,
    `type_beneficiaire_code` VARCHAR(50) NULL,
    `regime_code` VARCHAR(50) NULL,
    `region` VARCHAR(100) NULL,
    `secteur` VARCHAR(100) NULL,
    `nb_demandes_soumis` INTEGER NOT NULL DEFAULT 0,
    `nb_demandes_approuve` INTEGER NOT NULL DEFAULT 0,
    `nb_demandes_rejete` INTEGER NOT NULL DEFAULT 0,
    `montant_total_demandes` BIGINT NOT NULL DEFAULT 0,
    `montant_total_approuve` BIGINT NOT NULL DEFAULT 0,
    `delai_moyen_instruction_jours` DECIMAL(8, 2) NULL,
    `nb_anomalies_critique` INTEGER NOT NULL DEFAULT 0,
    `est_anonymise` BOOLEAN NOT NULL DEFAULT true,
    `date_calcul` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_est_anonymise`(`est_anonymise`),
    INDEX `idx_impot_concerne`(`impot_concerne`),
    INDEX `idx_nature_mesure_code`(`nature_mesure_code`),
    INDEX `idx_periode`(`periode_annee`, `periode_mois`),
    INDEX `idx_type_texte_1`(`type_texte_1`),
    INDEX `regime_code`(`regime_code`),
    INDEX `type_beneficiaire_code`(`type_beneficiaire_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `reporting_executions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `type_rapport_code` VARCHAR(50) NOT NULL,
    `periode_annee` INTEGER NOT NULL,
    `periode_mois` INTEGER NULL,
    `parametres` JSON NULL,
    `fichier_url` VARCHAR(500) NULL,
    `hash_fichier` CHAR(64) NULL,
    `est_programme` BOOLEAN NOT NULL DEFAULT false,
    `date_debut` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_fin` DATETIME(3) NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `message_erreur` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_periode`(`periode_annee`, `periode_mois`),
    INDEX `idx_statut_code`(`statut_code`),
    INDEX `idx_type_rapport_code`(`type_rapport_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `reset_password_tokens` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `est_utilise` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `token_hash`(`token_hash`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `roles_permissions` (
    `role` VARCHAR(50) NOT NULL,
    `ressource` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `perimetre` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_role`(`role`),
    PRIMARY KEY (`role`, `ressource`, `action`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `sessions_utilisateur` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `utilisateur_id` CHAR(36) NOT NULL,
    `jeton_session_hash` CHAR(64) NOT NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `pays` VARCHAR(100) NULL,
    `ville` VARCHAR(100) NULL,
    `date_connexion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_derniere_activite` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_deconnexion` DATETIME(3) NULL,
    `est_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `jeton_session_hash`(`jeton_session_hash`),
    INDEX `idx_est_active`(`est_active`),
    INDEX `idx_jeton_session_hash`(`jeton_session_hash`),
    INDEX `idx_utilisateur_id`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `system_logs` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `niveau` VARCHAR(20) NOT NULL,
    `source` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `contexte` JSON NULL,
    `trace` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_niveau`(`niveau`),
    INDEX `idx_source`(`source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `institution_id` CHAR(36) NOT NULL,
    `statut_code` VARCHAR(50) NOT NULL DEFAULT 'actif',
    `mfa_active` BOOLEAN NOT NULL DEFAULT true,
    `mfa_secret_enc` VARCHAR(500) NULL,
    `pin_hash` VARCHAR(60) NULL,
    `secteur_affecte` VARCHAR(100) NULL,
    `telephone` VARCHAR(20) NULL,
    `derniere_connexion` DATETIME(3) NULL,
    `ip_derniere_cx` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email`(`email`),
    INDEX `idx_email`(`email`),
    INDEX `idx_institution_id`(`institution_id`),
    INDEX `idx_role`(`role`),
    INDEX `idx_statut_code`(`statut_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `workflow_template_etapes` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `workflow_template_id` CHAR(36) NOT NULL,
    `nom_etape` VARCHAR(200) NOT NULL,
    `ordre` INTEGER NOT NULL,
    `acteur_role` VARCHAR(50) NOT NULL,
    `institution_type_code` VARCHAR(50) NULL,
    `delai_cible_jours` INTEGER NULL,
    `pin_requis` BOOLEAN NOT NULL DEFAULT false,
    `est_obligatoire` BOOLEAN NOT NULL DEFAULT true,
    `condition_activation` TEXT NULL,
    `action_declenchee` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_workflow_template_etapes_template_ordre`(`workflow_template_id`, `ordre`),
    INDEX `idx_workflow_template_id`(`workflow_template_id`),
    INDEX `institution_type_code`(`institution_type_code`),
    UNIQUE INDEX `uk_workflow_etape_ordre`(`workflow_template_id`, `ordre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `workflow_template_transitions` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `workflow_template_id` CHAR(36) NOT NULL,
    `etape_source_ordre` INTEGER NOT NULL,
    `etape_cible_ordre` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `condition_transition` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_workflow_template_id`(`workflow_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE `workflow_templates` (
    `id` CHAR(36) NOT NULL DEFAULT (uuid()),
    `code` VARCHAR(50) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `base_juridique_version_id` CHAR(36) NULL,
    `type_texte_1` VARCHAR(100) NOT NULL,
    `organe_gestion_code` VARCHAR(50) NULL,
    `est_actif` BOOLEAN NOT NULL DEFAULT true,
    `version_template` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_base_juridique_version_id`(`base_juridique_version_id`),
    INDEX `idx_organe_gestion_code`(`organe_gestion_code`),
    INDEX `idx_type_texte_1`(`type_texte_1`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- AddForeignKey
ALTER TABLE `accords_siege` ADD CONSTRAINT `accords_siege_ibfk_1` FOREIGN KEY (`type_institution_code`) REFERENCES `ref_types_accord_siege`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `actes` ADD CONSTRAINT `actes_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `actes` ADD CONSTRAINT `actes_ibfk_2` FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `actes` ADD CONSTRAINT `actes_ibfk_3` FOREIGN KEY (`type_code`) REFERENCES `ref_types_acte`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `actes` ADD CONSTRAINT `actes_ibfk_4` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrement_beneficiaires` ADD CONSTRAINT `agrement_beneficiaires_ibfk_1` FOREIGN KEY (`agrement_id`) REFERENCES `agrements`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrement_beneficiaires` ADD CONSTRAINT `agrement_beneficiaires_ibfk_2` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrements` ADD CONSTRAINT `agrements_ibfk_1` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrements` ADD CONSTRAINT `agrements_ibfk_2` FOREIGN KEY (`type_agrement_code`) REFERENCES `ref_types_agrement`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrements` ADD CONSTRAINT `agrements_ibfk_3` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrements` ADD CONSTRAINT `agrements_ibfk_4` FOREIGN KEY (`regime_code`) REFERENCES `ref_regimes_convention`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agrements` ADD CONSTRAINT `agrements_ibfk_5` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_convention`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_2` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_3` FOREIGN KEY (`convention_id`) REFERENCES `conventions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_4` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_5` FOREIGN KEY (`categorie_code`) REFERENCES `ref_categories_anomalie`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_6` FOREIGN KEY (`gravite_code`) REFERENCES `ref_gravites_anomalie`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_7` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_anomalie`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_ibfk_8` FOREIGN KEY (`detectee_par_code`) REFERENCES `ref_sources_detection`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `fk_anomalies_regle` FOREIGN KEY (`regle_id`) REFERENCES `regles_anomalie`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `archivages` ADD CONSTRAINT `archivages_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `archivages` ADD CONSTRAINT `archivages_ibfk_2` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_archivage`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_documents` ADD CONSTRAINT `base_juridique_documents_ibfk_1` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_documents` ADD CONSTRAINT `base_juridique_documents_ibfk_2` FOREIGN KEY (`uploaded_by_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_versions` ADD CONSTRAINT `base_juridique_versions_ibfk_1` FOREIGN KEY (`base_juridique_id`) REFERENCES `bases_juridiques`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_versions` ADD CONSTRAINT `base_juridique_versions_ibfk_2` FOREIGN KEY (`nature_mesure_code`) REFERENCES `ref_natures_mesure`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_versions` ADD CONSTRAINT `base_juridique_versions_ibfk_3` FOREIGN KEY (`portee_categorie_code`) REFERENCES `ref_portees_categorie`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_versions` ADD CONSTRAINT `base_juridique_versions_ibfk_4` FOREIGN KEY (`organe_gestion_code`) REFERENCES `ref_organes_gestion`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `base_juridique_versions` ADD CONSTRAINT `base_juridique_versions_ibfk_5` FOREIGN KEY (`mode_instruction_code`) REFERENCES `ref_modes_instruction`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaire_historique_fiscal` ADD CONSTRAINT `beneficiaire_historique_fiscal_ibfk_1` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaire_historique_fiscal` ADD CONSTRAINT `beneficiaire_historique_fiscal_ibfk_2` FOREIGN KEY (`statut_fiscal_code`) REFERENCES `ref_statuts_fiscal`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaire_historique_fiscal` ADD CONSTRAINT `fk_histofiscal_connecteur` FOREIGN KEY (`connecteur_code`) REFERENCES `connecteurs`(`code_systeme`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaires` ADD CONSTRAINT `beneficiaires_ibfk_1` FOREIGN KEY (`accord_siege_id`) REFERENCES `accords_siege`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaires` ADD CONSTRAINT `beneficiaires_ibfk_2` FOREIGN KEY (`type_beneficiaire_code`) REFERENCES `ref_types_beneficiaire`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaires` ADD CONSTRAINT `beneficiaires_ibfk_3` FOREIGN KEY (`statut_fiscal_code`) REFERENCES `ref_statuts_fiscal`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `beneficiaires` ADD CONSTRAINT `beneficiaires_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `codes_additionnels` ADD CONSTRAINT `codes_additionnels_ibfk_1` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `codes_additionnels` ADD CONSTRAINT `codes_additionnels_ibfk_2` FOREIGN KEY (`source_code`) REFERENCES `ref_sources_code`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `connecteur_logs` ADD CONSTRAINT `connecteur_logs_ibfk_1` FOREIGN KEY (`connecteur_id`) REFERENCES `connecteurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `connecteurs` ADD CONSTRAINT `connecteurs_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `connecteurs` ADD CONSTRAINT `connecteurs_ibfk_2` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_connecteur`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `convention_engagements` ADD CONSTRAINT `convention_engagements_ibfk_1` FOREIGN KEY (`convention_id`) REFERENCES `conventions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `conventions` ADD CONSTRAINT `conventions_ibfk_1` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `conventions` ADD CONSTRAINT `conventions_ibfk_2` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `conventions` ADD CONSTRAINT `conventions_ibfk_3` FOREIGN KEY (`accord_siege_id`) REFERENCES `accords_siege`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `conventions` ADD CONSTRAINT `conventions_ibfk_4` FOREIGN KEY (`regime_code`) REFERENCES `ref_regimes_convention`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `conventions` ADD CONSTRAINT `conventions_ibfk_5` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_convention`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_ibfk_2` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_ibfk_3` FOREIGN KEY (`type_code`) REFERENCES `ref_types_decision`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_complements` ADD CONSTRAINT `demande_complements_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_complements` ADD CONSTRAINT `demande_complements_ibfk_2` FOREIGN KEY (`instructeur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_complements` ADD CONSTRAINT `demande_complements_ibfk_3` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_etape`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_sync_externe` ADD CONSTRAINT `demande_sync_externe_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_sync_externe` ADD CONSTRAINT `demande_sync_externe_ibfk_2` FOREIGN KEY (`connecteur_id`) REFERENCES `connecteurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_etapes` ADD CONSTRAINT `demande_workflow_etapes_ibfk_1` FOREIGN KEY (`instance_id`) REFERENCES `demande_workflow_instances`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_etapes` ADD CONSTRAINT `demande_workflow_etapes_ibfk_2` FOREIGN KEY (`template_etape_id`) REFERENCES `workflow_template_etapes`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_etapes` ADD CONSTRAINT `demande_workflow_etapes_ibfk_3` FOREIGN KEY (`acteur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_etapes` ADD CONSTRAINT `demande_workflow_etapes_ibfk_4` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_etape`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_instances` ADD CONSTRAINT `demande_workflow_instances_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_instances` ADD CONSTRAINT `demande_workflow_instances_ibfk_2` FOREIGN KEY (`workflow_template_id`) REFERENCES `workflow_templates`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demande_workflow_instances` ADD CONSTRAINT `demande_workflow_instances_ibfk_3` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_etape`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_ibfk_1` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_ibfk_2` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_ibfk_3` FOREIGN KEY (`convention_id`) REFERENCES `conventions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_ibfk_4` FOREIGN KEY (`instructeur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_ibfk_5` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_demande`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `imports_mrd` ADD CONSTRAINT `imports_mrd_ibfk_1` FOREIGN KEY (`lance_par_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `imports_mrd` ADD CONSTRAINT `imports_mrd_ibfk_2` FOREIGN KEY (`statut_code`) REFERENCES `ref_etats_job`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `institutions` ADD CONSTRAINT `institutions_ibfk_1` FOREIGN KEY (`type_code`) REFERENCES `ref_types_institution`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `job_queue` ADD CONSTRAINT `job_queue_ibfk_1` FOREIGN KEY (`type_job_code`) REFERENCES `ref_types_job`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `job_queue` ADD CONSTRAINT `job_queue_ibfk_2` FOREIGN KEY (`statut_code`) REFERENCES `ref_etats_job`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_ibfk_2` FOREIGN KEY (`type_notification_code`) REFERENCES `ref_types_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_ibfk_3` FOREIGN KEY (`canal_code`) REFERENCES `ref_canaux_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_queue` ADD CONSTRAINT `notification_queue_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_queue` ADD CONSTRAINT `notification_queue_ibfk_2` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_queue` ADD CONSTRAINT `notification_queue_ibfk_3` FOREIGN KEY (`type_notification_code`) REFERENCES `ref_types_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_queue` ADD CONSTRAINT `notification_queue_ibfk_4` FOREIGN KEY (`canal_code`) REFERENCES `ref_canaux_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_queue` ADD CONSTRAINT `notification_queue_ibfk_5` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_ibfk_1` FOREIGN KEY (`type_notification_code`) REFERENCES `ref_types_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_ibfk_2` FOREIGN KEY (`canal_code`) REFERENCES `ref_canaux_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`type_notification_code`) REFERENCES `ref_types_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_4` FOREIGN KEY (`canal_code`) REFERENCES `ref_canaux_notification`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_5` FOREIGN KEY (`queue_id`) REFERENCES `notification_queue`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `parametres_systeme` ADD CONSTRAINT `parametres_systeme_ibfk_1` FOREIGN KEY (`type_parametre_code`) REFERENCES `ref_types_parametre`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_ibfk_1` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_ibfk_2` FOREIGN KEY (`rang_code`) REFERENCES `ref_rangs_piece`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_ibfk_3` FOREIGN KEY (`type_document_code`) REFERENCES `ref_types_document`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_ibfk_4` FOREIGN KEY (`valide_par_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `push_tokens` ADD CONSTRAINT `push_tokens_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `push_tokens` ADD CONSTRAINT `push_tokens_ibfk_2` FOREIGN KEY (`canal_push_code`) REFERENCES `ref_canaux_push`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quota_mouvements` ADD CONSTRAINT `quota_mouvements_ibfk_1` FOREIGN KEY (`quota_id`) REFERENCES `quotas`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quota_mouvements` ADD CONSTRAINT `quota_mouvements_ibfk_2` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quota_mouvements` ADD CONSTRAINT `quota_mouvements_ibfk_3` FOREIGN KEY (`type_mouvement_code`) REFERENCES `ref_types_mouvement_quota`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quotas` ADD CONSTRAINT `quotas_ibfk_1` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quotas` ADD CONSTRAINT `quotas_ibfk_2` FOREIGN KEY (`beneficiaire_id`) REFERENCES `beneficiaires`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quotas` ADD CONSTRAINT `quotas_ibfk_3` FOREIGN KEY (`convention_id`) REFERENCES `conventions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quotas` ADD CONSTRAINT `quotas_ibfk_4` FOREIGN KEY (`type_quota_code`) REFERENCES `ref_types_quota`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `quotas` ADD CONSTRAINT `quotas_ibfk_5` FOREIGN KEY (`unite_code`) REFERENCES `ref_unites_quota`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `regles_anomalie` ADD CONSTRAINT `regles_anomalie_ibfk_1` FOREIGN KEY (`categorie_code`) REFERENCES `ref_categories_anomalie`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `regles_anomalie` ADD CONSTRAINT `regles_anomalie_ibfk_2` FOREIGN KEY (`gravite_code`) REFERENCES `ref_gravites_anomalie`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reporting_aggregats` ADD CONSTRAINT `reporting_aggregats_ibfk_1` FOREIGN KEY (`nature_mesure_code`) REFERENCES `ref_natures_mesure`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reporting_aggregats` ADD CONSTRAINT `reporting_aggregats_ibfk_2` FOREIGN KEY (`type_beneficiaire_code`) REFERENCES `ref_types_beneficiaire`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reporting_aggregats` ADD CONSTRAINT `reporting_aggregats_ibfk_3` FOREIGN KEY (`regime_code`) REFERENCES `ref_regimes_convention`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reporting_executions` ADD CONSTRAINT `reporting_executions_ibfk_1` FOREIGN KEY (`type_rapport_code`) REFERENCES `ref_types_rapport`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reporting_executions` ADD CONSTRAINT `reporting_executions_ibfk_2` FOREIGN KEY (`statut_code`) REFERENCES `ref_etats_job`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reset_password_tokens` ADD CONSTRAINT `reset_password_tokens_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `roles_permissions` ADD CONSTRAINT `fk_rolesperm_role` FOREIGN KEY (`role`) REFERENCES `ref_roles`(`code`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sessions_utilisateur` ADD CONSTRAINT `sessions_utilisateur_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `fk_utilisateurs_role` FOREIGN KEY (`role`) REFERENCES `ref_roles`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_ibfk_2` FOREIGN KEY (`statut_code`) REFERENCES `ref_statuts_utilisateur`(`code`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workflow_template_etapes` ADD CONSTRAINT `workflow_template_etapes_ibfk_1` FOREIGN KEY (`workflow_template_id`) REFERENCES `workflow_templates`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workflow_template_etapes` ADD CONSTRAINT `workflow_template_etapes_ibfk_2` FOREIGN KEY (`institution_type_code`) REFERENCES `ref_types_institution`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workflow_template_transitions` ADD CONSTRAINT `workflow_template_transitions_ibfk_1` FOREIGN KEY (`workflow_template_id`) REFERENCES `workflow_templates`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workflow_templates` ADD CONSTRAINT `workflow_templates_ibfk_1` FOREIGN KEY (`base_juridique_version_id`) REFERENCES `base_juridique_versions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workflow_templates` ADD CONSTRAINT `workflow_templates_ibfk_2` FOREIGN KEY (`organe_gestion_code`) REFERENCES `ref_organes_gestion`(`code`) ON DELETE SET NULL ON UPDATE NO ACTION;
