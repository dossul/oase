# OASE-14 à 18 — Contrats API

> **Issues Plane :** OASE-14 (Auth), OASE-15 (Bénéficiaire), OASE-16 (Instruction), OASE-17 (Dashboards), OASE-18 (Administration)  
> **Date :** 2026-06-16  
> **Sources :** OASE-8 (RBAC), OASE-9 (Architecture), OASE-10 (Modules), OASE-11 (Schéma)  
> **Base URL :** `https://oase.mef.tg/api/v1`  
> **Format :** Toutes les réponses suivent l'enveloppe `{ data, meta }` ou `{ error }`.

---

## Conventions générales

```
Authorization : Bearer <access_token>   (sauf routes /public et /auth/login)
Content-Type  : application/json
Accept        : application/json

Codes HTTP :
  200 OK | 201 Created | 204 No Content
  400 Bad Request | 401 Unauthorized | 403 Forbidden
  404 Not Found | 409 Conflict | 422 Unprocessable Entity
  429 Too Many Requests | 500 Internal Server Error
```

---

## OASE-14 — API Auth

### POST `/auth/login`
Authentification email + mot de passe. Retourne un token temporaire si MFA requis.

**Body**
```json
{ "email": "k.agbodjan@otr.tg", "password": "Oase@2026!" }
```

**Réponse 200 — MFA non requis (P1)**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900,
    "user": {
      "id": "uuid", "nom": "Agbodjan", "prenom": "Kossi",
      "role": "agent_ci", "institution": "OTR — Centre des Impôts"
    }
  }
}
```

**Réponse 200 — MFA requis (P2/P4/P5/P7)**
```json
{
  "data": {
    "mfa_required": true,
    "mfa_token": "tmp_eyJ...",
    "expires_in": 300
  }
}
```

**Erreurs**
```
401 : { "error": { "code": "CREDENTIALS_INVALIDES", "message": "Email ou mot de passe incorrect." } }
429 : { "error": { "code": "TROP_DE_TENTATIVES", "message": "Compte temporairement verrouillé (5 min)." } }
```

---

### POST `/auth/mfa/verify`
Valide le code TOTP et retourne les tokens définitifs.

**Body**
```json
{ "mfa_token": "tmp_eyJ...", "code": "847291" }
```

**Réponse 200**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900
  }
}
```

**Erreurs**
```
401 : { "error": { "code": "CODE_MFA_INVALIDE" } }
401 : { "error": { "code": "MFA_TOKEN_EXPIRE" } }
```

---

### POST `/auth/refresh`
Rotation du refresh token.

**Body** `{ "refresh_token": "eyJ..." }`

**Réponse 200** → nouveau `access_token` + `refresh_token`

**Erreurs** `401 REFRESH_TOKEN_INVALIDE | REFRESH_TOKEN_REVOQUE`

---

### POST `/auth/logout`
Révoque le refresh token courant.

**Body** `{ "refresh_token": "eyJ..." }`  
**Réponse 204**

---

### POST `/auth/pin/set`
Définit ou change le PIN de signature (4-6 chiffres).

**Body** `{ "pin": "123456", "pin_confirm": "123456", "current_pin": "000000" }`  
**Réponse 200** `{ "data": { "message": "PIN mis à jour avec succès." } }`

---

### GET `/auth/me`
Profil et permissions de l'utilisateur courant.

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "nom": "Agbodjan", "prenom": "Kossi",
    "email": "k.agbodjan@otr.tg",
    "role": "agent_ci",
    "institution": { "code": "OTR_CI", "nom": "OTR — Centre des Impôts" },
    "mfa_active": true,
    "permissions": ["demandes:READ", "demandes:PRENDRE_EN_CHARGE", "demandes:APPROUVER_ETAPE"]
  }
}
```

---

## OASE-15 — API Bénéficiaire (P1)

### POST `/beneficiaires`
Créer son profil bénéficiaire.

**Body**
```json
{
  "raison_sociale": "TEXLOME SA",
  "nif": "TG-LOM-2018-B-0042",
  "rccm": "TG-LOM-2018-B-0042",
  "type_beneficiaire": "entreprise_privee",
  "secteur": "Industrie textile",
  "region": "Maritime",
  "email_contact": "direction@texlome.tg"
}
```

**Erreurs**
```
409 : { "error": { "code": "NIF_DEJA_UTILISE" } }
422 : { "error": { "code": "NIF_FORMAT_INVALIDE", "details": ["Format attendu : TG-XXX-YYYY-X-NNNN"] } }
```

---

### GET `/beneficiaires/me`
Profil + statut fiscal courant.

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "raison_sociale": "TEXLOME SA",
    "nif": "TG-LOM-2018-B-0042",
    "statut_fiscal": "conforme",
    "derniere_sync_fiscal": "2026-06-16T06:00:00Z",
    "nb_demandes_actives": 3
  }
}
```

