const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  await c.execute('DROP DATABASE IF EXISTS oase_test');
  await c.execute('CREATE DATABASE oase_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('oase_test recréée');
  await c.end();
})();
