# Audit Expert du MLD OASE v3.1 — Notation & Amendements

**Auditeur :** Expert Base de Données / Développeur Backend  
**Date :** 17 juin 2026  
**Périmètre audité :** Base `oase` / `oase_v3` (MySQL 9.1.0)  
**Méthode :** Inspection factuelle via `information_schema` + revue du DDL complet  

---

## Note Globale : **82 / 100** — *Solide base professionnelle, amendements requis pour grade "entreprise"*

| Critère | Poids | Note | Commentaire |
|---------|-------|------|-------------|
| **Normalisation & 3NF** | 20 | 15/20 | Excellente externalisation des enums, mais quelques dénormalisations à risque de dérive |
| **Intégrité référentielle** | 20 | 16/20 | 120 FK, 6 CHECK — mais 3 colonnes "code" sans FK |
| **Indexation & performance** | 15 | 13/15 | Index composites pertinents, manque FULLTEXT pour recherche |
| **Sécurité & audit** | 15 | 13/15 | Audit append-only excellent, chaînage hash non vérifié en base |
| **Versionning SCD2 & Workflow** | 15 | 11/15 | SCD2 correct mais **aucune garantie d'unicité de version active** (CRITIQUE) |
| **Scalabilité production** | 15 | 14/15 | Bon, manque partitionnement des tables de logs |

---

## 1. Points Forts (à conserver)

1. **SCD Type 2 réel** — Séparation `bases_juridiques` (stable) / `base_juridique_versions` (versions) bien conçue.
2. **Workflow BPM relationnel** — Remplacement du JSON opaque par 5 tables normalisées : exemplaire.
3. **Audit inaltérable** — Triggers `BEFORE UPDATE/DELETE` + chaînage SHA-256 : conforme aux exigences légales.
4. **Externalisation des enums** — 38 tables `ref_*` avec `code/libelle/ordre/couleur/est_actif` : maintenable et i18n-ready.
5. **Cohérence technique** — 100 % InnoDB, `utf8mb4_unicode_ci`, UUID, `DATETIME(3)` précision milliseconde.
6. **CHECK constraints** — Dates (`date_fin > date_debut`), montants positifs, seuils 0-100.
7. **Historisation** — `quota_mouvements` (solde avant/après), `beneficiaire_historique_fiscal`.

---

## 2. Anomalies Détectées & Amendements

### 🔴 CRITIQUE

#### A1. Aucune garantie d'unicité de la version active (SCD2)
**Problème :** Rien n'empêche deux lignes `base_juridique_versions` avec `valid_to IS NULL AND est_active=1` pour la même mesure. C'est la faille classique du SCD2 : corruption silencieuse du référentiel légal.

**Vérifié :** `generation_expression` absente, aucun index d'unicité partielle.

**Amendement :**
```sql
ALTER TABLE base_juridique_versions
  ADD COLUMN version_courante_flag TINYINT
    GENERATED ALWAYS AS (IF(valid_to IS NULL AND est_active = 1, 1, NULL)) STORED,
  ADD UNIQUE KEY uk_une_seule_version_active (base_juridique_id, version_courante_flag);
```
→ Garantit **une seule version courante** par mesure (MySQL autorise plusieurs NULL, mais `1` est unique par `base_juridique_id`).

---

### 🟠 MAJEUR

#### A2. `utilisateurs.role` en VARCHAR libre, sans table `ref_roles`
**Problème :** Le rôle pilote tout le RBAC mais reste du texte libre. Une faute de frappe (`decideur` vs `décideur`) casse les permissions silencieusement. `roles_permissions.role` souffre du même défaut.

**Vérifié :** `ref_roles` n'existe pas. Rôles réels : `admin_si`, `agent_agence`, `agent_ci`, `auditeur`, `beneficiaire`, `decideur`.

**Amendement :**
```sql
CREATE TABLE ref_roles (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  ordre INT NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT NULL,
  est_actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ref_roles (code, libelle, ordre) VALUES
  ('admin_si','Administrateur SI',1),
  ('agent_ci','Agent Cellule Instruction',2),
  ('agent_agence','Agent Agence',3),
  ('decideur','Décideur',4),
  ('auditeur','Auditeur',5),
  ('beneficiaire','Bénéficiaire',6);

ALTER TABLE utilisateurs       ADD CONSTRAINT fk_utilisateurs_role  FOREIGN KEY (role) REFERENCES ref_roles(code) ON DELETE RESTRICT;
ALTER TABLE roles_permissions  ADD CONSTRAINT fk_rolesperm_role     FOREIGN KEY (role) REFERENCES ref_roles(code) ON DELETE CASCADE;
```

#### A3. `anomalies.regle_id` sans clé étrangère
**Problème :** `regle_id VARCHAR(100)` pointe logiquement vers `regles_anomalie.code` mais aucune FK. Risque d'anomalies orphelines référençant une règle inexistante.

**Vérifié :** 0 FK sur `anomalies.regle_id`.

**Amendement :**
```sql
ALTER TABLE anomalies
  ADD CONSTRAINT fk_anomalies_regle FOREIGN KEY (regle_id)
  REFERENCES regles_anomalie(code) ON DELETE SET NULL;
```
*(Prérequis : `regles_anomalie.code` est déjà UNIQUE — OK.)*

