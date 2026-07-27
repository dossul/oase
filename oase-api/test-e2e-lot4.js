// Test E2E complet Lot 4 : gestion profil user connecté
// Cible : API sur port 3001 (nouvelle instance avec le code Lot 4)
//
// Tests :
// T1. GET /auth/me (enrichi) — doit retourner user + contribuable + alertes
// T2. PATCH /auth/me (nom+prenom sans OTP) — doit modifier
// T3. PATCH /auth/me (tel sans OTP) — doit refuser
// T4. PATCH /auth/me (tel sans code) — doit refuser
// T5. PATCH /auth/me (vide) — doit refuser
// T6. PATCH /auth/me (tel+OTP CHANGE_PHONE mais code faux) — 401 OTP_INVALIDE
// T7. PATCH /auth/me (tel+OTP CHANGE_PHONE OK) — doit modifier et burner l'OTP
// T8. PATCH /auth/me (re-use même OTP) — doit refuser (OTP déjà utilisé)
// T9. POST /auth/password/change (old mauvais) — 401
// T10. POST /auth/password/change (new != confirm) — 400
// T11. POST /auth/password/change (new === old) — 400
// T12. POST /auth/password/change (OK) — 200
// T13. login avec nouveau password — OK
// T14. login avec ancien password — KO

const API = process.env.API_URL || 'http://localhost:3001';
const log = (label, val) => console.log(`\n=== ${label} ===\n` + (typeof val === 'string' ? val : JSON.stringify(val, null, 2)));

