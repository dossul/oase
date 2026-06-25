const mysql = require('mysql2/promise');

const tables = [
  'ref_types_institution',
  'ref_statuts_utilisateur',
  'ref_types_beneficiaire',
  'ref_statuts_fiscal',
  'ref_statuts_demande'
];

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'oase' });
  for (const t of tables) {
    console.log(`\n=== ${t} ===`);
    const [rows] = await c.execute(`SELECT code, libelle FROM ${t} LIMIT 20`);
    rows.forEach(r => console.log(`  ${r.code} : ${r.libelle}`));
  }
  await c.end();
})();
