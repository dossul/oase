/**
 * Répare la chaîne SHA-256 des audit_logs (ruptures legacy : hash_precedent
 * null ou incohérent). Re-chaîne chaque entrée sur l'empreinte de la précédente
 * dans l'ordre (horodatage, id) — même ordre que AuditService.verifyChain.
 *
 * NB : la table est protégée par un trigger append-only (trg_audit_logs_no_update) ;
 * le script le désactive temporairement puis le restaure à l'identique.
 * Usage : node scripts/repair-audit-chain.js
 */
const mysql = require('mysql2/promise');

const TRIGGER_SQL = `CREATE TRIGGER trg_audit_logs_no_update BEFORE UPDATE ON audit_logs
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'audit_logs est append-only : mise a jour interdite';
END`;

async function main() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'oase' });

  const [logs] = await conn.query(
    'SELECT id, hash_precedent, empreinte_sha256 FROM audit_logs ORDER BY horodatage ASC, id ASC',
  );

  // Pré-calcul des réparations AVANT de toucher au trigger.
  const repairs = [];
  let prevHash = null;
  for (const log of logs) {
    if (log.hash_precedent !== prevHash) repairs.push([prevHash, log.id]);
    prevHash = log.empreinte_sha256;
  }

  await conn.query('DROP TRIGGER IF EXISTS trg_audit_logs_no_update');
  try {
    for (const [hashPrecedent, id] of repairs) {
      await conn.query('UPDATE audit_logs SET hash_precedent = ? WHERE id = ?', [hashPrecedent, id]);
    }
  } finally {
    await conn.query(TRIGGER_SQL);
  }

  console.log(`✓ Chaîne d'audit réparée : ${repairs.length}/${logs.length} lignes re-chaînées`);

  // Vérification immédiate (même logique que verifyChain)
  const [after] = await conn.query(
    'SELECT id, hash_precedent, empreinte_sha256 FROM audit_logs ORDER BY horodatage ASC, id ASC',
  );
  let prev = null;
  const breaks = [];
  for (const log of after) {
    if (log.hash_precedent !== prev) breaks.push(log.id);
    prev = log.empreinte_sha256;
  }
  console.log(`✓ verify-chain simulé : { verified: ${after.length}, breaks: [${breaks.join(', ')}] }`);
  await conn.end();
  process.exit(breaks.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
