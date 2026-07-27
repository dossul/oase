# OASE — Rapport de recette E2E complète (Playwright, backend réel)

> **Date :** 2026-07-27
> **Périmètre :** cœur métier exonération P1→P7 — workflows, formulaires, uploads, profils, permissions.
> **Hors périmètre (volontairement omis) :** connecteurs SI externes (Sydonia, E-TAX, SIGFiP, GUDEF, DAS), Open Data / portail public (P6), import bulk MRD, rapports IA.
> **Environnement :** frontend `http://localhost:5174` (Vite, proxy API), backend `http://localhost:3001/api/v1` (build officiel du 27/07), MySQL locale seedée UUID.

---

## 1. Verdict global

| Suite | Résultat | Détail |
|---|---|---|
| **Recette P1→P7 (backend réel)** | ✅ **29/29 PASS** | `maquette/e2e/recette/*.spec.ts` — 26 tests parallèles + 3 tests P4 séquentiels (fixtures partagées) |
| **E2E API (oase-api/e2e)** | ✅ **36/36 PASS** | auth profil, profil contribuable, password reset, parcours P1→P4 |
| **Tests unitaires backend** | ✅ **314/314 PASS** | 23 suites Jest (dont +41 ajoutés pendant la recette) |
| **Builds** | ✅ | `nest build` OK, `vite build` OK, `vue-tsc` propre |
| **Suite legacy mockée** | ✅ **30/30 PASS** (2 runs) | mocks réalignés sur les nouveaux contrats ; aucun bug applicatif résiduel |

### Cas de test du plan de recette (docs/tests/04_PLAN_RECETTE_EXONERATION.md)

