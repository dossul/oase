// Test E2E complet Lot 5 : gestion profil contribuable
// Cible : API sur port 3001
//
// Tests :
// T1. GET /contribuables/me (profil placeholder)
// T2. PATCH /contribuables/me (vide) — 400
// T3. PATCH /contribuables/me (nif + PENDING-) — 400 NIF_NE_PEUT_PAS_ETRE_PLACEHOLDER
// T4. PATCH /contribuables/me (typeContribuableCode invalide) — 400 TYPE_CONTRIBUABLE_INVALIDE
// T5. PATCH /contribuables/me (statutFiscalCode invalide) — 400 STATUT_FISCAL_INVALIDE
// T6. PATCH /contribuables/me (nif déjà pris par un autre contribuable) — 409
// T7. PATCH /contribuables/me (NIF valide + raison sociale) → 50%
// T8. PATCH /contribuables/me (type + adresse + tel) → 95%
// T9. PATCH /contribuables/me (email + secteur) → 100% + profilLocked
// T10. PATCH /contribuables/me (locked : nif) → 403 PROFIL_VERROUILLE_CHAMPS_INTERDITS
// T11. PATCH /contribuables/me (locked : telephone) → OK (autorisé)
// T12. GET /contribuables/me (re-fetch profil complet)
// T13. GET /contribuables/me sans token → 401

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
  const email = `lot5_${suffix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.tg`;
  const pwd = 'Lot5!Pwd2026X';

  const r0 = await call('POST', '/api/v1/otp/request', {
    telephone: tel, contexte: 'SIGNUP', payload: { email },
  });
  const codeSignup = r0.body?.codeDev;
  const r0b = await call('POST', '/api/v1/auth/signup', {
    telephone: tel, email, contexte: 'SIGNUP', codeOtp: codeSignup,
    password: pwd, nom: 'LOTFIVE', prenom: 'User',
  });
  return {
    tel, email, pwd,
    accessToken: r0b.body?.access_token,
    refreshToken: r0b.body?.refresh_token,
    userId: r0b.body?.user?.id,
  };
}

