const m = require('C:/wamp64/www/oase/oase-api/node_modules/mysql2/promise');
(async () => {
  const c = await m.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'oase' });
  const [t] = await c.query(
    `SELECT id, est_revoque AS estRevoque, created_at AS createdAt
     FROM refresh_tokens
     WHERE utilisateur_id = (
       SELECT id FROM utilisateurs WHERE email LIKE 'lot6_A_%@test.tg'
       ORDER BY created_at DESC LIMIT 1
     )
     ORDER BY created_at DESC`,
  );
  console.table(t);
  await c.end();
})();
