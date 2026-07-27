// Test E2E complet de l'onboarding OASE (mode code-only, pas d'email confirmation)
// 1) Request OTP (SIGNUP, payload email)
// 2) POST /auth/signup avec code + password + nom/prenom
// 3) GET /auth/me avec access token
// 4) Test /auth/logout
// 5) Vérif DB : user créé + contribuable lié

const TEST_TEL = '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
const TEST_EMAIL = 'onboard_' + Date.now() + '@test.tg';
const TEST_PASSWORD = 'Test!Pwd2026X';
const TEST_NOM = 'KOSSOU';
const TEST_PRENOM = 'Akossiwa';

const API = 'http://localhost:3000';

const log = (label, val) => console.log(`\n=== ${label} ===\n` + (typeof val === 'string' ? val : JSON.stringify(val, null, 2)));

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
  // 1) Demander OTP SIGNUP
  const r1 = await call('POST', '/api/v1/otp/request', {
    telephone: TEST_TEL,
    contexte: 'SIGNUP',
    payload: { email: TEST_EMAIL },
  });
  log('TEST 1 — POST /otp/request (SIGNUP)', { status: r1.status, body: r1.body });
  if (r1.status !== 201 && r1.status !== 200) process.exit(1);
  const codeOtp = r1.body?.codeDev;
  if (!codeOtp) {
    console.error('❌ codeDev manquant — vérifie OTP_EXPOSE_CODE_IN_RESPONSE=true');
    process.exit(1);
  }
  console.log(`✅ Code OTP reçu: ${codeOtp}`);

  // 2) POST /auth/signup (contexte forcé à SIGNUP côté body = sécurité anti-reuse)
  const r2 = await call('POST', '/api/v1/auth/signup', {
    telephone: TEST_TEL,
    email: TEST_EMAIL,
    contexte: 'SIGNUP',
    codeOtp,
    password: TEST_PASSWORD,
    nom: TEST_NOM,
    prenom: TEST_PRENOM,
  });
  log('TEST 2 — POST /auth/signup', { status: r2.status, body: r2.body });
  if (r2.status !== 201) process.exit(1);
  const accessToken = r2.body?.access_token;
  const refreshToken = r2.body?.refresh_token;
  if (!accessToken) {
    console.error('❌ access_token manquant');
    process.exit(1);
  }
  console.log(`✅ access_token OK (${accessToken.length} chars)`);
  console.log(`✅ refresh_token OK (${refreshToken?.length} chars)`);
  console.log(`✅ user: ${r2.body?.user?.email} (${r2.body?.user?.id})`);
  console.log(`✅ contribuable: nif=${r2.body?.contribuable?.nif}, profil=${r2.body?.contribuable?.profilCompletude}%`);

  // 3) GET /auth/me
  const r3 = await call('GET', '/api/v1/auth/me', null, accessToken);
  log('TEST 3 — GET /auth/me (avec token)', { status: r3.status, body: r3.body });

  // 4) Logout (POST /auth/logout + refresh_token dans body)
  const r4 = await call('POST', '/api/v1/auth/logout', { refresh_token: refreshToken }, accessToken);
  log('TEST 4 — POST /auth/logout (refresh_token)', { status: r4.status, body: r4.body });

  // 5) Test que le token access est blacklisté
  const r5 = await call('GET', '/api/v1/auth/me', null, accessToken);
  log('TEST 5 — GET /auth/me APRÈS logout (doit échouer)', { status: r5.status, body: r5.body });

  // 5bis) Test que le refresh token est blacklisté aussi
  const r5b = await call('POST', '/api/v1/auth/refresh', { refresh_token: refreshToken });
  log('TEST 5b — POST /auth/refresh APRÈS logout (doit échouer)', { status: r5b.status, body: r5b.body });

  // 6) Test email déjà pris (tentative re-same-email avec NOUVEL OTP)
  const r6a = await call('POST', '/api/v1/otp/request', {
    telephone: TEST_TEL,
    contexte: 'SIGNUP',
    payload: { email: TEST_EMAIL },
  });
  const codeOtp2 = r6a.body?.codeDev;
  const r6 = await call('POST', '/api/v1/auth/signup', {
    telephone: TEST_TEL,
    email: TEST_EMAIL,
    contexte: 'SIGNUP',
    codeOtp: codeOtp2,
    password: TEST_PASSWORD,
    nom: TEST_NOM,
    prenom: TEST_PRENOM,
  });
  log('TEST 6 — POST /auth/signup EMAIL DÉJÀ PRIS', { status: r6.status, body: r6.body });

  console.log('\n========================================');
  console.log('   FIN TEST E2E ONBOARDING');
  console.log('   Email utilisé : ' + TEST_EMAIL);
  console.log('   Tél utilisé   : ' + TEST_TEL);
  console.log('========================================\n');
})();
