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

### BUG #1 - 2026-07-11 00:14 UTC - Terminologie "Bénéficiaire" → "Contribuable"

**Decouverte par :** Ulrich
**Type :** Refactoring semantique (pas un bug technique)
**Statut :** Partiellement corrige

**Contexte :**
- OASE gere des exonerations fiscales au Togo
- Le terme "beneficiaire" designe le demandeur d'exoneration
- En fiscalite togolaise, le bon terme est "contribuable" (le contribuable demande l'exoneration, le beneficiaire serait plutot l'entreprise apres octroi)
- L'utilisateur prefere "contribuable" dans toute l'app

**Changement effectue (commit feaec27) :**
- ✅ Role DB libelle : "Bénéficiaire" → "Contribuable"
- ✅ Description : "Dépôt et suivi des demandes" → "Dépôt et suivi des demandes d'exonération fiscale"
- ✅ Email user : `beneficiaire@gouv.tg` → `contribuable@gouv.tg`
- ✅ Log du seed affiche les libelles (Contribuable au lieu de beneficiaire)
- ✅ ON DUPLICATE KEY UPDATE inclut maintenant email (pour les futures MAJ)

**A faire (TODO - pas fait) :**
- [ ] Renommer la table `beneficiaires` → `contribuables` (Prisma schema + migration)
- [ ] Renommer `beneficiaire_id` → `contribuable_id` dans toutes les tables
- [ ] Renommer `ref_types_beneficiaire` → `ref_types_contribuable`
- [ ] Renommer `beneficiaire_historique_fiscal` → `contribuable_historique_fiscal`
- [ ] Renommer `agrement_beneficiaires` → `agrement_contribuables`
- [ ] Renommer le code role `beneficiaire` → `contribuable` (breaking change, gere migration)
- [ ] Renommer `src/beneficiaires/` → `src/contribuables/` dans le backend NestJS
- [ ] Renommer endpoints `/api/v1/beneficiaires/` → `/api/v1/contribuables/`
- [ ] Mettre a jour 50+ fichiers frontend (RolesView.vue, NewDemandeView.vue, ProfilView.vue, etc.)
- [ ] Mettre a jour le `Beneficiaire` dans le router (route paths)
- [ ] Mettre a jour les labels i18n dans toutes les vues
- [ ] Mettre a jour la documentation (DEPLOIEMENT_DOCKER.md, etc.)

**Impact :** Refactor majeur a planifier dans une session dediee
**Estimation :** 2-4 heures de travail

