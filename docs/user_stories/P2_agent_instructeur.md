# OASE — User Stories P2 (Agent Instructeur)

> **Issue Plane :** OASE-33
> **Persona :** P2 — Agent Instructeur (OTR-CI, OTR-CDDI, DGBF)
> **Statut :** Rédigé
> **Date :** 10 juillet 2026
> **Référence écrans maquette :** `maquette/src/views/backoffice/*`

---

## Vue d'ensemble

Le persona **P2** instruit les demandes d'exonération déposées par les bénéficiaires. Il est rattaché à une institution (OTR-CI pour le code des investissements, OTR-CDDI pour les douanes, DGBF pour la gestion budgétaire). Il interagit avec 12 écrans du back-office :
- `DashboardView` — KPIs instruction
- `DossiersView` — file des dossiers à instruire
- `InstructionView` — instruction détaillée d'un dossier
- `ValidationView` — étape de validation
- `ControleView` — contrôle a posteriori
- `BudgetView` — vue budget / quotas
- `WorkflowCiOtrView` — workflow Code des Investissements
- `WorkflowCddiView` — workflow franchises douanières
- `WorkflowCodeInvestView` — variante Code Investissements
- `WorkflowConventionMiniereView` — convention minière
- `WorkflowZoneFrancheView` — zone franche
- `NotificationsView` — file de notifications

**MFA :** Oui (TOTP obligatoire).
**Signatures :** Oui — PIN de signature 4-6 chiffres.
**RBAC :** Limité à son institution + ses régimes assignés.

---

## US-P2-01 — Connexion avec MFA

| Champ | Valeur |
|---|---|
| **ID** | US-P2-01 |
| **Persona** | P2 |
| **Écran** | `/login` |
| **Endpoint** | `POST /api/v1/auth/login` + `POST /api/v1/auth/mfa/verify` |
| **Priorité** | Haute |
| **Statut** | ✅ Implémenté |

**En tant que** agent instructeur, **je veux** me connecter avec email + mot de passe + code MFA, **afin de** garantir un haut niveau de sécurité sur les dossiers fiscaux.

