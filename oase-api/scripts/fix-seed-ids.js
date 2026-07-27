/**
 * OASE — Migration des ids non-UUID du seed vers des UUID déterministes.
 *
 * Entrée  : deploy/oase_prod_dump.sql (dump mysqldump = seed de fait de la base oase)
 * Sortie  : deploy/oase_seed_fixed.sql
 *
 * - Remplace les ids 'dem-001', 'ben-001', 'user-001', 'bjv-001', 'inst-001', etc.
 *   par des UUID déterministes stables (hex, format 8-4-4-4-12) compatibles ParseUUIDPipe.
 * - Les remplacements couvrent les PK, les FK et les payloads JSON des audit_logs.
 * - Corrige le libellé 'Textiles de Lome' → 'Textiles de Lomé'.
 * - Ajoute les tables system_config + mfa_challenges (migration 005, absentes du dump).
 *
 * Usage : node scripts/fix-seed-ids.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');
const INPUT = path.join(ROOT, 'deploy', 'oase_prod_dump.sql');
const OUTPUT = path.join(ROOT, 'deploy', 'oase_seed_fixed.sql');
const MIGRATION_005 = path.join(__dirname, '..', 'prisma', 'migrations', '005_mfa_multicanal_system_config', 'migration.sql');

// Préfixe hex par famille d'ids → suffixe séquentiel sur 12 chiffres.
const FAMILIES = [
  { prefix: '10000000', re: /^inst-(\d{3})$/ },   // institutions
  { prefix: '20000000', re: /^user-(\d{3})$/ },   // utilisateurs
  { prefix: '30000000', re: /^param-(\d{3})$/ },  // parametres_systeme
  { prefix: '40000000', re: /^quo-(\d{3})$/ },    // quotas
  { prefix: '50000000', re: /^conn-(\d{3})$/ },   // connecteurs
  { prefix: '60000000', re: /^as-(\d{3})$/ },     // accords_siege
  { prefix: '70000000', re: /^ano-(\d{3})$/ },    // anomalies
  { prefix: '80000000', re: /^audit-(\d{3})$/ },  // audit_logs
  { prefix: '90000000', re: /^ca-(\d{3})$/ },     // codes_additionnels
  { prefix: 'b0000000', re: /^bj-(\d{3})$/, offset: 100 },  // bases_juridiques (b0000000-...-0001..5 déjà pris)
  { prefix: 'b1000000', re: /^bjv-(\d{3})$/, offset: 100 }, // base_juridique_versions (b1000000-...-0001..5 déjà pris)
  { prefix: 'c0000000', re: /^ben-(\d{3})$/, offset: 100 }, // contribuables (c0000000-...-0001..3 déjà pris)
  { prefix: 'd0000000', re: /^dem-(\d{3})$/, offset: 100 }, // demandes (d0000000-...-0001..5 déjà pris)
];

const OLD_IDS = [
  ...Array.from({ length: 10 }, (_, i) => `inst-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 7 }, (_, i) => `user-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 4 }, (_, i) => `param-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 4 }, (_, i) => `quo-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `conn-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 2 }, (_, i) => `as-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 2 }, (_, i) => `ano-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 3 }, (_, i) => `audit-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 3 }, (_, i) => `ca-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `bj-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `bjv-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 3 }, (_, i) => `ben-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 5 }, (_, i) => `dem-${String(i + 1).padStart(3, '0')}`),
];

function toUuid(oldId) {
  for (const fam of FAMILIES) {
    const m = oldId.match(fam.re);
    if (m) {
      const seq = parseInt(m[1], 10) + (fam.offset || 0);
      return `${fam.prefix}-0000-0000-0000-${String(seq).padStart(12, '0')}`;
    }
  }
  throw new Error(`Pas de famille pour l'id ${oldId}`);
}

let sql = fs.readFileSync(INPUT, 'utf8');

// Sanity check : les préfixes cibles ne doivent pas déjà exister dans le dump.
for (const fam of FAMILIES) {
  if (sql.includes(`${fam.prefix}-0000-0000-0000-`)) {
    // toléré pour b0000000/b1000000/c0000000/d0000000 (ids existants avec suffixe < 100)
  }
}

let totalReplacements = 0;
for (const oldId of OLD_IDS) {
  const uuid = toUuid(oldId);
  let count = 0;
  // Forme SQL : 'old-id'
  count += sql.split(`'${oldId}'`).length - 1;
  sql = sql.split(`'${oldId}'`).join(`'${uuid}'`);
  // Forme JSON échappée dans les strings SQL : \"old-id\"
  count += sql.split(`\\"${oldId}\\"`).length - 1;
  sql = sql.split(`\\"${oldId}\\"`).join(`\\"${uuid}\\"`);
  if (count === 0) {
    console.warn(`⚠️  ${oldId} : aucune occurrence trouvée`);
  }
  totalReplacements += count;
}
console.log(`✓ ${OLD_IDS.length} ids migrés (${totalReplacements} occurrences remplacées)`);

// Correction accents libellé contribuable (donnée seed).
sql = sql.split('TEXLOME SA — Textiles de Lome').join('TEXLOME SA — Textiles de Lomé');

// Ajout des tables system_config + mfa_challenges (migration 005 absente du dump)
// + enregistrement de la migration dans _prisma_migrations.
const migSql = fs.readFileSync(MIGRATION_005, 'utf8');
const checksum = crypto.createHash('sha256').update(migSql).digest('hex');
sql += `
-- ============================================================
-- Tables ajoutées par fix-seed-ids.js (migration 005_mfa_multicanal_system_config)
-- ============================================================

DROP TABLE IF EXISTS \`system_config\`;
CREATE TABLE \`system_config\` (
    \`key\` VARCHAR(100) NOT NULL,
    \`value\` TEXT NOT NULL,
    \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`system_config\` (\`key\`, \`value\`) VALUES
    ('mfa.enabled', 'false'),
    ('mfa.channels', '["totp"]'),
    ('mfa.default_channel', 'totp'),
    ('mfa.ttl_seconds', '300'),
    ('mfa.max_attempts', '5'),
    ('mfa.email.enabled', 'false'),
    ('mfa.whatsapp.enabled', 'false'),
    ('mfa.whatsapp.template', 'Votre code de vérification OASE est: {code}');

DROP TABLE IF EXISTS \`mfa_challenges\`;
CREATE TABLE \`mfa_challenges\` (
    \`id\` CHAR(36) NOT NULL,
    \`utilisateur_id\` CHAR(36) NOT NULL,
    \`canal\` VARCHAR(20) NOT NULL,
    \`code_hash\` VARCHAR(255) NOT NULL,
    \`sel\` VARCHAR(64) NOT NULL,
    \`tentatives\` INT NOT NULL DEFAULT 0,
    \`expires_at\` DATETIME(3) NOT NULL,
    \`est_utilise\` BOOLEAN NOT NULL DEFAULT false,
    \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX \`idx_mfa_challenge_actif\` ON \`mfa_challenges\`(\`utilisateur_id\`, \`canal\`, \`est_utilise\`);
CREATE INDEX \`idx_mfa_challenge_expires\` ON \`mfa_challenges\`(\`expires_at\`);

INSERT INTO \`_prisma_migrations\` (\`id\`, \`checksum\`, \`finished_at\`, \`migration_name\`, \`logs\`, \`rolled_back_at\`, \`started_at\`, \`applied_steps_count\`)
VALUES ('f1x5e3d0-0000-0000-0000-000000000005', '${checksum}', NOW(3), '005_mfa_multicanal_system_config', NULL, NULL, NOW(3), 1);
`;
// id doit être hex strict
sql = sql.replace('f1x5e3d0-0000-0000-0000-000000000005', 'f1a5e3d0-0000-0000-0000-000000000005');

fs.writeFileSync(OUTPUT, sql, 'utf8');
console.log(`✓ Seed corrigé écrit : ${OUTPUT} (${(sql.length / 1024).toFixed(0)} Ko)`);
