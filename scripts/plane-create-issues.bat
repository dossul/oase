@echo off
REM OASE — Création des issues Plane Phase A via API
REM API Key: plane_api_21369749db644345abe12675acaee074

set API_KEY=plane_api_21369749db644345abe12675acaee074
set BASE_URL=https://plane.ulia.site/api/v1
set WORKSPACE=iltic
set PROJECT_ID=66bc716c-8e92-45d7-9b1a-4756610a2451

echo === OASE Phase A — Creation issues Plane ===
echo.

REM Issue A.1 - Introspection (DONE)
echo [1/6] Creation A.1 — Introspection Prisma...
curl -s -X POST "%BASE_URL%/workspaces/%WORKSPACE%/projects/%PROJECT_ID%/issues/" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A.1 — Introspection Prisma depuis MySQL oase v3.3\",\"description\":\"**ETAT: ✅ TERMINE**\n\nExécuter `npx prisma db pull` sur base 'oase' (85 tables).\n\n**Résultat:** 85 modèles générés dans `prisma/schema.prisma`\n\n**Commandes:**\n```bash\ncd c:/wamp64/www/oase/oase-api\nnpx prisma db pull  # 85 models\nnpx prisma validate  # ✓ valid\nnpx prisma generate  # Client OK\n```\n\n**Vérification:** 85 modèles confirmés (PowerShell count)\n\n**Livrables:**\n- `prisma/schema.prisma` (1592 lignes)\n- Client Prisma dans `generated/prisma`\n\n**Prochaine étape:** A.2 Nettoyage conventions\",\"priority\":\"urgent\",\"estimate\":4,\"state\":\"completed\"}" > nul
if %ERRORLEVEL% == 0 (echo ✅ A.1 créé) else (echo ❌ A.1 erreur)

REM Issue A.2 - Nettoyage conventions
echo [2/6] Creation A.2 — Nettoyage conventions...
curl -s -X POST "%BASE_URL%/workspaces/%WORKSPACE%/projects/%PROJECT_ID%/issues/" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A.2 — Nettoyage conventions PascalCase + @@map\",\"description\":\"Refactorer schema.prisma pour conventions Prisma idiomatiques.\n\n**Objectifs:**\n1. Modèles snake_case → PascalCase avec @@map()\n   - demandes → Demande @@map(\\\"demandes\\\")\n   - beneficiaires → Beneficiaire @@map(\\\"beneficiaires\\\")\n   - ref_roles → RefRole @@map(\\\"ref_roles\\\")\n\n2. Champs snake_case → camelCase avec @map()\n   - raison_sociale → raisonSociale @map(\\\"raison_sociale\\\")\n   - date_creation → dateCreation @map(\\\"date_creation\\\")\n\n**Critères:**\n- [ ] 85 modèles PascalCase\n- [ ] Champs camelCase avec @map\n- [ ] prisma validate OK\n- [ ] prisma generate OK\n\n**Effort:** 8h\n**Dépendance:** A.1 ✅\",\"priority\":\"urgent\",\"estimate\":8}" > nul
if %ERRORLEVEL% == 0 (echo ✅ A.2 créé) else (echo ❌ A.2 erreur)

REM Issue A.3 - Enums TypeScript
echo [3/6] Creation A.3 — Generation enums TypeScript...
curl -s -X POST "%BASE_URL%/workspaces/%WORKSPACE%/projects/%PROJECT_ID%/issues/" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A.3 — Generation enums TypeScript depuis ref_*\",\"description\":\"Créer script pour générer enums TypeScript depuis 38 tables ref_*.\n\n**Tables source → Enums:**\n- ref_roles → enum Role\n- ref_statuts_demande → enum StatutDemande\n- ref_types_demande → enum TypeDemande\n- ref_natures_mesure → enum NatureMesure\n\n**Implémentation:**\n```typescript\n// scripts/generate-enums.ts\n// Lire ref_* via Prisma\n// Générer src/common/enums/generated.ts\n```\n\n**Intégration:**\n- npm run generate-enums\n- Post-hook après prisma generate\n\n**Critères:**\n- [ ] 38 enums générées\n- [ ] Utilisables dans DTOs NestJS\n- [ ] Sync automatique\n\n**Effort:** 4h\n**Dépendance:** A.2\",\"priority\":\"high\",\"estimate\":4}" > nul
if %ERRORLEVEL% == 0 (echo ✅ A.3 créé) else (echo ❌ A.3 erreur)

