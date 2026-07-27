/**
 * Restaure les lignes créées entre le dump de 03:17 et le réimport du seed corrigé
 * (données QA de la recette du 2026-07-27), en remappant les anciens ids non-UUID.
 * Usage : node scripts/restore-post-dump-rows.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOT = path.join(__dirname, '..', '..');
const BACKUP = path.join(ROOT, 'backups', 'oase_pre_seed_fix_20260727.sql');
const FIXED = path.join(ROOT, 'deploy', 'oase_seed_fixed.sql');

// Correspondance complète ancien id → UUID (identique à fix-seed-ids.js).
const FAMILIES = [
  { prefix: '10000000', re: /^inst-(\d{3})$/ },
  { prefix: '20000000', re: /^user-(\d{3})$/ },
  { prefix: '30000000', re: /^param-(\d{3})$/ },
  { prefix: '40000000', re: /^quo-(\d{3})$/ },
  { prefix: '50000000', re: /^conn-(\d{3})$/ },
  { prefix: '60000000', re: /^as-(\d{3})$/ },
  { prefix: '70000000', re: /^ano-(\d{3})$/ },
  { prefix: '80000000', re: /^audit-(\d{3})$/ },
  { prefix: '90000000', re: /^ca-(\d{3})$/ },
  { prefix: 'b0000000', re: /^bj-(\d{3})$/, offset: 100 },
  { prefix: 'b1000000', re: /^bjv-(\d{3})$/, offset: 100 },
  { prefix: 'c0000000', re: /^ben-(\d{3})$/, offset: 100 },
  { prefix: 'd0000000', re: /^dem-(\d{3})$/, offset: 100 },
];

const ID_MAP = {};
for (const fam of FAMILIES) {
  const base = fam.re.source.match(/\^(\w+)-/)[1];
  for (let n = 1; n <= 10; n++) {
    const oldId = `${base}-${String(n).padStart(3, '0')}`;
    ID_MAP[oldId] = `${fam.prefix}-0000-0000-0000-${String(n + (fam.offset || 0)).padStart(12, '0')}`;
  }
}

const TABLES = ['utilisateurs', 'contribuables', 'demandes'];

function remap(tuple) {
  for (const [oldId, uuid] of Object.entries(ID_MAP)) {
    tuple = tuple.split(`'${oldId}'`).join(`'${uuid}'`);
  }
  return tuple;
}

async function main() {
  const backup = fs.readFileSync(BACKUP, 'utf8').split('\n');
  const fixed = fs.readFileSync(FIXED, 'utf8');
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'oase', multipleStatements: true });

  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  for (const table of TABLES) {
    const inserts = backup.filter((l) => l.startsWith(`INSERT INTO \`${table}\``));
    let restored = 0;
    for (const line of inserts) {
      const body = line.replace(new RegExp(`^INSERT INTO \`${table}\` VALUES `), '').replace(/;\s*$/, '');
      const tuples = body.split('),(');
      const missing = [];
      tuples.forEach((t, i) => {
        let x = t;
        if (i > 0) x = '(' + x;
        if (i < tuples.length - 1) x = x + ')';
        const id = (x.match(/^\(?\('([^']*)'/) || [])[1];
        const effectiveId = ID_MAP[id] || id;
        if (id && !fixed.includes(effectiveId)) missing.push(remap(x));
      });
      if (missing.length) {
        await conn.query(`INSERT INTO \`${table}\` VALUES ${missing.join(',')}`);
        restored += missing.length;
      }
    }
    console.log(`${table}: ${restored} lignes restaurées`);
  }
  await conn.query('SET FOREIGN_KEY_CHECKS=1');
  await conn.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
