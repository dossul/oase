# Rapport de couverture des tests — OASE — 2026-07-28 (22h)

**Environnement testé :** production — https://oase.ulia.site (API : https://api.oase.ulia.site/api/v1)
**Auteur :** session QA assistée (Playwright + Jest), validation humaine : Ulrich
**Principe de rédaction :** ce document distingue strictement ce qui est **prouvé par un test exécuté** de ce qui est **non vérifié**. Aucune affirmation sans exécution correspondante.

---

## 1. Résumé exécutif

| Question | Réponse honnête |
|---|---|
| Tous les workflows de la recette officielle (P1→P5, P7) passent en prod ? | **OUI — 29/29 tests E2E Playwright PASS le 2026-07-28 à ~20h30 (59 s)** |
| Tous les personas ont-ils été testés ? | **NON.** Les parcours UI complets sont prouvés pour 6 personas sur les rôles existants. Voir §3. |
| Le backend est-il régressé ? | **Non — 369/369 tests unitaires Jest PASS** (le 2026-07-28) |
| Tous les comptes peuvent-ils se connecter en prod ? | **OUI — 16/16 logins API OK** (vérifié le 2026-07-27, rapport BUG #8/#9) |

---

## 2. Ce qui A ÉTÉ testé (preuves datées)

### 2.1 Recette E2E en production — 29/29 PASS (2026-07-28)

Commande : `TEST_BASE_URL=https://oase.ulia.site TEST_API_URL=https://api.oase.ulia.site/api/v1 node node_modules/@playwright/test/cli.js test e2e/recette/`

| Persona | Rôle utilisé | Tests | Couverture |
|---|---|---|---|
| **P1** Contribuable | `kossiwa.amele@texlome.tg` | TC-P1-01 à TC-P1-06 | Dépôt demande, garde-fous soumission, suivi + stepper workflow, réponse complément, attestation PDF, profil entreprise |
| **P2** Agent instructeur | `fatima.ouattara@otr.tg` (agent_ci) | TC-P2-01 à TC-P2-05 | File d'attente, instruction + PIN, demande de complément, rejet motivé, filtrage RLS (agent_ci vs agent_dgbf) |
| **P3** Agence de promotion | `komlan.kodjo@api.tg` | TC-P3-01, TC-P3-02 | Dashboard agence, instruction dans périmètre, refus 403 hors périmètre |
| **P4** Décideur | `amevi.koffi@mef.tg` | TC-P4-01 à TC-P4-03 | Approbation finale PIN + attestation + notification, blocage quota 422, dashboards |
| **P5** Auditeur | `paul.adjovi@igf.tg` | TC-P5-01 à TC-P5-03 | Dashboard anomalies, journal d'audit chaîne SHA-256, consultation dossier lecture seule |
| **P7** Admin système | `kossi.sewavi@dgtcp.tg` | TC-P7-01 à TC-P7-04 + TC-P7-PERM-01 à 04 | Création/désactivation utilisateur, protection DERNIER_ADMIN (409), reset MFA/PIN, config workflows, matrice 401/403 et routes interdites |

Détail dans `docs/qa/RAPPORT_RECETTE_2026-07-28.md`. p4-decideur rejoué isolément (fixtures partagées, per runbook).

### 2.2 Tests unitaires backend — 369/369 PASS (2026-07-28)

Inclut les 2 nouveaux tests du démarrage auto de workflow à la soumission (commit `1a8c26d`).

### 2.3 Audit console/réseau du parcours P1 — 0 erreur réelle (2026-07-28)

Navigation Playwright pilotée en navigateur visible (demande utilisateur) : tous les écrans P1, formulaires et flows parcourus, consoles récupérées. Résultat : **0 erreur réelle**, 2 × 401 attendus (tentative de login KO volontaire du scénario). Rapport : `webbridge/audit-p1-2026-07-28T19-57-16.md`.

### 2.4 Vérifications API ciblées en prod (2026-07-28)

- `GET /workflow/demandes/:id/etapes` → **200** (correction du 404 initial ; preuve en conditions réelles sur `DEM-2026-00050` créée par la recette)
- Export `GET /demandes/export/mes-demandes` : **XLSX 200 valide** (19 lignes), **CSV 200 avec BOM Excel**
- Favicon OASE servi

### 2.5 Vérifications antérieures toujours valables (2026-07-27, sessions BUG #8/#9)

- **16/16 comptes** (tous rôles canoniques) : login API prod OK 200
- **7/7 personas** : login UI en ligne + redirection correcte
- Endpoint Open Data public testé en accès anonyme (200) — **smoke test API uniquement**
- Chaîne d'audit : `breaks: []`

---

## 3. Ce qui N'A PAS été testé — reste à vérifier (honnêteté complète)

### 3.1 Persona P6 — Portail public / Open Data — ❌ NON TESTÉ EN E2E

Le plan de recette officiel (`docs/tests/04_PLAN_RECETTE_EXONERATION.md`, l. 6) exclut explicitement : *« Hors périmètre : intégrations SI externes, Open Data / portail public, P6 »*.
- Vérifié : uniquement un smoke test de l'endpoint API opendata anonyme (2026-07-27).
- **Non vérifié :** le parcours UI public complet, la vérification publique d'attestation, le portail open data en navigation réelle.

### 3.2 Rôles secondaires : login OK, parcours UI NON testés — ⚠️ PARTIEL

Ces comptes passent le login API (16/16) mais **aucun test E2E ne parcourt leur interface métier** :

| Rôle | Compte | État |
|---|---|---|
| `agent_cddi` | agent.cddi@oase.tg | Login ✅ — parcours UI ❌ |
| `agent_dgbf` | agent.dgbf@oase.tg | Login ✅ — vu seulement via le test RLS de P2, pas de parcours propre |
| `agent_dgtcp` | agent.dgtcp@oase.tg | Login ✅ — parcours UI ❌ |
| `agent_mae` | agent.mae@oase.tg | Login ✅ — parcours UI ❌ |
| `agent_dgmg` | agent.dgmg@oase.tg | Login ✅ — parcours UI ❌ |
| `agent_ministere` | agent.ministere@oase.tg | Login ✅ — parcours UI ❌ |
| `agent_conedef` | agent.conedef@oase.tg | Login ✅ — parcours UI ❌ |
| 2e contribuable | amouzou.kossi@togo-farms.tg | Login ✅ — utilisé indirectement par les fixtures, pas de parcours dédié |

### 3.3 Fonctionnalités transverses non couvertes

- **MFA TOTP** : désactivé sur tous les comptes de test → le flux MFA réel (enrôlement, challenge) n'est **jamais** exercé en E2E. Les tests TC-AUTH-02 du plan ne sont pas automatisés dans la suite jouée.
- **Notifications réelles** (e-mail, SMS, WhatsApp) : l'envoi effectif n'est pas vérifié (seule la présence UI/configuration l'est).
- **Intégrations SI externes** : hors périmètre du plan, non testées.
- **Charge / performance / volumétrie** : aucun test.
- **Sécurité offensive** (injection, OWASP) : non testée — seules les matrices d'autorisation 401/403 le sont.

### 3.4 Limites méthodologiques

- Les tests tournent sur **une seule base de production** avec des données de recette accumulées (demandes DEM-2026-0001 à 0050+) : un test peut être influencé par l'état des données.
- Les 2 échecs TC-P5-03/TC-P7-03 observés le 2026-07-28 pendant la fenêtre de redéploiement montrent que **la recette ne doit pas être jouée pendant un déploiement** (résultats non significatifs).
- La recette est un instantané : elle ne garantit rien après une modification ultérieure du code ou des données.

---

## 4. Recommandations (si une couverture totale est exigée)

1. Écrire et jouer une spec E2E **P6** (portail public, vérification attestation, open data).
2. Ajouter des parcours smoke UI pour les 5 rôles secondaires (cddi, dgbf, dgtcp, mae, dgmg, ministere, conedef) — au minimum : login → dashboard → 1 action métier.
3. Réactiver MFA sur un compte dédié et automatiser TC-AUTH-02.
4. Planifier un test de charge avant ouverture réelle aux usagers.
5. Rejouer la recette complète après **chaque** déploiement (jamais pendant).

---

*Document généré le 2026-07-28 après exécution réelle des tests cités. Toute ligne de ce rapport est traçable vers une exécution (rapports Playwright, Jest, scripts d'audit dans `webbridge/`, commits cités).*