REM Issue A.4 - Baseline migration
echo [4/6] Creation A.4 — Baseline migration...
curl -s -X POST "%BASE_URL%/workspaces/%WORKSPACE%/projects/%PROJECT_ID%/issues/" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A.4 — Baseline migration 001_init_v33\",\"description\":\"Créer migration initiale Prisma baseline v3.3.\n\n**Commandes:**\n```bash\nnpx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script ^> prisma/migrations/001_init_v33/migration.sql\nnpx prisma migrate resolve --applied 001_init_v33\n```\n\n**Vérification:**\n```bash\nnpx prisma migrate status\n# Attendu: 1 migration appliquée\n```\n\n**Critères:**\n- [ ] Dossier prisma/migrations/001_init_v33/ créé\n- [ ] migration.sql avec DDL complet\n- [ ] prisma migrate status OK\n\n**Effort:** 2h\n**Dépendance:** A.2\",\"priority\":\"high\",\"estimate\":2}" > nul
if %ERRORLEVEL% == 0 (echo ✅ A.4 créé) else (echo ❌ A.4 erreur)

REM Issue A.5 - Seed démo
echo [5/6] Creation A.5 — Seed demo v3.3...
curl -s -X POST "%BASE_URL%/workspaces/%WORKSPACE%/projects/%PROJECT_ID%/issues/" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A.5 — Seed demo aligné v3.3 (15 rôles, bases juridiques SCD2)\",\"description\":\"Mettre à jour prisma/seed.ts avec données complètes.\n\n**Données à créer:**\n1. 15 rôles canoniques (ref_roles)\n2. 10 institutions avec types\n3. 38 tables ref_* complètes\n4. 5 bases juridiques versions SCD2:\n   - FSRV, SRD, DIT, DIS, autres\n5. 3 bénéficiaires avec NIF\n6. 5 demandes en différents statuts\n7. Workflows liés aux types\n\n**Critères:**\n- [ ] prisma db seed sans erreur\n- [ ] 85 tables peuplées\n- [ ] Audit chain vérifiable\n- [ ] Données cohérentes (FK valides)\n\n**Effort:** 8h\n**Dépendance:** A.4\",\"priority\":\"high\",\"estimate\":8}" > nul
if %ERRORLEVEL% == 0 (echo ✅ A.5 créé) else (echo ❌ A.5 erreur)

REM Issue A.6 - Tests intégrité
echo [6/6] Creation A.6 — Tests d'intégrité...
curl -s -X POST "%BASE_URL%/workspaces/%WORKSPACE%/projects/%PROJECT_ID%/issues/" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A.6 — Tests d'intégrité post-réconciliation\",\"description\":\"Vérifier réconciliation Prisma ↔ MySQL complète.\n\n**Tests effectués:**\n1. Comptage: 85 modèles = 85 tables MySQL\n2. Relations: Toutes FK ont @relation explicite\n3. CRUD test sur 5 modèles critiques:\n   - Demande (CRUD complet)\n   - Utilisateur (auth, relations)\n   - Workflow (instances, étapes)\n   - Quota (calculs, mouvements)\n   - AuditLog (immutabilité, chaining)\n4. SCD2: Unicité version active\n5. Audit: verifyChain() = 0 rupture\n\n**Critères:**\n- [ ] 85 modèles = 85 tables\n- [ ] Tests CRUD passent\n- [ ] Audit chain intacte\n- [ ] Prêt pour Phase B (NestJS)\n\n**Effort:** 4h\n**Dépendance:** A.5\",\"priority\":\"high\",\"estimate\":4}" > nul
if %ERRORLEVEL% == 0 (echo ✅ A.6 créé) else (echo ❌ A.6 erreur)

echo.
echo === Terminé ===
echo Voir les issues sur: https://plane.ulia.site/iltic/projects/%PROJECT_ID%/issues/
pause
