// DB check après Lot 6 E2E
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'oase',
  });

  console.log('\n=== 1. User A (après reset) ===');
  const [users] = await conn.query(`
    SELECT id, email, nom, role, statut_code AS statutCode,
           derniere_connexion AS derniereConnexion,
           updated_at AS updatedAt
    FROM utilisateurs
    WHERE email LIKE 'lot6_A_%@test.tg'
      AND created_at > (NOW() - INTERVAL 5 MINUTE)
    ORDER BY created_at DESC
    LIMIT 1
  `);
  if (users.length === 0) {
    console.log('Aucun user A récent trouvé.');
    await conn.end();
    process.exit(1);
  }
  console.table(users);
  const a = users[0];

  console.log('\n=== 2. Audit log (PASSWORD_RESET_*) ===');
  const [audit] = await conn.query(`
    SELECT action, role_au_moment AS role,
           JSON_EXTRACT(nouvelle_valeur, '$.sessionsRevoquees') AS sessions,
           JSON_EXTRACT(nouvelle_valeur, '$.reason') AS reason,
           created_at AS createdAt
    FROM audit_logs
    WHERE utilisateur_id = ?
      AND action LIKE 'PASSWORD_RESET_%'
    ORDER BY created_at DESC
    LIMIT 10
  `, [a.id]);
  console.table(audit);

  console.log('\n=== 3. Refresh tokens du user A ===');
  const [tokens] = await conn.query(`
    SELECT id, est_revoque AS estRevoque, expires_at AS expiresAt, created_at AS createdAt
    FROM refresh_tokens
    WHERE utilisateur_id = ?
    ORDER BY created_at DESC
  `, [a.id]);
  console.table(tokens);

  console.log('\n=== 4. OTP RESET_PWD récents ===');
  const [otps] = await conn.query(`
    SELECT id, telephone, contexte, tentatives, est_utilise AS estUtilise,
           JSON_EXTRACT(payload_json, '$.userId') AS payloadUserId,
           JSON_EXTRACT(payload_json, '$.email') AS payloadEmail,
           created_at AS createdAt
    FROM phone_otp_codes
    WHERE contexte = 'RESET_PWD'
    ORDER BY created_at DESC
    LIMIT 8
  `);
  console.table(otps.map(o => ({ ...o, payloadUserId: JSON.stringify(o.payloadUserId), payloadEmail: JSON.stringify(o.payloadEmail) })));

  console.log('\n=== 5. Vérifs cohérence ===');
  const checks = [];

  // Audit : au moins 1 SUCCESS + 1 ECHEC (T3 email mismatch)
  const actions = Object.fromEntries(audit.map(a => [a.action, (audit.filter(x => x.action === a.action)).length]));
  checks.push(['au moins 1 PASSWORD_RESET_SUCCES', (actions['PASSWORD_RESET_SUCCES'] || 0) >= 1]);
  checks.push(['au moins 1 PASSWORD_RESET_ECHEC (T3 email mismatch)', (actions['PASSWORD_RESET_ECHEC'] || 0) >= 1]);

  // Refresh tokens : tous les refreshs CRÉÉS AVANT le dernier reset sont révoqués
  // (= tous sauf le dernier, créé par un login post-reset, ex: T11b)
  const revoked = tokens.filter(t => t.estRevoque === 1).length;
  const active = tokens.filter(t => t.estRevoque === 0).length;
  console.log(`refresh tokens: total=${tokens.length}, revoked=${revoked}, active=${active}`);
  checks.push(['refresh tokens >= 1 (signup)', tokens.length >= 1]);
  checks.push(['tous les anciens refreshs révoqués (sauf login post-dernier-reset)',
    revoked === tokens.length - active]);
  checks.push(['<= 1 actif (login post-reset)', active <= 1]);

  // OTP RESET_PWD : tous utilisés (1 par test, dont 1 a fait 2 resets)
  const used = otps.filter(o => o.estUtilise === 1).length;
  checks.push(['OTP RESET_PWD >= 5 utilisés (T2 + T3 + T4 + T5 + T6 + T7 + T10a + T11)',
    used >= 5, `used=${used}`]);

  // payload OTP doit contenir userId + email
  const otpWithPayload = otps.find(o => o.payloadUserId && o.payloadEmail);
  checks.push(['au moins 1 OTP avec payload {userId, email}', !!otpWithPayload]);

  // Bilan
  console.log('\n=== BILAN COHÉRENCE ===');
  let pass = 0, fail = 0;
  for (const [name, ok] of checks) {
    if (ok) { pass++; console.log(`✅ ${name}`); }
    else { fail++; console.log(`❌ ${name}`); }
  }
  console.log(`\nPASS: ${pass}    FAIL: ${fail}`);

  await conn.end();
  if (fail > 0) process.exit(1);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
