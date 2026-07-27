// Tests Playwright E2E Lot 5 — Complétion profil contribuable
import { test, expect, request, APIRequestContext } from '@playwright/test';

const API = process.env.TEST_BASE_URL || 'http://localhost:3001';
const randomPhone = () => '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
const randomEmail = (s: string) => `lot5pw_${s}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.tg`;
const randomNif = (suffix: string) => `PW-${suffix}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;

async function signupUser(api: APIRequestContext, suffix: string) {
  const phone = randomPhone();
  const email = randomEmail(suffix);
  const pwd = 'Lot5PW!Pwd2026X';

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
    email, pwd,
    accessToken: body.access_token as string,
    userId: body.user.id as string,
  };
}

test.describe('Lot 5 — Contribuable profile completion', () => {

  test('P1. GET /contribuables/me retourne profil placeholder 60%', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');

    const r = await api.get(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
    });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.data.nif).toMatch(/^PENDING-/);
    expect(body.data.profilCompletude).toBe(60);
    expect(body.data.profilLocked).toBe(false);
    expect(body.data.isProfilPlaceholder).toBe(true);
    expect(body.data.typeContribuable.libelle).toBe('Personne physique');
    // Alerte NIF placeholder
    expect((body.data.alertes as Array<{ code: string }>).map(a => a.code)).toContain('NIF_PLACEHOLDER');
    // Détail de complétude
    expect(body.data.completudeDetail.max).toBe(100);
    expect(body.data.completudeDetail.champs.find((c: { champ: string }) => c.champ === 'nif').complete).toBe(false);
  });

  test('P2. PATCH /contribuables/me (NIF PENDING-) → 400', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif: 'PENDING-FAKE' },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).code).toBe('NIF_NE_PEUT_PAS_ETRE_PLACEHOLDER');
  });

  test('P3. PATCH /contribuables/me (type invalide) → 400', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { typeContribuableCode: 'inconnu_ou_invalide' },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).code).toBe('TYPE_CONTRIBUABLE_INVALIDE');
  });

  test('P4. PATCH /contribuables/me (statut invalide) → 400', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { statutFiscalCode: 'fraudster' },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).code).toBe('STATUT_FISCAL_INVALIDE');
  });

  test('P5. PATCH /contribuables/me (NIF déjà pris) → 409', async () => {
    const api = await request.newContext();
    const a = await signupUser(api, 'A');
    const b = await signupUser(api, 'B');
    const nifB = randomNif('B');

    // B pose son NIF
    const bSet = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${b.accessToken}` },
      data: { nif: nifB },
    });
    expect(bSet.status()).toBe(200);

    // A tente de prendre le même
    const aTry = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${a.accessToken}` },
      data: { nif: nifB },
    });
    expect(aTry.status()).toBe(409);
    expect((await aTry.json()).code).toBe('NIF_DEJA_UTILISE');
  });

  test('P6. Complétion par paliers : NIF → 80, +adresse → 95, +secteur → 100/locked', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const nif = randomNif('A');

    // Étape 1 : NIF
    const s1 = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif },
    });
    expect(s1.status()).toBe(200);
    expect((await s1.json()).data.completude.score).toBe(80);

    // Étape 2 : + adresse (type et tel déjà OK au signup)
    const s2 = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { adresse: '12 Avenue de la Liberation, Lome' },
    });
    expect(s2.status()).toBe(200);
    expect((await s2.json()).data.completude.score).toBe(95);

    // Étape 3 : + secteur (email déjà OK au signup)
    const s3 = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { secteur: 'Agroalimentaire' },
    });
    expect(s3.status()).toBe(200);
    const s3body = await s3.json();
    expect(s3body.data.completude.score).toBe(100);
    expect(s3body.data.completude.isLocked).toBe(true);
    expect(s3body.data.contribuable.profilLocked).toBe(true);
  });

  test('P7. PATCH locked : NIF interdit → 403', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const nif = randomNif('L');

    // Compléter à 100%
    await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif, adresse: 'addr', secteur: 'sec' },
    });

    // Tenter de changer le NIF
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif: 'NEW-ATTEMPT' },
    });
    expect(r.status()).toBe(403);
    const body = await r.json();
    expect(body.code).toBe('PROFIL_VERROUILLE_CHAMPS_INTERDITS');
    expect(body.champsInterdits).toContain('nif');
  });

  test('P8. PATCH locked : champs autorisés (tel) → 200', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const nif = randomNif('L2');
    const newTel = randomPhone();

    // Compléter à 100%
    await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif, adresse: 'addr', secteur: 'sec' },
    });

    // Modifier le tel (autorisé même locked)
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { telephone: newTel },
    });
    expect(r.status()).toBe(200);
    expect((await r.json()).data.contribuable.telephone).toBe(newTel);
  });

  test('P8b. PATCH locked MIXTE (nif interdit + tel autorisé) → 200, nif ignoré, tel appliqué', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const nif = randomNif('MIX');
    const newTel = randomPhone();

    // Compléter à 100%
    await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif, adresse: 'addr', secteur: 'sec' },
    });

    // PATCH mixte : NIF interdit + tel autorisé
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif: 'IGN-LOCK', telephone: newTel },
    });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.data.contribuable.nif).toBe(nif);
    expect(body.data.contribuable.telephone).toBe(newTel);
  });

  test('P8c. PATCH locked QUE interdits → 403', async () => {
    const api = await request.newContext();
    const u = await signupUser(api, 'A');
    const nif = randomNif('ONLY');

    await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif, adresse: 'addr', secteur: 'sec' },
    });

    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      headers: { Authorization: `Bearer ${u.accessToken}` },
      data: { nif: 'NEW-NIF', raisonSociale: 'NEW-RSN' },
    });
    expect(r.status()).toBe(403);
    expect((await r.json()).code).toBe('PROFIL_VERROUILLE_CHAMPS_INTERDITS');
  });

  test('P9. GET /contribuables/me (profil complet) sans token → 401', async () => {
    const api = await request.newContext();
    const r = await api.get(`${API}/api/v1/contribuables/me`);
    expect(r.status()).toBe(401);
  });

  test('P10. PATCH /contribuables/me sans token → 401', async () => {
    const api = await request.newContext();
    const r = await api.patch(`${API}/api/v1/contribuables/me`, {
      data: { adresse: 'hack' },
    });
    expect(r.status()).toBe(401);
  });
});
