// Vérif DB après onboarding E2E
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'oase',
  });

  console.log('\n=== 1. Derniers utilisateurs créés (top 3) ===');
  const [users] = await conn.query(`
    SELECT id, email, nom, prenom, telephone, role,
           statut_code AS statutCode, mfa_active AS mfaActive,
           derniere_connexion AS derniereConnexion, created_at AS createdAt
    FROM utilisateurs
    ORDER BY created_at DESC
    LIMIT 3
  `);
  console.table(users);

  if (users.length === 0) { console.log('Aucun user.'); await conn.end(); return; }

  const lastUser = users[0];

  console.log('\n=== 2. Contribuable lié au dernier user ===');
  const [contrib] = await conn.query(`
    SELECT id, user_id AS userId, nif, raison_sociale AS raisonSociale,
           type_contribuable_code AS typeContribuableCode,
           statut_fiscal_code AS statutFiscalCode,
           profil_completude AS profilCompletude,
           profil_locked AS profilLocked,
           email_contact AS emailContact
    FROM contribuables
    WHERE user_id = ?
  `, [lastUser.id]);
  console.table(contrib);

  console.log('\n=== 3. Audit log du dernier user (5 dernières entrées) ===');
  const [audit] = await conn.query(`
    SELECT id, action, entite, role_au_moment AS roleAuMoment,
           institution, ip, created_at AS createdAt
    FROM audit_logs
    WHERE utilisateur_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `, [lastUser.id]);
  console.table(audit);

  console.log('\n=== 4. Refresh tokens du dernier user ===');
  const [tokens] = await conn.query(`
    SELECT id, utilisateur_id AS utilisateurId, expires_at AS expiresAt,
           est_revoque AS estRevoque, ip, created_at AS createdAt
    FROM refresh_tokens
    WHERE utilisateur_id = ?
    ORDER BY created_at DESC
  `, [lastUser.id]);
  console.table(tokens);

  console.log('\n=== 5. OTP récents (SIGNUP utilisés) ===');
  const [otps] = await conn.query(`
    SELECT id, telephone, contexte, tentatives, est_utilise AS estUtilise,
           expires_at AS expiresAt, created_at AS createdAt
    FROM phone_otp_codes
    WHERE contexte = 'SIGNUP'
    ORDER BY created_at DESC
    LIMIT 3
  `);
  console.table(otps);

  await conn.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
