# OASE-27 — Inventaire exhaustif des écrans

> **Issue Plane :** OASE-27  
> **Date :** 2026-06-16  
> **Source :** `comprehension/02_VUES_INVENTAIRE.md`, maquette Vue 3

---

## Récapitulatif

| Espace | Écrans | Personas |
|---|:---:|---|
| Authentification | 3 | Tous |
| Portail bénéficiaire (P1) | 7 | Opérateur économique |
| Back-office instruction (P2) | 9 | Agent CI / CDDI / DGBF / Décideur |
| Agences de promotion (P3) | 4 | Agence (API, ZATP…) |
| Décideurs stratégiques (P4) | 5 | UPF / MEF / OIIL |
| Contrôle & audit (P5) | 4 | IGF, Cour des Comptes, FMI |
| Open Data public (P6) | 3 | Citoyen |
| Administration système (P7) | 6 | Administrateur SI |
| **Total** | **41** | |

---

## A — Authentification (3 écrans)

### A-01 · Login
- **Route :** `/login`  
- **Composant :** `LoginView.vue`  
- **Fonctions :** email + mot de passe, lien "Mot de passe oublié", bouton connexion  
- **API :** `POST /auth/login`  
- **Transitions :** → A-02 si MFA requis · → espace persona si MFA non requis

### A-02 · Vérification MFA
- **Route :** `/auth/mfa`  
- **Composant :** `MfaView.vue`  
- **Fonctions :** saisie code TOTP 6 chiffres, timer 30s, lien "Je n'ai plus accès à mon application"  
- **API :** `POST /auth/mfa/verify`  
- **Transitions :** → espace persona selon rôle

### A-03 · Réinitialisation mot de passe
- **Route :** `/auth/reset-password`  
- **Composant :** `ResetPasswordView.vue`  
- **Fonctions :** saisie email, confirmation envoi, nouveau mot de passe (token URL)  
- **API :** `POST /auth/password-reset/request` · `POST /auth/password-reset/confirm`

---

## B — Portail bénéficiaire P1 (7 écrans)

### B-01 · Dashboard bénéficiaire
- **Route :** `/beneficiaire`  
- **Composant :** `BeneficiaireHomeView.vue`  
- **Données affichées :** nb demandes actives, statut fiscal OTR, demandes récentes, alertes échéances  
- **API :** `GET /beneficiaires/me` · `GET /demandes?limit=5`

### B-02 · Liste des demandes
- **Route :** `/beneficiaire/demandes`  
- **Composant :** `DemandesListView.vue`  
- **Fonctions :** filtre par statut/date/texte, pagination, télécharger attestation  
- **API :** `GET /demandes`

### B-03 · Détail d'une demande
- **Route :** `/beneficiaire/demandes/:id`  
- **Composant :** `DemandeDetailView.vue`  
- **Données :** référence, statut (badge couleur), étapes workflow, pièces, historique, attestation si approuvée  
- **API :** `GET /demandes/:id`

### B-04 · Nouvelle demande — Étape 1 : choix base juridique
- **Route :** `/beneficiaire/demandes/new/step1`  
- **Composant :** `NouvelleDemandeStep1View.vue`  
- **Fonctions :** recherche dans référentiel MRD (filtre type impôt / nature), sélection mesure, affichage description  
- **API :** `GET /bases-juridiques?search=&type=&nature=`

### B-05 · Nouvelle demande — Étape 2 : informations + pièces
- **Route :** `/beneficiaire/demandes/new/step2`  
- **Composant :** `NouvelleDemandeStep2View.vue`  
- **Fonctions :** montant estimé, date échéance souhaitée, upload pièces rang 1 (obligatoires), upload pièces rang 2 (optionnelles), barre de progression  
- **API :** `POST /pieces-jointes/upload` · `POST /demandes`

### B-06 · Nouvelle demande — Étape 3 : récapitulatif + soumission
- **Route :** `/beneficiaire/demandes/new/step3`  
- **Composant :** `NouvelleDemandeStep3View.vue`  
- **Fonctions :** récapitulatif complet, case à cocher déclaration sur l'honneur, bouton Soumettre  
- **API :** `POST /demandes/:id/soumettre`

### B-07 · Profil bénéficiaire
- **Route :** `/beneficiaire/profil`  
- **Composant :** `ProfilBeneficiaireView.vue`  
- **Fonctions :** infos entreprise, NIF, RCCM, statut fiscal (badge), modifier contacts, changer PIN  
- **API :** `GET /beneficiaires/me` · `PATCH /beneficiaires/me` · `POST /auth/pin/set`

---

## C — Back-office instruction P2/P4 (9 écrans)

