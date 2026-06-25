# OASE-30 & 31 — Inventaire formulaires + règles de validation

> **Issues Plane :** OASE-30 (inventaire), OASE-31 (validation)  
> **Date :** 2026-06-16

---

## F-01 · Formulaire de connexion

| Champ | Type | Requis | Validation frontend | Validation backend |
|---|---|---|---|---|
| `email` | email | ✅ | Format email RFC 5322 | Existence en DB |
| `password` | password | ✅ | Min 8 car. | bcrypt compare |

**Soumission :** `POST /auth/login`  
**Erreurs :** `CREDENTIALS_INVALIDES` · `TROP_DE_TENTATIVES` (429)

---

## F-02 · Vérification MFA

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `code` | text (6 chiffres) | ✅ | Exactement 6 chiffres `[0-9]{6}` · Saisie auto-submit à 6 car. |

---

## F-03 · Définir / modifier PIN

| Champ | Type | Requis | Validation frontend | Validation backend |
|---|---|---|---|---|
| `current_pin` | password | si PIN existant | 4–6 chiffres | bcrypt compare |
| `pin` | password | ✅ | `/^\d{4,6}$/` | |
| `pin_confirm` | password | ✅ | Identique à `pin` | |

**Règle :** PIN ≠ 4 chiffres identiques (`1111`, `2222`…) ni séquences `1234`, `0000`

---

## F-04 · Création profil bénéficiaire

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `raison_sociale` | text | ✅ | 3–200 car. |
| `nif` | text | ✅ | Format `TG-[A-Z]{2,4}-\d{4}-[A-Z]-\d{4}` |
| `rccm` | text | ✅ | Non vide · ≤ 100 car. |
| `type_beneficiaire` | select | ✅ | Enum `TypeBeneficiaire` |
| `secteur` | text | ✅ | Min 2 car. |
| `region` | select | ✅ | Enum régions Togo (Maritime, Plateaux, Centrale, Kara, Savanes) |
| `email_contact` | email | ✅ | Format email |
| `telephone` | tel | ✅ | Format `+228 XX XX XX XX` |

---

## F-05 · Nouvelle demande — Étape 1 : sélection base juridique

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `base_juridique_id` | search/select | ✅ | UUID valide · Mesure `est_active = true` |
| Filtre `type_texte` | select | Non | Enum `TypeTexteLegal` |
| Filtre `nature_mesure` | select | Non | Enum `NatureMesure` |
| Filtre `impot_concerne` | text search | Non | |

**Règle bloquante :** Mesure inactive → message "Cette mesure n'est plus applicable depuis le [date]"

---

## F-06 · Nouvelle demande — Étape 2 : informations + pièces

| Champ | Type | Requis | Validation frontend | Validation backend |
|---|---|---|---|---|
| `montant_fcfa` | number | ✅ | > 0 · ≤ 999 999 999 999 · Entier | > 0 |
| `date_echeance` | date | Non | ≥ aujourd'hui + 7 jours | Format ISO |
| `description_projet` | textarea | Non | Max 2000 car. | |
| **Pièces rang 1** | file (multiple) | ✅ selon base jur. | MIME: PDF/JPEG/PNG · Taille ≤ 10MB · Min 1 fichier par catégorie rang 1 | SHA-256 · Anti-virus scan |
| **Pièces rang 2** | file (multiple) | Non | MIME: PDF/JPEG/PNG · Taille ≤ 10MB | |

**Catégories pièces rang 1 obligatoires (variables par mesure) :**
- NIF (copie certifiée)
- RCCM (en cours de validité)
- Attestation fiscale OTR (< 3 mois)
- Statut de la société

---

## F-07 · Nouvelle demande — Étape 3 : soumission

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `declaration_honneur` | checkbox | ✅ | Doit être coché (true) |

**Garde-fous avant soumission (backend) :**
1. `statut_fiscal !== 'dette_active'` — sinon `403 STATUT_FISCAL_DETTE_ACTIVE`
2. Toutes les pièces rang 1 présentes — sinon `422 PIECES_RANG_UN_MANQUANTES`
3. `montant_fcfa > 0` — sinon `422 MONTANT_INVALIDE`
4. Quota non épuisé à 100% — sinon `422 QUOTA_EPUISE`

---

## F-08 · Répondre à une demande de complément

| Champ | Type | Requis | Validation |
|---|---|---|---|
| Nouvelles pièces | file | ✅ ≥ 1 | Idem F-06 |
| `commentaire_reponse` | textarea | Non | Max 1000 car. |

---

## F-09 · Validation d'une étape workflow (P2)

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `commentaire` | textarea | Non | Max 2000 car. |
| `pin` | password | ✅ | `[0-9]{4,6}` · vérifié bcrypt |

**Règles :** Étape doit être `en_cours` · Utilisateur affecté à l'organe de l'étape

---

## F-10 · Demande de complément (P2 → P1)

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `motif` | textarea | ✅ | 20–2000 car. · Doit être explicite |

**Effet :** Demande → `action_requise` · Notification P1 envoyée

---

## F-11 · Approbation / Rejet final (P2/P4)