(async () => {
  console.log('--- Setup user A (sera complété) ---');
  const A = await signupUser('A');
  console.log(`email=${A.email} tel=${A.tel}`);

  console.log('--- Setup user B (pour test NIF déjà pris) ---');
  const B = await signupUser('B');
  console.log(`email=${B.email} tel=${B.tel}`);

  // Préparer un NIF pour B (utilisé par T6)
  const nifB = `NIF-B-${Date.now()}`;
  const setupB = await call('PATCH', '/api/v1/contribuables/me', {
    nif: nifB,
    raisonSociale: 'Societe B',
  }, B.accessToken);
  if (setupB.status !== 200) {
    console.log('❌ Setup B échoué', setupB);
    process.exit(1);
  }

  // ===== T1. GET /contribuables/me (placeholder) =====
  const t1 = await call('GET', '/api/v1/contribuables/me', null, A.accessToken);
  log('T1 — GET /contribuables/me (placeholder)', { status: t1.status, body: t1.body });
  expect('T1 status 200', t1.status === 200, t1);
  expect('T1 nif placeholder', t1.body?.data?.nif?.startsWith('PENDING-'), t1);
  expect('T1 profilCompletude=60', t1.body?.data?.profilCompletude === 60, t1);
  expect('T1 profilLocked=false', t1.body?.data?.profilLocked === false, t1);
  expect('T1 isProfilPlaceholder=true', t1.body?.data?.isProfilPlaceholder === true, t1);
  expect('T1 typeContribuable personne_physique', t1.body?.data?.typeContribuableCode === 'personne_physique', t1);
  expect('T1 typeContribuable enrichi (libelle)', t1.body?.data?.typeContribuable?.libelle === 'Personne physique', t1);
  expect('T1 statutFiscal enrichi', t1.body?.data?.statutFiscal?.libelle === 'Inconnu', t1);
  expect('T1 completudeDetail.max=100', t1.body?.data?.completudeDetail?.max === 100, t1);
  expect('T1 completudeDetail.base complete', t1.body?.data?.completudeDetail?.champs?.[0]?.complete === true, t1);
  expect('T1 completudeDetail.nif incomplete', t1.body?.data?.completudeDetail?.champs?.find((c) => c.champ === 'nif')?.complete === false, t1);
  expect('T1 alertes NIF_PLACEHOLDER', t1.body?.data?.alertes?.some((a) => a.code === 'NIF_PLACEHOLDER'), t1);

  // ===== T2. PATCH vide =====
  const t2 = await call('PATCH', '/api/v1/contribuables/me', {}, A.accessToken);
  log('T2 — PATCH vide', { status: t2.status, body: t2.body });
  expect('T2 status 200 (updated=false)', t2.status === 200, t2);
  expect('T2 updated=false', t2.body?.data?.updated === false, t2);

  // ===== T3. PATCH nif PENDING-* =====
  const t3 = await call('PATCH', '/api/v1/contribuables/me', {
    nif: 'PENDING-FAKE',
  }, A.accessToken);
  log('T3 — PATCH nif PENDING-', { status: t3.status, body: t3.body });
  expect('T3 status 400', t3.status === 400, t3);
  expect('T3 code NIF_NE_PEUT_PAS_ETRE_PLACEHOLDER',
    t3.body?.code === 'NIF_NE_PEUT_PAS_ETRE_PLACEHOLDER' || t3.body?.message?.code === 'NIF_NE_PEUT_PAS_ETRE_PLACEHOLDER', t3);

  // ===== T4. PATCH typeContribuableCode invalide =====
  const t4 = await call('PATCH', '/api/v1/contribuables/me', {
    typeContribuableCode: 'inconnu_ou_invalide',
  }, A.accessToken);
  log('T4 — PATCH type invalide', { status: t4.status, body: t4.body });
  expect('T4 status 400', t4.status === 400, t4);
  expect('T4 code TYPE_CONTRIBUABLE_INVALIDE',
    t4.body?.code === 'TYPE_CONTRIBUABLE_INVALIDE' || t4.body?.message?.code === 'TYPE_CONTRIBUABLE_INVALIDE', t4);

  // ===== T5. PATCH statutFiscalCode invalide =====
  const t5 = await call('PATCH', '/api/v1/contribuables/me', {
    statutFiscalCode: 'fraudster',
  }, A.accessToken);
  log('T5 — PATCH statut invalide', { status: t5.status, body: t5.body });
  expect('T5 status 400', t5.status === 400, t5);
  expect('T5 code STATUT_FISCAL_INVALIDE',
    t5.body?.code === 'STATUT_FISCAL_INVALIDE' || t5.body?.message?.code === 'STATUT_FISCAL_INVALIDE', t5);

  // ===== T6. PATCH nif déjà pris par B =====
  const t6 = await call('PATCH', '/api/v1/contribuables/me', {
    nif: nifB,
  }, A.accessToken);
  log('T6 — PATCH nif déjà pris', { status: t6.status, body: t6.body });
  expect('T6 status 409', t6.status === 409, t6);
  expect('T6 code NIF_DEJA_UTILISE',
    t6.body?.code === 'NIF_DEJA_UTILISE' || t6.body?.message?.code === 'NIF_DEJA_UTILISE', t6);

  // ===== T7. PATCH NIF + raison sociale =====
  const nifA = `NIF-A-${Date.now()}`;
  const t7 = await call('PATCH', '/api/v1/contribuables/me', {
    nif: nifA,
    raisonSociale: 'Alpha Tech SARL',
  }, A.accessToken);
  log('T7 — PATCH NIF + raison sociale', { status: t7.status, body: t7.body });
  expect('T7 status 200', t7.status === 200, t7);
  expect('T7 updated=true', t7.body?.data?.updated === true, t7);
  // 60 (initial signup) + 20 (NIF) = 80 (raison sociale déjà OK au signup)
  expect('T7 score=80', t7.body?.data?.completude?.score === 80, t7);
  expect('T7 isLocked=false', t7.body?.data?.completude?.isLocked === false, t7);

  // ===== T8. PATCH type + adresse + telephone =====
  const t8 = await call('PATCH', '/api/v1/contribuables/me', {
    typeContribuableCode: 'entreprise_privee',
    adresse: '12 Avenue de la Liberation, Lome, Togo',
    telephone: '+22890111222',
  }, A.accessToken);
  log('T8 — PATCH type + adresse + telephone', { status: t8.status, body: t8.body });
  expect('T8 status 200', t8.status === 200, t8);
  // 80 + 15 (adresse) = 95 (type et tel déjà OK au signup)
  expect('T8 score=95', t8.body?.data?.completude?.score === 95, t8);

  // ===== T9. PATCH emailContact + secteur =====
  const t9 = await call('PATCH', '/api/v1/contribuables/me', {
    emailContact: 'contact@alphatech.tg',
    secteur: 'Agroalimentaire',
  }, A.accessToken);
  log('T9 — PATCH email + secteur', { status: t9.status, body: t9.body });
  expect('T9 status 200', t9.status === 200, t9);
  // 85 + 10 (email) + 5 (secteur) = 100
  expect('T9 score=100', t9.body?.data?.completude?.score === 100, t9);
  expect('T9 isLocked=true', t9.body?.data?.completude?.isLocked === true, t9);
  expect('T9 profilLocked=true', t9.body?.data?.contribuable?.profilLocked === true, t9);

  // ===== T10. PATCH locked : nif =====
  const t10 = await call('PATCH', '/api/v1/contribuables/me', {
    nif: 'NIF-TRY-CHANGE',
  }, A.accessToken);
  log('T10 — PATCH locked: nif', { status: t10.status, body: t10.body });
  expect('T10 status 403', t10.status === 403, t10);
  expect('T10 code PROFIL_VERROUILLE_CHAMPS_INTERDITS',
    t10.body?.code === 'PROFIL_VERROUILLE_CHAMPS_INTERDITS' || t10.body?.message?.code === 'PROFIL_VERROUILLE_CHAMPS_INTERDITS', t10);

  // ===== T11. PATCH locked : telephone (autorisé) =====
  const t11 = await call('PATCH', '/api/v1/contribuables/me', {
    telephone: '+22890333444',
  }, A.accessToken);
  log('T11 — PATCH locked: telephone (autorisé)', { status: t11.status, body: t11.body });
  expect('T11 status 200', t11.status === 200, t11);
  expect('T11 telephone=NEW', t11.body?.data?.contribuable?.telephone === '+22890333444', t11);

  // ===== T11b. PATCH locked : MIXTE (nif interdit + tel autorisé) → 200 + nif ignoré =====
  // Le service doit filtrer le NIF interdit mais appliquer le changement de tel.
  const t11b = await call('PATCH', '/api/v1/contribuables/me', {
    nif: 'IGN-LOCKED',
    telephone: '+22890555666',
  }, A.accessToken);
  log('T11b — PATCH locked: mixte (nif interdit + tel autorisé)', { status: t11b.status, body: t11b.body });
  expect('T11b status 200', t11b.status === 200, t11b);
  // Le tel doit avoir été appliqué
  expect('T11b telephone appliqué', t11b.body?.data?.contribuable?.telephone === '+22890555666', t11b);
  // Le NIF ne doit PAS avoir changé
  expect('T11b nif inchangé', t11b.body?.data?.contribuable?.nif === nifA, t11b);

  // ===== T11c. PATCH locked : QUE des champs interdits → 403 =====
  const t11c = await call('PATCH', '/api/v1/contribuables/me', {
    nif: 'IGN-1',
    raisonSociale: 'IGN-RSN',
  }, A.accessToken);
  log('T11c — PATCH locked: que interdits', { status: t11c.status, body: t11c.body });
  expect('T11c status 403', t11c.status === 403, t11c);
  expect('T11c code PROFIL_VERROUILLE_CHAMPS_INTERDITS',
    t11c.body?.code === 'PROFIL_VERROUILLE_CHAMPS_INTERDITS' || t11c.body?.message?.code === 'PROFIL_VERROUILLE_CHAMPS_INTERDITS', t11c);

  // ===== T12. GET /contribuables/me re-fetch =====
  const t12 = await call('GET', '/api/v1/contribuables/me', null, A.accessToken);
  log('T12 — GET /contribuables/me (post-completion)', { status: t12.status, body: t12.body });
  expect('T12 nif=A', t12.body?.data?.nif === nifA, t12);
  expect('T12 raisonSociale=Alpha', t12.body?.data?.raisonSociale === 'Alpha Tech SARL', t12);
  expect('T12 profilCompletude=100', t12.body?.data?.profilCompletude === 100, t12);
  expect('T12 profilLocked=true', t12.body?.data?.profilLocked === true, t12);
  expect('T12 isProfilPlaceholder=false', t12.body?.data?.isProfilPlaceholder === false, t12);
  expect('T12 typeContribuable=entreprise_privee', t12.body?.data?.typeContribuableCode === 'entreprise_privee', t12);
  expect('T12 typeContribuable.libelle=Entreprise', t12.body?.data?.typeContribuable?.libelle?.includes('Entreprise'), t12);
  expect('T12 derniereMajCompletude présente', !!t12.body?.data?.derniereMajCompletude, t12);

  // ===== T13. GET sans token =====
  const t13 = await call('GET', '/api/v1/contribuables/me');
  log('T13 — GET sans token', { status: t13.status, body: t13.body });
  expect('T13 status 401', t13.status === 401, t13);

  // ===== T14. PATCH sans token =====
  const t14 = await call('PATCH', '/api/v1/contribuables/me', { adresse: 'hack' });
  log('T14 — PATCH sans token', { status: t14.status, body: t14.body });
  expect('T14 status 401', t14.status === 401, t14);

  // ===== T15. Bonus : si on baisse le score (effacer un champ critique) après lock, profilLocked reste true ? =====
  // En fait l'utilisateur ne peut pas baisser (locked), donc ce test vérifie juste
  // que locked ne descend jamais (cf T10).

  console.log(`\n========================================`);
  console.log(`   LOT 5 — TESTS E2E`);
  console.log(`   PASS: ${pass}    FAIL: ${fail}`);
  console.log(`   Email A: ${A.email}`);
  console.log(`   NIF A: ${nifA}`);
  console.log(`========================================\n`);

  if (fail > 0) process.exit(1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