### C-01 · Dashboard backoffice
- **Route :** `/backoffice`  
- **Composant :** `BackofficeHomeView.vue`  
- **Données :** file d'attente (demandes à traiter), KPIs temps réel, alertes anomalies, statut connecteurs  
- **API :** `GET /demandes/stats/par-statut` · `GET /connecteurs/health`

### C-02 · File d'instruction
- **Route :** `/backoffice/demandes`  
- **Composant :** `InstructionListView.vue`  
- **Fonctions :** filtres avancés (type texte, organe, montant, date), tri, prise en charge, bulk actions  
- **API :** `GET /demandes?statut=soumis,en_instruction`

### C-03 · Instruction d'une demande
- **Route :** `/backoffice/demandes/:id`  
- **Composant :** `InstructionDetailView.vue`  
- **Fonctions :** vue complète dossier, pièces visionneuses intégrées, étapes workflow (validation/rejet par étape), demande de complément, annotation  
- **API :** `GET /demandes/:id` · `POST /workflow/etapes/:id/valider` · `POST /demandes/:id/demander-complement`

### C-04 · Décision finale
- **Route :** `/backoffice/demandes/:id/decision`  
- **Composant :** `DecisionView.vue`  
- **Fonctions :** résumé dossier, saisie PIN, commentaire, bouton Approuver / Rejeter  
- **API :** `POST /demandes/:id/approuver` · `POST /demandes/:id/rejeter`

### C-05 · Référentiel bases juridiques
- **Route :** `/backoffice/bases-juridiques`  
- **Composant :** `BasesJuridiquesView.vue`  
- **Fonctions :** liste avec filtres, détail mesure (SCD T2), import MRD, historique versions  
- **API :** `GET /bases-juridiques` · `POST /bases-juridiques/import/mrd`

### C-06 · Gestion des quotas
- **Route :** `/backoffice/quotas`  
- **Composant :** `QuotasView.vue`  
- **Fonctions :** tableau avec barres de progression, alerte 80% (orange), épuisé 100% (rouge), historique consommation  
- **API :** `GET /quotas`

### C-07 · Gestion des anomalies
- **Route :** `/backoffice/anomalies`  
- **Composant :** `AnomaliesView.vue`  
- **Fonctions :** liste par gravité/statut, affecter, classer, tracer résolution  
- **API :** `GET /anomalies` · `PATCH /anomalies/:id`

### C-08 · Conventions
- **Route :** `/backoffice/conventions`  
- **Composant :** `ConventionsView.vue`  
- **Fonctions :** liste conventions actives, détail (type, parties, échéance), alertes expiration J-30  
- **API :** `GET /conventions`

### C-09 · Journal d'audit
- **Route :** `/backoffice/audit`  
- **Composant :** `AuditLogView.vue`  
- **Fonctions :** timeline horodatée, filtres (action, entité, utilisateur, date), export CSV, vérification chaîne SHA-256  
- **API :** `GET /audit-logs` · `POST /audit-logs/verify-chain`

---

## D — Agences de promotion P3 (4 écrans)

### D-01 · Dashboard agence
- **Route :** `/agence`  
- **Composant :** `AgenceHomeView.vue`  
- **Données :** demandes de son périmètre (API, ZATP, Mines…), KPIs secteur, alertes  
- **API :** `GET /demandes?scope=agence`

### D-02 · Suivi demandes périmètre
- **Route :** `/agence/demandes`  
- **Composant :** `AgenceDemandesView.vue`  
- **Fonctions :** vue en lecture seule, filtres par texte juridique, export rapport  
- **API :** `GET /demandes` (RLS périmètre agence)

### D-03 · Instruction agence (si compétente)
- **Route :** `/agence/demandes/:id`  
- **Composant :** `AgenceInstructionView.vue`  
- **Fonctions :** idem C-03 mais limité au périmètre de l'agence  
- **API :** identique C-03

### D-04 · Rapports agence
- **Route :** `/agence/rapports`  
- **Composant :** `AgenceRapportsView.vue`  
- **Fonctions :** rapport PDF/Excel mensuel/annuel, dépenses fiscales par secteur  
- **API :** `GET /rapports/agence`

---

## E — Décideurs stratégiques P4 (5 écrans)

### E-01 · Dashboard décideur
- **Route :** `/decideur`  
- **Composant :** `DecideurHomeView.vue`  
- **Données :** KPIs globaux (montant total, taux approbation, délai moyen), graphiques tendances  
- **API :** `GET /demandes/stats/par-statut`

### E-02 · Tableau de bord fiscal
- **Route :** `/decideur/fiscal`  
- **Composant :** `DashboardFiscalView.vue`  
- **Données :** dépenses fiscales par type impôt, par nature mesure, par secteur, évolution annuelle  
- **API :** `GET /demandes/stats/fiscal`

