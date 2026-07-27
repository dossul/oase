# OASE — Document de recette exhaustif

> **Version :** 2.0  
> **Date :** 2026-07-26  
> **Périmètre :** Recette complète OASE — Auth, RBAC, MFA multi-canal, Audit, P1→P7  
> **Sources :** `docs/tests/01_STRATEGIE_PLAYWRIGHT.md`, `docs/tests/04_PLAN_RECETTE_EXONERATION.md`, `docs/backend/05_RBAC_PERMISSIONS.md`, `docs/tests/05_RUNBOOK_QA_E2E.md`

---

## Sommaire

1. Vue d'ensemble et périmètre
2. Personas et utilisateurs de test
3. Cas de test transversaux (AUTH, RBAC, MFA, AUDIT)
4. Cas de test par persona (P1→P7)
5. Matrice de couverture RBAC
6. Tests MFA multi-canal
7. Tests audit log et chaîne cryptographique
8. Tests non-fonctionnels (performance, sécurité)
9. Checklist de recette
10. Suivi des anomalies

---

## 1. Vue d'ensemble et périmètre

### 1.1 Objectif

Ce document liste l'ensemble des cas de test à exécuter pour valider la conformité de la plateforme OASE (exonération fiscale/douanière) avant mise en production. Il couvre :

