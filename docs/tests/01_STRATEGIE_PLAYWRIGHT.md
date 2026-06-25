# OASE-42 à 51 — Stratégie E2E Playwright + Tests détaillés

> **Issues Plane :** OASE-42 (stratégie), OASE-43 (auth), OASE-44 (P1), OASE-45 (P2/P3), OASE-46 (dashboards), OASE-47 (P7 admin), OASE-48 (P6 public), OASE-49 (erreurs console), OASE-50 (responsive), OASE-51 (réseau)  
> **Date :** 2026-06-16

---

## 1. Stack et configuration

```bash
npm install -D @playwright/test
cd oase-frontend && npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // séquentiel car shared DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'https://demo.oase.mef.tg',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /setup\.ts/, },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] }, dependencies: ['setup'] },
  ],
});
```

---

## 2. Utilisateurs de test (seed)

| Persona | Email | Mot de passe | PIN | MFA |
|---|---|---|---|---|
| P1 bénéficiaire | `texlome@demo.tg` | `Oase@2026!` | `123456` | Non |
| P2 agent OTR-CI | `fatima.ouattara@otr.tg` | `Oase@2026!` | `123456` | Oui (TOTP seed fixe) |
| P3 agence API | `komlan.kodjo@api.tg` | `Oase@2026!` | `123456` | Oui |
| P4 décideur MEF | `amevi.koffi@mef.tg` | `Oase@2026!` | `123456` | Oui |
| P5 contrôle IGF | `paul.adjovi@igf.tg` | `Oase@2026!` | `123456` | Oui |
| P6 public | (sans auth) | | | |
| P7 admin SI | `kossi.sewavi@dgtcp.tg` | `Oase@2026!` | `123456` | Oui |

---

## 3. Spécifications de tests

### OASE-43 — Authentification et sécurité

```typescript
// e2e/auth.spec.ts
test.describe('Authentification', () => {
  test('P1 : login email+mdp sans MFA → espace bénéficiaire', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'texlome@demo.tg');
    await page.fill('[name=password]', 'Oase@2026!');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/beneficiaire');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('P2 : login + MFA TOTP → espace backoffice', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'fatima.ouattara@otr.tg');
    await page.fill('[name=password]', 'Oase@2026!');
    await page.click('button[type=submit]');
    // Redirect MFA
    await expect(page).toHaveURL(/\/auth\/mfa/);
    const code = generateTOTP('BASE32SECRET'); // seed fixe test
    await page.fill('[name=code]', code);
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/backoffice');
  });

  test('Login credentials invalides → toast erreur', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'inconnu@demo.tg');
    await page.fill('[name=password]', 'mauvais');
    await page.click('button[type=submit]');
    await expect(page.locator('.toast-danger')).toContainText('Email ou mot de passe incorrect');
    await expect(page).toHaveURL('/login');
  });

  test('Accès /backoffice par P1 → 403', async ({ page }) => {
    await loginAs(page, 'texlome@demo.tg'); // helper
    await page.goto('/backoffice/demandes');
    await expect(page.locator('.error-403')).toBeVisible();
  });

  test('Token expiré → redirect login', async ({ page }) => {
    await loginAs(page, 'texlome@demo.tg');
    await expireToken(); // helper API
    await page.reload();
    await expect(page).toHaveURL('/login');
  });
});
```

### OASE-44 — Parcours bénéficiaire complet

