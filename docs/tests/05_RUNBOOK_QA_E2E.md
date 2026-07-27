# OASE — Runbook QA E2E Playwright

> **Version :** 1.0  
> **Date :** 2026-07-26  
> **Périmètre :** Exécution, diagnostic et maintenance des tests E2E Playwright pour OASE (P1→P7 + auth + RBAC + MFA + audit)  
> **Sources :** `docs/tests/01_STRATEGIE_PLAYWRIGHT.md`, `docs/tests/04_PLAN_RECETTE_EXONERATION.md`, `docs/backend/05_RBAC_PERMISSIONS.md`

---

## 1. Prérequis environnement

### 1.1 Installation

```bash
# Backend
cd oase-api
npm install
npx prisma generate
npx prisma migrate deploy

# Frontend
cd oase-frontend
npm install
npx playwright install --with-deps chromium
```

### 1.2 Variables d'environnement requises

| Variable | Valeur dev | Description |
|---|---|---|
| `DATABASE_URL` | `mysql://root:@localhost:3306/oase` | Connexion DB |
| `JWT_SECRET` | `dev-secret-change-me` | Secret JWT |
| `ENCRYPTION_KEY` | `a`.repeat(32) | Clé chiffrement MFA |
| `MFA_ENABLED` | `false` | Activer/désactiver MFA global |
| `OTP_EXPOSE_CODE_IN_RESPONSE` | `true` | Exposer code OTP en dev |
| `BASE_URL` | `http://localhost:3000` | URL backend |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend |

### 1.3 Démarrer les services

```bash
# Terminal 1 — Backend
cd oase-api
npm run start:dev

# Terminal 2 — Frontend
cd oase-frontend
npm run dev
```

---

## 2. Utilisateurs de test (seed)

| Persona | Email | Mot de passe | PIN | Rôle | MFA |
|---|---|---|---|---|---|
| P1 contribuable | `texlome@demo.tg` | `Oase@2026!` | `123456` | `contribuable` | Non |
| P2 agent OTR-CI | `fatima.ouattara@otr.tg` | `Oase@2026!` | `123456` | `agent_ci` | Oui (TOTP) |
| P3 agence API | `komlan.kodjo@api.tg` | `Oase@2026!` | `123456` | `agent_agence` | Oui |
| P4 décideur MEF | `amevi.koffi@mef.tg` | `Oase@2026!` | `123456` | `decideur` | Oui |
| P5 contrôle IGF | `paul.adjovi@igf.tg` | `Oase@2026!` | `123456` | `auditeur` | Oui |
| P7 admin SI | `admin@oase.tg` | `Oase@2026!` | `123456` | `admin_si` | Oui |

> **Note :** En mode dev avec `MFA_ENABLED=false`, le MFA est désactivé globalement. Pour tester le MFA, mettre `MFA_ENABLED=true` et utiliser le code TOTP du seed.

---

## 3. Exécution des tests

### 3.1 Commandes de base

```bash
# Tous les tests E2E
cd oase-frontend && npx playwright test

# Un fichier spécifique
npx playwright test e2e/parcours-p1-p4.spec.ts

# Un test spécifique (par titre)
npx playwright test -g "P1 peut soumettre une demande"

# Mode debug (inspecteur Playwright)
npx playwright test --debug

# Mode UI (interface visuelle)
npx playwright test --ui

# Avec rapport HTML
npx playwright test --reporter=html && npx playwright show-report
```

### 3.2 Tests backend (Jest)

```bash
cd oase-api

# Tous les tests unitaires
npx jest --no-coverage

# Tests RBAC uniquement
npx jest src/rbac.spec.ts

# Tests auth + MFA
npx jest src/auth/auth.service.spec.ts

# Tests guard RBAC
npx jest src/common/guards/rbac.guard.spec.ts

# Avec couverture
npx jest --coverage
```

### 3.3 Tests par persona