---

### GET `/demandes` (scope P1)
Mes demandes avec filtres.

**Query params**
```
?statut=en_instruction,soumis
&page=1&limit=20
&sort=created_at&order=desc
&search=OASE-2024
```

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "OASE-2024-000002",
      "base_juridique": {
        "code_mesure": "MRD-2024-0042",
        "libelle": "Exonération de droit de douane sur équipements industriels",
        "nature_mesure": "Exoneration",
        "impot_concerne": "Droit de Douane (DD)"
      },
      "statut": "en_instruction",
      "montant_fcfa": 15000000,
      "date_depot": "2026-05-10T08:30:00Z",
      "etape_actuelle": "Contrôle conformité juridique"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "took_ms": 8 }
}
```

---

### POST `/demandes` (créer brouillon)

**Body**
```json
{
  "base_juridique_id": "uuid-bj",
  "montant_fcfa": 15000000,
  "secteur": "Industrie",
  "date_echeance": "2026-09-30"
}
```

**Erreurs**
```
403 : STATUT_FISCAL_DETTE_ACTIVE
422 : MESURE_INACTIVE
422 : MONTANT_REQUIS
```

---

### POST `/demandes/:id/soumettre`
Soumet le brouillon après upload des pièces.

**Body** `{}`  
**Erreurs**
```
422 : PIECES_RANG_UN_MANQUANTES  { "details": ["NIF", "RCCM"] }
422 : MONTANT_NEGATIF
403 : STATUT_FISCAL_DETTE_ACTIVE
```

---

### POST `/pieces-jointes/upload`
Upload multipart.

**Form data** : `file` (max 10MB) + `demande_id` + `categorie` + `rang`

**Réponse 201**
```json
{
  "data": {
    "id": "uuid",
    "nom_fichier": "rccm-texlome.pdf",
    "hash_sha256": "a3f2...",
    "taille_octets": 524288,
    "rang": "premier",
    "categorie": "RCCM"
  }
}
```

---

### GET `/attestations/:id/download`
URL signée de l'attestation approuvée (TTL 15 min).

**Réponse 200** `{ "data": { "url": "https://s3.mef.tg/signed/...", "expires_at": "..." } }`

---

## OASE-16 — API Instruction (P2/P3)

### GET `/demandes` (scope P2/P3)
Liste avec RLS appliqué selon `organe_gestion`.

**Query params supplémentaires**
```
?statut=soumis,en_instruction,action_requise
&base_juridique_type=Code Général des Impôts
&date_from=2026-01-01&date_to=2026-06-30
&montant_min=1000000&montant_max=100000000
```

---

### POST `/demandes/:id/prendre-en-charge`

**Body** `{}`  
**Réponse 200** → demande mise à jour avec `statut: "en_instruction"`, `instructeur_id` affecté

**Erreurs**
```
403 : ROLE_INCOMPATIBLE_ORGANE_GESTION
409 : DEMANDE_DEJA_PRISE_EN_CHARGE
```

---

### POST `/demandes/:id/demander-complement`

**Body** `{ "motif": "Le RCCM fourni est expiré depuis le 01/01/2026. Merci de fournir le RCCM renouvelé." }`

**Réponse 200** → statut `action_requise`, notification P1 envoyée

---

### POST `/workflow/etapes/:id/valider`

**Body** `{ "commentaire": "Conformité juridique vérifiée.", "pin": "123456" }`  
**Réponse 200** → étape `valide`, demande passe à l'étape suivante

**Erreurs** `401 PIN_INVALIDE | 422 ETAPE_NON_EN_COURS`

---

### POST `/workflow/etapes/:id/rejeter`

**Body** `{ "motif": "Dossier incomplet — pièces insuffisantes.", "pin": "123456" }`  
**Réponse 200** → étape `rejete`, demande → `rejete`

---

### POST `/demandes/:id/approuver`
Approbation finale — uniquement `decideur`.

**Body** `{ "pin": "123456", "commentaire": "Dossier complet et conforme." }`

**Réponse 200**
```json
{
  "data": {
    "decision_id": "uuid",
    "type": "approbation",
    "attestation_url": "https://s3.mef.tg/attestations/OASE-2024-000002.pdf",
    "qr_code_hash": "b7e3a...",
    "date_decision": "2026-06-16T14:30:00Z"
  }
}
```

**Erreurs**
```
403 : ROLE_INSUFFISANT
422 : ETAPES_WORKFLOW_INCOMPLETES
422 : ANOMALIE_CRITIQUE_NON_RESOLUE  { "anomalie_id": "uuid" }
422 : QUOTA_EPUISE  { "quota_id": "uuid", "consomme": 8500000000, "total": 10000000000 }
401 : PIN_INVALIDE
```

---

### POST `/demandes/:id/rejeter`

**Body** `{ "motif_rejet": "NIF non reconnu dans la base OTR.", "pin": "123456" }`

---

### GET `/demandes/:id`
Détail complet d'une demande.

**Réponse 200**
```json
{
  "data": {
    "id": "uuid",
    "reference": "OASE-2024-000002",
    "statut": "en_instruction",
    "base_juridique": {
      "code_mesure": "MRD-2024-0042",
      "libelle": "Exonération DD équipements industriels",
      "nature_mesure": "Exoneration",
      "impot_concerne": "Droit de Douane (DD)",
      "organe_gestion": "CDDI",
      "mode_instruction": "automatique",
      "systeme_information": "Sydonia World",
      "portee_categorie": "Temporaire_Phase",
      "conformite_directive_uemoa": "oui"
    },
    "beneficiaire": {
      "raison_sociale": "TEXLOME SA",
      "nif": "TG-LOM-2018-B-0042",
      "statut_fiscal": "conforme",
      "type_beneficiaire": "entreprise_privee"
    },
    "instructeur": { "nom": "Agbodjan", "prenom": "Kossi", "role": "agent_ci" },
    "montant_fcfa": 15000000,
    "etape_actuelle": "Contrôle conformité juridique",
    "etapes": [
      { "ordre": 1, "nom": "Vérification pièces P1", "statut": "valide", "date_fin": "2026-05-12T10:00:00Z" },
      { "ordre": 2, "nom": "Contrôle conformité juridique", "statut": "en_cours" },
      { "ordre": 3, "nom": "Visa DGBF", "statut": "en_attente" },
      { "ordre": 4, "nom": "Approbation finale UPF/MEF", "statut": "en_attente" }
    ],
    "pieces_jointes": [
      { "nom_fichier": "nif-texlome.pdf", "rang": "premier", "categorie": "NIF", "est_valide": true },
      { "nom_fichier": "rccm-texlome.pdf", "rang": "premier", "categorie": "RCCM", "est_valide": true }
    ],
    "anomalies": [],
    "quota": { "consomme": 1250000000, "total": 5000000000, "pourcentage": 25 }
  }
}
```

---

## OASE-17 — API Tableaux de bord

### GET `/demandes/stats/par-statut`
KPIs globaux pour dashboards P4/P5/admin.

**Réponse 200**
```json
{
  "data": {
    "par_statut": {
      "brouillon": 12, "soumis": 8, "en_instruction": 24,
      "action_requise": 5, "approuve": 187, "rejete": 43,
      "expire": 7, "archive": 312
    },
    "montant_total_approuve_fcfa": 48750000000,
    "delai_moyen_traitement_jours": 12.4,
    "taux_approbation_pct": 81.3,
    "par_type_texte": {
      "Code Général des Impôts": 142,
      "Accord de siège": 89,
      "Zone Franche": 67,
      "Code des Investissements": 38,
      "Code Minier": 22
    },
    "par_nature_mesure": {
      "Exoneration": 287, "Exemption": 42, "Abattement": 18,
      "Taux_reduit": 11
    },
    "periode": { "debut": "2024-01-01", "fin": "2026-06-16" }
  }
}
```

---

### GET `/quotas`
Vue globale des quotas avec alertes.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "base_juridique": { "code_mesure": "MRD-2024-0100", "libelle": "Exonération IS Zone Franche" },
      "type_quota": "global_mesure",
      "total_fcfa": 10000000000,
      "consomme_fcfa": 8500000000,
      "pourcentage": 85,
      "alerte": true,
      "alerte_seuil_pct": 80
    }
  ]
}
```