let pass = 0, fail = 0;
const expect = (name, cond, extra) => {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`, extra ? JSON.stringify(extra) : ''); }
};

async function call(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = txt; }
  return { status: r.status, body: json };
}

(async () => {
  // --- Setup : créer un user de test via signup (comme Lot 3) ---
  const TEST_TEL = '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
  const TEST_TEL_NEW = '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
  const TEST_EMAIL = 'lot4_' + Date.now() + '@test.tg';
  const TEST_PWD = 'TestPwd!2026X';
  const TEST_PWD_NEW = 'NewPwd!2026XX';

  console.log(`\n--- Setup (signup user de test) ---`);
  console.log(`email=${TEST_EMAIL} tel=${TEST_TEL}`);

  const r0 = await call('POST', '/api/v1/otp/request', {
    telephone: TEST_TEL,
    contexte: 'SIGNUP',
    payload: { email: TEST_EMAIL },
  });
  expect('setup OTP', (r0.status === 200 || r0.status === 201) && r0.body?.codeDev, r0);
  const codeSignup = r0.body.codeDev;

  const r0b = await call('POST', '/api/v1/auth/signup', {
    telephone: TEST_TEL,
    email: TEST_EMAIL,
    contexte: 'SIGNUP',
    codeOtp: codeSignup,
    password: TEST_PWD,
    nom: 'DUPONT',
    prenom: 'Jean',
  });
  expect('setup signup', r0b.status === 201, r0b);
  const accessToken = r0b.body?.access_token;
  const refreshToken = r0b.body?.refresh_token;
  const userId = r0b.body?.user?.id;

  // ===== T1. GET /auth/me enrichi =====
  const t1 = await call('GET', '/api/v1/auth/me', null, accessToken);
  log('T1 — GET /auth/me enrichi', { status: t1.status, body: t1.body });
  expect('T1 status 200', t1.status === 200, t1);
  expect('T1 user.email', t1.body?.data?.user?.email === TEST_EMAIL, t1.body);
  expect('T1 user.telephone', t1.body?.data?.user?.telephone === TEST_TEL, t1.body);
  expect('T1 contribuable lié', !!t1.body?.data?.contribuable, t1.body);
  expect('T1 contribuable.nif placeholder', t1.body?.data?.contribuable?.nif?.startsWith('PENDING-'), t1.body);
  expect('T1 contribuable.profilCompletude=60', t1.body?.data?.contribuable?.profilCompletude === 60, t1.body);
  expect('T1 isProfilPlaceholder=true', t1.body?.data?.contribuable?.isProfilPlaceholder === true, t1.body);
  expect('T1 alertes[0].code PROFIL_PLACEHOLDER',
    t1.body?.data?.alertes?.[0]?.code === 'PROFIL_PLACEHOLDER', t1.body);
  expect('T1 alertes[1].code PROFIL_INCOMPLET',
    t1.body?.data?.alertes?.[1]?.code === 'PROFIL_INCOMPLET', t1.body);

  // ===== T2. PATCH /auth/me (nom+prenom, sans OTP) =====
  const t2 = await call('PATCH', '/api/v1/auth/me', {
    nom: 'MARTIN',
    prenom: 'Pierre',
  }, accessToken);
  log('T2 — PATCH nom+prenom', { status: t2.status, body: t2.body });
  expect('T2 status 200', t2.status === 200, t2);
  expect('T2 updated=true', t2.body?.data?.updated === true, t2);
  expect('T2 nom=MARTIN', t2.body?.data?.user?.nom === 'MARTIN', t2);
  expect('T2 prenom=Pierre', t2.body?.data?.user?.prenom === 'Pierre', t2);

  // Re-fetch pour confirmer
  const t2b = await call('GET', '/api/v1/auth/me', null, accessToken);
  expect('T2b persist nom', t2b.body?.data?.user?.nom === 'MARTIN', t2b);
  expect('T2b persist prenom', t2b.body?.data?.user?.prenom === 'Pierre', t2b);

  // ===== T3. PATCH /auth/me (tel sans OTP) =====
  const t3 = await call('PATCH', '/api/v1/auth/me', {
    telephone: TEST_TEL_NEW,
  }, accessToken);
  log('T3 — PATCH tel sans OTP', { status: t3.status, body: t3.body });
  expect('T3 status 400', t3.status === 400, t3);
  expect('T3 code OTP_CHANGE_PHONE_REQUIS', t3.body?.code === 'OTP_CHANGE_PHONE_REQUIS' || t3.body?.message?.code === 'OTP_CHANGE_PHONE_REQUIS', t3);

  // ===== T4. PATCH /auth/me (tel + contexte mais pas de code) =====
  const t4 = await call('PATCH', '/api/v1/auth/me', {
    telephone: TEST_TEL_NEW,
    contexte: 'CHANGE_PHONE',
  }, accessToken);
  log('T4 — PATCH tel+contexte sans code', { status: t4.status, body: t4.body });
  expect('T4 status 400', t4.status === 400, t4);

  // ===== T5. PATCH /auth/me (body vide) =====
  const t5 = await call('PATCH', '/api/v1/auth/me', {}, accessToken);
  log('T5 — PATCH vide', { status: t5.status, body: t5.body });
  expect('T5 status 400', t5.status === 400, t5);
  expect('T5 code AUCUN_CHAMPS_A_MODIFIER', t5.body?.code === 'AUCUN_CHAMPS_A_MODIFIER' || t5.body?.message?.code === 'AUCUN_CHAMPS_A_MODIFIER', t5);

  // ===== T6. Demander OTP CHANGE_PHONE =====
  const t6a = await call('POST', '/api/v1/otp/request', {
    telephone: TEST_TEL_NEW,
    contexte: 'CHANGE_PHONE',
    payload: { userId, newPhone: TEST_TEL_NEW },
  });
  log('T6a — OTP CHANGE_PHONE', { status: t6a.status, body: t6a.body });
  expect('T6a status 200', t6a.status === 200, t6a);
  const codeChangePhone = t6a.body?.codeDev;

  // ===== T6b. PATCH avec mauvais code =====
  const t6 = await call('PATCH', '/api/v1/auth/me', {
    telephone: TEST_TEL_NEW,
    contexte: 'CHANGE_PHONE',
    codeOtp: '000000',
  }, accessToken);
  log('T6 — PATCH tel + mauvais code', { status: t6.status, body: t6.body });
  expect('T6 status 401', t6.status === 401, t6);
  expect('T6 code OTP_INVALIDE', t6.body?.code === 'OTP_INVALIDE' || t6.body?.message?.code === 'OTP_INVALIDE', t6);

  // ===== T7. PATCH avec bon code =====
  const t7 = await call('PATCH', '/api/v1/auth/me', {
    telephone: TEST_TEL_NEW,
    contexte: 'CHANGE_PHONE',
    codeOtp: codeChangePhone,
  }, accessToken);
  log('T7 — PATCH tel + bon code', { status: t7.status, body: t7.body });
  expect('T7 status 200', t7.status === 200, t7);
  expect('T7 updated=true', t7.body?.data?.updated === true, t7);
  expect('T7 telephone=NEW', t7.body?.data?.user?.telephone === TEST_TEL_NEW, t7);

  // ===== T8. Re-use même OTP (doit être brûlé) =====
  const t8 = await call('PATCH', '/api/v1/auth/me', {
    telephone: TEST_TEL_NEW,
    contexte: 'CHANGE_PHONE',
    codeOtp: codeChangePhone,
  }, accessToken);
  log('T8 — re-use même OTP', { status: t8.status, body: t8.body });
  expect('T8 status 401', t8.status === 401, t8);
  expect('T8 code OTP_INEXISTANT_OU_DEJA_UTILISE',
    t8.body?.code === 'OTP_INEXISTANT_OU_DEJA_UTILISE' || t8.body?.message?.code === 'OTP_INEXISTANT_OU_DEJA_UTILISE', t8);

  // ===== T9. POST /auth/password/change (old mauvais) =====
  const t9 = await call('POST', '/api/v1/auth/password/change', {
    oldPassword: 'WrongPwd!2026',
    newPassword: TEST_PWD_NEW,
    newPasswordConfirm: TEST_PWD_NEW,
  }, accessToken);
  log('T9 — password change old mauvais', { status: t9.status, body: t9.body });
  expect('T9 status 401', t9.status === 401, t9);
  expect('T9 code ANCIEN_PASSWORD_INVALIDE',
    t9.body?.code === 'ANCIEN_PASSWORD_INVALIDE' || t9.body?.message?.code === 'ANCIEN_PASSWORD_INVALIDE', t9);

  // ===== T10. POST /auth/password/change (new != confirm) =====
  const t10 = await call('POST', '/api/v1/auth/password/change', {
    oldPassword: TEST_PWD,
    newPassword: TEST_PWD_NEW,
    newPasswordConfirm: 'DifferentPwd!2026',
  }, accessToken);
  log('T10 — new != confirm', { status: t10.status, body: t10.body });
  expect('T10 status 400', t10.status === 400, t10);
  expect('T10 code PASSWORD_CONFIRMATION_INCORRECTE',
    t10.body?.code === 'PASSWORD_CONFIRMATION_INCORRECTE' || t10.body?.message?.code === 'PASSWORD_CONFIRMATION_INCORRECTE', t10);

  // ===== T11. POST /auth/password/change (new === old) =====
  const t11 = await call('POST', '/auth/password/change'.replace('/auth', '/api/v1/auth'), {
    oldPassword: TEST_PWD,
    newPassword: TEST_PWD,
    newPasswordConfirm: TEST_PWD,
  }, accessToken);
  log('T11 — new === old', { status: t11.status, body: t11.body });
  expect('T11 status 400', t11.status === 400, t11);
  expect('T11 code PASSWORD_IDENTIQUE',
    t11.body?.code === 'PASSWORD_IDENTIQUE' || t11.body?.message?.code === 'PASSWORD_IDENTIQUE', t11);

  // ===== T12. POST /auth/password/change (OK) =====
  const t12 = await call('POST', '/api/v1/auth/password/change', {
    oldPassword: TEST_PWD,
    newPassword: TEST_PWD_NEW,
    newPasswordConfirm: TEST_PWD_NEW,
  }, accessToken);
  log('T12 — password change OK', { status: t12.status, body: t12.body });
  expect('T12 status 200', t12.status === 200, t12);
  expect('T12 changed=true', t12.body?.data?.changed === true, t12);

  // ===== T13. login avec nouveau password =====
  const t13 = await call('POST', '/api/v1/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PWD_NEW,
  });
  log('T13 — login avec nouveau pwd', { status: t13.status, body: t13.body });
  expect('T13 status 200', t13.status === 200, t13);
  expect('T13 access_token présent', !!t13.body?.access_token, t13);

  // ===== T14. login avec ancien password =====
  const t14 = await call('POST', '/api/v1/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PWD,
  });
  log('T14 — login avec ancien pwd', { status: t14.status, body: t14.body });
  expect('T14 status 401', t14.status === 401, t14);
  expect('T14 code CREDENTIALS_INVALIDES', t14.body?.code === 'CREDENTIALS_INVALIDES' || t14.body?.message?.code === 'CREDENTIALS_INVALIDES', t14);

  // ===== T15. password change révoque TOUS les refresh tokens =====
  // Le user a fait signup (refresh #1), login T13 (refresh #2).
  // Après T12 (password change), TOUS les refresh tokens doivent être révoqués.
  // Preuve : on tente un /auth/refresh avec le refresh #2 (du login T13) → doit échouer
  const t15 = await call('POST', '/api/v1/auth/refresh', { refresh_token: refreshToken });
  log('T15 — refresh après password change (doit échouer)', { status: t15.status, body: t15.body });
  expect('T15 status 401', t15.status === 401, t15);
  expect('T15 code REFRESH_TOKEN_INVALIDE',
    t15.body?.code === 'REFRESH_TOKEN_INVALIDE' || t15.body?.message?.code === 'REFRESH_TOKEN_INVALIDE', t15);

  // ===== T16. POST /auth/logout (sur un refresh déjà révoqué = idempotent) =====
  const t16 = await call('POST', '/api/v1/auth/logout', { refresh_token: refreshToken }, accessToken);
  log('T16 — logout idempotent', { status: t16.status, body: t16.body });
  expect('T16 status 204 (idempotent)', t16.status === 204, t16);

  // ===== T17. Bonus : le password change renvoie sessionsRevoquees =====
  // (changement de password déjà fait en T12 — on re-fait pour tester le retour)
  const t17a = await call('POST', '/api/v1/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PWD_NEW,
  });
  const accessT17 = t17a.body?.access_token;
  const refreshT17 = t17a.body?.refresh_token;
  const t17 = await call('POST', '/api/v1/auth/password/change', {
    oldPassword: TEST_PWD_NEW,
    newPassword: 'ThirdPwd!2026XX',
    newPasswordConfirm: 'ThirdPwd!2026XX',
  }, accessT17);
  log('T17 — password change 2e fois (sessionsRevoquees)', { status: t17.status, body: t17.body });
  expect('T17 status 200', t17.status === 200, t17);
  expect('T17 sessionsRevoquees >= 1', (t17.body?.data?.sessionsRevoquees || 0) >= 1, t17);
  // Le refresh du login T17 doit être révoqué
  const t17b = await call('POST', '/api/v1/auth/refresh', { refresh_token: refreshT17 });
  expect('T17b refresh révoqué', t17b.status === 401, t17b);

  console.log(`\n========================================`);
  console.log(`   LOT 4 — TESTS E2E`);
  console.log(`   PASS: ${pass}    FAIL: ${fail}`);
  console.log(`   Email utilisé : ${TEST_EMAIL}`);
  console.log(`========================================\n`);

  if (fail > 0) process.exit(1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
