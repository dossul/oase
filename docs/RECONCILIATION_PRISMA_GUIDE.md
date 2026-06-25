# OASE — Guide de Réconciliation Prisma v3.3

> **Objectif :** Transformer le MLD MySQL 85 tables en schema Prisma opérationnel  
> **Date :** 17 juin 2026  
> **Verrou :** 🔴 Critique — bloque toute implémentation NestJS

---

## Résumé Exécutif

| Élément | État | Action requise |
|---------|------|----------------|
| Base MySQL `oase` | ✅ 85 tables, 15 rôles, SCD2 auditée | Aucune |
| `schema.prisma` actuel | ❌ 19 modèles, cible PostgreSQL | **Régénérer** |
| Script réconciliation | ✅ Créé | À exécuter |
| Tâches Plane | ✅ Exportées | À importer sur ulia.site |

---

## Méthode Recommandée : Introspection Automatique

### Étape 1 — Préparer l'environnement

```bash
cd c:\wamp64\www\oase\oase-api

# Vérifier que Prisma est installé
npx prisma --version
# Attendu : prisma 5.x

# Configurer la connexion MySQL
echo DATABASE_URL="mysql://root:@localhost:3306/oase" > .env
```

### Étape 2 — Introspection (commande unique)

```bash
npx prisma db pull
```

**Résultat attendu :**
- Génération automatique de `prisma/schema.prisma` avec 85 modèles
- Types MySQL mappés automatiquement (`VARCHAR` → `String @db.VarChar()`)
- Index et FK détectés

### Étape 3 — Vérification

```bash
# Valider le schema
npx prisma validate

# Générer le client typé
npx prisma generate

# Vérifier le nombre de modèles
findstr /C:"model " prisma\schema.prisma | find /C "model "
# Attendu : 85
```

### Étape 4 — (Optionnel) Studio Prisma

```bash
npx prisma studio
# Ouvre http://localhost:5555 pour visualiser les 85 tables
```

---

## Post-Introspection : Nettoyage Manuel Requis

L'introspection génère des noms bruts. Actions de refactoring :

| Pattern | Exemple Brut | Exemple Propre |
|---------|-------------|----------------|
| Nom table | `ref_roles` | `RefRole` avec `@@map("ref_roles")` |
| Relation | `user_id Int @db.Int` | `userId Int @map("user_id")` |
| Enum Prisma | Tables ref_* | Enums TypeScript générés |

---

## Livrables Produits

| Fichier | Usage |
|---------|-------|
| `@c:&#65372;wamp64&#65372;www&#65372;oase&#65372;scripts&#65372;reconcile-prisma.bat` | Script Windows pour exécuter toute la réconciliation en une fois |
| `@c:&#65372;wamp64&#65372;www&#65372;oase&#65372;docs&#65372;PLANE_IMPORT_OASE_A.json` | Import JSON pour créer les 6 issues Plane automatiquement |
| `@c:&#65372;wamp64&#65372;www&#65372;oase&#65372;docs&#65372;PLANE_ISSUES_EXPORT.md` | Version markdown des tâches (si import JSON indisponible) |

---

## Import sur Plane (ulia.site)

### Option A : Import JSON (si Plane le supporte)
1. Aller sur Plane → Projet OASE → Import
2. Sélectionner `PLANE_IMPORT_OASE_A.json`
3. Mapper les champs → Créer l'épopée "Phase A — Réconciliation"

### Option B : Manuel
Créer l'épopée puis 6 issues avec les titres :
- `A.1 — Introspection Prisma depuis MySQL oase v3.3` (Urgent, 4h)
- `A.2 — Nettoyage conventions de nommage` (Urgent, 8h)
- `A.3 — Generation enums TypeScript depuis ref_*` (High, 4h)
- `A.4 — Baseline migration 001_init_v33` (High, 2h)
- `A.5 — Seed demo aligne sur v3.3 (15 roles, MRD)` (High, 8h)
- `A.6 — Tests d'integrite post-reconciliation` (High, 4h)

---

## Critère de Succès

✅ **Réconciliation terminée quand :**
1. `npx prisma validate` = 0 erreur
2. 85 modèles dans `schema.prisma`
3. `prisma db seed` peuple toutes les tables
4. Test CRUD réussi sur `Demande`, `Utilisateur`, `Workflow`, `Quota`, `AuditLog`

---

## Prochaine Phase (B — Scaffolding)

Une fois A.6 validé :
- Installer NestJS : `nest new oase-api --strict`
- Créer `PrismaModule` global
- Intégrer les `impl/` existants (Auth, Audit, Connecteurs)

*Voir `PLAN_SUITE_DETAILLE.md` pour les phases B→G.*

---

*Guide créé le 17 juin 2026 — OASE v3.3*