#### A4. Dérive de dénormalisation sur `demandes`
**Problème :** `demandes.etape_actuelle` (VARCHAR), `quota_consomme`, `quota_total` dupliquent des données qui font autorité ailleurs (`demande_workflow_etapes`, `quotas`). Source classique d'incohérence.

**Amendement (recommandation) :**
- Conserver ces colonnes **uniquement comme cache de lecture**, alimenté par l'application/trigger.
- Documenter explicitement qu'elles ne font PAS autorité.
- Alternative : les exposer via une vue `v_demande_etat_courant` et les retirer de la table.

---

### 🟡 MINEUR

#### A5. `demande_workflow_instances.statut_code` réutilise `ref_statuts_etape`
Le statut d'une **instance** (en_cours / terminé / annulé) n'est pas du même domaine qu'un statut d'**étape** (en_attente / validé / rejeté). Réutiliser la même table ref mélange deux vocabulaires.
**Amendement :** créer `ref_statuts_workflow` dédié.

#### A6. `beneficiaire_historique_fiscal.connecteur_code` sans FK
Devrait référencer `connecteurs.code_systeme`.

#### A7. `pieces_jointes.categorie` en texte libre
Devrait être une FK vers une table `ref_categories_piece` pour cohérence du classement documentaire.

#### A8. Sémantique monétaire ambiguë
La convention annonce « BIGINT centimes FCFA » mais les colonnes se nomment `montant_fcfa`. Risque d'erreur ×100. **Amendement :** trancher (unité = FCFA entier, le FCFA n'ayant pas de subdivision courante) et le documenter dans chaque commentaire de colonne.

#### A9. `connecteurs.config_auth JSON NOT NULL` pour données chiffrées
Un blob chiffré AES n'est pas du JSON valide. Utiliser `TEXT`/`VARBINARY` ou stocker `{ "cipher": "...", "iv": "..." }`.

#### A10. Soft-delete incohérent
Seule `demandes` possède `deleted_at`. Définir une politique globale (soft-delete partout ou nulle part).

#### A11. Absence de FULLTEXT pour la recherche
Aucun index `FULLTEXT`. Pour la recherche bénéficiaires/mesures :
```sql
ALTER TABLE beneficiaires ADD FULLTEXT INDEX ft_beneficiaires (raison_sociale);
ALTER TABLE base_juridique_versions ADD FULLTEXT INDEX ft_bjv_libelle (libelle);
```

#### A12. Partitionnement des tables de logs (scalabilité)
`audit_logs`, `system_logs`, `connecteur_logs` croissent indéfiniment. Prévoir un partitionnement `BY RANGE` sur l'année pour la production :
```sql
-- Exemple (à appliquer en prod, nécessite que la PK inclue la colonne de partition)
-- PARTITION BY RANGE (YEAR(created_at)) (...)
```

---

## 3. Synthèse des Amendements par Priorité

| # | Sévérité | Amendement | Impact | Appliqué |
|---|----------|------------|--------|----------|
| A1 | 🔴 Critique | Unicité version active SCD2 | Intégrité référentiel légal | ✅ |
| A2 | 🟠 Majeur | Table `ref_roles` + FK | Sécurité RBAC | ✅ |
| A3 | 🟠 Majeur | FK `anomalies.regle_id` | Intégrité | ✅ |
| A6 | 🟡 Mineur | FK `connecteur_code` | Intégrité | ✅ |
| A11 | 🟡 Mineur | Index FULLTEXT recherche | Performance | ✅ |
| A4 | 🟠 Majeur | Doc dénormalisation cache | Cohérence | 📋 Documenté |
| A5 | 🟡 Mineur | `ref_statuts_workflow` | Clarté domaine | 📋 Backlog |
| A7 | 🟡 Mineur | `ref_categories_piece` | Cohérence | 📋 Backlog |
| A8 | 🟡 Mineur | Sémantique monétaire | Qualité | 📋 Doc |
| A9 | 🟡 Mineur | `config_auth` non-JSON | Design | 📋 Backlog |
| A10 | 🟡 Mineur | Politique soft-delete | Cohérence | 📋 Backlog |
| A12 | 🟡 Mineur | Partitionnement logs | Scalabilité | 📋 Prod |

**Légende :** ✅ appliqué dans `99_amendments_v3.1.sql` — 📋 recommandation documentée.

---

## 4. Note Après Amendements Appliqués : **90 / 100**

Les amendements A1, A2, A3, A6, A11 portent la base à un niveau **production-ready**. Les éléments restants (📋) sont des optimisations de raffinement à planifier dans le backlog, sans bloquer la mise en service.

| Critère | Avant | Après |
|---------|-------|-------|
| Normalisation & 3NF | 15/20 | 17/20 |
| Intégrité référentielle | 16/20 | 19/20 |
| Indexation & performance | 13/15 | 14/15 |
| Sécurité & audit | 13/15 | 14/15 |
| Versionning SCD2 & Workflow | 11/15 | 14/15 |
| Scalabilité production | 14/15 | 14/15 |
| **TOTAL** | **82/100** | **92/100** |

---

**Fichier d'amendements :** `oase_99_amendments_v3.1.sql`  
**Bases mises à jour :** `oase`, `oase_v3`  
**Dump régénéré :** `oase_v3.2_dump_2026-06-17.sql`
