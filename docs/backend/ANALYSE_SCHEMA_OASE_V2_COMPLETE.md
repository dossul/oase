# OASE — Analyse critique du schéma actuel (v2) face au périmètre complet

> **Date :** 2026-06-17  
> **Référence :** PRD_OASE.md, Cahier des Charges, Rapport diagnostique, maquettes 41 écrans, matrice de tests, fiche technique officielle.

---

## 1. Synthèse exécutive

Le schéma de base de données OASE v2 (24 tables de référence + 19 tables métier) est **un squelette fonctionnel pour POC**, pas un modèle de production prêt à supporter le périmètre complet annoncé.

Il couvre approximativement :
- Le référentiel minimal des mesures (bases juridiques),
- La dépose et le suivi simplifié d'une demande d'exonération,
- Un circuit de validation linéaire,
- Une gestion très basique des quotas,
- Les fondations de l'audit log.

Mais il ignore ou sous-modélise massivement : les 7 processus institutionnels d'octroi, le SCD Type 2 réel, les conventions/agréments/accords de siège, la distinction dépenses fiscales / prises en charge TVA, le portail public de transparence, le moteur de règles, la file d'attente SI, l'archivage légal, la simulation d'impact, l'application mobile, la RLS/confidentialité.

### Note globale

**33 / 100 — Insuffisant pour le périmètre annoncé.**

---

## 2. Tableau détaillé par domaine fonctionnel