| Persona | Fichier E2E | Cas couverts |
|---|---|---|
| Auth | `e2e/lot4-auth-profile.spec.ts` | Login, logout, refresh, profile |
| P1 Contribuable | `e2e/parcours-p1-p4.spec.ts` | Création demande, upload pièces, suivi |
| P2 Agent CI | `e2e/parcours-p1-p4.spec.ts` | Instruction, complément, validation |
| P4 Décideur | `e2e/parcours-p1-p4.spec.ts` | Approbation, rejet, attestation |
| P5 Auditeur | (à implémenter) | Audit logs, vérification chaîne |
| Password reset | `e2e/lot6-password-reset.spec.ts` | OTP, reset, re-login |
| Profil contribuable | `e2e/lot5-contribuable-profile.spec.ts` | Complétude, alertes |

---

## 4. Matrice de couverture RBAC

### 4.1 Vérification rapide

```bash
# Vérifier que tous les @Roles() sont alignés avec la spec
cd oase-api && npx jest src/rbac.spec.ts --no-coverage --verbose
```

### 4.2 Endpoints critiques par rôle

| Endpoint | Rôles autorisés | Test négatif |
|---|---|---|
| `POST /demandes` | `contribuable`, `admin_si` | `agent_ci` → 403 |
| `POST /demandes/:id/approuver` | `decideur`, `admin_si` | `contribuable` → 403 |
| `POST /demandes/:id/rejeter` | `agent_ci`, `agent_cddi`, `agent_dgbf`, `agent_agence`, `agent_mae`, `agent_dgmg`, `decideur`, `admin_si` | `contribuable` → 403 |
| `GET /audit-logs` | `auditeur`, `decideur`, `admin_si` | `contribuable` → 403 |
| `GET /audit-logs/verify-chain` | `auditeur`, `admin_si` | `decideur` → 403 |
| `POST /utilisateurs` | `admin_si` | `auditeur` → 403 |
| `POST /bases-juridiques` | `admin_si` | `agent_ci` → 403 |
| `POST /attestations/actes/:id` | `decideur`, `admin_si` | `agent_ci` → 403 |
| `POST /jobs/archiver` | `admin_si` | `decideur` → 403 |
| `PATCH /admin/mfa/config` | `admin_si` | `auditeur` → 403 |

---

## 5. Tests MFA multi-canal

### 5.1 Scénarios de test

| ID | Scénario | Canal | Étapes | Résultat attendu |
|---|---|---|---|---|
| MFA-01 | Login sans MFA (désactivé) | — | Login normal | Token pair direct |
| MFA-02 | Login avec MFA TOTP | `totp` | Login → `mfa_required` → verify avec code TOTP | Token pair après verify |
| MFA-03 | Login avec MFA email | `email` | Login → code envoyé par email → verify | Token pair après verify |
| MFA-04 | Login avec MFA WhatsApp | `whatsapp` | Login → code envoyé par WhatsApp → verify | Token pair après verify |
| MFA-05 | MFA token expiré | `totp` | Login → attendre >5min → verify | `MFA_TOKEN_EXPIRE` |
| MFA-06 | Code MFA incorrect | `totp` | Login → verify avec mauvais code | `CODE_MFA_INVALIDE` |
| MFA-07 | Changement de canal | `email` | Login (canal=totp) → verify avec canal=email | Token pair (si email configuré) |
| MFA-08 | Admin modifie config MFA | — | `PATCH /admin/mfa/config` | Config mise à jour |
| MFA-09 | Non-admin tente modif config | — | `PATCH /admin/mfa/config` avec rôle `agent_ci` | 403 |
| MFA-10 | Max tentatives dépassé | `email` | 6 tentatives avec mauvais code | Challenge invalidé |

### 5.2 Test MFA en dev

```bash
# Activer MFA avec canal TOTP
curl -X PATCH http://localhost:3000/admin/mfa/config \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "defaultChannel": "totp"}'

# Login — doit retourner mfa_required
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "fatima.ouattara@otr.tg", "password": "Oase@2026!"}'

# Verify MFA
curl -X POST http://localhost:3000/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"mfa_token": "<token>", "code": "123456", "canal": "totp"}'
```

---

## 6. Tests audit log

### 6.1 Scénarios

