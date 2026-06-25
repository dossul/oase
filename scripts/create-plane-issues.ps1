# OASE — Création des issues Plane Phase A
# API Key: plane_api_21369749db644345abe12675acaee074

$apiKey = "plane_api_21369749db644345abe12675acaee074"
$baseUrl = "https://plane.ulia.site/api/v1"
$workspace = "iltic"
$projectId = "66bc716c-8e92-45d7-9b1a-4756610a2451"
$headers = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

# Issues à créer
$issues = @(
    @{
        name = "A.1 — Introspection Prisma depuis MySQL oase v3.3"
        description = @"
**ÉTAT: ✅ TERMINÉ — 85 modèles générés**

Exécuter `npx prisma db pull` sur base 'oase' (85 tables).

**Livrables:**
- `prisma/schema.prisma` avec 85 modèles @model
- Client Prisma généré dans `generated/prisma`

**Commandes exécutées:**
```bash
cd c:\wamp64\www\oase\oase-api
npx prisma db pull  # 85 models detected
npx prisma validate  # ✓ valid
npx prisma generate  # Client OK
```

**Vérification:**
```powershell
(Get-Content 'prisma/schema.prisma' | Select-String -Pattern '^model ').Count
# Résultat: 85
```

**Prochaine étape:** A.2 Nettoyage conventions de nommage
"@
        priority = "urgent"
        estimate = 4
    },
    @{
        name = "A.2 — Nettoyage conventions de nommage PascalCase + @@map"
        description = @"
Refactorer `schema.prisma` pour respecter les conventions Prisma idiomatiques.

**Objectifs:**
1. Renommer modèles snake_case → PascalCase
   - `demandes` → `Demande` avec `@@map("demandes")`
   - `beneficiaires` → `Beneficiaire` avec `@@map("beneficiaires")`
   - `ref_roles` → `RefRole` avec `@@map("ref_roles")`

2. Renommer champs:
   - `raison_sociale` → `raisonSociale` avec `@map("raison_sociale")`
   - `date_creation` → `dateCreation` avec `@map("date_creation")`

3. Conserver la compatibilité MySQL via `@@map` et `@map`

**Critères d'acceptation:**
- [ ] Tous les 85 modèles en PascalCase
- [ ] Tous les champs camelCase avec @map
- [ ] `prisma validate` OK
- [ ] `prisma generate` OK

**Effort:** 8h
**Dépendance:** A.1 ✅
"@
        priority = "urgent"
        estimate = 8
    },
    @{
        name = "A.3 — Génération enums TypeScript depuis ref_*"
        description = @"
Créer un script pour générer des enums TypeScript fortement typés depuis les 38 tables ref_*.

**Tables source:**
- ref_roles → enum Role
- ref_statuts_demande → enum StatutDemande  
- ref_types_demande → enum TypeDemande
- ref_natures_mesure → enum NatureMesure
- etc.

**Implémentation:**
```typescript
// scripts/generate-enums.ts
// Lire les tables ref_* via Prisma
// Générer src/common/enums/generated.ts
```

**Intégration:**
- Ajouter `npm run generate-enums` au package.json
- Exécuter automatiquement après `prisma generate`

**Critères d'acceptation:**
- [ ] Enums TypeScript générés pour les 38 tables ref_*
- [ ] Enums utilisables dans les DTOs NestJS
- [ ] Synchronisation automatique possible

**Effort:** 4h
**Dépendance:** A.2
"@
        priority = "high"
        estimate = 4
    },
    @{
        name = "A.4 — Baseline migration 001_init_v33"
        description = @"
Créer la migration initiale Prisma pour la baseline v3.3.

**Commandes:**
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/001_init_v33/migration.sql
npx prisma migrate resolve --applied 001_init_v33
```

**Vérification:**
```bash
npx prisma migrate status
# Attendu: 1 migration appliquée
```

**Critères d'acceptation:**
- [ ] Dossier `prisma/migrations/001_init_v33/` créé
- [ ] Fichier `migration.sql` contient le DDL complet
- [ ] `prisma migrate status` OK

**Effort:** 2h
**Dépendance:** A.2
"@
        priority = "high"
        estimate = 2
    },
    @{
        name = "A.5 — Seed démo aligné v3.3 (15 rôles, bases juridiques SCD2)"
        description = @"
Mettre à jour `prisma/seed.ts` avec des données complètes et cohérentes.

**Données à créer:**
1. **15 rôles canoniques** (ref_roles):
   - admin, agent_dgbf, agent_dgtcp, agent_otr, agent_ministere, etc.

2. **10 institutions** avec leurs types

3. **38 tables ref_*** complètes (statuts, types, natures)

4. **5 bases juridiques** avec versions SCD2:
   - FSRV, SRD, DIT, DIS, autres mesures

5. **3 bénéficiaires** avec NIF valides

6. **5 demandes** dans différents statuts

7. **Workflows** liés aux types de texte

**Critères d'acceptation:**
- [ ] `npx prisma db seed` exécute sans erreur
- [ ] 85 tables peuplées
- [ ] Audit chain vérifiable (verifyChain = 0 rupture)
- [ ] Données cohérentes (FK valides)

**Effort:** 8h
**Dépendance:** A.4
"@
        priority = "high"
        estimate = 8
    },
    @{
        name = "A.6 — Tests d'intégrité post-réconciliation"
        description = @"
Vérifier que la réconciliation Prisma ↔ MySQL est complète et fonctionnelle.

**Tests à effectuer:**
1. **Comptage:** 85 modèles Prisma = 85 tables MySQL
2. **Relations:** Toutes les FK ont des `@relation` explicites
3. **CRUD test** sur 5 modèles critiques:
   - `Demande` (CRUD complet)
   - `Utilisateur` (auth, relations)
   - `Workflow` (instances, étapes)
   - `Quota` (calculs, mouvements)
   - `AuditLog` (immutabilité, chaining)

4. **SCD2:** Unicité version active garantie
5. **Audit:** verifyChain() = 0 rupture après seed

**Script de test:**
```typescript
// tests/integration/reconciliation.spec.ts
```

**Critères d'acceptation:**
- [ ] 85 modèles = 85 tables
- [ ] Tests CRUD passent
- [ ] Audit chain intacte
- [ ] Prêt pour Phase B (NestJS)

**Effort:** 4h
**Dépendance:** A.5
"@
        priority = "high"
        estimate = 4
    }
)

Write-Host "=== Création des issues OASE Phase A ===" -ForegroundColor Green
Write-Host "Projet: $projectId" -ForegroundColor Gray
Write-Host ""

foreach ($issue in $issues) {
    $body = @{
        name = $issue.name
        description = $issue.description
        priority = $issue.priority
        estimate = $issue.estimate
    } | ConvertTo-Json -Depth 10
    
    $url = "$baseUrl/workspaces/$workspace/projects/$projectId/issues/"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
        Write-Host "✅ Créé: $($issue.name)" -ForegroundColor Green
        Write-Host "   ID: $($response.id)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Erreur: $($issue.name)" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Green
