// Tests Playwright E2E Lot 6 — Reset password (mot de passe oublié)
import { test, expect, request, APIRequestContext } from '@playwright/test';

const API = process.env.TEST_BASE_URL || 'http://localhost:3001';
const randomPhone = () => '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
const randomEmail = (s: string) => `lot6pw_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.tg`;

interface TestUser { email: string; pwd: string; phone: string; userId: string; accessToken: string; }

async function signupUser(api: APIRequestContext, suffix: string): Promise<TestUser> {
  const phone = randomPhone();
  const email = randomEmail(suffix);
  const pwd = 'Lot6PW!Pwd2026X';

  const otpResp = await api.post(`${API}/api/v1/otp/request`, {
    data: { telephone: phone, contexte: 'SIGNUP', payload: { email } },
  });
  const codeOtp = (await otpResp.json() as { codeDev: string }).codeDev;

  const signupResp = await api.post(`${API}/api/v1/auth/signup`, {
    data: {
      telephone: phone, email, contexte: 'SIGNUP', codeOtp,
      password: pwd, nom: 'LOTPW', prenom: 'Test',
    },
  });
  expect(signupResp.status()).toBe(201);
  const body = await signupResp.json();
  return {
    email, pwd, phone,
    userId: body.user.id as string,
    accessToken: body.access_token as string,
  };
}

async function requestResetOtp(api: APIRequestContext, u: TestUser) {
  const r = await api.post(`${API}/api/v1/otp/request`, {
    data: { telephone: u.phone, contexte: 'RESET_PWD', payload: { userId: u.userId, email: u.email } },
  });
  return (await r.json() as { codeDev: string }).codeDev;
}

