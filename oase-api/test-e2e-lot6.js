// Test E2E complet Lot 6 : Reset password (mot de passe oublié)
// Cible : API sur port 3001
//
// Tests :
// T1. POST /auth/password/reset (sans OTP préalable) → 401
// T2. POST /auth/password/reset (mauvais code) → 401
// T3. POST /auth/password/reset (email mismatch) → 400
// T4. POST /auth/password/reset (newPassword != confirm) → 400
// T5. POST /auth/password/reset (contexte != RESET_PWD) → 400
// T6. POST /auth/password/reset (password faible) → 400
// T7. POST /auth/password/reset (OK) → 200 + sessionsRevoquees
// T8. Login avec ancien password → 401
// T9. Login avec nouveau password → 200
// T10. Tentative de reset avec même OTP (déjà consommé) → 401
// T11. Tentative de reset sans payer le userId du payload (anti-théft)
//        → 400 (email mismatch car OTP du user A utilisé pour reset B)

const API = process.env.API_URL || 'http://localhost:3001';
const log = (label, val) => console.log(`\n=== ${label} ===\n` + (typeof val === 'string' ? val : JSON.stringify(val, null, 2)));

let pass = 0, fail = 0;
const expect = (name, cond, extra) => {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`, extra ? JSON.stringify(extra).slice(0, 300) : ''); }
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

async function signupUser(suffix) {
  const tel = '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
  const email = `lot6_${suffix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.tg`;
  const pwd = 'Lot6!Pwd2026X';

  const r0 = await call('POST', '/api/v1/otp/request', {
    telephone: tel, contexte: 'SIGNUP', payload: { email },
  });
  const codeSignup = r0.body?.codeDev;
  const r0b = await call('POST', '/api/v1/auth/signup', {
    telephone: tel, email, contexte: 'SIGNUP', codeOtp: codeSignup,
    password: pwd, nom: 'LOTSIX', prenom: 'Test',
  });
  return {
    tel, email, pwd,
    accessToken: r0b.body?.access_token,
    refreshToken: r0b.body?.refresh_token,
    userId: r0b.body?.user?.id,
  };
}

(async () => {
  console.log('--- Setup user A (victime du reset) ---');
  const A = await signupUser('A');
  console.log(`email=${A.email} tel=${A.tel}`);

  // ===== T1. POST reset sans OTP préalable =====
  const t1 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: A.email,
    contexte: 'RESET_PWD',
    codeOtp: '000000',
    newPassword: 'NewPwd!2026XX',
    newPasswordConfirm: 'NewPwd!2026XX',
  });
  log('T1 — reset sans OTP', { status: t1.status, body: t1.body });
  expect('T1 status 401', t1.status === 401, t1);
  expect('T1 code OTP_INEXISTANT', t1.body?.code === 'OTP_INEXISTANT_OU_DEJA_UTILISE', t1);

  // Demander un OTP RESET_PWD pour A
  const otpReq = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel,
    contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  log('Setup OTP RESET_PWD', { status: otpReq.status, body: otpReq.body });
  const otpCode = otpReq.body?.codeDev;
  expect('Setup OTP code présent', !!otpCode, otpReq);

  // ===== T2. Reset avec mauvais code =====
  const t2 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: A.email,
    contexte: 'RESET_PWD',
    codeOtp: '000000',
    newPassword: 'NewPwd!2026XX',
    newPasswordConfirm: 'NewPwd!2026XX',
  });
  log('T2 — reset mauvais code', { status: t2.status, body: t2.body });
  expect('T2 status 401', t2.status === 401, t2);
  expect('T2 code OTP_INVALIDE',
    t2.body?.code === 'OTP_INVALIDE' || t2.body?.message?.code === 'OTP_INVALIDE', t2);

  // Demander un nouveau OTP (le précédent a été marqué utilisé après 1 tentative infructueuse)
  // Wait, actually in our service, OTP is consumed on first verifier() call.
  // Bad code increments tentatives, doesn't consume. Let me re-check.
  // Looking at OtpService: only successful verification marks as used. Bad code increments tentatives.
  // So the OTP is still valid. Let me reuse it.

  // ===== T3. Reset avec email mismatch =====
  const t3 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: 'wrong@email.tg', // ≠ A.email
    contexte: 'RESET_PWD',
    codeOtp: otpCode,
    newPassword: 'NewPwd!2026XX',
    newPasswordConfirm: 'NewPwd!2026XX',
  });
  log('T3 — reset email mismatch', { status: t3.status, body: t3.body });
  expect('T3 status 400', t3.status === 400, t3);
  expect('T3 code EMAIL_OTP_MISMATCH',
    t3.body?.code === 'EMAIL_OTP_MISMATCH' || t3.body?.message?.code === 'EMAIL_OTP_MISMATCH', t3);

  // ===== T4. Reset avec newPassword != confirm =====
  // Demander un nouveau OTP car le précédent est peut-être consommé (T2 + T3)
  const otpReq2 = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel,
    contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  const otpCode2 = otpReq2.body?.codeDev;

  const t4 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: A.email,
    contexte: 'RESET_PWD',
    codeOtp: otpCode2,
    newPassword: 'NewPwd!2026XX',
    newPasswordConfirm: 'DifferentPwd!2026',
  });
  log('T4 — newPassword != confirm', { status: t4.status, body: t4.body });
  expect('T4 status 400', t4.status === 400, t4);
  expect('T4 code PASSWORD_CONFIRMATION_INCORRECTE',
    t4.body?.code === 'PASSWORD_CONFIRMATION_INCORRECTE' || t4.body?.message?.code === 'PASSWORD_CONFIRMATION_INCORRECTE', t4);

  // ===== T5. Reset avec contexte != RESET_PWD =====
  const otpReq3 = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel,
    contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  const otpCode3 = otpReq3.body?.codeDev;

  const t5 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: A.email,
    contexte: 'SIGNUP', // wrong contexte
    codeOtp: otpCode3,
    newPassword: 'NewPwd!2026XX',
    newPasswordConfirm: 'NewPwd!2026XX',
  });
  log('T5 — contexte != RESET_PWD', { status: t5.status, body: t5.body });
  expect('T5 status 400', t5.status === 400, t5);
  expect('T5 code contexte invalide',
    t5.body?.message?.[0]?.includes('RESET_PWD') || t5.body?.code === 'contexte must be one of', t5);

  // ===== T6. Reset avec password faible =====
  const otpReq4 = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel,
    contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  const otpCode4 = otpReq4.body?.codeDev;

  const t6 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: A.email,
    contexte: 'RESET_PWD',
    codeOtp: otpCode4,
    newPassword: 'weak',
    newPasswordConfirm: 'weak',
  });
  log('T6 — password faible', { status: t6.status, body: t6.body });
  expect('T6 status 400', t6.status === 400, t6);

  // ===== T7. Reset OK =====
  const otpReq5 = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel,
    contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  const otpCode5 = otpReq5.body?.codeDev;

  const t7 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: A.email,
    contexte: 'RESET_PWD',
    codeOtp: otpCode5,
    newPassword: 'NewPwd!2026XX',
    newPasswordConfirm: 'NewPwd!2026XX',
  });
  log('T7 — reset OK', { status: t7.status, body: t7.body });
  expect('T7 status 200', t7.status === 200, t7);
  expect('T7 reset=true', t7.body?.data?.reset === true, t7);
  expect('T7 sessionsRevoquees >= 1', (t7.body?.data?.sessionsRevoquees || 0) >= 1, t7);

  // ===== T8. Login avec ancien password =====
  const t8 = await call('POST', '/api/v1/auth/login', {
    email: A.email, password: A.pwd,
  });
  log('T8 — login ancien pwd', { status: t8.status, body: t8.body });
  expect('T8 status 401', t8.status === 401, t8);
  expect('T8 code CREDENTIALS_INVALIDES',
    t8.body?.code === 'CREDENTIALS_INVALIDES' || t8.body?.message?.code === 'CREDENTIALS_INVALIDES', t8);

  // ===== T9. Login avec nouveau password =====
  const t9 = await call('POST', '/api/v1/auth/login', {
    email: A.email, password: 'NewPwd!2026XX',
  });
  log('T9 — login nouveau pwd', { status: t9.status, body: t9.body });
  expect('T9 status 200', t9.status === 200, t9);
  expect('T9 access_token présent', !!t9.body?.access_token, t9);

  // ===== T10. Re-use même OTP (déjà consommé) =====
  const otpReq6 = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel,
    contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  const otpCode6 = otpReq6.body?.codeDev;
  // 1ère utilisation : OK
  const first = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel, email: A.email, contexte: 'RESET_PWD', codeOtp: otpCode6,
    newPassword: 'OtherPwd!2026', newPasswordConfirm: 'OtherPwd!2026',
  });
  expect('Setup T10a 1ère utilisation OK', first.status === 200, first);
  // 2e utilisation (re-use) : doit échouer
  const t10 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel, email: A.email, contexte: 'RESET_PWD', codeOtp: otpCode6,
    newPassword: 'OtherPwd!2026', newPasswordConfirm: 'OtherPwd!2026',
  });
  log('T10 — re-use OTP', { status: t10.status, body: t10.body });
  expect('T10 status 401', t10.status === 401, t10);
  expect('T10 code OTP_INEXISTANT',
    t10.body?.code === 'OTP_INEXISTANT_OU_DEJA_UTILISE' || t10.body?.message?.code === 'OTP_INEXISTANT_OU_DEJA_UTILISE', t10);

  // ===== T11. Anti-théft : user A a demandé un OTP, user B tente de l'utiliser =====
  console.log('\n--- Setup user B (pour T11) ---');
  const B = await signupUser('B');

  // A demande un OTP pour A
  const otpReqA = await call('POST', '/api/v1/otp/request', {
    telephone: A.tel, contexte: 'RESET_PWD',
    payload: { userId: A.userId, email: A.email },
  });
  const otpCodeA = otpReqA.body?.codeDev;

  // B tente d'utiliser cet OTP (avec son propre email) → doit échouer email mismatch
  const t11 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: A.tel,
    email: B.email, // ≠ l'email du payload OTP
    contexte: 'RESET_PWD',
    codeOtp: otpCodeA,
    newPassword: 'HackerPwd!2026',
    newPasswordConfirm: 'HackerPwd!2026',
  });
  log('T11 — anti-théft OTP', { status: t11.status, body: t11.body });
  expect('T11 status 400', t11.status === 400, t11);
  expect('T11 code EMAIL_OTP_MISMATCH',
    t11.body?.code === 'EMAIL_OTP_MISMATCH' || t11.body?.message?.code === 'EMAIL_OTP_MISMATCH', t11);

  // Vérifier que A peut toujours se connecter avec son dernier password valide
  // (le OTP a été consommé sans changer le password, mais le compte n'est pas affecté)
  const t11b = await call('POST', '/api/v1/auth/login', {
    email: A.email, password: 'OtherPwd!2026',
  });
  // Note: après T10, le password de A est 'OtherPwd!2026'
  log('T11b — A peut toujours login', { status: t11b.status, body: t11b.body });
  expect('T11b A toujours login', t11b.status === 200, t11b);

  // ===== T12. Anti-bypass : user SUSPENDU ne peut pas reset son password =====
  console.log('\n--- Setup user C (suspendu) ---');
  const C = await signupUser('C');

  // Suspendre C directement en DB
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'oase' });
  await conn.execute(`UPDATE utilisateurs SET statut_code = 'suspendu' WHERE id = ?`, [C.userId]);
  console.log(`User C suspendu (id=${C.userId})`);

  // Demander OTP RESET_PWD pour C
  const otpReqC = await call('POST', '/api/v1/otp/request', {
    telephone: C.tel, contexte: 'RESET_PWD',
    payload: { userId: C.userId, email: C.email },
  });
  const otpCodeC = otpReqC.body?.codeDev;

  // Tenter le reset
  const t12 = await call('POST', '/api/v1/auth/password/reset', {
    telephone: C.tel, email: C.email, contexte: 'RESET_PWD', codeOtp: otpCodeC,
    newPassword: 'Bypass!Pwd2026XX', newPasswordConfirm: 'Bypass!Pwd2026XX',
  });
  log('T12 — reset user suspendu', { status: t12.status, body: t12.body });
  expect('T12 status 403', t12.status === 403, t12);
  expect('T12 code USER_NON_ACTIF',
    t12.body?.code === 'USER_NON_ACTIF' || t12.body?.message?.code === 'USER_NON_ACTIF', t12);

  // Vérifier que le password de C n'a pas été changé
  const loginC = await call('POST', '/api/v1/auth/login', {
    email: C.email, password: C.pwd,
  });
  log('T12b — C login avec ancien pwd (statut suspendu)', { status: loginC.status, body: loginC.body });
  expect('T12b status 401 (suspendu)', loginC.status === 401, loginC);

  await conn.close();

  console.log(`\n========================================`);
  console.log(`   LOT 6 — TESTS E2E`);
  console.log(`   PASS: ${pass}    FAIL: ${fail}`);
  console.log(`   Email A: ${A.email}`);
  console.log(`========================================\n`);

  if (fail > 0) process.exit(1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