---

### GET `/connecteurs/health`
Statut temps réel de tous les connecteurs.

**Réponse 200**
```json
{
  "data": [
    { "code": "SYDONIA",  "statut": "actif",       "latence_ms": 120, "taux_erreur": 0.5, "dernier_sync": "2026-06-16T07:00:00Z" },
    { "code": "ETAX",     "statut": "actif",        "latence_ms": 85,  "taux_erreur": 0.2, "dernier_sync": "2026-06-16T07:00:00Z" },
    { "code": "SIGFIP",   "statut": "actif",        "latence_ms": 210, "taux_erreur": 1.1, "dernier_sync": "2026-06-16T07:00:00Z" },
    { "code": "GUDEF",    "statut": "maintenance",  "latence_ms": 0,   "taux_erreur": 0.0, "dernier_sync": "2026-06-14T12:00:00Z" },
    { "code": "DAS",      "statut": "erreur",       "latence_ms": 5000,"taux_erreur": 12.5,"dernier_sync": "2026-06-16T05:45:00Z" }
  ]
}
```

---

### GET `/anomalies/stats`

**Réponse 200**
```json
{
  "data": {
    "par_gravite": { "critique": 2, "elevee": 8, "moyenne": 15, "faible": 23 },
    "par_statut":  { "nouvelle": 12, "en_examen": 6, "traitee": 28, "classee": 2 },
    "par_categorie": { "juridique": 18, "financiere": 12, "temporelle": 9, "procedurale": 9 }
  }
}
```

