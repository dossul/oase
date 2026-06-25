const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'oase' });
  const [rows] = await c.execute('SELECT id, code, nom, type_code FROM institutions');
  console.log(rows);
  await c.end();
})();
