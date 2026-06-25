const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  await c.execute('CREATE DATABASE IF NOT EXISTS oase_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('Base oase_test créée');
  await c.end();
})();