### E-03 · Suivi quotas global
- **Route :** `/decideur/quotas`  
- **Composant :** `QuotasGlobalView.vue`  
- **Données :** vue consolidée tous organes, alertes rouge/orange, historique consommation  
- **API :** `GET /quotas`

### E-04 · Rapports exécutifs
- **Route :** `/decideur/rapports`  
- **Composant :** `RapportsExecsView.vue`  
- **Fonctions :** génération rapport PDF (MRE, rapport annuel dépenses fiscales), export Excel  
- **API :** `POST /rapports/executif`

### E-05 · Approbation finale (déléguée)
- **Route :** `/decideur/approbations`  
- **Composant :** `ApprobationsView.vue`  
- **Fonctions :** file des demandes en attente d'approbation finale, saisie PIN, commentaire  
- **API :** `POST /demandes/:id/approuver`

---

## F — Contrôle & audit P5 (4 écrans)

### F-01 · Dashboard contrôle
- **Route :** `/controle`  
- **Composant :** `ControleHomeView.vue`  
- **Données :** anomalies critiques, alertes récentes, taux non-conformité  

### F-02 · Anomalies détaillées
- **Route :** `/controle/anomalies`  
- **Composant :** `ControleAnomaliesView.vue`  
- **Fonctions :** vue complète audit anomalies, lecture seule, export  

### F-03 · Consultation audit log
- **Route :** `/controle/audit`  
- **Composant :** `ControleAuditView.vue`  
- **Fonctions :** idem C-09 mais lecture seule, vérification intégrité chaîne  

### F-04 · Rapports de contrôle
- **Route :** `/controle/rapports`  
- **Composant :** `ControleRapportsView.vue`  
- **Fonctions :** rapports conformité, rapport anomalies, export IGF  

---

## G — Open Data public P6 (3 écrans)

### G-01 · Portail statistiques
- **Route :** `/`  (racine publique)  
- **Composant :** `OpenDataHomeView.vue`  
- **Données :** statistiques anonymisées — nb mesures, montant global, top impôts, graphiques  
- **API :** `GET /public/stats`

### G-02 · Catalogue mesures
- **Route :** `/catalogue`  
- **Composant :** `CatalogueView.vue`  
- **Fonctions :** liste publique des bases juridiques actives, filtre par type/nature, sans données bénéficiaires  
- **API :** `GET /bases-juridiques/public`

### G-03 · Vérification attestation
- **Route :** `/attestations/verifier`  
- **Composant :** `VerificationAttestationView.vue`  
- **Fonctions :** saisie hash QR, résultat validité (valide / invalide / révoqué)  
- **API :** `POST /public/attestations/verifier`

---

## H — Administration système P7 (6 écrans)

### H-01 · Dashboard admin
- **Route :** `/admin`  
- **Composant :** `AdminHomeView.vue`  
- **Données :** santé système, statut connecteurs, alertes techniques, logs erreurs récents  

### H-02 · Gestion utilisateurs
- **Route :** `/admin/utilisateurs`  
- **Composant :** `AdminUsersView.vue`  
- **Fonctions :** CRUD utilisateurs, attribuer rôle/institution, activer/désactiver, reset MFA, reset PIN  
- **API :** `GET /utilisateurs` · `POST /utilisateurs` · `PATCH /utilisateurs/:id` · `POST /utilisateurs/:id/reset-mfa`

### H-03 · Configuration workflows
- **Route :** `/admin/workflows`  
- **Composant :** `AdminWorkflowsView.vue`  
- **Fonctions :** liste templates, créer/modifier étapes, assigner organe par étape  
- **API :** `GET /workflow-templates` · `POST /workflow-templates`

### H-04 · Configuration connecteurs
- **Route :** `/admin/connecteurs`  
- **Composant :** `AdminConnecteursView.vue`  
- **Fonctions :** liste connecteurs, statut circuit breaker, tester ping, activer/désactiver, forcer open/close  
- **API :** `GET /connecteurs/health` · `POST /connecteurs/:code/force-open` · `POST /connecteurs/:code/test`

### H-05 · Import MRD
- **Route :** `/admin/import-mrd`  
- **Composant :** `AdminImportMrdView.vue`  
- **Fonctions :** upload CSV/JSON, aperçu 10 lignes, lancer import, suivi progression, rapport d'erreurs  
- **API :** `POST /bases-juridiques/import/mrd` · `GET /bases-juridiques/import/:job_id/status`

### H-06 · Logs système
- **Route :** `/admin/logs`  
- **Composant :** `AdminLogsView.vue`  
- **Fonctions :** logs applicatifs (niveau ERROR/WARN), PM2 logs, erreurs connecteurs, timeline 24h  

---

*Livrable OASE-27 — 41 écrans inventoriés.*
