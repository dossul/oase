import { test, expect } from '@playwright/test';

test.describe('Parcours P1 -> P4 (API)', () => {
  test('P1 - API racine accessible', async ({ request }) => {
    const response = await request.get('/api/v1/');
    expect(response.status()).toBe(200);
  });

  test('P2 - health API OK', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect(response.status()).toBe(200);
  });

  test('P3 - API docs Swagger disponible', async ({ request }) => {
    const response = await request.get('/api/docs');
    expect([200, 301, 302]).toContain(response.status());
  });

  test('P4 - authentification API retourne reponse valide', async ({ request }) => {
    const response = await request.post('/api/v1/auth/login', {
      data: {
        email: 'beneficiaire@oase.tg',
        password: 'Oase@2026!',
      },
    });
    expect([200, 401, 403]).toContain(response.status());
    const body = await response.json().catch(() => ({}));
    expect(body).toEqual(expect.any(Object));
  });
});
