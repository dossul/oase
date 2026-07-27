// Debug P6
const API = 'http://localhost:3001';
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
  const tel = '+228' + (Math.floor(Math.random() * 90_000_000) + 10_000_000).toString();
  const email = `dbg_${Date.now()}@test.tg`;
  const r0 = await call('POST', '/api/v1/otp/request', { telephone: tel, contexte: 'SIGNUP', payload: { email } });
  const codeOtp = r0.body?.codeDev;
  const r0b = await call('POST', '/api/v1/auth/signup', {
    telephone: tel, email, contexte: 'SIGNUP', codeOtp, password: 'Dbg!Pwd2026X', nom: 'DBG', prenom: 'User',
  });
  const access = r0b.body?.access_token;
  console.log('Signup OK, user:', r0b.body?.user?.id);

  // Test PATCH avec nif seul
  const nif = `DBG-NIF-A-${Date.now()}`;
  console.log(`Trying PATCH nif=${nif} (len=${nif.length})`);
  const r1 = await call('PATCH', '/api/v1/contribuables/me', { nif }, access);
  console.log('Response:', r1.status, JSON.stringify(r1.body, null, 2));
})();