**Critères d'acceptation :**
- [ ] MFA TOTP **obligatoire** pour P2 (pas de désactivation possible depuis l'UI)
- [ ] 1ère connexion : QR code à scanner dans une app authenticator
- [ ] Codes de secours fournis (10 codes à usage unique)
- [ ] Si perte téléphone → procédure de reset via administrateur P7
- [ ] Délai MFA token : 5 min
- [ ] Échecs répétés → verrouillage 15 min après 5 tentatives

---

## US-P2-02 — Voir son tableau de bord instructeur

| Champ | Valeur |
|---|---|
| **ID** | US-P2-02 |
| **Persona** | P2 |
| **Écran** | `/backoffice/dashboard` |
| **Endpoint** | `GET /api/v1/dashboards/p2` |
| **Priorité** | Haute |
| **Statut** | ✅ Implémenté |

**En tant qu'** agent instructeur, **je veux** visualiser mon tableau de bord, **afin de** suivre ma charge d'instruction et mes KPIs.

**Critères d'acceptation :**
- [ ] 6 KPI : dossiers à instruire (≤ 5j), en cours, validés ce mois, rejetés ce mois, SLA moyen, taux de rejet
- [ ] Graphique en barres : dossiers traités par jour sur 30 jours
- [ ] Liste des 10 derniers dossiers en attente d'instruction (triés par date de dépôt ASC)
- [ ] Alerte si SLA global > 10 jours
- [ ] Comparaison avec la moyenne de l'institution

---

## US-P2-03 — Consulter la file des dossiers à instruire

| Champ | Valeur |
|---|---|
| **ID** | US-P2-03 |
| **Persona** | P2 |
| **Écran** | `/backoffice/dossiers` |
| **Endpoint** | `GET /api/v1/demandes?statut=en_instruction&instructeur=me` |
| **Priorité** | Haute |
| **Statut** | ✅ Implémenté |

**En tant qu'** agent instructeur, **je veux** consulter la file de dossiers qui m'est assignée, **afin de** les traiter dans l'ordre de priorité.

**Critères d'acceptation :**
- [ ] Tableau paginé : n° demande, bénéficiaire, type régime, date dépôt, SLA (jours restants), priorité
- [ ] Filtres : statut, régime, période, priorité
- [ ] Tri par SLA ASC par défaut (les plus urgents en premier)
- [ ] Badge coloré SLA : vert (> 5j), orange (3-5j), rouge (< 3j)
- [ ] Bouton « Prendre en charge » pour s'assigner le dossier
- [ ] Vue Kanban alternative (colonnes par statut)

---

## US-P2-04 — Instruire un dossier (étape technique)

| Champ | Valeur |
|---|---|
| **ID** | US-P2-04 |
| **Persona** | P2 |
| **Écran** | `/backoffice/instruction/:id` |
| **Endpoint** | `GET /api/v1/demandes/:id`, `POST /api/v1/demandes/:id/avis-technique` |
| **Priorité** | Haute |
| **Statut** | ✅ Implémenté |

**En tant qu'** instructeur technique, **je veux** analyser un dossier et émettre un avis technique, **afin de** permettre la décision finale.

**Critères d'acceptation :**
- [ ] Affichage complet du dossier : infos bénéficiaire, type régime, base juridique, pièces jointes, historique
- [ ] Visualiseur PDF intégré pour les pièces
- [ ] Zone de saisie pour l'avis technique (favorable / défavorable / complément requis)
- [ ] Si complément requis → motif obligatoire + liste des pièces attendues
- [ ] Calcul automatique du montant d'exonération proposé (selon barème)
- [ ] Comparaison avec les exonérations antérieures du même bénéficiaire
- [ ] Sauvegarde en brouillon + soumission finale (les deux tracés dans `audit_logs`)

---

## US-P2-05 — Demander un complément au bénéficiaire

| Champ | Valeur |
|---|---|
| **ID** | US-P2-05 |
| **Persona** | P2 |
| **Écran** | `/backoffice/instruction/:id` (action « Demander complément ») |
| **Endpoint** | `POST /api/v1/demandes/:id/complement-requis` |
| **Priorité** | Haute |
| **Statut** | ✅ Implémenté |

**En tant qu'** instructeur, **je veux** demander des pièces ou informations complémentaires au bénéficiaire, **afin de** poursuivre l'instruction.

**Critères d'acceptation :**
- [ ] Modale : motif du complément (textarea obligatoire) + liste des pièces attendues (multi-select)
- [ ] Délai de réponse paramétrable (par défaut 15 jours, max 30)
- [ ] Notification automatique envoyée au bénéficiaire (in-app + email)
- [ ] Statut du dossier passe à `en_complement`
- [ ] Timer visible dans le dossier (« Expire dans 12 jours »)
- [ ] Le bénéficiaire peut répondre directement via son portail

---

## US-P2-06 — Valider ou rejeter une demande

| Champ | Valeur |
|---|---|
| **ID** | US-P2-06 |
| **Persona** | P2 |
| **Écran** | `/backoffice/validation/:id` |
| **Endpoint** | `POST /api/v1/decisions` |
| **Priorité** | Haute |
| **Statut** | ✅ Implémenté |

**En tant qu'** agent validateur, **je veux** prendre une décision finale (valider / rejeter), **afin de** conclure l'instruction.

**Critères d'acceptation :**
- [ ] Récapitulatif du dossier + avis technique de l'instructeur
- [ ] Choix : VALIDER / REJETER / ABROGER
- [ ] Si validation : montant d'exonération (modifiable par rapport à la proposition)
- [ ] Si rejet : motif obligatoire (liste de motifs pré-définis)
- [ ] Si validation : durée de validité (date début + date fin)
- [ ] Saisie du PIN de signature pour engager la décision
- [ ] Décision tracée dans `audit_logs` avec hash SHA-256
- [ ] Notification automatique au bénéficiaire

---

## US-P2-07 — Contrôler une exonération déjà accordée

| Champ | Valeur |
|---|---|
| **ID** | US-P2-07 |
| **Persona** | P2 |
| **Écran** | `/backoffice/controle/:id` |
| **Endpoint** | `GET /api/v1/controles`, `POST /api/v1/controles` |
| **Priorité** | Moyenne |
| **Statut** | ✅ Implémenté |

**En tant qu'** agent contrôleur, **je veux** vérifier qu'une exonération accordée est utilisée conformément, **afin de** détecter les fraudes ou usages non conformes.

**Critères d'acceptation :**
- [ ] Fiche d'attestation d'origine + historique des transactions
- [ ] Comparaison entre l'engagement de réalisation et les réalisations effectives
- [ ] Liste des écarts constatés (zone de saisie libre)
- [ ] Conclusion : CONFORME / NON_CONFORME / A_COMPLETER
- [ ] Si non-conforme → transmission au service des anomalies
- [ ] Photo / preuve jointes possibles

---

## US-P2-08 — Consulter les quotas budgétaires

| Champ | Valeur |
|---|---|
| **ID** | US-P2-08 |
| **Persona** | P2 |
| **Écran** | `/backoffice/budget` |
| **Endpoint** | `GET /api/v1/quotas?institution=me&periode=YYYY` |
| **Priorité** | Moyenne |
| **Statut** | ✅ Implémenté |

**En tant qu'** agent DGBF, **je veux** consulter les quotas budgétaires alloués, **afin de** savoir si je peux valider une nouvelle exonération.

**Critères d'acceptation :**
- [ ] Tableau : régime, quota alloué, consommé, disponible, % consommé
- [ ] Filtre par exercice fiscal
- [ ] Alerte si > 80% consommé
- [ ] Blocage automatique si quota épuisé (workflow engine rejette la validation)
- [ ] Graphique en barres empilées (engagé vs consommé vs disponible)

---

## US-P2-09 — Configurer un workflow

| Champ | Valeur |
|---|---|
| **ID** | US-P2-09 |
| **Persona** | P2 (rôle admin workflow) |
| **Écran** | `/backoffice/workflow/:regime` (ex: `WorkflowCiOtrView`) |
| **Endpoint** | `GET/POST /api/v1/workflow/templates` |
| **Priorité** | Basse |
| **Statut** | ✅ Implémenté |

**En tant qu'** administrateur workflow, **je veux** configurer les étapes et les règles de transition d'un régime, **afin d'** adapter le circuit d'instruction.

**Critères d'acceptation :**
- [ ] Liste des étapes du workflow (drag & drop pour réordonner)
- [ ] Pour chaque étape : rôle requis, délai max, condition d'entrée, condition de sortie
- [ ] Éditeur de règles de blocage (DSL simple : SI montant > X ALORS étape supplémentaire)
- [ ] Versioning du workflow (n° version + dates d'effet)
- [ ] Test du workflow sur un dossier fictif avant activation
- [ ] Toute modification journalisée

---

## US-P2-10 — Exporter la liste des dossiers traités

| Champ | Valeur |
|---|---|
| **ID** | US-P2-10 |
| **Persona** | P2 |
| **Écran** | `/backoffice/dossiers` (menu export) |
| **Endpoint** | `GET /api/v1/rapports/instruction?format=xlsx&periode=...` |
| **Priorité** | Moyenne |
| **Statut** | ✅ Implémenté |

**En tant qu'** agent instructeur, **je veux** exporter ma liste de dossiers traités, **afin de** produire mon rapport d'activité mensuel.

**Critères d'acceptation :**
- [ ] Filtres : période, statut, régime
- [ ] Colonnes : n° dossier, bénéficiaire, date instruction, décision, montant, durée
- [ ] Formats : XLSX et PDF
- [ ] Limite : 5 000 lignes par export
- [ ] Export tracé dans `audit_logs` (qui a exporté quoi quand)

---

## Récapitulatif

| ID | Titre | Priorité | Statut |
|---|---|---|---|
| US-P2-01 | Connexion avec MFA | Haute | ✅ |
| US-P2-02 | Dashboard instructeur | Haute | ✅ |
| US-P2-03 | File des dossiers | Haute | ✅ |
| US-P2-04 | Instruire un dossier | Haute | ✅ |
| US-P2-05 | Demander un complément | Haute | ✅ |
| US-P2-06 | Valider / rejeter | Haute | ✅ |
| US-P2-07 | Contrôler une exonération | Moyenne | ✅ |
| US-P2-08 | Consulter les quotas | Moyenne | ✅ |
| US-P2-09 | Configurer un workflow | Basse | ✅ |
| US-P2-10 | Exporter dossiers traités | Moyenne | ✅ |

**Total : 10 user stories — toutes implémentées.**

---

*Document lié à OASE-33.*