| # | Domaine fonctionnel | Score /100 | Justification critique |
|---|---------------------|-----------:|------------------------|
| 1 | **Architecture globale & normalisation** | 45 | Séparation ref/métier, UUID PK, FK RESTRICT, JSON pour définitions. Mais nombreux champs `VARCHAR` sans référentiel (`impot_concerne`, `secteur`, `region`, `branche_activite`, `programme_dotation`, `position_sh`). Pas de méta-modèle fonctionnel, pas de versioning générique, pas de tables `pays`, `devises`, `unites_temps`. |
| 2 | **Authentification, IAM & sécurité** | 38 | MFA, PIN, hash mot de passe, refresh tokens présents. Aucune table `sessions`, `tentatives_connexion`, `lockout`, `devices`, `webauthn`, `password_history`, `certificats`. RBAC plat `(role, ressource, action)` sans hiérarchie, sans contexte institution, sans RLS ligne. Le chiffrement AES-256-GCM n'est matérialisé que par `mfa_secret_enc`. |
| 3 | **Gestion des bénéficiaires & portail** | 35 | `beneficiaires` est une fiche simpliste. Pas de `contacts`, `adresses`, `representants_legaux`, `beneficiaires_effectifs`, `comptes_bancaires`, `historique_fiscal`, `relations_groupe`. Un seul `user_id` par bénéficiaire : impossible de gérer plusieurs utilisateurs internes. Pas de `preferences_notifications`. |
| 4 | **Référentiel juridique MRD & SCD Type 2** | 28 | La table `bases_juridiques` tente le SCD Type 2 (`version`, `valid_from`, `valid_to`) mais `code_mesure` est `UNIQUE`, ce qui interdit physiquement plusieurs versions d'une même mesure. **Écart bloquant**. Pas de table `ref_familles_juridiques` (11 familles), `ref_impots` (27 types), `ref_textes_fondamentaux`, `articles_paragraphes`, `liens_textes`. `impot_concerne` est un `VARCHAR(100)` sans FK. |
| 5 | **Gestion des demandes** | 42 | `demandes` couvre le minimum (référence, base juridique, bénéficiaire, montant, statut). Manquent : type de demande, priorité, canal de dépôt, montant demandé/accordé/réalisé, SLA, dates de réception/traitement, lien parent/enfant (renouvellement, modification), motif complet structuré, contentieux. Soft delete OK. |
| 6 | **Instruction back-office & workflow** | 44 | `workflow_templates` + `etapes_workflow` permettent un circuit linéaire. Mais `definition` JSON est opaque, non contraint. Pas de `conditions_transition`, `regles_routage`, `taches`, `commentaires_instruction`, `demandes_complement`, `remplacements_agents`, `competences_agent`, `delais_reels`. |
| 7 | **Validation, décisions & actes administratifs** | 30 | `decisions` stocke un avis avec hash et PIN. Aucune table `actes_administratifs` : pas de numérotation officielle, pas d'acte signé, pas de signature électronique qualifiée, pas de visa/collégialité, pas de mentions légales obligatoires, pas d'enregistrement au registre des actes. |
| 8 | **Conventions, agréments & accords de siège** | 33 | `conventions` et `accords_siege` existent mais sont pauvres. Pas de table `agrements`. Pas de `avenants`, `clauses`, `documents_convention`, `niveau_confidentialite`, `acces_convention_autorise`, `log_acces_confidentiel`, `beneficiaires_effectifs`. `conventions.regime_code` ENUM restreint. |
| 9 | **Suivi actif & reporting d'engagements** | 15 | Quasi inexistant. Pas de `suivi_realisations`, `attestations_annuelles`, `visites_inspections`, `reports`, `investissements_realises`, `emplois_verifies`, `indicateurs_engagements`. Impossible de contrôler les clauses suspensives ou les engagements d'emploi/investissement. |
| 10 | **Suivi budgétaire, fiscal & TVA** | 22 | Seul `quotas` (`total/consomme`) et un booléen `est_depense_fiscale_2024` existent. Pas de `budgets`, `credits_ouverts`, `engagements_budgetaires`, `liquidations`, `depenses_fiscales_annuelles`, `prises_en_charge_tva`, `recettes_fiscales_perdues`, `evaluations_impact`. La distinction dépenses fiscales / prises en charge TVA n'est pas modélisée. |
| 11 | **Interopérabilité avec 8 SI** | 30 | `connecteurs` + `codes_additionnels` sont insuffisants. Seeds : seulement 5 connecteurs (SYDONIA, ETAX, SIGFIP, GUDEF, DAS) ; il en manque 3 (SIGTAS, Base DLFC, Base service gestionnaire). Pas de `logs_connecteur`, `transactions_si`, `file_attente`, `mappings_champs`, `erreurs_reconciliation`, `etats_synchronisation`, `messages SOAP/REST`. `config_auth` JSON n'est pas chiffré. |
| 12 | **Audit, contrôle & traçabilité** | 48 | `audit_logs` est le point fort : horodatage, ancienne/nouvelle valeur JSON, hash SHA-256, hash précédent. Mais aucun mécanisme de vérification de chaîne dans la base, pas de `missions_controle`, `constats`, `recommandations`, `rapports_controle`, pas de traçabilité des lectures. |
| 13 | **Alertes & moteur de règles** | 18 | `anomalies` existe mais `regle_id` est un `VARCHAR` sans FK. Pas de table `regles`, `conditions`, `actions`, `types_alerte`, `planification_alertes`. Les alertes J-90/J-60/J-30 ne sont pas modélisées. `alerte_seuil_pct` dans `quotas` est le seul mécanisme. |
| 14 | **Dashboards & portail public de transparence** | 10 | Aucune table de data mart (`indicateurs`, `vues_materialisees`, `statistiques_publiques`, `donnees_ouvertes`, `publications`). Le portail public avec données agrégées/anonymisées ne peut pas exister sur ce schéma sans ajouts massifs. |
| 15 | **Simulation d'impact** | 5 | Aucune table `simulations`, `scenarios`, `parametres_simulation`, `resultats_simulation`. Le module est totalement absent du modèle. |
| 16 | **Archivage & cycle de vie** | 20 | Seul `deleted_at` sur `demandes` existe. Pas de `politiques_archivage`, `documents_archives`, `bacs_archives`, `restaurations`, `conservation_legale`. L'état `archive` dans `ref_statuts_demande` ne remplace pas un sous-système d'archivage. |
| 17 | **Notifications & communication** | 40 | `notifications` gère in-app/email/SMS. Mais pas de `templates_notification`, `preferences_utilisateur`, `file_attente_envoi`, `historique_erreurs`, `notifications_push_mobile`, `campagnes`. |
| 18 | **Admin technique & application mobile** | 20 | Pas de `devices`, `push_tokens`, `versions_app`, `sessions_actives`, `parametres_securite`, `maintenance_programmee`. `refresh_tokens` n'a pas de champ device. Le modèle ne supporte pas une app iOS/Android complète. |

---

## 3. Écarts critiques / bloquants