test.describe('Lot 6 — Password reset (forgot password)', () => {

  test('P1. POST /auth/password/reset (sans OTP préalable) → 401', async () => {
    const api = await request.newContext();
    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: randomPhone(),
        email: 'unknown@x.tg',
        contexte: 'RESET_PWD',
        codeOtp: '000000',
        newPassword: 'NewPwd!2026XX',
        newPasswordConfirm: 'NewPwd!2026XX',
      },
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).code).toBe('OTP_INEXISTANT_OU_DEJA_UTILISE');
  });

  test('P2. POST /auth/password/reset (mauvais code) → 401', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    await requestResetOtp(api, u);

    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'RESET_PWD',
        codeOtp: '000000',
        newPassword: 'NewPwd!2026XX', newPasswordConfirm: 'NewPwd!2026XX',
      },
    });
    expect(r.status()).toBe(401);
    expect((await r.json()).code).toBe('OTP_INVALIDE');
  });

  test('P3. POST /auth/password/reset (email mismatch) → 400', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const codeOtp = await requestResetOtp(api, u);

    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone,
        email: 'wrong@email.tg',
        contexte: 'RESET_PWD',
        codeOtp,
        newPassword: 'NewPwd!2026XX', newPasswordConfirm: 'NewPwd!2026XX',
      },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).code).toBe('EMAIL_OTP_MISMATCH');
  });

  test('P4. POST /auth/password/reset (contexte != RESET_PWD) → 400', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const codeOtp = await requestResetOtp(api, u);

    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'SIGNUP',
        codeOtp,
        newPassword: 'NewPwd!2026XX', newPasswordConfirm: 'NewPwd!2026XX',
      },
    });
    expect(r.status()).toBe(400);
  });

  test('P5. POST /auth/password/reset (newPassword != confirm) → 400', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const codeOtp = await requestResetOtp(api, u);

    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'RESET_PWD', codeOtp,
        newPassword: 'NewPwd!2026XX', newPasswordConfirm: 'Different!2026',
      },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).code).toBe('PASSWORD_CONFIRMATION_INCORRECTE');
  });

  test('P6. POST /auth/password/reset (OK) → 200, ancien KO, nouveau OK', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const newPwd = 'P6New!Pwd2026XX';
    const codeOtp = await requestResetOtp(api, u);

    const reset = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'RESET_PWD', codeOtp,
        newPassword: newPwd, newPasswordConfirm: newPwd,
      },
    });
    expect(reset.status()).toBe(200);
    const body = await reset.json();
    expect(body.data.reset).toBe(true);
    expect(body.data.sessionsRevoquees).toBeGreaterThanOrEqual(1);

    // Ancien password : KO
    const loginOld = await api.post(`${API}/api/v1/auth/login`, {
      data: { email: u.email, password: u.pwd },
    });
    expect(loginOld.status()).toBe(401);

    // Nouveau password : OK
    const loginNew = await api.post(`${API}/api/v1/auth/login`, {
      data: { email: u.email, password: newPwd },
    });
    expect(loginNew.status()).toBe(200);
    expect((await loginNew.json()).access_token).toBeTruthy();
  });

  test('P7. Re-use même OTP (déjà consommé) → 401', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const codeOtp = await requestResetOtp(api, u);

    // 1ère utilisation OK
    const r1 = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'RESET_PWD', codeOtp,
        newPassword: 'P7New!Pwd2026', newPasswordConfirm: 'P7New!Pwd2026',
      },
    });
    expect(r1.status()).toBe(200);

    // 2e utilisation (re-use) KO
    const r2 = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'RESET_PWD', codeOtp,
        newPassword: 'P7Other!Pwd2026', newPasswordConfirm: 'P7Other!Pwd2026',
      },
    });
    expect(r2.status()).toBe(401);
    expect((await r2.json()).code).toBe('OTP_INEXISTANT_OU_DEJA_UTILISE');
  });

  test('P8. Anti-théft : user B tente d\'utiliser l\'OTP de A → 400', async () => {
    const api = await request.newContext();
    const a = await signupUser(api, 'A');
    const b = await signupUser(api, 'B');
    const codeOtpA = await requestResetOtp(api, a);

    // B essaie d'utiliser l'OTP de A (avec son propre email) → email mismatch
    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: a.phone, email: b.email, // email de B ≠ email du payload
        contexte: 'RESET_PWD', codeOtp: codeOtpA,
        newPassword: 'Hacker!Pwd2026', newPasswordConfirm: 'Hacker!Pwd2026',
      },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).code).toBe('EMAIL_OTP_MISMATCH');

    // A peut toujours se connecter normalement
    const loginA = await api.post(`${API}/api/v1/auth/login`, {
      data: { email: a.email, password: a.pwd },
    });
    expect(loginA.status()).toBe(200);
  });

  test('P9. User SUSPENDU ne peut pas reset son password → 403 USER_NON_ACTIF', async () => {
    // Ce test ne peut pas être exécuté via Playwright (besoin d'accès direct MySQL).
    // Il est couvert par le test Node (T12) qui fait l'UPDATE SQL direct.
    // On garde ce test comme placeholder pour la couverture.
    // Skip conditionnel si l'environnement n'a pas mysql2
    const mysql = await import('mysql2/promise');
    if (!mysql) {
      test.skip();
      return;
    }

    const api = await request.newContext();
    const u = await signupUser(api, 'A');

    // Suspendre via SQL
    const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'oase' });
    await conn.execute(`UPDATE utilisateurs SET statut_code = 'suspendu' WHERE id = ?`, [u.userId]);

    // Demander OTP RESET_PWD
    const otpResp = await api.post(`${API}/api/v1/otp/request`, {
      data: { telephone: u.phone, contexte: 'RESET_PWD', payload: { userId: u.userId, email: u.email } },
    });
    const codeOtp = (await otpResp.json() as { codeDev: string }).codeDev;

    // Tenter le reset
    const r = await api.post(`${API}/api/v1/auth/password/reset`, {
      data: {
        telephone: u.phone, email: u.email, contexte: 'RESET_PWD', codeOtp,
        newPassword: 'Bypass!Pwd2026XX', newPasswordConfirm: 'Bypass!Pwd2026XX',
      },
    });
    expect(r.status()).toBe(403);
    expect((await r.json()).code).toBe('USER_NON_ACTIF');

    await conn.end();
  });
});