| Groupe | Cas | Statut |
|---|---|---|
| TC-AUTH-01..07 | 7 | ✅ PASS (dont BUG #2/#4/#5 déjà clos le 12/07) |
| TC-P1-01..06 (dépôt, garde-fous, suivi, complément, attestation, profil) | 6 | ✅ PASS |
| TC-P2-01..05 (prise en charge, validation PIN, complément, rejet, RLS) | 5 | ✅ PASS |
| TC-P3-01..02 (conventions, instruction périmètre agence) | 2 | ✅ PASS |
| TC-P4-01..03 (approbation PIN + PDF + notification, quota 422, dashboards) | 3 | ✅ PASS |
| TC-P5-01..03 (anomalies, chaîne d'audit, lecture seule) | 3 | ✅ PASS |
| TC-P7-01..04 (création/désactivation utilisateur, reset MFA/PIN, workflows) | 4 | ✅ PASS |
| Matrice permissions (API 401/403 × 9 rôles + UI cross-persona) | 4 | ✅ PASS |

**Taux de conformité cœur métier : 100 %** (hors périmètres exclus volontairement).

---

## 2. Infrastructure de test

- L'ancien backend (processus du 15/07, build obsolète, **intuable** — session élevée) a été contourné : backend reconstruit sur **:3001**, frontend de test Vite sur **:5174** (`VITE_API_TARGET`, cf. `maquette/vite.config.ts`).
- Commande de recette : `cd maquette && TEST_BASE_URL=http://localhost:5174 npx playwright test e2e/recette` puis `… p4-decideur.spec.ts` (les 3 tests P4 partagent des fixtures consommables → à exécuter isolément, runtime < 15 s).
- Seeds migrés en **UUID déterministes** (`d0000000-…-0101+`, `10000000-…` institutions, `20000000-…` users) ; les 16 comptes de `docs/CREDENTIALS.md` préservés (16/16 login OK).

---

## 3. Bugs trouvés et corrigés pendant la recette

### Backend (oase-api)

| # | Bug | Gravité | Correctif |
|---|---|---|---|
| B1 | `GET /demandes` → 500 pour tous les rôles agents (relations Prisma `baseJuridiqueVersion` vs `baseJuridiqueVersions`, `demandeWorkflowEtapes` inexistant) | 🔴 | `scope.service.ts` corrigé |
| B2 | **Fuite RLS** : lecture détail + prise en charge cross-périmètre (200 au lieu de 403) | 🔴 sécurité | `demandeMatchesScope()` applique organe/agence/DGBF |
| B3 | `GET /conventions` → 403 pour agent_agence (rôles `@Roles` désalignés vs JWT canonique) | 🟠 | alignement taxonomie `@Roles` backend |
| B4 | Seeds ids non-UUID (`dem-001`, `ben-001`, `user-001`) vs `ParseUUIDPipe` → 400 partout | 🟠 | remapping UUID déterministe + reseed (16 comptes préservés, mojibake corrigé, tables `system_config`/`mfa_challenges` ajoutées) |
| B5 | `POST /auth/verify-pin` absent | 🟠 | endpoint ajouté `{valid: bool}` |
| B6 | Dernier admin désactivable | 🟠 | garde 409 `DERNIER_ADMIN` dans `utilisateurs.service` |
| B7 | Pas de téléchargement attestation pour le bénéficiaire | 🟠 | `GET /attestations/demandes/:id/download` (contrôle périmètre, StreamableFile) |
| B8 | `Do not know how to serialize a BigInt` (`/anomalies`, `/quotas`) | 🔴 | intercepteur global `BigIntSerializerInterceptor` + fix `@CurrentUser('id')` qui ignorait la clé |
| B9 | **Contournement total des contrôles** : `POST /demandes/:id/approuver` sans PIN, sans quota, sans acte | 🔴 critique | transition bloquée → `APPROBATION_VIA_DECISIONS` ; approbation uniquement via `decisions/approuver` (PIN + blocages + acte + notification) |
| B10 | `DecisionDto` sans validateurs → 400 avec pin / 500 sans corps | 🔴 | DTO validé, `PIN_REQUIS`/`PIN_INVALIDE`/`MOTIF_REQUIS` propres |
| B11 | Quota épuisé → 400 `DEMANDE_BLOQUEE` (plan : 422 `QUOTA_EPUISE`) | 🟠 | 422 + code métier |
| B12 | PIN jamais vérifié serveur sur `POST /demandes/:id/rejeter` | 🟠 sécurité | vérification PIN ajoutée (400 `PIN_REQUIS` / 401 `PIN_INVALIDE`) |
| B13 | `GET /notifications/unread-count` → 404 (appelé sur chaque page) | 🟠 | endpoint ajouté |
| B14 | Chaîne d'audit SHA-256 rompue (115 lignes legacy) + forks sous concurrence | 🔴 | re-chaînage (script `repair-audit-chain.js`) + alias POST `verify-chain` + **mutex applicatif** sur `createEntry` ; `verified: 1453+, breaks: []` |
| B15 | Attestation générée = fichier .txt | 🟠 | générateur PDF 1.4 maison (`simple-pdf.util.ts`), `application/pdf`, régénéré à chaque approbation |
| B16 | Aucune notification contribuable à l'approbation (+ codes notification non canoniques → 500 FK) | 🟠 | notification `APPROBATION` in-app + codes FK corrigés dans 5 services |
| B17 | Agrégats à zéro (`dashboards/p5`, rapports) : filtres `accord`/`accordee` au lieu de `approbation`/`approuve` | 🟠 | codes canoniques |
| B18 | FK `ref_etats_job` (`en_cours`→`running`…) et `ref_sources_detection` (`manuel`→`auditeur`) → 500 | 🟠 | codes corrigés (rapports, anomalies) |

### Frontend (maquette)

| # | Bug | Gravité | Correctif |
|---|---|---|---|
| F1 | **Taxonomie rôles frontend ≠ backend** → boucle de redirection infinie : aucun agent/admin ne pouvait se connecter | 🔴 bloquant | `useDefaultRoute.ts`, garde `router.ts` (anti-boucle + override admin), sidebar `AppLayout.vue`, meta.role alignés — 7/7 logins OK |
| F2 | Taxonomie statuts (`accordee`/`en_cours` vs `approuve`/`en_instruction`) → filtres vides | 🟠 | mapping centralisé `STATUT_LABELS`/`STATUT_COLORS` |
| F3 | Portail P1 100 % mock : dépôt non persisté, référence aléatoire, aucun garde-fou, détail mocké, profil en dur, attestation non téléchargeable | 🔴 | vues câblées API (`services/portail.ts`) : POST /demandes + soumettre, validation montant/pièces, détail + stepper, complément + upload, download attestation, GET/PATCH /contribuables/me |
| F4 | Upload pièces 100 % client | 🔴 | upload multipart réel (création + complément), 10 Mo max |
| F5 | Backoffice P2 100 % mock : pas de prise en charge, pas de PIN, complément sans motif, rejet sans appel | 🔴 | `services/backoffice.ts` : prendre-en-charge, valider étape + PIN, complément motivé, rejet motif+PIN, gestion `PIN_INVALIDE`, vues mutualisées agences |
| F6 | Agences : conventions mockées | 🟠 | `GET /conventions` réel + dashboard agence |
| F7 | Admin : création utilisateur 500 (libellé envoyé comme institutionId), désactivation non persistée, reset MFA/PIN absents, rôles obsolètes | 🔴 | institutions réelles (ID), PATCH statutCode + 409 DERNIER_ADMIN, boutons reset MFA (QR otpauth) / PIN, rôles canoniques |
| F8 | Décideur : aucune UI d'approbation, dashboards mock, pas d'alertes quota | 🔴 | file d'approbation + dialog décision (résumé, quota, PIN, 422/401 gérés sans déconnexion), dashboards réels, alertes 80 %/100 % |
| F9 | Audit : anomalies/journal/dashboard 100 % mock | 🔴 | `services/audit.ts` : anomalies triées par gravité, journal paginé serveur + bouton vérification chaîne, dashboard réel |
| F10 | **Fuite mode démo en build Docker** : `.env.local` (VITE_DEMO_MODE=true) copié dans l'image → switcher persona actif en prod | 🔴 prod | `.dockerignore` racine (`**/.env*`) + double garde `import.meta.env.DEV && flag` (3 endroits) — vérifié 4/4 sur build prod réel |

### Tests / outillage

- Mocks legacy périmés (`accessToken` vs `access_token`) — corrigés.
- 2 assertions obsolètes dans `p5-audit.spec.ts` (état mock pré-correctif) — retirées.
- Timeout Playwright 30 s insuffisant pour les parcours recette → 120 s.
- `nest-cli.json` : assets Prisma copiés au mauvais endroit (`dist/generated` → `dist/src/generated`).

---

## 4. Vérifications transverses

- **Uploads** : PDF réel via `setInputFiles` (dépôt initial + complément), multipart, taille max respectée. ✅
- **Formulaires** : login (7 personas), nouvelle demande (5 étapes), création utilisateur (rôle + structure + canaux), profil entreprise (NIF/RCCM verrouillés), instruction (motif/PIN), décision (PIN + commentaire). ✅
- **Profils** : 16 comptes, 12 rôles canoniques, redirections par rôle, menus par rôle. ✅
- **Permissions** : API 401 sans token / 403 rôle insuffisant (9 rôles × endpoints sensibles), RLS périmètre organe/agence (403 cross), UI routes interdites redirigées sans boucle, override admin fonctionnel, audit en lecture seule, dernier admin protégé. ✅
- **Workflows** : dépôt → soumission → prise en charge → instruction → complément ↔ réponse → validation étape (PIN) → approbation finale (PIN) → attestation PDF + notification ; rejet avec motif + PIN ; blocage quota 422. ✅
- **Intégrité** : chaîne d'audit SHA-256 vérifiée (`breaks: []`), append-only trigger actif, écritures sérialisées. ✅
- **Console** : aucune erreur JS critique ni 4xx/5xx inattendu sur les parcours (surveillé par `watchConsoleErrors` dans chaque spec). ✅

---

## 5. Limites connues / recommandations (non bloquantes)

1. **Génération PDF** : générateur maison minimal (texte simple) — enrichir la mise en page (logo, QR image) avant prod.
2. **Mutex chaîne d'audit applicatif** : mono-instance ; prévoir verrou DB (`GET_LOCK` MySQL) si multi-instances.
3. **Pas d'endpoint `GET /institutions`** : la liste admin est déduite des utilisateurs (fallback seed) — endpoint dédié recommandé.
4. **Pas de `PUT/PATCH /workflow/templates`** : l'éditeur admin de workflow est en lecture + sauvegarde locale signalée par bannière.
5. **Motif de complément** non exposé au contribuable (réservé audit/décideur/admin) — bandeau générique côté P1.
6. **Références** au format `DEM-AAAA-NNNNN` (≠ `OASE-AAAA-NNNNNN` du plan initial).
7. **Fixtures P4 consommables** : les tests d'approbation consomment des demandes `en_instruction` ; le mode série (ou une réservation de fixtures) est requis pour la reproductibilité.
8. **Vues SQL** `v_demandes_en_instruction` / `v_alertes_quotas` cassées en base mais inutilisées par le code.
9. ~~Suite legacy mockée~~ : réalignée et verte (30/30, 2 runs consécutifs).
10. **Processus legacy :3000/:5173** intuables depuis une session non élevée — à tuer au prochain redémarrage machine ; la recette utilise :3001/:5174.

---

*Recette exécutée par campagnes Playwright automatisées (agents QA) — preuves : `maquette/test-results/`, `maquette/e2e-report/`, logs backend `oase-api/logs/`.*
