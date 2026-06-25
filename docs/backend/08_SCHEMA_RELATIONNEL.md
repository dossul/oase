# OASE-11 — Modèle relationnel (Prisma Schema)

> **Issue Plane :** OASE-11  
> **Date :** 2026-06-16  
> **Livrable principal :** `docs/backend/schema.prisma` (prêt à copier dans `prisma/schema.prisma`)  
> **Sources :** OASE-5 (corrections MRD), OASE-6 (Domain Model), OASE-7 (Statuts), OASE-8 (RBAC)

---

## 1. Tables produites — vue d'ensemble

| # | Table | Lignes initiales | Description |
|---|---|---|---|
| 1 | `institutions` | ~15 | OTR-CI, OTR-CDDI, DGBF, SAZOF, DGMG, MAE... |
| 2 | `utilisateurs` | ~50 (demo) | Comptes P1→P7 |
| 3 | `refresh_tokens` | dynamique | Rotation JWT |
| 4 | `accords_siege` | ~100 | Accords ONU/ambassades/ONG |
| 5 | `beneficiaires` | ~200 (demo) | Opérateurs économiques |
| 6 | `bases_juridiques` | **1 316** (MRD) | Mesures dérogatoires — import MRD |
| 7 | `codes_additionnels` | ~1 000 | Codes Sydonia / E-TAX par mesure |
| 8 | `demandes` | ~500 (demo) | Dossiers d'exonération |
| 9 | `pieces_jointes` | ~2 000 (demo) | Documents attachés |
| 10 | `workflow_templates` | 6 | cgi-ci, cgi-cddi, zone-franche, accord-siege, minier, manuel |
| 11 | `etapes_workflow` | ~3 000 (demo) | Étapes par demande |
| 12 | `decisions` | ~400 (demo) | Approbations/rejets |
| 13 | `conventions` | ~50 (demo) | Conventions investissement/ZF/siège |
| 14 | `quotas` | ~100 | Plafonds par mesure/bénéficiaire |
| 15 | `anomalies` | ~80 (demo) | Irrégularités détectées |
| 16 | `audit_logs` | dynamique | Journal SHA-256 chaîné |
| 17 | `connecteurs` | 5 | Sydonia, SIGTAS, SIGFiP, GUDEF, E-TAX |
| 18 | `notifications` | dynamique | In-app / email / SMS |
| 19 | `roles_permissions` | ~40 | Matrice RBAC (OASE-8) |

**Total : 19 tables, 22 enums**

---

## 2. Diagramme entité-relation (simplifié)

```
institutions ──< utilisateurs
                      │
                      ├── décisions
                      ├── étapes_workflow (acteur)
                      ├── anomalies (créée_par)
                      ├── pièces_jointes (validée_par)
                      └── notifications

accords_siege ──< bénéficiaires ──< demandes ──< pièces_jointes
                      │                │
                      │                ├── étapes_workflow
                      │                ├── décisions
                      │                ├── anomalies
                      │                └── notifications
                      │
                      └──< conventions ──< demandes
                                │
                                └── anomalies

bases_juridiques ──< codes_additionnels
         │
         ├──< demandes
         ├──< conventions
         ├──< quotas
         └──< anomalies
```

---

## 3. Points clés de conception

### 3.1 SCD Type 2 sur `bases_juridiques`

Chaque modification d'une mesure MRD crée une **nouvelle ligne** plutôt que d'écraser l'existante :

```sql
-- Versionner une mesure
UPDATE bases_juridiques SET valid_to = NOW() WHERE id = :old_id;
INSERT INTO bases_juridiques (..., version, valid_from) 
  VALUES (..., :old_version + 1, NOW());
```

La vue active est toujours : `WHERE est_active = true AND valid_to IS NULL`

Les demandes existantes **conservent leur FK vers l'ancienne version** — pas de rétroactivité.

### 3.2 Audit log — hash chaîné

```typescript
// audit.service.ts
async createEntry(payload: CreateAuditDto): Promise<void> {
  const last = await this.prisma.auditLog.findFirst({
    orderBy: { horodatage: 'desc' },
    select: { empreinte_sha256: true },
  });

  const data = JSON.stringify({ ...payload, hash_precedent: last?.empreinte_sha256 });
  const empreinte = createHash('sha256').update(data).digest('hex');

  await this.prisma.auditLog.create({
    data: { ...payload, hash_precedent: last?.empreinte_sha256, empreinte_sha256: empreinte },
  });
}
```