- **Authentification** et gestion des sessions
- **RBAC** (contrôle d'accès basé sur les rôles) — 21 contrôleurs
- **MFA multi-canal** (TOTP, email, WhatsApp)
- **Audit log** avec chaîne cryptographique
- **Parcours métier** P1 (contribuable) → P7 (admin SI)
- **Tests non-fonctionnels** (performance, sécurité)

### 1.2 Critère de passage

Un cas de test est marqué **PASS** si et seulement si :
1. Les étapes du scénario sont déroulables sans erreur bloquante
2. Les résultats attendus sont tous observés
3. Aucune erreur console critique (404, 500, JS exception)
4. Une capture ou snapshot est conservé en preuve

### 1.3 Légende

| Statut | Signification |
|---|---|
| PASS | Cas conforme |
| FAIL | Anomalie à corriger |
| BLOCK | Bloqué par une dépendance |
| N/A | Hors périmètre |

---

## 2. Personas et utilisateurs de test

| Code | Persona | Email | Rôle | MFA | Objectif |
|---|---|---|---|---|---|
| P1 | Contribuable | `texlome@demo.tg` | `contribuable` | Non | Déposer, suivre, récupérer exonérations |
| P2 | Agent CI | `fatima.ouattara@otr.tg` | `agent_ci` | Oui | Instruire, valider, rejeter dossiers |
| P2b | Agent CDDI | `agent.cddi@otr.tg` | `agent_cddi` | Oui | Instruction complémentaire |
| P2c | Agent DGBF | `agent.dgbf@dgf.tg` | `agent_dgbf` | Oui | Instruction financière |
| P2d | Agent DGTCP | `agent.dgtcp@dgf.tg` | `agent_dgtcp` | Oui | Contrôle fiscal |
| P3 | Agence | `komlan.kodjo@api.tg` | `agent_agence` | Oui | Conventions, agréments |
| P3b | MAE | `mae@mae.tg` | `agent_mae` | Oui | Agréments diplomatiques |
| P3c | DGMG | `dgmg@minepat.tg` | `agent_dgmg` | Oui | Conventions minière |
| P3d | Ministère | `ministere@minepat.tg` | `agent_ministere` | Oui | Pilotage sectoriel |
| P4 | Décideur | `amevi.koffi@mef.tg` | `decideur` | Oui | Approuver, piloter, analyser |
| P4b | CONEDEF | `conedef@conedef.tg` | `agent_conedef` | Oui | Commission exonération |
| P5 | Auditeur | `paul.adjovi@igf.tg` | `auditeur` | Oui | Auditer, contrôler conformité |
| P7 | Admin SI | `admin@oase.tg` | `admin_si` | Oui | Gérer users, workflows, config |

---

## 3. Cas de test transversaux

### 3.1 Authentification (TC-AUTH)

#### TC-AUTH-01 — Connexion P1 sans MFA

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Connexion contribuable avec email + mot de passe |
| Préconditions | Utilisateur P1 existant, MFA désactivé |

**Étapes**
1. Aller sur `/login`
2. Saisir email `texlome@demo.tg`
3. Saisir mot de passe `Oase@2026!`
4. Cliquer **Se connecter**

**Résultats attendus**
- Redirection vers `/portail/dashboard`
- Token JWT présent dans localStorage
- Sidebar affiche "Contribuable"
- Aucune erreur console

---

#### TC-AUTH-02 — Connexion P2 avec MFA TOTP

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Titre | Connexion agent avec MFA TOTP |
| Préconditions | MFA activé, TOTP configuré |

**Étapes**
1. Aller sur `/login`
2. Saisir email `fatima.ouattara@otr.tg`
3. Saisir mot de passe `Oase@2026!`
4. Cliquer **Se connecter**
5. Page MFA s'affiche, saisir code TOTP à 6 chiffres
6. Cliquer **Vérifier**

**Résultats attendus**
- Étape 4 : redirection vers page MFA, `mfa_required: true`
- Étape 6 : redirection vers `/admin/dashboard`
- Token JWT + refresh token présents

---

#### TC-AUTH-03 — Échec login mot de passe incorrect

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Refus connexion avec mauvais mot de passe |

**Étapes**
1. Aller sur `/login`
2. Saisir email `texlome@demo.tg`
3. Saisir mot de passe `wrong-password`
4. Cliquer **Se connecter**

**Résultats attendus**
- Message d'erreur "Identifiants invalides"
- Pas de redirection
- Audit log : `LOGIN_ECHEC`

---

#### TC-AUTH-04 — Refresh token

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Rotation du refresh token |

**Étapes**
1. Login réussi (TC-AUTH-01)
2. Attendre expiration access token (15 min)
3. Appeler `POST /auth/refresh` avec refresh token

**Résultats attendus**
- Nouveau access token + nouveau refresh token
- Ancien refresh token révoqué

---

#### TC-AUTH-05 — Logout

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Déconnexion et révocation token |

**Étapes**
1. Login réussi
2. Cliquer **Déconnexion**
3. Tenter d'accéder `/portail/dashboard`

**Résultats attendus**
- Redirection vers `/login`
- Refresh token révoqué en base

---

#### TC-AUTH-06 — Reset password via OTP

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Réinitialisation mot de passe oublié |

**Étapes**
1. Aller sur `/login`, cliquer **Mot de passe oublié**
2. Saisir numéro de téléphone
3. Recevoir OTP par SMS
4. Saisir OTP + nouveau mot de passe
5. Login avec nouveau mot de passe

**Résultats attendus**
- Mot de passe modifié en base
- Anciens refresh tokens révoqués
- Login réussi avec nouveau mot de passe

---

#### TC-AUTH-07 — Changement mot de passe (authentifié)

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Titre | Changement mot de passe avec vérif ancien |

**Étapes**
1. Login P2
2. Aller dans **Profil > Sécurité**
3. Saisir ancien mot de passe + nouveau
4. Valider

**Résultats attendus**
- Mot de passe modifié
- Audit log : `PASSWORD_CHANGED`
- Sessions actives conservées

---

### 3.2 RBAC (TC-RBAC)

#### TC-RBAC-01 — Contrôle d'accès par rôle (matrice complète)

| Champ | Valeur |
|---|---|
| Persona | Tous |
| Titre | Vérification automatisée des @Roles() sur 21 contrôleurs |
| Préconditions | Tests Jest `src/rbac.spec.ts` |

**Étapes**
1. Exécuter `npx jest src/rbac.spec.ts --no-coverage`
2. Vérifier que les 212 tests passent

**Résultats attendus**
- 212 tests passent (metadata alignment + positive + negative + critical assertions)
- Aucun test en échec

---

#### TC-RBAC-02 — CONTRIBUABLE ne peut pas approuver

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Refus approbation par contribuable |

**Étapes**
1. Login P1
2. Tenter `POST /demandes/:id/approuver`

**Résultats attendus**
- HTTP 403 Forbidden
- `{ code: 'ROLE_NON_AUTORISE' }`

---

#### TC-RBAC-03 — AUDITEUR ne peut pas gérer utilisateurs

| Champ | Valeur |
|---|---|
| Persona | P5 |
| Titre | Refus création utilisateur par auditeur |

**Étapes**
1. Login P5
2. Tenter `POST /utilisateurs`

**Résultats attendus**
- HTTP 403 Forbidden

---

#### TC-RBAC-04 — Seul ADMIN_SI peut gérer bases juridiques

| Champ | Valeur |
|---|---|
| Persona | P7 vs P2 |
| Titre | Création base juridique réservée admin |

**Étapes**
1. Login P2 → `POST /bases-juridiques` → 403
2. Login P7 → `POST /bases-juridiques` → 201

**Résultats attendus**
- P2 : 403 Forbidden
- P7 : 201 Created

---

#### TC-RBAC-05 — AGENT_DGBF peut rejeter une demande

| Champ | Valeur |
|---|---|
| Persona | P2c |
| Titre | Agent DGBF autorisé à rejeter |

**Étapes**
1. Login P2c (agent_dgbf)
2. `POST /demandes/:id/rejeter` avec motif + PIN

**Résultats attendus**
- HTTP 200 ou 201
- Demande passée en statut `rejete`

---

#### TC-RBAC-06 — Audit verify-chain restreint

| Champ | Valeur |
|---|---|
| Persona | P5 vs P4 |
| Titre | Verify-chain réservé auditeur + admin |

**Étapes**
1. Login P4 (decideur) → `GET /audit-logs/verify-chain` → 403
2. Login P5 (auditeur) → `GET /audit-logs/verify-chain` → 200
3. Login P7 (admin_si) → `GET /audit-logs/verify-chain` → 200

**Résultats attendus**
- P4 : 403
- P5 : 200 + statut chaîne
- P7 : 200 + statut chaîne

---

### 3.3 MFA Multi-canal (TC-MFA)

#### TC-MFA-01 — Login avec MFA TOTP

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Canal | `totp` |
| Préconditions | MFA activé, canal par défaut = totp |

**Étapes**
1. `POST /auth/login` avec credentials P2
2. Réponse : `{ mfa_required: true, canal: 'totp', mfa_token: '...' }`
3. `POST /auth/mfa/verify` avec `{ mfa_token, code: '123456', canal: 'totp' }`

**Résultats attendus**
- Étape 2 : `mfa_required: true`, `canal: 'totp'`
- Étape 3 : `access_token` + `refresh_token` + `user`

---

#### TC-MFA-02 — Login avec MFA Email

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Canal | `email` |
| Préconditions | MFA activé, canal par défaut = email |

**Étapes**
1. Configurer MFA : `PATCH /admin/mfa/config { defaultChannel: 'email' }`
2. `POST /auth/login` avec credentials P2
3. Code envoyé par email (placeholder en dev : log console)
4. `POST /auth/mfa/verify` avec `{ mfa_token, code: '<code_email>', canal: 'email' }`

**Résultats attendus**
- Étape 2 : `mfa_required: true`, `canal: 'email'`
- Étape 3 : code à 6 chiffres généré et envoyé
- Étape 4 : token pair émis

---

#### TC-MFA-03 — Login avec MFA WhatsApp

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Canal | `whatsapp` |
| Préconditions | MFA activé, canal par défaut = whatsapp, téléphone renseigné |

**Étapes**
1. Configurer MFA : `PATCH /admin/mfa/config { defaultChannel: 'whatsapp' }`
2. `POST /auth/login` avec credentials P2
3. Code envoyé par WhatsApp (placeholder en dev : log console)
4. `POST /auth/mfa/verify` avec `{ mfa_token, code: '<code_whatsapp>', canal: 'whatsapp' }`

**Résultats attendus**
- Étape 2 : `mfa_required: true`, `canal: 'whatsapp'`
- Étape 4 : token pair émis

---

#### TC-MFA-04 — MFA token expiré

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Titre | Token MFA expiré après 5 minutes |

**Étapes**
1. Login → obtenir `mfa_token`
2. Attendre > 5 minutes
3. `POST /auth/mfa/verify` avec le token expiré

**Résultats attendus**
- HTTP 401
- `{ code: 'MFA_TOKEN_EXPIRE' }`

---

#### TC-MFA-05 — Code MFA incorrect

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Titre | Refus avec mauvais code MFA |

**Étapes**
1. Login → obtenir `mfa_token`
2. `POST /auth/mfa/verify` avec code `000000` (incorrect)

**Résultats attendus**
- HTTP 401
- `{ code: 'CODE_MFA_INVALIDE' }`

---

#### TC-MFA-06 — Changement de canal lors de la vérification

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Titre | Vérification avec canal différent du canal par défaut |

**Étapes**
1. Configurer MFA : canal par défaut = `totp`
2. Login → `mfa_token` avec `canal: 'totp'`
3. `POST /auth/mfa/verify` avec `{ mfa_token, code, canal: 'email' }`

**Résultats attendus**
- Si email configuré : token pair émis
- Si email non configuré : `CODE_MFA_INVALIDE`

---

#### TC-MFA-07 — Admin modifie config MFA

| Champ | Valeur |
|---|---|
| Persona | P7 |
| Titre | Modification configuration MFA par admin |

**Étapes**
1. Login P7
2. `PATCH /admin/mfa/config { enabled: true, defaultChannel: 'email', emailEnabled: true }`
3. `GET /admin/mfa/config`

**Résultats attendus**
- Étape 2 : 200 + config mise à jour
- Étape 3 : config reflète les modifications

---

#### TC-MFA-08 — Non-admin ne peut pas modifier config MFA

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Titre | Refus modification config MFA par agent |

**Étapes**
1. Login P2
2. `PATCH /admin/mfa/config`

**Résultats attendus**
- HTTP 403 Forbidden

---

#### TC-MFA-09 — Max tentatives MFA dépassé

| Champ | Valeur |
|---|---|
| Persona | P2 |
| Canal | `email` |
| Titre | Blocage après 5 tentatives incorrectes |

**Étapes**
1. Configurer MFA : canal = `email`, maxAttempts = 5
2. Login → code envoyé par email
3. Tenter 6 fois avec code incorrect

**Résultats attendus**
- Tentatives 1-5 : `CODE_MFA_INVALIDE`
- Tentative 6 : challenge invalidé, code inutilisable

---

#### TC-MFA-10 — Reset MFA par admin

| Champ | Valeur |
|---|---|
| Persona | P7 |
| Titre | Réinitialisation MFA d'un utilisateur |

**Étapes**
1. Login P7
2. `POST /utilisateurs/:id/reset-mfa`
3. Vérifier nouveau secret + QR code

**Résultats attendus**
- 200 + `{ mfaSecret, mfaQrCodeUri }`
- Audit log : `MFA_RESET`

---

### 3.4 Audit Log (TC-AUDIT)

#### TC-AUDIT-01 — Lister audit logs

| Champ | Valeur |
|---|---|
| Persona | P5 |
| Titre | Liste paginée des logs d'audit |

**Étapes**
1. Login P5
2. `GET /audit-logs?page=1&limit=20`

**Résultats attendus**
- 200 + `{ data: [...], meta: { total, page, limit, totalPages } }`
- Chaque entry : `{ id, action, entite, entiteId, utilisateurId, createdAt, hash }`

---

#### TC-AUDIT-02 — Détail d'un audit log

| Champ | Valeur |
|---|---|
| Persona | P5 |
| Titre | Consultation d'une entrée d'audit |

**Étapes**
1. Login P5
2. `GET /audit-logs/:id`

**Résultats attendus**
- 200 + détail complet : `{ id, action, entite, entiteId, utilisateurId, ancienneValeur, nouvelleValeur, hash, hashPrecedent, createdAt }`

---

#### TC-AUDIT-03 — Vérification de la chaîne

| Champ | Valeur |
|---|---|
| Persona | P5 |
| Titre | Vérification intégrité chaîne cryptographique |

**Étapes**
1. Login P5
2. `GET /audit-logs/verify-chain`

**Résultats attendus**
- 200 + `{ valide: true, totalVerifies: N, premierHash: '...', dernierHash: '...' }`
- Si chaîne rompue : `{ valide: false, anomalies: [...] }`

---

#### TC-AUDIT-04 — Accès non-autorisé aux logs

| Champ | Valeur |
|---|---|
| Persona | P1 |
| Titre | Refus accès audit logs par contribuable |

**Étapes**
1. Login P1
2. `GET /audit-logs`

**Résultats attendus**
- HTTP 403 Forbidden

---

#### TC-AUDIT-05 — Verify-chain par décideur

| Champ | Valeur |
|---|---|
| Persona | P4 |
| Titre | Refus verify-chain par décideur |

**Étapes**
1. Login P4
2. `GET /audit-logs/verify-chain`

**Résultats attendus**
- HTTP 403 Forbidden (réservé `auditeur` + `admin_si`)

---

#### TC-AUDIT-06 — Audit log généré par action métier

| Champ | Valeur |
|---|---|
| Persona | P1 → P2 → P4 |
| Titre | Vérifier qu'une action métier crée une entrée d'audit |

**Étapes**
1. P1 crée une demande → audit `DEMANDE_CREEE`
2. P2 prend en charge → audit `DEMANDE_PRISE_EN_CHARGE`
3. P4 approuve → audit `DEMANDE_APPROUVEE`
4. P5 liste les logs et vérifie les 3 entrées

**Résultats attendus**
- 3 entrées d'audit présentes avec hash chaînés
- Chaîne valide

---

## 4. Cas de test par persona

### 4.1 P1 — Contribuable

#### TC-P1-01 — Création de demande d'exonération

**Étapes**
1. Login P1
2. Aller sur **Nouvelle demande**
3. Sélectionner le type d'exonération
4. Remplir le formulaire (mesure, base juridique, montant)
5. Sauvegarder en brouillon
6. Soumettre la demande

**Résultats attendus**
- Demande créée en statut `brouillon` puis `soumise`
- Numéro de demande généré
- Audit log créé

---

#### TC-P1-02 — Upload de pièces jointes

**Étapes**
1. Login P1
2. Ouvrir une demande existante
3. Ajouter une pièce jointe (PDF, < 5 MB)
4. Vérifier la liste des pièces

**Résultats attendus**
- Fichier uploadé avec statut `en_attente`
- Liste mise à jour

---

#### TC-P1-03 — Suivi de demande

**Étapes**
1. Login P1
2. Consulter la liste de ses demandes
3. Ouvrir le détail d'une demande en cours

**Résultats attendus**
- Statut visible (soumise, en_instruction, approuvee, rejete)
- Historique des étapes affiché
- Décisions visibles

---

#### TC-P1-04 — Complétion de demande (demande de complément)

**Étapes**
1. P2 demande un complément sur la demande
2. P1 reçoit une notification
3. P1 complète la demande (ajout pièces/info)
4. P1 resoumet

**Résultats attendus**
- Notification reçue par P1
- Demande repasse en statut `soumise`
- Audit log créé

---

#### TC-P1-05 — Profil contribuable et complétude

**Étapes**
1. Login P1
2. Aller sur **Mon profil**
3. Vérifier le score de complétude
4. Compléter les champs manquants
5. Vérifier recalcul du score

**Résultats attendus**
- Score de complétude affiché (0-100%)
- Mise à jour des champs incrémente le score
- Lock à 100% quand tous les champs requis sont remplis

---

#### TC-P1-06 — Réception de notification

**Étapes**
1. P2 effectue une action sur la demande de P1
2. P1 consulte ses notifications

**Résultats attendus**
- Notification présente dans la liste
- Marquage comme lu fonctionnel

---

### 4.2 P2 — Agent instructeur

#### TC-P2-01 — Liste des demandes à instruire

**Étapes**
1. Login P2
2. Consulter la file de demandes assignées

**Résultats attendus**
- Demandes filtrées par secteur d'affectation
- Statuts visibles
- Actions disponibles (prendre en charge, demander complément)

---

#### TC-P2-02 — Prise en charge d'une demande

**Étapes**
1. Login P2
2. Sélectionner une demande `soumise`
3. Cliquer **Prendre en charge**

**Résultats attendus**
- Demande passe en `en_instruction`
- Agent assigné à la demande
- Audit log créé

---

#### TC-P2-03 — Demande de complément

**Étapes**
1. P2 ouvre une demande en instruction
2. Cliquer **Demander complément**
3. Saisir le motif
4. Valider

**Résultats attendus**
- Demande passe en `complement_demande`
- Notification envoyée au P1
- Audit log créé

---

#### TC-P2-04 — Validation de pièces jointes

**Étapes**
1. P2 ouvre une demande
2. Consulter les pièces jointes
3. Valider une pièce
4. Invalider une autre pièce avec motif

**Résultats attendus**
- Pièce validée : statut `valide`
- Pièce invalidée : statut `invalide` + motif
- Audit log créé pour chaque action

---

#### TC-P2-05 — Rejet d'une demande

**Étapes**
1. P2 ouvre une demande en instruction
2. Cliquer **Rejeter**
3. Saisir le motif
4. Saisir le PIN de signature
5. Valider

**Résultats attendus**
- Demande passe en `rejete`
- Décision enregistrée avec motif
- Audit log créé
- Notification envoyée au P1

---

### 4.3 P3 — Agence

#### TC-P3-01 — Liste des conventions

**Étapes**
1. Login P3
2. Aller sur **Conventions**
3. Filtrer par statut / périmètre

**Résultats attendus**
- Liste des conventions du périmètre de l'agence
- Détails visibles

---

#### TC-P3-02 — Renouvellement de convention

**Étapes**
1. P3 ouvre une convention expirée ou expirant
2. Cliquer **Renouveler**
3. Saisir nouvelle date d'échéance
4. Valider

**Résultats attendus**
- Convention renouvelée
- Nouvelle date d'échéance enregistrée
- Audit log créé

---

### 4.4 P4 — Décideur

#### TC-P4-01 — Tableau de bord P4

**Étapes**
1. Login P4
2. Consulter le dashboard P4

**Résultats attendus**
- KPIs affichés : nombre de demandes, montants, taux d'approbation
- Graphiques visibles
- Filtres par période fonctionnels

---

#### TC-P4-02 — Approbation d'une demande

**Étapes**
1. Login P4
2. Ouvrir une demande en attente de décision
3. Cliquer **Approuver**
4. Saisir le PIN de signature
5. Valider

**Résultats attendus**
- Demande passe en `approuvee`
- Décision enregistrée
- Attestation générée
- Audit log créé

---

#### TC-P4-03 — Génération d'attestation

**Étapes**
1. P4 approuve une demande (TC-P4-02)
2. Aller sur **Attestations**
3. Générer l'attestation pour l'acte approuvé

**Résultats attendus**
- Attestation PDF générée
- Numéro d'attestation unique
- Téléchargement possible

---

### 4.5 P5 — Auditeur

#### TC-P5-01 — Consultation des audit logs

(Voir TC-AUDIT-01 à TC-AUDIT-06)

---

#### TC-P5-02 — Tableau de bord P5

**Étapes**
1. Login P5
2. Consulter le dashboard P5

**Résultats attendus**
- KPIs audit : nombre d'actions, anomalies détectées
- Graphiques temporels

---

#### TC-P5-03 — Détection d'anomalies

**Étapes**
1. Login P5
2. Aller sur **Anomalies**
3. Consulter la liste
4. Traiter une anomalie

**Résultats attendus**
- Liste des anomalies affichée
- Traitement possible (marquer comme résolue)

---

### 4.6 P7 — Admin SI

#### TC-P7-01 — Gestion des utilisateurs

**Étapes**
1. Login P7
2. Aller sur **Utilisateurs**
3. Créer un nouvel utilisateur
4. Modifier un utilisateur
5. Réinitialiser MFA d'un utilisateur

**Résultats attendus**
- Création : mot de passe temporaire + secret MFA générés
- Modification : champs modifiables
- Reset MFA : nouveau secret + QR code générés
- Audit log pour chaque action

---

#### TC-P7-02 — Gestion des workflows

**Étapes**
1. Login P7
2. Aller sur **Workflows**
3. Créer un template de workflow
4. Ajouter des étapes
5. Activer le template

**Résultats attendus**
- Template créé avec étapes
- Template activable/désactivable

---

#### TC-P7-03 — Gestion des bases juridiques

**Étapes**
1. Login P7
2. Aller sur **Bases juridiques**
3. Créer une nouvelle base juridique
4. Créer une version
5. Importer en masse

**Résultats attendus**
- Création : base juridique avec version
- Version : incrément de version
- Import : fichier CSV/Excel traité

---

#### TC-P7-04 — Gestion des quotas

**Étapes**
1. Login P7
2. Aller sur **Quotas**
3. Créer un quota
4. Ajouter un mouvement (consommation)

**Résultats attendus**
- Quota créé avec plafond
- Mouvement enregistré
- Solde recalculé

---

#### TC-P7-05 — Configuration MFA

(Voir TC-MFA-07 à TC-MFA-10)

---

#### TC-P7-06 — Gestion des jobs

**Étapes**
1. Login P7
2. Aller sur **Jobs**
3. Vérifier le heartbeat
4. Lancer l'archivage

**Résultats attendus**
- Heartbeat : statut des jobs actifs
- Archivage : demandes archivées

---

## 5. Matrice de couverture RBAC

### 5.1 Endpoints publics (sans auth)

| Endpoint | Méthode | Accès |
|---|---|---|
| `/auth/login` | POST | Public |
| `/auth/mfa/verify` | POST | Public (avec mfa_token) |
| `/auth/password/reset` | POST | Public (avec OTP) |
| `/attestations/verifier/:numero` | GET | Public |

### 5.2 Endpoints authentifiés (tous rôles)

| Endpoint | Méthode | Rôles |
|---|---|---|
| `/demandes` | GET | Tous sauf `public` |
| `/demandes/:id` | GET | Tous sauf `public` |
| `/notifications` | GET | Tous sauf `public` |
| `/notifications/:id/lue` | PATCH | Tous sauf `public` |
| `/audit-logs` | GET | `auditeur`, `decideur`, `admin_si` |
| `/audit-logs/:id` | GET | `auditeur`, `decideur`, `admin_si` |
| `/audit-logs/verify-chain` | GET | `auditeur`, `admin_si` |

### 5.3 Endpoints restreints

| Endpoint | Méthode | Rôles autorisés |
|---|---|---|
| `/demandes` | POST | `contribuable`, `admin_si` |
| `/demandes/:id/approuver` | POST | `decideur`, `admin_si` |
| `/demandes/:id/rejeter` | POST | `agent_ci`, `agent_cddi`, `agent_dgbf`, `agent_agence`, `agent_mae`, `agent_dgmg`, `decideur`, `admin_si` |
| `/demandes/:id/archiver` | POST | `admin_si` |
| `/utilisateurs` | GET/POST | `admin_si` |
| `/bases-juridiques` | POST | `admin_si` |
| `/jobs/*` | ALL | `admin_si` |
| `/admin/mfa/config` | GET/PATCH | `admin_si` |
| `/attestations/actes/:id` | POST | `decideur`, `admin_si` |
| `/rapports/generer` | POST | `admin_si`, `agent_ministere`, `decideur` |

---

## 6. Tests non-fonctionnels

### 6.1 Performance

| ID | Test | Objectif | Seuil |
|---|---|---|---|
| PERF-01 | Temps de login | Login + MFA | < 2s |
| PERF-02 | Liste de demandes | 1000 demandes en base | < 1s |
| PERF-03 | Génération attestation | PDF generation | < 5s |
| PERF-04 | Audit log listing | 10000 logs | < 2s |
| PERF-05 | Verify-chain | 10000 logs | < 5s |

### 6.2 Sécurité

| ID | Test | Objectif |
|---|---|---|
| SEC-01 | JWT expiré | Refus après 15 min |
| SEC-02 | Refresh token révoqué | Refus après logout |
| SEC-03 | PIN requis pour signature | Refus sans PIN |
| SEC-04 | Throttle login | Max 10 tentatives/min |
| SEC-05 | Throttle MFA | Max 5 tentatives |
| SEC-06 | Chiffrement MFA secret | AES-256-GCM |
| SEC-07 | Hash chaîne audit | SHA-256 chaîné |
| SEC-08 | OTP hashé en base | SHA-256 + sel |
| SEC-09 | MFA challenge hashé | SHA-256 + sel |
| SEC-10 | RBAC sur tous les endpoints | Aucun endpoint sans guard |

---

## 7. Checklist de recette finale

### 7.1 Avant exécution

- [ ] Backend compile (`tsc --noEmit`)
- [ ] Frontend compile
- [ ] Prisma client généré
- [ ] Migrations appliquées (005 inclus)
- [ ] Seed users présents
- [ ] Variables d'environnement configurées
- [ ] Services démarrés (backend + frontend)

### 7.2 Tests automatisés

- [ ] Tests unitaires backend : 284+ tests passent
- [ ] Tests RBAC : 212 tests passent
- [ ] Tests guard RBAC : 3 tests passent
- [ ] Tests auth + MFA : tous passent
- [ ] Tests E2E Playwright : tous passent
- [ ] Aucune erreur console

### 7.3 Tests manuels

- [ ] TC-AUTH-01 à 07 : 7/7 PASS
- [ ] TC-RBAC-01 à 06 : 6/6 PASS
- [ ] TC-MFA-01 à 10 : 10/10 PASS
- [ ] TC-AUDIT-01 à 06 : 6/6 PASS
- [ ] TC-P1-01 à 06 : 6/6 PASS
- [ ] TC-P2-01 à 05 : 5/5 PASS
- [ ] TC-P3-01 à 02 : 2/2 PASS
- [ ] TC-P4-01 à 03 : 3/3 PASS
- [ ] TC-P5-01 à 03 : 3/3 PASS
- [ ] TC-P7-01 à 06 : 6/6 PASS
- [ ] PERF-01 à 05 : 5/5 PASS
- [ ] SEC-01 à 10 : 10/10 PASS

### 7.4 Validation finale

- [ ] Tous les cas en statut PASS
- [ ] Aucune anomalie critique ouverte
- [ ] Rapport de recette généré
- [ ] Captures d'écran archivées
- [ ] Validation MOA signée

---

## 8. Suivi des anomalies

| # | Date | Cas de test | Description | Sévérité | Statut | Fix |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

> Format : ajouter une ligne par anomalie détectée pendant la recette.

---

## 9. Résumé exécutif

| Catégorie | Total cas | Seuil attendu |
|---|---:|---:|
| Auth | 7 | 7/7 |
| RBAC | 6 | 6/6 |
| MFA | 10 | 10/10 |
| Audit | 6 | 6/6 |
| P1 Contribuable | 6 | 6/6 |
| P2 Agent | 5 | 5/5 |
| P3 Agence | 2 | 2/2 |
| P4 Décideur | 3 | 3/3 |
| P5 Auditeur | 3 | 3/3 |
| P7 Admin | 6 | 6/6 |
| Performance | 5 | 5/5 |
| Sécurité | 10 | 10/10 |
| **Total** | **69** | **69/69 (100%)** |