---

## OASE-18 — API Administration (P7)

### GET `/utilisateurs`

**Query** `?role=agent_ci&institution=OTR_CI&statut=actif&page=1&limit=20`

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid", "nom": "Agbodjan", "prenom": "Kossi",
      "email": "k.agbodjan@otr.tg", "role": "agent_ci",
      "institution": "OTR — Centre des Impôts",
      "statut": "actif", "mfa_active": true,
      "derniere_connexion": "2026-06-16T08:15:00Z"
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 20 }
}
```

---

### POST `/utilisateurs`

**Body**
```json
{
  "nom": "Togbevi", "prenom": "Essi",
  "email": "e.togbevi@otr.tg",
  "role": "agent_ci",
  "institution_id": "uuid-otr-ci",
  "mfa_active": true
}
```
**Réponse 201** → utilisateur créé, email d'activation envoyé

---

### PATCH `/utilisateurs/:id`

**Body** (champs modifiables) `{ "role": "agent_dgbf", "statut": "inactif" }`

**Erreurs** `403 MODIFICATION_ROLE_INTERDIT | 409 DERNIER_ADMIN`

---

### POST `/utilisateurs/:id/reset-mfa`
Régénère le secret TOTP → retourne QR Code pour re-scan.

**Réponse 200** `{ "data": { "qr_code_url": "data:image/png;base64,..." } }`

---

### GET `/bases-juridiques/import/mrd` → POST
Import bulk CSV/JSON du MRD (admin uniquement).

**Body** `multipart/form-data` — fichier CSV ou JSON  
**Réponse 202**
```json
{
  "data": {
    "job_id": "uuid",
    "statut": "en_cours",
    "lignes_total": 1316,
    "lignes_importees": 0,
    "message": "Import en cours en arrière-plan."
  }
}
```

### GET `/bases-juridiques/import/:job_id/status`
Suivi de l'import en cours.

**Réponse 200**
```json
{
  "data": {
    "statut": "termine",
    "lignes_importees": 1316,
    "lignes_ignorees": 4,
    "erreurs": [
      { "ligne": 42, "raison": "code_mesure déjà existant — ignoré (SCD T2 requis)" }
    ]
  }
}
```

---

## API publique (sans authentification)

### GET `/public/stats`
```json
{
  "data": {
    "nb_mesures_actives": 1298,
    "nb_demandes_2025": 312,
    "montant_estime_depenses_fiscales_fcfa": 48750000000,
    "top_impots": ["TVA", "IRPP", "IS", "DD", "Taxe Foncière"],
    "derniere_mise_a_jour": "2026-06-16T06:00:00Z"
  }
}
```

### POST `/public/attestations/verifier`
**Body** `{ "hash": "b7e3a..." }`

**Réponse 200**
```json
{
  "data": {
    "valide": true,
    "reference": "OASE-2024-000002",
    "date_decision": "2026-06-16T14:30:00Z",
    "type_mesure": "Exonération DD équipements industriels",
    "statut_mesure": "active"
  }
}
```

---

*Livrables OASE-14 à 18 — API Contracts complets.*  
*Alimente OASE-19 (Auth implementation), OASE-20 (Audit), OASE-42 à 51 (Tests E2E).*
