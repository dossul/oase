# Analyse Complète du MLD OASE v3

**Date :** 17 juin 2026  
**Version :** 3.2 (MySQL 8/9)  
**Objets :** 85 tables + 4 vues + 2 triggers + 2 index FULLTEXT  
**Dump :** `oase_v3.2_dump_2026-06-17.sql` (188 Ko)  
**Documents liés :** `AUDIT_MLD_V3_EXPERT.md` (audit schéma 92/100), `AUDIT_DOC_ANALYSE.md` (audit doc 89/100)  

> **Historique des versions**
> - v3.0 : 83 tables + 4 vues (version initiale)
> - v3.1 : +`base_juridique_documents` (médiathèque bases juridiques) → 84 tables
> - v3.2 : +`ref_roles`, garde d'unicité version active SCD2, 4 FK supplémentaires, 2 index FULLTEXT → 85 tables

---

## 1. Architecture Générale

### 1.1 Familles de Tables

| Domaine | Tables | Description |
|---------|--------|-------------|
| **Référence (CRUD)** | 38 tables `ref_*` | Remplacent tous les ENUMs (types institution, statuts, natures mesure, etc.) |
| **Identité & Sécurité** | 6 tables | Utilisateurs, sessions, tokens, permissions, authentification MFA |
| **Référentiel Métier** | 6 tables | Institutions, accords siège, bases juridiques SCD Type 2, codes additionnels |
| **Bénéficiaires** | 5 tables | Bénéficiaires, conventions, agréments, engagements, historique fiscal |
| **Demandes** | 4 tables | Demandes, pièces jointes, compléments, workflow BPM |
| **Workflow BPM** | 4 tables | Templates, étapes, transitions, instances, étapes d'instances |
| **Décisions & Actes** | 2 tables | Décisions, actes administratifs avec QR code |
| **Quotas** | 2 tables | Quotas et historisation des mouvements |
| **Anomalies** | 2 tables | Anomalies détectées et règles de détection |
| **Connecteurs SI** | 3 tables | Connecteurs, logs de sync, sync externe des demandes |
| **Notifications** | 4 tables | Templates, préférences, file d'attente, notifications envoyées |
| **Audit** | 1 table | Logs inaltérables avec chaînage SHA-256 |
| **Reporting** | 3 tables | Agrégats, exécutions de rapports, publications Open Data |
| **Admin Système** | 5 tables | Paramètres, imports MRD, archivage, logs système, job queue |
| **Mobile** | 1 table | Tokens push notification |

---

## 2. Analyse Détaillée par Domaine

### 2.1 Tables de Référence (38 tables) — Tous les ENUMs remplacés