### 3.3 `config_auth` connecteurs — chiffrement AES-256

```typescript
// storage dans connecteurs.config_auth (Json)
const encrypted = {
  iv: randomBytes(16).toString('hex'),
  data: aes256gcm.encrypt(JSON.stringify({ client_id, client_secret, token_url })),
};
```

### 3.4 Référence demande — format `OASE-YYYY-NNNNNN`

```typescript
// reference.service.ts
async generate(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.prisma.demande.count({
    where: { reference: { startsWith: `OASE-${year}-` } },
  });
  return `OASE-${year}-${String(count + 1).padStart(6, '0')}`;
}
```

---

## 4. Index critiques

| Table | Index | Justification |
|---|---|---|
| `demandes` | `(statut)` | Filtrage principal toutes vues |
| `demandes` | `(beneficiaire_id)` | RLS P1 |
| `demandes` | `(instructeur_id)` | RLS P2 |
| `demandes` | `(base_juridique_id)` | JOIN fréquent |
| `bases_juridiques` | `(type_texte_1)` | Routage workflow |
| `bases_juridiques` | `(organe_gestion)` | RLS agents |
| `bases_juridiques` | `(est_active, valid_to)` | Vue active SCD T2 |
| `audit_logs` | `(entite, entite_id)` | Recherche par ressource |
| `audit_logs` | `(horodatage)` | Tri chronologique |
| `notifications` | `(utilisateur_id, est_lue)` | Badge non-lues |
| `codes_additionnels` | `(code, source)` | Lookup Sydonia/E-TAX |
| `refresh_tokens` | `(token_hash)` | Validation refresh |

---

## 5. Vues matérialisées recommandées (Open Data)

```sql
-- Vue agrégée publique (rafraîchie quotidiennement)
CREATE MATERIALIZED VIEW vue_opendata_stats AS
SELECT
  EXTRACT(YEAR FROM d.date_depot)   AS annee,
  bj.type_texte_1                   AS type_texte,
  bj.impot_concerne                 AS impot,
  bj.nature_mesure                  AS nature,
  COUNT(d.id)                       AS nb_demandes,
  COUNT(d.id) FILTER (WHERE d.statut = 'approuve') AS nb_approuvees,
  SUM(d.montant_fcfa) FILTER (WHERE d.statut = 'approuve') AS montant_total_fcfa,
  b.type_beneficiaire               AS type_beneficiaire
FROM demandes d
  JOIN bases_juridiques bj ON bj.id = d.base_juridique_id
  JOIN beneficiaires b     ON b.id  = d.beneficiaire_id
WHERE d.statut NOT IN ('brouillon', 'archive')
GROUP BY 1, 2, 3, 4, 8;

-- Rafraîchissement nocturne
REFRESH MATERIALIZED VIEW CONCURRENTLY vue_opendata_stats;
```

---

## 6. Migrations à prévoir

| Migration | Contenu |
|---|---|
| `001_initial_schema` | Toutes les tables + enums |
| `002_workflow_templates_seed` | 6 templates JSON |
| `003_institutions_seed` | ~15 institutions |
| `004_mrd_import` | 1 316 mesures MRD (script séparé) |
| `005_roles_permissions_seed` | Matrice RBAC OASE-8 |
| `006_connecteurs_seed` | 5 connecteurs (config vide) |
| `007_opendata_views` | Vues matérialisées + CRON refresh |

---

## 7. Compatibilité MySQL (cPanel demo)

Prisma génère du SQL compatible MySQL 8 avec `provider = "mysql"`.  
Seuls ajustements nécessaires :
- `@db.Uuid` → `@db.VarChar(36)` (MySQL n'a pas de type UUID natif)
- `Json` → `@db.Json` (MySQL 5.7+ supporté)
- Vues matérialisées → **non supportées MySQL** → remplacer par requêtes directes avec cache Redis

```prisma
// .env cPanel
DATABASE_URL="mysql://oase_user:PASSWORD@localhost:3306/oase_demo"

// schema.prisma — switch provider
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

---

*Livrable OASE-11 — Schema Prisma complet.*  
*Fichier prêt à l'emploi : `docs/backend/schema.prisma`*  
*Alimente OASE-12 (seeds de démonstration) et OASE-14→18 (API contracts).*
