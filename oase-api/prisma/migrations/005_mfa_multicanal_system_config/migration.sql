-- CreateTable
CREATE TABLE `system_config` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CreateTable
CREATE TABLE `mfa_challenges` (
    `id` CHAR(36) NOT NULL,
    `utilisateur_id` CHAR(36) NOT NULL,
    `canal` VARCHAR(20) NOT NULL,
    `code_hash` VARCHAR(255) NOT NULL,
    `sel` VARCHAR(64) NOT NULL,
    `tentatives` INT NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `est_utilise` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CreateIndex
CREATE INDEX `idx_mfa_challenge_actif` ON `mfa_challenges`(`utilisateur_id`, `canal`, `est_utilise`);

-- CreateIndex
CREATE INDEX `idx_mfa_challenge_expires` ON `mfa_challenges`(`expires_at`);

-- Seed default MFA config
INSERT INTO `system_config` (`key`, `value`) VALUES
    ('mfa.enabled', 'false'),
    ('mfa.channels', '["totp"]'),
    ('mfa.default_channel', 'totp'),
    ('mfa.ttl_seconds', '300'),
    ('mfa.max_attempts', '5'),
    ('mfa.email.enabled', 'false'),
    ('mfa.whatsapp.enabled', 'false'),
    ('mfa.whatsapp.template', 'Votre code de vérification OASE est: {code}');
