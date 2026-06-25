const mysql = require('mysql2/promise');

const tables = [
  'bases_juridiques',
  'base_juridique_versions',
  'beneficiaires',
  'demandes',
  'institutions',
  'utilisateurs',
  'ref_roles'
];

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'oase' });
  for (const t of tables) {
    console.log(`\n=== ${t} ===`);
    const [rows] = await c.execute(`DESCRIBE ${t}`);
    console.log(rows.map(r => r.Field).join(', '));
  }
  await c.end();
})();