**Liste complète :**
- `ref_types_institution` (13 valeurs : OTR, DGBF, DGTCP...)
- `ref_statuts_utilisateur` (actif, inactif, suspendu)
- `ref_types_beneficiaire` (entreprise privée, ONG, institution diplomatique...)
- `ref_statuts_fiscal` (conforme, dette active, inconnu)
- `ref_natures_mesure` (exonération, exemption, abattement, crédit impôt...)
- `ref_portees_categorie` (permanente, temporaire déterminée...)
- `ref_modes_instruction` (automatique, semi-auto, manuel)
- `ref_organes_gestion` (CI, CDDI, OTR...)
- `ref_statuts_demande` (8 statuts : brouillon → soumis → en instruction → approuvé/rejeté)
- `ref_statuts_etape` (en attente, en cours, validée, rejetée)
- `ref_statuts_convention` (active, suspendue, résiliée)
- `ref_statuts_anomalie` (nouvelle, en examen, traitée, classée)
- `ref_statuts_connecteur` (actif, erreur, maintenance)
- `ref_rangs_piece` (rang 1 obligatoire, rang 2 facultatif)
- `ref_types_quota` (global, par bénéficiaire, par convention, annuel)
- `ref_unites_quota` (FCFA, quantité physique, nombre d'opérations)
- `ref_categories_anomalie` (juridique, financière, temporelle, procédurale)
- `ref_gravites_anomalie` (critique, élevée, moyenne, faible)
- `ref_sources_detection` (moteur de règles, auditeur, connecteur SI)
- `ref_types_decision` (approbation, rejet, demande complément)
- `ref_regimes_convention` (ZFI, ZES, Code Investissements...)
- `ref_canaux_notification` (in-app, email, SMS)
- `ref_types_accord_siege` (ONU, UA, ambassade...)
- `ref_sources_code` (Sydonia, E-TAX, autre)
- `ref_types_acte` (attestation, arrêté, décision de rejet)
- `ref_types_mouvement_quota` (consommation, libération, ajustement, report)
- `ref_statuts_notification` (pending, sent, failed, read)
- `ref_types_notification` (soumission, instruction, complément, approbation...)
- `ref_etats_job` (pending, running, completed, failed, cancelled)
- `ref_types_job` (import MRD, archivage, sync connecteur...)
- `ref_statuts_archivage` (en attente, archivé, erreur)
- `ref_types_rapport` (exécutif, fiscal, contrôle, agence, Open Data)
- `ref_types_document` (NIF, RCCM, statuts, business plan...)
- `ref_types_parametre` (général, sécurité, notification, archivage...)
- `ref_canaux_push` (FCM, APNS, Web Push)
- `ref_types_agrement` (fiscal, investissement, ZFI, minier...)

**Conception :** Chaque table a `code` (PK), `libelle`, `description`, `ordre`, `couleur`, `est_actif`, `created_at`.

---

### 2.2 SCD Type 2 — Bases Juridiques Versionnées

**Tables concernées :**
1. `bases_juridiques` — Entité stable (id, code_mesure UNIQUE, code_mesure_mrd)
2. `base_juridique_versions` — Versionnage SCD Type 2 complet
3. `codes_additionnels` — Codes liés à une version spécifique

**Structure SCD Type 2 dans `base_juridique_versions` :**
```sql
- base_juridique_id (FK vers l'entité stable)
- version (INT, incrémenté à chaque modification)
- valid_from (DATETIME) — Début de validité
- valid_to (DATETIME, NULL = version courante) — Fin de validité
- est_active (TINYINT) — Flag actif/inactif
- UNIQUE(base_juridique_id, version)
```

**Vue métier :** `v_bases_juridiques_actives` — Sélectionne toutes les versions où `est_active=1 AND valid_to IS NULL`

**Conception :**
- Les demandes stockent `base_juridique_version_id` (pas `base_juridique_id`)
- Aucune rétroactivité : une demande conserve toujours la version en vigueur au moment du dépôt
- Historique complet conservé pour audit légal

---

### 2.3 Gestion des Médias — Pièces Jointes

**Table :** `pieces_jointes`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | CHAR(36) PK | UUID |
| `demande_id` | CHAR(36) FK | Lien vers la demande |
| `nom_fichier` | VARCHAR(300) | Nom original |
| `type_mime` | VARCHAR(100) | Type MIME (application/pdf, image/jpeg...) |
| `taille_octets` | BIGINT | Taille fichier |
| `rang_code` | VARCHAR(50) FK | `ref_rangs_piece` : rang 1 (obligatoire) ou rang 2 (facultatif) |
| `categorie` | VARCHAR(100) | Catégorie fonctionnelle |
| `type_document_code` | VARCHAR(50) FK | `ref_types_document` : NIF, RCCM, statuts, convention... |
| `url_stockage` | VARCHAR(500) | URL/Path de stockage (S3/minio local) |
| `hash_sha256` | CHAR(64) | Empreinte SHA-256 du fichier (intégrité) |
| `est_valide` | TINYINT(1) NULL | Validation par agent (NULL = en attente) |
| `valide_par_id` | CHAR(36) FK | Agent ayant validé |
| `date_validation` | DATETIME | Date de validation |
| `commentaire_validation` | TEXT | Commentaire sur la validation |

**✅ MÉDIATHÈQUE LIVRÉE (v3.1) :** La médiathèque des bases juridiques est désormais gérée par la table `base_juridique_documents` (documents légaux : lois, décrets, circulaires, arrêtés, notes de service). Champs clés : `type_document`, `reference_document`, `date_document`, `url_stockage`, `hash_sha256`, `est_texte_fondateur`, `est_public`, FK vers `base_juridique_versions` et `utilisateurs`.

**Médias couverts dans le système :**
- **Pièces jointes des demandes** (contribuables) → `pieces_jointes`
- **Médiathèque des bases juridiques** (textes légaux) → `base_juridique_documents`

---

### 2.4 Tracking des Demandes et Changements de Statut

#### 2.4.1 Workflow BPM Normalisé (remplace le JSON opaque v2)

**Tables du workflow :**
1. `workflow_templates` — Modèles de workflow par type de texte/organe
2. `workflow_template_etapes` — Définition des étapes d'un template
3. `workflow_template_transitions` — Transitions possibles entre étapes
4. `demande_workflow_instances` — Instance de workflow créée à la soumission
5. `demande_workflow_etapes` — Étapes réelles de l'instance avec statut

**Structure `demande_workflow_instances` :**
```sql
- demande_id (FK, UNIQUE) — Une seule instance par demande
- workflow_template_id (FK)
- statut_code (en_cours, termine, annule)
- date_debut, date_fin
```

**Structure `demande_workflow_etapes` :**
```sql
- instance_id (FK)
- template_etape_id (FK)
- nom_etape, ordre
- acteur_role, acteur_id (FK vers utilisateur)
- statut_code (en_attente, en_cours, valide, rejete, annule)
- date_debut, date_fin — Tracking temporel réel
- delai_cible_jours
- commentaire
- pin_signe (signature électronique par PIN)
- decision_prise
```

#### 2.4.2 Audit Log Inaltérable — Tracking de TOUTES les Actions

**Table :** `audit_logs`

| Champ | Description |
|-------|-------------|
| `horodatage` | Timestamp précis de l'action |
| `utilisateur_id` | Qui a fait l'action |
| `role_au_moment` | Rôle de l'utilisateur à ce moment |
| `institution` | Institution de l'utilisateur |
| `action` | Type d'action (SOUMETTRE_DEMANDE, CHANGER_STATUT, VALIDER_ETAPE...) |
| `entite` | Table concernée |
| `entite_id` | ID de l'enregistrement |
| `demande_id` | Si lié à une demande |
| `ancienne_valeur` | JSON — État avant |
| `nouvelle_valeur` | JSON — État après |
| `ip`, `user_agent` | Contexte technique |
| `hash_precedent` | Chaînage SHA-256 avec ligne précédente |
| `empreinte_sha256` | Hash complet de la ligne (intégrité) |

**Triggers de protection :**
```sql
- trg_audit_logs_no_update — Interdit UPDATE
- trg_audit_logs_no_delete — Interdit DELETE
```

**⚠️ ANALYSE :** Le tracking des changements de statut est COMPLET via `audit_logs`. Chaque modification de `demandes.statut_code` doit être loggée avec `ancienne_valeur` et `nouvelle_valeur` en JSON.

#### 2.4.3 Compléments et Réclamations

**Table :** `demande_complements`

| Champ | Description |
|-------|-------------|
| `demande_id` | Demande concernée |
| `instructeur_id` | Agent demandant le complément |
| `motif` | Raison de la demande |
| `pieces_attendues` | Liste des documents manquants |
| `date_demande` | Quand le complément est demandé |
| `date_reponse` | Quand le bénéficiaire répond |
| `statut_code` | en_attente, fourni, refuse |

**Index stratégiques pour tracking :**
- `idx_demandes_statut_created` — Recherche par statut + date
- `idx_demandes_beneficiaire_statut` — Mes dashboard bénéficiaire
- `idx_decisions_demande_type` — Historique décisions par demande
- `idx_actes_demande_type` — Attestations générées

---

### 2.5 Connecteurs SI et Interopérabilité

**Tables :**
1. `connecteurs` — Configuration des connexions aux SI externes
2. `connecteur_logs` — Log de tous les appels API
3. `demande_sync_externe` — File d'attente des synchronisations

**Structure `connecteurs` :**
```sql
- code_systeme (SYDONIA, ETAX, SIGFIP...)
- endpoint (URL de l'API)
- config_auth (JSON chiffré AES-256-GCM)
- latence_ms, taux_erreur (métriques temps réel)
- dernier_sync, volume_24h
- fallback_manuel, timeout_s, failure_threshold
```

**Structure `connecteur_logs` :**
```sql
- direction (in/out)
- operation (verification_nif, check_quota...)
- payload_entrant/sortant (JSON)
- statut_http, duree_ms, est_erreur
```

---

### 2.6 Quotas et Historisation

**Table principale :** `quotas`
- Solde courant par base juridique / bénéficiaire / convention
- Alertes automatiques à 80% et 100%

**Table historique :** `quota_mouvements`
```sql
- quota_id (FK)
- demande_id (FK, nullable)
- type_mouvement_code (consommation, liberation, ajustement, report)
- montant
- solde_avant, solde_apres — Snapshot comptable
- commentaire
```

**Vue métier :** `v_alertes_quotas` — Calcule taux de consommation en temps réel avec niveau d'alerte

---

### 2.7 Décisions et Actes Administratifs

**Table :** `decisions`
```sql
- demande_id, utilisateur_id
- type_code (approbation, rejet, demande_complement)
- date_decision, motif
- document_url, hash_sha256
- pin_hash, est_signe — Signature électronique
```

**Table :** `actes`
```sql
- demande_id, decision_id
- type_code (attestation, arrete, rejet)
- reference (numéro unique d'acte)
- beneficiaire_id, montant_fcfa
- date_effet, document_url, hash_document
- qr_code_hash, qr_code_image_url — Pour vérification publique
- est_revoke, date_revocation, motif_revocation — Révocation possible
```

---

## 3. Vues Métier (4 vues)

| Vue | Usage |
|-----|-------|
| `v_bases_juridiques_actives` | Versions courantes des mesures |
| `v_demandes_en_instruction` | Dossiers en cours avec durée de traitement |
| `v_opendata_stats` | Statistiques anonymisées pour Open Data |
| `v_alertes_quotas` | Quotas dépassant le seuil d'alerte |

---

## 4. Index Stratégiques

**Index composites pour performance :**
- `idx_demandes_statut_created` — Back-office filtrage
- `idx_demandes_beneficiaire_statut` — Portail bénéficiaire
- `idx_pieces_jointes_demande_rang` — Validation par rang
- `idx_decisions_demande_type` — Historique décisions
- `idx_actes_demande_type` — Attestations
- `idx_quota_mouvements_quota_date` — Historique consommation
- `idx_workflow_template_etapes_template_ordre` — Ordre des étapes
- `idx_demande_workflow_etapes_instance_ordre` — Progression workflow
- `idx_audit_logs_action_entite` — Recherche d'audit

---

## 5. Vérification des Exigences

### 5.1 ✅ Couvert (Présent dans MLD v3)

| Exigence | Tables | Statut |
|----------|--------|--------|
| SCD Type 2 bases juridiques | `bases_juridiques`, `base_juridique_versions` | ✅ OK |
| Workflow BPM relationnel | `workflow_*`, `demande_workflow_*` | ✅ OK |
| Audit log inaltérable | `audit_logs` + triggers | ✅ OK |
| Quotas historisés | `quotas`, `quota_mouvements` | ✅ OK |
| Actes administratifs | `decisions`, `actes` | ✅ OK |
| Pièces jointes demandes | `pieces_jointes` | ✅ OK |
| Tracking changements | `audit_logs.ancienne_valeur/nouvelle_valeur` | ✅ OK |
| Notifications multi-canal | `notification_*` | ✅ OK |
| Interopérabilité SI | `connecteurs`, `connecteur_logs` | ✅ OK |
| Anomalies et règles | `anomalies`, `regles_anomalie` | ✅ OK |
| Reporting/Open Data | `reporting_*`, `opendata_publications` | ✅ OK |
| 38 tables de référence | 38 tables `ref_*` | ✅ OK |

### 5.2 ⚠️ À Compléter (Backlog résiduel)

| Exigence | Description | Priorité |
|----------|-------------|----------|
| ~~Médiathèque bases juridiques~~ | ✅ **LIVRÉE en v3.1** (`base_juridique_documents`) | Fait |
| **Historique statuts demande** | Table dédiée `demande_historique_statuts` pour reporting fin (audit_logs couvre déjà le besoin légal) | Moyenne |
| **Médias bénéficiaires permanents** | Documents hors demandes (fiches techniques, agréments précédents) | Moyenne |

### 5.3 ✅ Amendements Qualité v3.2 (voir `AUDIT_MLD_V3_EXPERT.md`)

| Amendement | Description | Sévérité |
|-----------|-------------|----------|
| **Garde unicité version active SCD2** | Colonne générée `version_courante_flag` + index unique → empêche 2 versions « courantes » pour une même mesure | 🔴 Critique |
| **Table `ref_roles` + FK** | Normalise le RBAC (`utilisateurs.role`, `roles_permissions.role`) | 🟠 Majeur |
| **FK `anomalies.regle_id`** | Intégrité vers `regles_anomalie.code` | 🟠 Majeur |
| **FK `connecteur_code`** | `beneficiaire_historique_fiscal` → `connecteurs.code_systeme` | 🟡 Mineur |
| **Index FULLTEXT** | Recherche sur `raison_sociale` et `libelle` | 🟡 Mineur |

---

## 6. Schéma Relationnel Visuel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          OASE MLD v3 — Vue d'ensemble                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  institutions   │     │ bases_juridiques │     │   beneficiaires │
│  (10 seeds)     │     │  (5 seeds)       │     │   (3 seeds)     │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │              ┌────────▼─────────┐              │
         │              │base_juridique_  │              │
         │              │versions (SCD2)   │              │
         │              │  (5 versions)    │              │
         │              └────────┬─────────┘              │
         │                       │                        │
         └───────────┬───────────┴───────────┬────────────┘
                     │                       │
         ┌───────────▼───────────┐   ┌──────▼──────────┐
         │      demandes         │   │   conventions   │
         │      (5 seeds)        │   │                 │
         └───────────┬───────────┘   └─────────────────┘
                     │
         ┌───────────▼───────────┐
         │   workflow_tracking   │
         │  demande_workflow_    │
         │  instances + etapes   │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │     audit_logs        │
         │  (inaltérable,        │
         │   chaînage SHA256)    │
         └───────────────────────┘
```

---

## 7. Conformité MRD et SCD Type 2

### 7.1 Mapping MRD vers MLD v3

| Concept MRD | Table MLD v3 | Champ |
|-------------|--------------|-------|
| Code mesure | `bases_juridiques` | `code_mesure` |
| Libellé mesure | `base_juridique_versions` | `libelle` |
| Impôt concerné | `base_juridique_versions` | `impot_concerne` |
| Nature mesure | `base_juridique_versions` → `ref_natures_mesure` | `nature_mesure_code` |
| Type texte 1 | `base_juridique_versions` | `type_texte_1` (CGI, Loi, Décret...) |
| Organe gestion | `base_juridique_versions` → `ref_organes_gestion` | `organe_gestion_code` |
| Mode instruction | `base_juridique_versions` → `ref_modes_instruction` | `mode_instruction_code` |

### 7.2 Gestion des Versions Annuelles

**Scénario :** Modification du taux d'abattement CGI 2025
1. Mise à jour MRD reçue (nouvelle ligne Excel)
2. Création nouvelle `base_juridique_versions` avec `version = version_max + 1`
3. `valid_from = NOW()`, ancienne version reçoit `valid_to = NOW()`
4. Demandes existantes conservent leur `base_juridique_version_id` (pas de rétroactivité)
5. Nouvelles demandes pointent vers la nouvelle version

---

## 8. Recommandations

### 8.1 À Implémenter Immédiatement

**1. Médiathèque des Bases Juridiques**
```sql
CREATE TABLE base_juridique_documents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  base_juridique_version_id CHAR(36) NOT NULL,
  type_document VARCHAR(50) NOT NULL, -- 'loi', 'decret', 'circulaire', 'arrete'
  reference_document VARCHAR(200), -- Référence officielle
  date_document DATE,
  nom_fichier VARCHAR(300),
  url_stockage VARCHAR(500),
  hash_sha256 CHAR(64),
  est_texte_fondateur TINYINT(1) DEFAULT 0, -- Texte fondateur de la mesure
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (base_juridique_version_id) REFERENCES base_juridique_versions(id) ON DELETE CASCADE,
  INDEX idx_base_version (base_juridique_version_id),
  INDEX idx_type_document (type_document)
) ENGINE=InnoDB;
```

**2. Table d'Historique des Statuts de Demande (optionnel mais recommandé pour reporting)**
```sql
CREATE TABLE demande_historique_statuts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  demande_id CHAR(36) NOT NULL,
  statut_avant VARCHAR(50),
  statut_apres VARCHAR(50) NOT NULL,
  utilisateur_id CHAR(36),
  motif TEXT,
  date_changement DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  INDEX idx_demande_date (demande_id, date_changement)
) ENGINE=InnoDB;
```

### 8.2 Validation du Dump

**Commande pour restaurer sur un autre serveur :**
```bash
mysql -u root -p < oase_v3_dump_2026-06-17.sql
```

**Vérification post-restauration :**
```sql
USE oase;
SELECT 'Tables', COUNT(*) FROM information_schema.tables WHERE table_schema='oase' AND table_type='BASE TABLE'
UNION ALL
SELECT 'Vues', COUNT(*) FROM information_schema.views WHERE table_schema='oase'
UNION ALL
SELECT 'Triggers', COUNT(*) FROM information_schema.triggers WHERE trigger_schema='oase';
-- Résultat attendu (v3.2) : 85 tables, 4 vues, 2 triggers
```

---

## 9. Synthèse des Fichiers

| Fichier | Description | Taille |
|---------|-------------|--------|
| `docs/backend/MLD_OASE_V3_MYSQL.md` | Documentation complète avec SQL | ~2 064 lignes |
| `docs/backend/ANALYSE_MLD_V3_COMPLETE.md` | **Ce document** — Analyse structurelle | ~520 lignes |
| `docs/backend/AUDIT_MLD_V3_EXPERT.md` | Audit expert du schéma (92/100) | — |
| `docs/backend/AUDIT_DOC_ANALYSE.md` | Audit qualité de ce document (89/100) | — |
| `oase_99_amendments_v3.1.sql` | Migration des amendements v3.2 | — |
| `backups/oase_v3.2_dump_2026-06-17.sql` | Dump complet avec données | 188 Ko |

---

## 10. Matrice de Traçabilité Table ↔ Écran ↔ Endpoint ↔ Persona

> Relie le modèle de données aux 41 écrans (`frontend/01_INVENTAIRE_ECRANS.md`) pour garantir un produit fonctionnel de bout en bout.

| Domaine données | Tables principales | Écrans maquette | Endpoints API | Persona |
|-----------------|-------------------|-----------------|---------------|---------|
| Authentification | `utilisateurs`, `sessions_utilisateur`, `refresh_tokens`, `reset_password_tokens` | A-01, A-02, A-03 | `POST /auth/login`, `/auth/mfa/verify`, `/auth/password-reset/*` | Tous |
| Demandes (dépôt) | `demandes`, `pieces_jointes`, `bases_juridiques`, `base_juridique_versions` | B-02→B-06 | `GET/POST /demandes`, `POST /pieces-jointes/upload`, `POST /demandes/:id/soumettre` | Bénéficiaire |
| Instruction | `demande_workflow_instances`, `demande_workflow_etapes`, `demande_complements` | C-02, C-03 | `POST /workflow/etapes/:id/valider`, `/demandes/:id/demander-complement` | agent_ci, agent_agence |
| Décision/Actes | `decisions`, `actes` | C-04, E-05 | `POST /demandes/:id/approuver`, `/rejeter` | agent_ci, decideur |
| Référentiel MRD | `bases_juridiques`, `base_juridique_versions`, `base_juridique_documents`, `codes_additionnels`, `imports_mrd` | C-05, H-05 | `GET /bases-juridiques`, `POST /bases-juridiques/import/mrd` | agent_ci, admin_si |
| Quotas | `quotas`, `quota_mouvements` | C-06, E-03 | `GET /quotas` | agent_ci, decideur |
| Anomalies | `anomalies`, `regles_anomalie` | C-07, F-02 | `GET /anomalies`, `PATCH /anomalies/:id` | agent_ci, auditeur |
| Conventions | `conventions`, `convention_engagements`, `agrements` | C-08 | `GET /conventions` | agent_ci |
| Audit | `audit_logs` | C-09, F-03 | `GET /audit-logs`, `POST /audit-logs/verify-chain` | agent_ci, auditeur |
| Connecteurs SI | `connecteurs`, `connecteur_logs`, `demande_sync_externe` | H-04 | `GET /connecteurs/health`, `POST /connecteurs/:code/test` | admin_si |
| Reporting/Open Data | `reporting_aggregats`, `reporting_executions`, `opendata_publications` | D-04, E-04, G-01→G-03 | `GET /public/stats`, `POST /rapports/*` | agence, decideur, citoyen |
| Notifications | `notification_*`, `push_tokens` | (transversal) | `GET /notifications` | Tous |
| Administration | `utilisateurs`, `roles_permissions`, `ref_roles`, `parametres_systeme`, `workflow_templates` | H-01→H-06 | `GET/POST /utilisateurs`, `/workflow-templates` | admin_si |

---

## 11. RBAC — Rôles et Cohérence

### 11.1 Rôles canoniques (`ref_roles`, v3.3 — 15 rôles)

| Code | Libellé | Espace maquette |
|------|---------|-----------------|
| `beneficiaire` | Bénéficiaire | P1 — Portail (B-01→B-07) |
| `agent_ci` | Agent OTR — Centre des Impôts | P2 — Back-office (C-01→C-09) |
| `agent_cddi` | Agent OTR — CDDI (Douanes) | P2 — Back-office |
| `agent_dgbf` | Agent DGBF (visa budgétaire) | P2 — Back-office |
| `agent_dgtcp` | Agent DGTCP / GUDEF | P2 — Trésor |
| `agent_agence` | Agent Agence (SAZOF / API-ZF) | P3 — Agences (D-01→D-04) |
| `agent_mae` | Agent MAE | P3 — Accords de siège |
| `agent_dgmg` | Agent DGMG (mines) | P3 — Extractif |
| `agent_ministere` | Agent Ministère sectoriel | P2 — Avis technique |
| `decideur` | Décideur UPF / MEF | P4 — Décideurs (E-01→E-05) |
| `agent_conedef` | Agent CONEDEF | P4 — Évaluation DF |
| `auditeur` | Auditeur / Contrôle | P5 — Contrôle (F-01→F-04) |
| `public` | Citoyen / Open Data | P6 — Open Data (G-01→G-03) |
| `admin_si` | Administrateur SI | P7 — Administration (H-01→H-06) |
| `system` | Système (CRON / événements) | — Transversal |

### 11.2 ✅ Cohérence des rôles résolue (v3.3)

L'incohérence des rôles obsolètes (`agent_otr`, `agence`) a été **corrigée** : `ref_roles` contient désormais les 15 rôles canoniques de `05_RBAC_PERMISSIONS.md`, et les documents `04_STATUTS_ET_TRANSITIONS.md` et `02_LANGAGE_METIER_OASE.md` ont été alignés sur ces codes. Note : `ministere_sectoriel` reste un **type d'institution** (`ref_types_institution`), distinct du rôle `agent_ministere`.

---

## 12. Machine d'État `Demande` — 8 Statuts et Effets de Bord

> Synchronisé avec `04_STATUTS_ET_TRANSITIONS.md` et la table `ref_statuts_demande`.

| Statut | Couleur UI | Transition entrante | Effets de bord (tables impactées) |
|--------|-----------|---------------------|-----------------------------------|
| `brouillon` | Gris | création | `demandes` |
| `soumis` | Bleu clair | `soumettre()` | génère `reference`, crée `notification_queue`, `audit_logs` |
| `en_instruction` | Bleu | `prendre_en_charge()` | crée `demande_workflow_instances` + `demande_workflow_etapes` |
| `action_requise` | Orange | `demander_complement()` | `demande_complements`, `notification_queue` |
| `approuve` | Vert | `approuver()` | `decisions`, `actes` (QR+SHA256), `quota_mouvements`, `notifications` |
| `rejete` | Rouge | `rejeter()` | `decisions` (motif), `notifications` |
| `expire` | Gris foncé | `expirer()` (CRON) | `notifications`, `audit_logs` |
| `archive` | Neutre | `archiver()` | `archivages`, `audit_logs` |

**Règles de blocage** (cf. `04` bloc-01..05) rattachées au modèle :
- `bloc-01` dette fiscale → `beneficiaires.statut_fiscal_code = 'dette_active'`
- `bloc-02` anomalie critique → `anomalies.gravite_code = 'critique'`
- `bloc-03` quota dépassé → `quotas.consomme + montant > quotas.total`
- `bloc-04` mesure expirée → `base_juridique_versions.date_abrogation < NOW()`
- `bloc-05` pièces manquantes → `pieces_jointes` rang 1 incomplet

---

**Fin de l'analyse — MLD v3.2 validé : 85 tables + 4 vues + 2 triggers, 0 erreur, traçabilité fonctionnelle complète, dump disponible.**
