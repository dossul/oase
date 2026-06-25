const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'oase_test' });
  const [tables] = await c.execute("SELECT COUNT(*) AS nb FROM information_schema.tables WHERE table_schema = 'oase_test' AND table_type = 'BASE TABLE'");
  const [rows] = await c.execute("SELECT COUNT(*) AS nb FROM demandes");
  const [benefs] = await c.execute("SELECT COUNT(*) AS nb FROM beneficiaires");
  const [versions] = await c.execute("SELECT COUNT(*) AS nb FROM base_juridique_versions");
  const [users] = await c.execute("SELECT COUNT(*) AS nb FROM utilisateurs");
  console.log('Tables:', tables[0].nb);
  console.log('Demandes:', rows[0].nb);
  console.log('Beneficiaires:', benefs[0].nb);
  console.log('BJ Versions:', versions[0].nb);
  console.log('Utilisateurs:', users[0].nb);
  await c.end();
})();
