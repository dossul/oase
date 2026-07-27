// DB check après Lot 4 E2E
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'oase',
  });

  console.log('\n=== 1. Dernier user créé ===');
  // On cherche un user créé dans les 5 dernières minutes (donc par CE run du test)
  const [users] = await conn.query(`
    SELECT id, email, nom, prenom, telephone, role, updated_at AS updatedAt
    FROM utilisateurs
    WHERE created_at > (NOW() - INTERVAL 5 MINUTE)
      AND email LIKE 'lot4_%@test.tg'
    ORDER BY created_at DESC
    LIMIT 1
  `);
  console.table(users);
  if (users.length === 0) {
    console.log('Aucun user de test récent trouvé (5 dernières minutes).');
    await conn.end();
    process.exit(1);
  }
  const last = users[0];

  console.log('\n=== 2. Audit log (5 dernières entrées) ===');
  const [audit] = await conn.query(`
    SELECT action, entite, role_au_moment AS role,
           JSON_EXTRACT(ancienne_valeur, '$') AS avant,
           JSON_EXTRACT(nouvelle_valeur, '$') AS apres,
           created_at AS createdAt
    FROM audit_logs
    WHERE utilisateur_id = ?
    ORDER BY created_at DESC
    LIMIT 8
  `, [last.id]);
  console.table(audit.map(a => ({ ...a, avant: JSON.stringify(a.avant), apres: JSON.stringify(a.apres) })));

  console.log('\n=== 3. Refresh tokens du user ===');
  const [tokens] = await conn.query(`
    SELECT id, est_revoque AS estRevoque, expires_at AS expiresAt, created_at AS createdAt
    FROM refresh_tokens
    WHERE utilisateur_id = ?
    ORDER BY created_at DESC
  `, [last.id]);
  console.table(tokens);

  console.log('\n=== 4. OTP CHANGE_PHONE récents ===');
  const [otps] = await conn.query(`
    SELECT id, telephone, contexte, tentatives, est_utilise AS estUtilise,
           JSON_EXTRACT(payload_json, '$') AS payload,
           created_at AS createdAt
    FROM phone_otp_codes
    WHERE contexte = 'CHANGE_PHONE'
    ORDER BY created_at DESC
    LIMIT 3
  `);
  console.table(otps.map(o => ({ ...o, payload: JSON.stringify(o.payload) })));

  console.log('\n=== 5. Vérifs cohérence ===');
  const checks = [];

  // T1+T2 : nom/prenom modifiés, tel inchangé
  checks.push(['nom = MARTIN (changé par T2)', last.nom === 'MARTIN']);
  checks.push(['prenom = Pierre (changé par T2)', last.prenom === 'Pierre']);
  checks.push(['tel = nouveau (changé par T7)', /^(\+228)\d+$/.test(last.telephone)]);

  // T12 : password hash doit être différent de l'ancien (et toujours bcrypt)
  const [pwdRow] = await conn.query(`SELECT password_hash FROM utilisateurs WHERE id = ?`, [last.id]);
  checks.push(['password hash bcrypt ($2)', pwdRow[0].password_hash.startsWith('$2')]);

  // Audit : doit y avoir au moins 1 USER_PROFILE_UPDATED et 1 PASSWORD_CHANGE_SUCCES
  const [auditActions] = await conn.query(`
    SELECT action, COUNT(*) AS n FROM audit_logs
    WHERE utilisateur_id = ? AND action IN ('USER_PROFILE_UPDATED', 'PASSWORD_CHANGE_SUCCES', 'PASSWORD_CHANGE_ECHEC')
    GROUP BY action
  `, [last.id]);
  console.log('\nDétail audit Lot 4 :');
  console.table(auditActions);
  const actions = Object.fromEntries(auditActions.map(a => [a.action, a.n]));
  checks.push(['USER_PROFILE_UPDATED >= 2 (T2 + T7)', (actions['USER_PROFILE_UPDATED'] || 0) >= 2]);
  checks.push(['PASSWORD_CHANGE_SUCCES >= 1 (T12)', (actions['PASSWORD_CHANGE_SUCCES'] || 0) >= 1]);
  checks.push(['PASSWORD_CHANGE_ECHEC >= 1 (T9)', (actions['PASSWORD_CHANGE_ECHEC'] || 0) >= 1]);

  // Refresh tokens : au moins 3 créés (signup + login T13 + login T17), tous révoqués
  // car chaque password change révoque TOUT (T12 puis T17).
  const revoked = tokens.filter(t => t.estRevoque === 1).length;
  const active = tokens.filter(t => t.estRevoque === 0).length;
  console.log(`\nRefresh tokens : total=${tokens.length}, révoqués=${revoked}, actifs=${active}`);
  checks.push(['refresh tokens >= 3 (signup + 2 logins)', tokens.length >= 3]);
  checks.push(['tous révoqués par T12 + T17 (sécurité password change)', revoked === tokens.length]);
  checks.push(['0 actif (toutes sessions invalidées)', active === 0]);

  // OTP CHANGE_PHONE : >= 1 créé, 1 utilisé (T7)
  const used = otps.filter(o => o.estUtilise === 1).length;
  const notUsed = otps.filter(o => o.estUtilise === 0).length;
  console.log(`\nOTP CHANGE_PHONE : total=${otps.length}, utilisés=${used}, non utilisés=${notUsed}`);
  checks.push(['OTP CHANGE_PHONE >= 1 créé', otps.length >= 1]);
  checks.push(['OTP CHANGE_PHONE utilisé (T7)', used >= 1]);

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