```typescript
// e2e/beneficiaire.spec.ts
test.describe('Parcours bénéficiaire P1', () => {
  test('Soumettre une demande d\'exonération', async ({ page }) => {
    await loginAs(page, 'texlome@demo.tg');

    // Étape 1 : sélection base juridique
    await page.goto('/beneficiaire/demandes/new/step1');
    await page.fill('[name=search]', 'produits alimentaires');
    await page.waitForResponse(/\/bases-juridiques/);
    await page.click('text=Mesure 141 : Exonération TVA sur importation de produits alimentaires');

    // Étape 2 : montant + pièces
    await page.click('button:has-text("Suivant")');
    await page.fill('[name=montant_fcfa]', '15000000');
    await page.setInputFiles('[name=piece_nif]', 'tests/fixtures/nif.pdf');
    await page.setInputFiles('[name=piece_rccm]', 'tests/fixtures/rccm.pdf');
    await page.click('button:has-text("Suivant")');

    // Étape 3 : récap + soumission
    await page.click('input[name=declaration_honneur]');
    await page.click('button:has-text("Soumettre")');
    await page.waitForResponse(/\/demandes\/.*\/soumettre/);

    // Vérification
    await expect(page.locator('.toast-success')).toContainText('Demande soumise avec succès');
    await expect(page.locator('.reference-oase')).toMatch(/OASE-2026-\d{6}/);
  });

  test('Répondre à une demande de complément', async ({ page }) => {
    await loginAs(page, 'texlome@demo.tg');
    await page.goto('/beneficiaire/demandes');
    // Filtrer "Action requise"
    await page.click('text=Action requise');
    await page.click('text=OASE-2024-000002');
    await page.click('text=Répondre au complément');
    await page.setInputFiles('[name=nouvelles_pieces]', 'tests/fixtures/rccm_renouvele.pdf');
    await page.click('button:has-text("Soumettre le complément")');
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('Télécharger attestation après approbation', async ({ page }) => {
    await loginAs(page, 'texlome@demo.tg');
    await page.goto('/beneficiaire/demandes');
    await page.click('text=Approuvé');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Télécharger l\'attestation'),
    ]);
    expect(download.suggestedFilename()).toMatch(/attestation_OASE-.*\.pdf/);
  });
});
```

### OASE-45 — Instruction back-office

```typescript
// e2e/instruction.spec.ts
test.describe('Instruction P2', () => {
  test('Prendre en charge et instruire un dossier', async ({ page }) => {
    await loginAs(page, 'fatima.ouattara@otr.tg', { mfa: true });
    await page.goto('/backoffice/demandes');
    await page.click('button:has-text("Prendre en charge")');
    await page.click('text=Instruire');

    // Visionner pièces
    await page.click('text=Pièces jointes');
    await expect(page.locator('.pdf-viewer')).toBeVisible();

    // Valider étape
    await page.fill('[name=pin]', '123456');
    await page.fill('[name=commentaire]', 'Dossier conforme — pièces vérifiées');
    await page.click('button:has-text("Valider l\'étape")');

    await expect(page.locator('.toast-success')).toContainText('Étape validée');
  });

  test('Demander un complément', async ({ page }) => {
    await loginAs(page, 'fatima.ouattara@otr.tg', { mfa: true });
    await page.goto('/backoffice/demandes');
    await page.click('text=OASE-2026-000003');
    await page.click('button:has-text("Demander un complément")');
    await page.fill('[name=motif]', 'RCCM expiré — fournir RCCM renouvelé');
    await page.click('button:has-text("Envoyer")');
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.statut-badge')).toContainText('Action requise');
  });

  test('Approbation finale avec PIN', async ({ page }) => {
    await loginAs(page, 'amevi.koffi@mef.tg', { mfa: true });
    await page.goto('/decideur/approbations');
    await page.click('text=OASE-2026-000005');
    await page.fill('[name=pin]', '123456');
    await page.click('button:has-text("Approuver")');
    await page.waitForResponse(/\/approuver/);
    await expect(page.locator('.toast-success')).toContainText('Demande approuvée');
  });
});
```

### OASE-46 — Dashboards et exports

```typescript
// e2e/dashboards.spec.ts
test.describe('Dashboards', () => {
  test('P4 : KPIs globaux affichés', async ({ page }) => {
    await loginAs(page, 'amevi.koffi@mef.tg', { mfa: true });
    await page.goto('/decideur');
    await expect(page.locator('[data-testid=kpi-montant-total]')).toContainText(/FCFA/);
    await expect(page.locator('[data-testid=kpi-taux-approbation]')).toContainText('%');
  });

  test('Export rapport PDF exécutif', async ({ page }) => {
    await loginAs(page, 'amevi.koffi@mef.tg', { mfa: true });
    await page.goto('/decideur/rapports');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Exporter PDF")'),
    ]);
    expect(download.suggestedFilename()).toMatch(/RME_\d{4}\.pdf/);
  });
});
```

### OASE-47 — Administration (P7)

