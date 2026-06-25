# OASE — Issues Plane pour la Réconciliation Prisma (Phase A)

> **Projet :** OASE  
> **Épopée :** Phase A — Réconciliation Modèle de Données  
> **Date :** 17 juin 2026  
> **État :** À importer dans Plane (ulia.site)

---

## ÉPOPÉE A : Réconciliation Prisma ↔ MySQL v3.3

**Description :**  
Le schema.prisma actuel contient 19 modèles et cible PostgreSQL. Le MLD réel v3.3 contient 85 tables MySQL avec SCD2, audit inaltérable, 15 rôles. Cette épopée vise à réconcilier Prisma avec la base de données réelle.

**Critère de sortie :**  
`prisma migrate reset && prisma db seed` recrée la base v3.3 à l'identique, `prisma generate` sans erreur.

---

### Issue A.1 — Introspection Prisma initiale
| Champ | Valeur |
|-------|--------|
| **Titre** | Introspection Prisma : générer schema.prisma depuis MySQL oase v3.3 |
| **Type** | Feature |
| **Priorité** | 🔴 Urgente |
| **Assigné** | Tech Lead Backend |
| **Estimation** | 4h |
| **État** | Todo |

**Description détaillée :**
1. Configurer `DATABASE_URL="mysql://root:@localhost:3306/oase"` dans `.env`
2. Changer `provider = "mysql"` dans `schema.prisma`
3. Exécuter `npx prisma db pull` pour introspecter les 85 tables
4. Vérifier que tous les modèles sont générés (compteur : 85 modèles)
5. Si erreurs de nommage, documenter et passer à A.2

**Critère d'acceptation :**
- [ ] Fichier `prisma/schema.prisma` contient 85 modèles `@model`
- [ ] `npx prisma validate` retourne 0 erreur

---

### Issue A.2 — Nettoyage et conventions de nommage
| Champ | Valeur |
|-------|--------|
| **Titre** | Nettoyage schema.prisma : PascalCase, @map, relations explicites |
| **Type** | Refactor |
| **Priorité** | 🔴 Urgente |
| **Assigné** | Tech Lead Backend |
| **Estimation** | 8h |
| **État** | Todo |

**Description détaillée :**
1. Renommer tous les modèles en PascalCase (ex: `ref_roles` → `RefRole`)
2. Ajouter `@@map("original_table_name")` pour préserver les noms SQL
3. Vérifier les relations `@relation` avec clés étrangères explicites
4. Corriger les types MySQL → Prisma (`DATETIME(3)` → `DateTime @db.DateTime(3)`)
5. Ajouter les index `@index` et `@unique` reflétant le MLD

**Critère d'acceptation :**
- [ ] Tous les modèles en PascalCase avec `@@map`
- [ ] Relations explicites sur toutes les FK
- [ ] `prisma validate` OK

---

### Issue A.3 — Génération des enums TypeScript
| Champ | Valeur |
|-------|--------|
| **Titre** | Générer enums TypeScript depuis les tables ref_* |
| **Type** | Feature |
| **Priorité** | 🟠 Haute |
| **Assigné** | Backend Dev |
| **Estimation** | 4h |
| **État** | Todo |

**Description détaillée :**
Les 38 tables `ref_*` (statuts, types, natures) doivent générer des enums TypeScript pour le typage fort.

1. Créer script `scripts/generate-enums.ts`
2. Lire les tables `ref_*` et générer des enums Prisma + TypeScript
3. Enums à générer : `StatutDemande`, `StatutEtape`, `NatureMesure`, `TypeTexte`, `Role`, etc.
4. Intégrer au build (npm run generate-enums)

**Critère d'acceptation :**
- [ ] Fichier `src/common/enums/generated.ts` avec tous les enums
- [ ] Import automatique dans les DTOs

---

### Issue A.4 — Baseline migration Prisma
| Champ | Valeur |
|-------|--------|
| **Titre** | Créer baseline migration 001_init_v33 |
| **Type** | Feature |
| **Priorité** | 🟠 Haute |
| **Assigné** | Tech Lead Backend |
| **Estimation** | 2h |
| **État** | Todo |

**Description détaillée :**
1. `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > 001_init_v33.sql`
2. Créer `prisma/migrations/001_init_v33/migration.sql`
3. Marquer comme résolu : `npx prisma migrate resolve --applied 001_init_v33`

**Critère d'acceptation :**
- [ ] Migration 001_init_v33 créée
- [ ] `prisma migrate status` montre 1 migration appliquée

---

### Issue A.5 — Seed démo aligné sur v3.3
| Champ | Valeur |
|-------|--------|
| **Titre** | Mettre à jour seed.ts avec 15 rôles et données complètes |
| **Type** | Feature |
| **Priorité** | 🟠 Haute |
| **Assigné** | Backend Dev |
| **Estimation** | 8h |
| **État** | Todo |

**Description détaillée :**
Mettre à jour `prisma/seed.ts` pour inclure :
1. 15 rôles canoniques (`ref_roles`)
2. 10 institutions types
3. 38 tables de référence complètes
4. 5 bases juridiques avec versions SCD2
5. 3 bénéficiaires, 5 demandes démo
6. Médiathèque (`base_juridique_documents`)

**Critère d'acceptation :**
- [ ] `npx prisma db seed` exécute sans erreur
- [ ] 85 tables peuplées avec données cohérentes

---

### Issue A.6 — Tests d'intégrité post-réconciliation
| Champ | Valeur |
|-------|--------|
| **Titre** | Vérifier intégrité Prisma vs MySQL après réconciliation |
| **Type** | Testing |
| **Priorité** | 🟠 Haute |
| **Assigné** | QA / Backend Dev |
| **Estimation** | 4h |
| **État** | Todo |

**Description détaillée :**
1. Script de vérification : compte modèles Prisma vs tables MySQL
2. Vérifier les relations : chaque FK Prisma a une contrainte MySQL
3. Test CRUD sur 5 modèles critiques (Demande, Utilisateur, Workflow, Quota, Audit)
4. Vérifier SCD2 : garde unicité version active

**Critère d'acceptation :**
- [ ] 85 modèles Prisma ↔ 85 tables MySQL
- [ ] Tests CRUD passent sur les 5 modèles critiques
- [ ] Audit `verifyChain()` = 0 rupture après seed

---

## ÉPOPÉE B : Scaffolding NestJS (Suite)

### Issue B.1 — NestJS project setup
| Champ | Valeur |
|-------|--------|
| **Titre** | Scaffolding NestJS : modules, config, CI |
| **Type** | Feature |
| **Priorité** | 🔴 Urgente |
| **Assigné** | Tech Lead Backend |
| **Estimation** | 3j |
| **Dépendance** | A.6 (réconciliation terminée) |

---

### Issue B.2 — PrismaModule global
| Champ | Valeur |
|-------|--------|
| **Titre** | PrismaModule global avec PrismaService |
| **Type** | Feature |
| **Priorité** | 🔴 Urgente |
| **Assigné** | Backend Dev |
| **Estimation** | 1j |
| **Dépendance** | A.6 |

---

## Lien avec le Plan Détaillé

Voir `docs/PLAN_SUITE_DETAILLE.md` pour le contexte complet des phases A→G.

---

*Export pour Plane — à copier-coller ou importer via API Plane.*