| ID | Scénario | Étapes | Résultat attendu |
|---|---|---|---|
| AUD-01 | Lister audit logs | `GET /audit-logs` avec `auditeur` | 200 + liste paginée |
| AUD-02 | Détail audit log | `GET /audit-logs/:id` | 200 + détail complet |
| AUD-03 | Vérifier chaîne | `GET /audit-logs/verify-chain` | 200 + statut chaîne |
| AUD-04 | Accès non-autorisé | `GET /audit-logs` avec `contribuable` | 403 |
| AUD-05 | Verify-chain par décideur | `GET /audit-logs/verify-chain` avec `decideur` | 403 |

### 6.2 Test audit en dev

```bash
# Lister les logs
curl http://localhost:3000/audit-logs?page=1&limit=20 \
  -H "Authorization: Bearer <auditeur_token>"

# Vérifier la chaîne
curl http://localhost:3000/audit-logs/verify-chain \
  -H "Authorization: Bearer <auditeur_token>"
```

---

## 7. Diagnostic et dépannage

### 7.1 Tests E2E échouent

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Navigation timeout` | Frontend non démarré | Vérifier `npm run dev` sur port 5173 |
| `401 Unauthorized` | Token expiré ou MFA activé | Vérifier `MFA_ENABLED` et seed users |
| `403 Forbidden` | RBAC mal aligné | Lancer `npx jest src/rbac.spec.ts` |
| `Database connection error` | MySQL non démarré | Vérifier WAMP/MAMP, port 3306 |
| `Cannot find module` | Prisma client non généré | `npx prisma generate` |
| `EPERM: query_engine.dll` | DLL locked par process | Fermer les process Node, régénérer |

### 7.2 Tests backend échouent

```bash
# Vérifier la compilation
npx tsc --noEmit

# Lint
npm run lint:check

# Tests avec logs détaillés
npx jest --no-coverage --verbose 2>&1
```

### 7.3 Régénérer le client Prisma

```bash
cd oase-api
# Si la DLL est locked, fermer tous les process Node d'abord
npx prisma generate
```

### 7.4 Réinitialiser la base de dev

```bash
cd oase-api
npx prisma migrate reset --force
npx prisma db seed
```

---

## 8. CI/CD

### 8.1 Pipeline GitHub Actions (recommandé)

```yaml
name: OASE E2E
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: ''
          MYSQL_DATABASE: oase_test
        ports: ['3306:3306']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd oase-api && npm ci && npx prisma generate && npx prisma migrate deploy
      - run: cd oase-api && npx jest --no-coverage
      - run: cd oase-frontend && npm ci && npx playwright install --with-deps chromium
      - run: cd oase-frontend && npx playwright test
        env:
          BASE_URL: http://localhost:3000
```

### 8.2 Critères de passage

| Critère | Seuil |
|---|---|
| Tests unitaires backend | 100% (284+ tests) |
| Tests RBAC | 100% (212 tests) |
| Tests E2E Playwright | 100% des scénarios critiques |
| Couverture code | ≥ 80% |
| Erreurs console E2E | 0 |
| Aucun test `skip` ou `todo` | Obligatoire |

---

## 9. Checklist avant recette

- [ ] Backend compile sans erreur (`tsc --noEmit`)
- [ ] Frontend compile sans erreur
- [ ] `npx prisma generate` à jour
- [ ] Migrations appliquées (`prisma migrate deploy`)
- [ ] Seed users présents en base
- [ ] Tests unitaires backend passent (284+)
- [ ] Tests RBAC passent (212)
- [ ] Tests E2E Playwright passent
- [ ] Aucune erreur console dans le navigateur
- [ ] MFA config vérifiée (`GET /admin/mfa/config`)
- [ ] Audit logs fonctionnels (`GET /audit-logs`)
- [ ] Chaîne d'audit valide (`GET /audit-logs/verify-chain`)

---

## 10. Rapport de recette

Après exécution complète, générer le rapport :

```bash
# Rapport Playwright HTML
cd oase-frontend && npx playwright test --reporter=html
npx playwright show-report

# Rapport couverture backend
cd oase-api && npx jest --coverage
```

Le rapport doit inclure :
- Nombre total de tests exécutés
- Taux de réussite par catégorie (auth, P1, P2, P4, P5, P7, RBAC, MFA, audit)
- Captures d'écran des échecs
- Logs console des échecs
- Durée d'exécution
- Version du code testé (git SHA)