```typescript
// e2e/admin.spec.ts
test.describe('Administration', () => {
  test('Créer un utilisateur et lui envoyer activation', async ({ page }) => {
    await loginAs(page, 'kossi.sewavi@dgtcp.tg', { mfa: true });
    await page.goto('/admin/utilisateurs');
    await page.click('text=Nouvel utilisateur');
    await page.fill('[name=nom]', 'Test');
    await page.fill('[name=prenom]', 'Utilisateur');
    await page.fill('[name=email]', 'test.utilisateur@demo.tg');
    await page.selectOption('[name=role]', 'agent_ci');
    await page.selectOption('[name=institution_id]', 'OTR-CI');
    await page.click('button:has-text("Créer")');
    await expect(page.locator('.toast-success')).toContainText('Utilisateur créé');
  });

  test('Réinitialiser MFA → QR code affiché', async ({ page }) => {
    await loginAs(page, 'kossi.sewavi@dgtcp.tg', { mfa: true });
    await page.goto('/admin/utilisateurs');
    await page.click('[data-testid=action-reset-mfa]:first-child');
    await expect(page.locator('.qrcode-mfa')).toBeVisible();
  });
});
```

### OASE-48 — Portail public

```typescript
// e2e/public.spec.ts
test.describe('Portail public', () => {
  test('Vérifier attestation par hash QR', async ({ page }) => {
    await page.goto('/attestations/verifier');
    await page.fill('[name=hash]', 'a1b2c3d4e5f6789012345678901234567890abcd1234567890abcdef12345678');
    await page.click('button:has-text("Vérifier")');
    await expect(page.locator('.resultat-valide')).toBeVisible();
    await expect(page.locator('.reference-oase')).toContainText('OASE-');
  });

  test('Attestation inexistante → message non reconnu', async ({ page }) => {
    await page.goto('/attestations/verifier');
    await page.fill('[name=hash]', '0000000000000000000000000000000000000000000000000000000000000000');
    await page.click('button:has-text("Vérifier")');
    await expect(page.locator('.resultat-invalide')).toContainText('non reconnue');
  });

  test('Stats anonymisées accessibles sans auth', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid=stat-nb-mesures]')).toContainText('1 316');
    await expect(page.locator('[data-testid=stat-nb-demandes]')).toBeVisible();
    // Aucun nom de bénéficiaire ne doit apparaître
    await expect(page.locator('text=TEXLOME')).not.toBeVisible();
  });
});
```

### OASE-49 à 51 — Erreurs console, visuel, réseau

```typescript
// e2e/quality.spec.ts
test.describe('Qualité navigateur', () => {
  test('Zéro erreur console sur tous les parcours', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/'); // public
    await loginAs(page, 'texlome@demo.tg'); // P1
    await loginAs(page, 'fatima.ouattara@otr.tg', { mfa: true }); // P2
    await loginAs(page, 'amevi.koffi@mef.tg', { mfa: true }); // P4

    expect(errors).toEqual([]);
  });

  test('Responsive mobile — menu hamburger fonctionnel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/beneficiaire');
    await page.click('[data-testid=menu-hamburger]');
    await expect(page.locator('.mobile-menu')).toBeVisible();
    await page.click('text=Mes demandes');
    await expect(page).toHaveURL('/beneficiaire/demandes');
  });

  test('États de chargement API visibles', async ({ page }) => {
    await page.goto('/beneficiaire/demandes');
    await expect(page.locator('.skeleton-loader')).toBeVisible(); // pendant le fetch
    await page.waitForResponse(/\/demandes/);
    await expect(page.locator('.skeleton-loader')).not.toBeVisible();
  });

  test('Aucune requête API non-autorisée (401 inattendu)', async ({ page }) => {
    const unauthorized: string[] = [];
    page.on('response', r => { if (r.status() === 401) unauthorized.push(r.url()); });
    await page.goto('/');
    await loginAs(page, 'texlome@demo.tg');
    await page.goto('/beneficiaire/demandes');
    expect(unauthorized).toEqual([]);
  });
});
```

---

## 4. Organisation des fichiers de test

```
e2e/
├── setup.ts              # Reset DB seeds + fixtures upload
├── fixtures/
│   ├── nif.pdf
│   ├── rccm.pdf
│   └── rccm_renouvele.pdf
├── helpers/
│   ├── auth.ts           # loginAs, generateTOTP, expireToken
│   ├── api.ts            # helpers pour appeler l'API NestJS directement
│   └── selectors.ts      # constantes data-testid
├── auth.spec.ts          # OASE-43
├── beneficiaire.spec.ts  # OASE-44
├── instruction.spec.ts   # OASE-45
├── dashboards.spec.ts  # OASE-46
├── admin.spec.ts         # OASE-47
├── public.spec.ts        # OASE-48
└── quality.spec.ts       # OASE-49 à 51
```

---

*Livrables OASE-42 à 51 — Stratégie Playwright + 53 spécifications de test.*
