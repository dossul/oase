# OASE - Rapport de bugs

**Date debut :** 2026-07-10 23:30 UTC
**Testeur :** Ulrich (interface) + Mavis (navig. Playwright)
**Methode :** E2E navigation + API testing
**URL :** https://oase.ulia.site/

---

## Comptes de test

| Email | Password | Role | MFA |
|---|---|---|---|
| admin@oase.ci | Oase@2026! | admin | desactive |
| agent.ci@oase.ci | Oase@2026! | agent_ci | desactive |
| instructeur@oase.ci | Oase@2026! | instructeur | desactive |

---

## Workflows

| # | Workflow | Status | Bugs |
|---|---|---|---|
| W1 | Auth (login/MFA/logout/me) | A FAIRE | - |
| W2 | Portail beneficiaire | A FAIRE | - |
| W3 | Backoffice instructeur | A FAIRE | - |
| W4 | Decideur | A FAIRE | - |
| W5 | Agences | A FAIRE | - |
| W6 | Admin | A FAIRE | - |
| W7 | Audit | A FAIRE | - |
| W8 | Institutions | A FAIRE | - |
| W9 | Tresor | A FAIRE | - |
| W10 | OpenData | A FAIRE | - |

---

## Bugs trouves

### Format

```
### BUG #N - [titre]
- **Date** : 2026-07-10 HH:MM
- **Workflow** : W#
- **Page/Route** : /chemin
- **Severite** : Critique / Haute / Moyenne / Basse
- **Compte** : admin@oase.ci
- **Reproduction** :
  1. Aller a ...
  2. Cliquer sur ...
  3. Observer ...
- **Attendu** : ...
- **Obtenu** : ...
- **Logs** :
  ```
  ...
  ```
- **Capture** : (si applicable)
```

---

## Session de test en cours
