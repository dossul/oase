// DB check après Lot 5 E2E
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'oase',
  });

  console.log('\n=== 1. User A (complété 100%) ===');
  const [users] = await conn.query(`
    SELECT u.id, u.email, u.nom, u.prenom,
           c.nif, c.raison_sociale AS raisonSociale,
           c.type_contribuable_code AS typeContribuable,
           c.statut_fiscal_code AS statutFiscal,
           c.secteur, c.adresse, c.telephone AS cTelephone,
           c.email_contact AS emailContact,
           c.profil_completude AS profilCompletude,
           c.profil_locked AS profilLocked,
           c.derniere_maj_completude AS derniereMaj
    FROM utilisateurs u
    JOIN contribuables c ON c.user_id = u.id
    WHERE u.email LIKE 'lot5_A_%@test.tg'
      AND u.created_at > (NOW() - INTERVAL 5 MINUTE)
    ORDER BY u.created_at DESC
    LIMIT 1
  `);
  if (users.length === 0) {
    console.log('Aucun user A récent trouvé.');
    await conn.end();
    process.exit(1);
  }
  console.table(users);
  const a = users[0];

  console.log('\n=== 2. Audit log du user A (5 dernières entrées) ===');
  const [audit] = await conn.query(`
    SELECT action, entite,
           JSON_EXTRACT(ancienne_valeur, '$.profilCompletude') AS scoreAvant,
           JSON_EXTRACT(nouvelle_valeur, '$.profilCompletude') AS scoreApres,
           created_at AS createdAt
    FROM audit_logs
    WHERE utilisateur_id = ?
      AND action = 'CONTRIBUABLE_PROFILE_UPDATED'
    ORDER BY created_at DESC
    LIMIT 5
  `, [a.id]);
  console.table(audit);

  console.log('\n=== 3. Vérifs cohérence ===');
  const checks = [];
  checks.push(['NIF = NIF-A-*', a.nif.startsWith('NIF-A-')]);
  checks.push(['raisonSociale = Alpha Tech', a.raisonSociale === 'Alpha Tech SARL']);
  checks.push(['type = entreprise_privee', a.typeContribuable === 'entreprise_privee']);
  checks.push(['adresse = 12 Avenue', a.adresse?.includes('12 Avenue')]);
  checks.push(['telephone = +22890555666 (T11b dernière modif)', a.cTelephone === '+22890555666']);
  checks.push(['emailContact = contact@alphatech', a.emailContact === 'contact@alphatech.tg']);
  checks.push(['secteur = Agroalimentaire', a.secteur === 'Agroalimentaire']);
  checks.push(['profilCompletude = 100', a.profilCompletude === 100]);
  checks.push(['profilLocked = true', a.profilLocked === 1 || a.profilLocked === true]);
  checks.push(['derniereMaj présente', !!a.derniereMaj]);

  // NIF unique : on doit avoir un seul user avec ce NIF
  const [nifDup] = await conn.query(`SELECT COUNT(*) AS n FROM contribuables WHERE nif = ?`, [a.nif]);
  checks.push(['NIF unique en base', nifDup[0].n === 1]);

  // Audit : au moins 3 entrées (T7, T8, T9) + 1 (T11 locked=tel ok) = 4
  checks.push(['audit >= 4 entrées', audit.length >= 4]);

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
