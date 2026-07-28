# Rapport de recette E2E — Production — 2026-07-28

**Cible :** https://oase.ulia.site (API : https://api.oase.ulia.site/api/v1)
**Méthode :** Playwright chromium, `e2e/recette/`, 6 workers, fixtures partagées (p4-decideur rejoué isolément per runbook)
**Contexte :** session BUG #10 (voir `docs/BUGS.md`) — workflows P1 contribuable + workflow engine.

## Résultat : 29/29 PASS (59,0 s)

| Spec | Tests | Résultat |
|---|---|---|
| p1-depot | TC-P1-01 dépôt nominal, TC-P1-02 garde-fous | ✅ |
| p1-suivi | TC-P1-03 suivi + stepper, TC-P1-04 complément, TC-P1-05 attestation PDF, TC-P1-06 profil | ✅ |
| p2-instruction | TC-P2-01 à TC-P2-05 (file, instruction, complément, rejet, RLS) | ✅ |
| p3-agences | TC-P3-01 dashboard, TC-P3-02 périmètre + 403 | ✅ |
| p4-decideur | TC-P4-01 approbation PIN + attestation, TC-P4-02 quota 422, TC-P4-03 dashboards | ✅ |
| p5-audit | TC-P5-01 anomalies, TC-P5-02 chaîne SHA-256, TC-P5-03 lecture seule | ✅ |
| p7-administration | TC-P7-01 à TC-P7-04 + compléments API (DERNIER_ADMIN 409, reset MFA/PIN) | ✅ |
| p7-permissions | TC-P7-PERM-01 à 04 (matrice 401/403, routes interdites) | ✅ |

## Vérifications complémentaires du jour

- Audit console/réseau Playwright piloté (navigateur visible) sur tout le parcours P1 : **0 erreur réelle**, 2 × 401 attendus (login KO volontaire).
- `GET /workflow/demandes/:id/etapes` → 200 sur demandes soumises (dont `DEM-2026-00050` créée pendant la recette — démarrage auto prouvé en conditions réelles).
- Export serveur : XLSX 200 valide (19 lignes), CSV 200 avec BOM Excel.
- 369/369 tests Jest backend ; vue-tsc 0 erreur ; bundle `index-pWw9Bvs3.js`.

## Commande de rejeu

```bash
cd maquette
TEST_BASE_URL=https://oase.ulia.site TEST_API_URL=https://api.oase.ulia.site/api/v1 \
  node node_modules/@playwright/test/cli.js test e2e/recette/ --reporter=line
```

## Note sur les échecs transitoires

TC-P5-03 et TC-P7-03 ont échoué 2× pendant la fenêtre de redéploiement (API en restart / ancien bundle). Repro headed sain dès stack stabilisée, puis 9/9 et 29/29 PASS. Non reproductibles hors fenêtre de déploiement — aucun correctif produit requis.

---

## Mise à jour v2 — 2026-07-28 ~23h : 41/41 headless + 16/16 headed

Suite élargie à la demande de l'utilisateur (« rien sans test E2E headless ET headed ») :

| Spec | Tests | Résultat |
|---|---|---|
| p6-opendata (NOUVEAU) | TC-P6-01 à TC-P6-05 — portail public anonyme, 0 erreur, API publique 200 | ✅ 5/5 |
| roles-secondaires (NOUVEAU) | smoke E2E agent_cddi/dgbf/dgtcp/mae/dgmg/ministere/conedef — écrans métier, 0 erreur console, 0 API ≥ 400 | ✅ 7/7 |
| recette complète (29 + 12) | headless | ✅ **41/41 (1,3 min)** |
| specs nouvelles + p1-suivi | **headed (navigateur visible)** | ✅ **16/16 (47 s)** |

Bugs réels détectés et corrigés dans cette passe : BUG #10.5 (403 CONEDEF sur /rapports), BUG #10.6 (403 DGBF sur /dashboards/p5), BUG #10.7 (401 anonyme garanti sur /opendata/rapports). Détail : `RAPPORT_COUVERTURE_TESTS_2026-07-28.md` §5 et `docs/BUGS.md`.