| Champ | Type | Requis | Validation frontend | Validation backend |
|---|---|---|---|---|
| `commentaire` | textarea | Non | Max 2000 car. | |
| `motif_rejet` | textarea | si Rejet | Min 20 car. | |
| `pin` | password | ✅ | `[0-9]{4,6}` | bcrypt verify |

**Guards backend avant approbation :**
- `ETAPES_WORKFLOW_INCOMPLETES` si étapes non toutes validées
- `ANOMALIE_CRITIQUE_NON_RESOLUE` si anomalie critique ouverte
- `QUOTA_EPUISE` si quota 100%
- `PIN_INVALIDE` si PIN incorrect

---

## F-12 · Création utilisateur (P7)

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `nom` | text | ✅ | 2–100 car. · `[a-zA-ZÀ-ÿ\s\-]+` |
| `prenom` | text | ✅ | Idem |
| `email` | email | ✅ | Format · Unicité en DB |
| `role` | select | ✅ | Enum `Role` (15 valeurs) |
| `institution_id` | select | ✅ | UUID institution active |
| `secteur_affecte` | text | Non | Requis si rôle = agence_api / agence_zatp / agent_minier |
| `mfa_active` | checkbox | ✅ | Obligatoire pour P2→P7 (avertissement si désactivé) |

---

## F-13 · Import MRD (P7)

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `fichier` | file | ✅ | MIME: `text/csv` ou `application/json` · Taille ≤ 50MB |
| `mode` | select | ✅ | `upsert` (défaut) · `append_only` · `replace_all` |

**Colonnes CSV attendues (MRD 2024) :**
`code_mesure · libelle_mesure · type_texte · reference_article · nature_mesure · impot_concerne · organe_gestion · portee_categorie · secteur · type_objectif · systeme_information · est_active · conformite_uemoa`

---

## F-14 · Vérification attestation (public)

| Champ | Type | Requis | Validation |
|---|---|---|---|
| `hash` | text | ✅ | Format SHA-256 hex (64 car.) ou QR scan auto |

---

## Règles de validation globales

### Frontend (class-validator / VeeValidate)

```typescript
// Règles communes à tous les formulaires
const RULES = {
  required:    (v) => !!v || 'Champ obligatoire',
  email:       (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email invalide',
  nif:         (v) => /^TG-[A-Z]{2,4}-\d{4}-[A-Z]-\d{4}$/.test(v) || 'Format NIF invalide (ex: TG-LOM-2018-B-0042)',
  pin:         (v) => /^\d{4,6}$/.test(v) || 'PIN : 4 à 6 chiffres uniquement',
  montant:     (v) => Number(v) > 0 || 'Montant doit être positif',
  fileSize:    (f) => f.size <= 10_485_760 || 'Fichier trop volumineux (max 10MB)',
  fileMime:    (f) => ['application/pdf','image/jpeg','image/png'].includes(f.type) || 'Format non autorisé (PDF, JPG, PNG)',
  minLength:   (n) => (v) => v?.length >= n || `Minimum ${n} caractères`,
  maxLength:   (n) => (v) => v?.length <= n || `Maximum ${n} caractères`,
};
```

### Backend (NestJS class-validator decorators)

```typescript
// Exemple DTO NewDemandeDto
class NewDemandeDto {
  @IsUUID()                         base_juridique_id: string;
  @IsInt() @Min(1)                  montant_fcfa: number;
  @IsOptional() @IsDateString()     date_echeance?: string;
  @IsOptional() @MaxLength(2000)    description_projet?: string;
}
```

### Messages d'erreur — Standard OASE

| Code erreur | Message utilisateur FR |
|---|---|
| `CREDENTIALS_INVALIDES` | "Email ou mot de passe incorrect." |
| `TROP_DE_TENTATIVES` | "Trop de tentatives. Compte bloqué 5 minutes." |
| `CODE_MFA_INVALIDE` | "Code incorrect. Vérifiez votre application d'authentification." |
| `PIN_INVALIDE` | "PIN incorrect. Vérifiez votre code." |
| `STATUT_FISCAL_DETTE_ACTIVE` | "Dépôt impossible — dette fiscale active auprès de l'OTR. Contactez le Centre des Impôts." |
| `PIECES_RANG_UN_MANQUANTES` | "Pièces obligatoires manquantes : {liste}. Veuillez les joindre avant de soumettre." |
| `QUOTA_EPUISE` | "Quota épuisé pour cette mesure. Soumission impossible. Contactez l'organe gestionnaire." |
| `ETAPES_WORKFLOW_INCOMPLETES` | "Toutes les étapes d'instruction doivent être validées avant approbation finale." |
| `ANOMALIE_CRITIQUE_NON_RESOLUE` | "Une anomalie critique non résolue bloque l'approbation : {anomalie_id}." |
| `NIF_DEJA_UTILISE` | "Ce NIF est déjà associé à un compte bénéficiaire." |
| `FICHIER_TROP_VOLUMINEUX` | "Fichier refusé — taille maximale : 10 MB." |

---

*Livrables OASE-30 & 31 — Formulaires et validation.*