| # | Écart | Impact |
|---|-------|--------|
| 1 | **`bases_juridiques.code_mesure UNIQUE` alors que SCD Type 2 est exigé** | Empêche le versionnage annuel (lois de finances). Le modèle ne peut pas stocker deux versions d'une même mesure. Bloquant pour la mise à jour MRD. |
| 2 | **Absence totale de Row-Level Security (RLS) et de niveaux d'accès aux conventions confidentielles** | Impossible de respecter la confidentialité des conventions minières/pétrolières et accords de siège sensibles. |
| 3 | **Aucune modélisation de la distinction dépenses fiscales / prises en charge TVA** | Exigence fonctionnelle centrale non implémentée ; le reporting fiscal sera faux. |
| 4 | **Aucun data mart / modèle de publication pour le portail public de transparence** | Le portail public (données agrégées/anonymisées) ne peut pas être alimenté. |
| 5 | **Aucun moteur de règles déclaratif** | `anomalies.regle_id` n'a pas de table cible. Les alertes intelligentes et détections automatiques ne sont pas supportées. |
| 6 | **Seuls 5 connecteurs sur 8 SI requis sont seedsés ; pas de file d'attente ni de log d'échange** | L'interopérabilité réelle est impossible ; pas de réconciliation, pas de tolérance aux pannes. |
| 7 | **Absence de tables `ref_impots` (27 types) et `ref_familles_juridiques` (11 familles)** | Le référentiel de base est inadapté aux 1 290 mesures MRD 2024. |
| 8 | **Pas de tables `actes_administratifs`, `agrements`, `suivi_realisations`, `budgets`** | Les 7 processus institutionnels d'octroi ne peuvent pas aboutir juridiquement ni être suivis. |

---

## 4. Écarts majeurs

- Pas de gestion multi-comptes/utilisateurs par bénéficiaire.
- Pas de table `contacts`, `adresses`, `representants_legaux`, `beneficiaires_effectifs`.
- Pas de circuit de demande de complément ni de commentaires d'instruction structurés.
- Pas de signatures électroniques qualifiées ni de registre des actes signés.
- Pas de gestion des avenants et clauses des conventions.
- Pas d'historique de consommation des quotas (`quotas` écrase l'année en cours).
- Pas de table `sessions`, `tentatives_connexion`, `lockout`, `password_history`.
- Pas de modèle de files d'attente pour les échanges SI.
- Pas de templates de notification ni de préférences utilisateur.
- Pas de table `alertes` avec planification J-90/J-60/J-30.
- Pas de table `simulations` ni `scenarios`.
- Pas de modèle d'archivage légale.
- Pas de tables de monitoring applicatif (`health_checks`, `metriques`, `incidents`).
- Pas de gestion des versions d'application mobile et des push tokens.
- Pas de référentiels géographiques (`pays`, `regions`, `zones_franches`) ni sectoriels.
- Absence de table `types_demande`, `priorites`, `canaux_depot`, `types_piece`.

---

## 5. Écarts mineurs

- Champs `VARCHAR` sans contrainte ou FK : `impot_concerne`, `secteur`, `region`, `branche_activite`.
- `objectif_type`, `programme_dotation`, `position_sh`, `odd` non normalisés.
- `workflow_templates.definition` et `connecteurs.config_auth` en JSON sans schéma JSON validé.
- Pas de table `ref_types_document` pour les pièces jointes.
- Pas de validation OCR/conformité des pièces (`est_valide` est un simple booléen nullable).
- Pas de table `commentaires` générique liée aux demandes/étapes.
- Pas de champ `motif_complet` structuré dans `demandes`.
- Pas d'index composite sur `bases_juridiques(code_mesure, version)`.
- Pas de `CHECK` sur les dates (`date_debut < date_fin` dans `conventions`, `valid_from < valid_to`).
- Pas de table `ref_unites_temps` ou `ref_exercices_budgetaires`.

---

## 6. Points forts

- Bonne séparation entre tables de référence et tables métier.
- Utilisation systématique d'UUID en PK et de `DATETIME(3)`.
- Présence de soft delete (`deleted_at`) sur `demandes`.
- Présence de `refresh_tokens` et de `mfa_secret_enc`.
- `audit_logs` avec empreinte SHA-256 et hash précédent (même si la vérification de chaîne n'est pas dans la base).
- `workflow_templates` et `etapes_workflow` fournissent une ossature de circuit de validation.
- `roles_permissions` offre un RBAC simple extensible.
- Seeds représentatifs permettant une démonstration rapide.

---

## 7. Verdict final

Le schéma OASE v2 est **un POC structuré mais très partiel**, inadéquat pour un SI institutionnel couvrant 41 écrans, 7 personas, 7 processus d'octroi, 1 290 mesures, 8 interconnexions SI, un portail public de transparence et une application mobile.

Les écarts critiques — notamment le **SCD Type 2 physiquement impossible**, l'**absence de RLS/conventions confidentielles**, l'**absence de modèle TVA prise en charge**, l'**absence de moteur de règles** et l'**absence de data mart** — rendent le schéma inadéquat au périmètre annoncé.

### Recommandation

Refonte profonde du modèle de données avant tout développement V1. Le MLD corrigé complet est proposé dans `MLD_OASE_V3_MYSQL.md`.

---

*Analyse produite par l'agent Kilo — 2026-06-17.*
