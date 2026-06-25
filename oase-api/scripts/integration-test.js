/**
 * OASE — Test d'intégrité Prisma v3.3
 *
 * Crée une base temporaire, applique la migration baseline et le seed,
 * puis vérifie les compteurs attendus.
 *
 * Usage : node scripts/integration-test.js
 */

const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const path = require('path');

const TEST_DB = 'oase_test';
const DATABASE_URL = process.env.DATABASE_URL || `mysql://root:@localhost:3306/${TEST_DB}`;

const dbUrl = new URL(DATABASE_URL);
const dbHost = dbUrl.hostname || 'localhost';
const dbPort = dbUrl.port || 3306;
const dbUser = dbUrl.username || 'root';
const dbPassword = dbUrl.password || '';

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  return execSync(cmd, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });
}

async function main() {
  // 1. Créer la base temporaire
  const c = await mysql.createConnection({ host: dbHost, port: dbPort, user: dbUser, password: dbPassword });
  await c.execute(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await c.execute(`CREATE DATABASE ${TEST_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`✅ Base ${TEST_DB} créée`);

  // 2. Appliquer la migration
  run('npx prisma migrate reset --force --skip-seed');

  // 3. Exécuter le seed
  run('npx prisma db seed');

  // 4. Vérifier les compteurs
  const c2 = await mysql.createConnection({ host: dbHost, port: dbPort, user: dbUser, password: dbPassword, database: TEST_DB });
  const checks = [
    ["SELECT COUNT(*) AS nb FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'", [TEST_DB], 86, 'tables'],
    ['SELECT COUNT(*) AS nb FROM demandes', [], 5, 'demandes'],
    ['SELECT COUNT(*) AS nb FROM beneficiaires', [], 3, 'beneficiaires'],
    ['SELECT COUNT(*) AS nb FROM base_juridique_versions', [], 5, 'versions base juridique'],
    ['SELECT COUNT(*) AS nb FROM utilisateurs', [], 3, 'utilisateurs'],
  ];

  for (const [sql, params, expected, label] of checks) {
    const [rows] = await c2.execute(sql, params);
    const value = rows[0].nb;
    const ok = value === expected;
    console.log(`${ok ? '✅' : '❌'} ${label}: ${value} (attendu ${expected})`);
    if (!ok) process.exitCode = 1;
  }

  await c2.end();
  await c.end();

  console.log('\n✅ Test d\'intégrité terminé');
}

main().catch((err) => {
  console.error('\n❌ Erreur:', err.message);
  process.exit(1);
});
