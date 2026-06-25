# OASE-5 — Contradictions, zones floues et points à clarifier

> **Issue Plane :** OASE-5 (In Progress)  
> **Date :** 2026-06-16  
> **Sources analysées :** MRD 2024 Final (12.09.2025, 1 316 mesures), MRD_summary.json, MRD_finalisee_v1.md, 01_INVENTAIRE_EXONERATIONS.md, GAP_MAQUETTE_VS_TDR_DIAGNOSTIC_OASE_V2.md, types/index.ts, 02_LANGAGE_METIER_OASE.md (OASE-4), PRD_OASE.md, TDR, CdC  
> **Objet :** Cartographie de toutes les contradictions inter-documents, incohérences métier et zones floues qui bloquent ou risquent de bloquer la conception backend.

---

## Méthode d'analyse

Cinq sources ont été croisées systématiquement :

| Source | Rôle |
|---|---|
| **MRD 2024** (1 316 mesures, 42 colonnes) | Vérité des données fiscales — base de référence légale |
| **OASE-4 / 02_LANGAGE_METIER_OASE.md** | Modèle de données cible défini dans la session précédente |
| **types/index.ts** | Implémentation TypeScript maquette — seul code existant |
| **GAP V2** | Analyse d'écart maquette ↔ TDR/CdC (document de couverture) |
| **TDR + CdC** | Contrat fonctionnel client — ce qui est commandé |

---

## PARTIE 1 — Contradictions confirmées

### C-01 ⚠️ `ExoType` ≠ `Nature de la mesure` MRD

**Sévérité : HAUTE — bloque le schéma SQL**

Dans OASE-4, `ExoType` décrit le **régime de l'exonération** (douanière, fiscale IS, TVA, zone franche...).  
Dans la MRD, `Nature de la mesure dérogatoire` décrit la **forme juridique** (Exonération, Exemption, Abattement, Réduction d'impôt, Taux réduit, Crédit d'impôt).

Ce sont **deux axes orthogonaux** — une même ligne MRD a les deux.

**Impact :** La table `bases_juridiques` DOIT avoir deux colonnes distinctes :
- `type_regime` → ce qu'on appelait `ExoType` (douanière, IS, TVA, zone_franche, sectorielle...)
- `nature_mesure` → forme juridique issue du MRD : `Exonération | Exemption | Abattement | Réduction d'impôt | Taux réduit | Crédit d'impôt`

**Décision requise :** Ajouter `nature_mesure ENUM` dans `bases_juridiques`.

---

### C-02 ⚠️ `impot_concerne` absent du schéma OASE-4

**Sévérité : HAUTE — manque critique pour l'identification**

La MRD a 30 types d'impôts/taxes distincts (TVA 184, IRPP 160, IS 144, DD 120, Taxe foncière 106...).  
La table `bases_juridiques` de OASE-4 ne comporte aucune colonne pour le type d'impôt concerné.

**Impact :** Impossible de filtrer les mesures par type d'impôt, ni de relier une demande à la bonne mesure par son impôt cible.

**Décision requise :** Ajouter `impot_concerne VARCHAR(100)` dans `bases_juridiques`, alimenté par la colonne MRD `Impôt, droit et taxes`.

---

### C-03 ⚠️ 274 mesures sans système d'information — non traitées dans le CdC

**Sévérité : CRITIQUE — risque d'échec projet**

Dans la MRD (`par_systeme_information`) :

| SI | Effectif |
|---|---|
| Sydonia World | 475 (403 + 72) |
| Base service gestionnaire | 306 |
| **ND (sans SI)** | **274** |
| Base DLFC | 178 (164 + 14) |
| E-TAX | 42 |
| DAS | 14 |
| SYDONIA / Sydonia World+DLFC | 26 |

**274 mesures MRD n'ont aucun système d'information** pour les suivre.  
Le TDR et le CdC ne traitent pas ce cas → comment OASE instruite une demande basée sur une mesure sans SI ?

**Impact :** Sans décision explicite, OASE ne peut pas créer un connecteur pour ces mesures. Elles ne peuvent pas être traitées de façon automatique — seule la saisie manuelle est possible.

**Décision requise :** Définir un mode de traitement `MANUEL` pour les 274 mesures ND. Ajouter `mode_instruction ENUM('automatique','semi_automatique','manuel')` dans `bases_juridiques`.

---

### C-04 ⚠️ `Organe de gestion` ≠ `Organe d'attribution` : deux acteurs différents non modélisés

**Sévérité : HAUTE — impacte le RBAC**

La MRD distingue deux colonnes :

| Colonne MRD | Valeurs | Signification |
|---|---|---|
| `Organe de gestion` | CI (800), CDDI (497), CDDI/CI (18), OTR (1) | Qui gère le dossier en interne OTR |
| `Organe d'attribution du droit d'accès` | OTR (1 075), SAZOF (124), DGMG (69), Ministère mines (46) | Qui délivre officiellement l'avantage |

Le modèle OASE-4 ne comporte **aucune de ces deux colonnes** dans `bases_juridiques`.

**Impact :** Le moteur de workflow ne peut pas router automatiquement un dossier vers CI ou CDDI (OTR), ni déterminer si c'est SAZOF ou DGMG qui signe.

**Décision requise :** Ajouter dans `bases_juridiques` :
- `organe_gestion ENUM('CI','CDDI','CDDI_CI','OTR')`
- `organe_attribution VARCHAR(50)` (OTR, SAZOF, DGMG, Ministère mines)

---

### C-05 ⚠️ Portée temporelle : 74 variantes textuelles non normalisées

**Sévérité : MOYENNE — risque de dette technique**

La MRD compte **74 valeurs distinctes** pour `Portée de la dérogation/durée de l'exonération` (Permanente, Permanent, permanente, Permanante, 01 an, 05 ans, cinq ans, Phase d'exploitation, Durée de la convention (35 ans)...).

OASE-4 définit `portee ENUM('Permanente','Temporaire')` — seulement 2 valeurs.

**Impact :** Un taux réduit valable seulement « pendant la phase de recherche » est modélisé `Temporaire` mais sans durée calculable → impossible de déclencher une alerte d'échéance (pourtant demandée dans le CdC §4.2 à 30/60/90 jours).

**Décision requise :** Enrichir `bases_juridiques` avec :
- `portee_categorie ENUM('Permanente','Temporaire_Determinee','Temporaire_Phase','Liee_Convention')` 
- `portee_duree_mois INT NULL` (quand calculable)
- `portee_description TEXT` (valeur brute MRD pour archivage)

---

### C-06 ⚠️ Conformité texte fondamental / directive UEMOA : 128 non-conformes ignorés

**Sévérité : HAUTE — risque légal et de contrôle**

Données MRD :
- Conformité texte fondamental : 633 `oui`, **115 `non`**, 528 sans information
- Conformité directive UEMOA : 586 `oui`, **161 `non`**, 1 `N/A`

OASE-4 modélise `conformite_texte_fondamental` et `conformite_directive_uemoa` comme `ENUM NULL`.  
**C'est correct** — mais la zone floue est : **que fait OASE quand une mesure est `non` ?**

- Le TDR ne prévoit pas de blocage automatique.
- Le CdC §3.4 mentionne des « alertes anomalies » mais ne définit pas de règle de blocage.
- La maquette génère des `Anomalie` de catégorie `juridique` mais sans lien direct avec ces colonnes MRD.

**Décision requise :** Clarifier avec le MOA si une mesure `non-conforme directive UEMOA` doit :
- [A] Être instruite normalement avec une alerte informative
- [B] Déclencher un circuit de validation spécial (CONEDEF ?)
- [C] Être bloquée à la saisie

---

### C-07 ⚠️ `TypeBeneficiaire` OASE-4 ≠ `Types de bénéficiaires` MRD

**Sévérité : MOYENNE**

| OASE-4 `TypeBeneficiaire` | MRD `Types de bénéficiaires` |
|---|---|
| `entreprise_privee` | Entreprises (610) |
| `organisme_public` | Administration publique et autres entités d'utilité publique (98) |
| `ong` | Associations, coopératives et ONG (66) |
| `institution_diplomatique` | Institutions internationales et représentations diplomatiques (320) |
| `organisation_internationale` | (inclus dans ci-dessus) |
| `personne_physique` | Ménages (133) |
| `autre` | Autres (3) |
| ❌ manquant | **Entreprises et ménages (86)** |

La catégorie **Entreprises et ménages** (86 mesures) n'a pas d'équivalent dans OASE-4.

**Décision requise :** Ajouter `entreprises_et_menages` à l'enum `TypeBeneficiaire`.

---

### C-08 ⚠️ `code_mesure` MRD ↔ OASE-4 : format non défini

**Sévérité : HAUTE — clé pivot système**

OASE-4 définit `code_mesure VARCHAR(20) UNIQUE` (ex. `MRD-0042`).  
La MRD utilise `N° d'ordre` (entier 1→1316) comme identifiant.

**Ces deux ne sont pas la même chose.** Le `N° d'ordre` peut changer entre éditions du MRD.

**Décision requise :** Définir un format stable de `code_mesure` :
- Option A : `MRD-YYYY-NNNN` (ex. `MRD-2024-0042`) — incluant l'année d'édition
- Option B : UUID généré à l'import initial, immuable
- Option C : Reprendre le `N° d'ordre` + suffixe de version (ex. `MRD-042-v2024`)

---

## PARTIE 2 — Colonnes MRD manquantes dans le schéma OASE-4

La table `bases_juridiques` définie dans OASE-4 est **incomplète** au regard du MRD. Voici les colonnes critiques manquantes :

| Colonne MRD | Colonne à ajouter dans `bases_juridiques` | Priorité |
|---|---|---|
| `Impôt, droit et taxes` | `impot_concerne VARCHAR(100)` | **P0 — bloquant** |
| `Nature de la mesure dérogatoire` | `nature_mesure ENUM(...)` | **P0 — bloquant** |
| `Organe de gestion` | `organe_gestion ENUM('CI','CDDI','CDDI_CI','OTR')` | **P0 — workflow** |
| `Organe d'attribution du droit d'accès` | `organe_attribution VARCHAR(50)` | **P0 — workflow** |
| `Système d'information` | `systeme_information VARCHAR(50)` | **P0 — connecteurs** |
| `mode_instruction` (dérivé) | `mode_instruction ENUM('automatique','semi_automatique','manuel')` | **P0 — connecteurs** |
| `Portée de la dérogation/durée` | `portee_categorie ENUM(...)` + `portee_duree_mois INT` + `portee_description TEXT` | **P1** |
| `Type d'objectif de la mesure` | `objectif_type ENUM('Economique','Social','Economique_et_social','Autre')` | **P1** |
| `Branches d'activités concernées` | `branche_activite VARCHAR(100)` | **P1** |
| `DF (oui/non) 2024` | `est_depense_fiscale_2024 BOOLEAN` (renommer `est_depense_fiscale`) | P2 |
| `Périmètre d'évaluation (oui/non) 2024` | `est_evaluee_2024 BOOLEAN` | P2 |
| `Disponibilité de données (oui/non)` | `donnees_disponibles BOOLEAN` | P2 |
| `Fonction budgétaire` | `fonction_budgetaire VARCHAR(100)` | P2 |
| `ODD` | `odd VARCHAR(20)` | P3 |
| `Programme/Dotation 2022` | `programme_dotation VARCHAR(100)` | P3 |
| `Position SH du bien concerné` | `position_sh VARCHAR(50)` | P3 |

---

## PARTIE 3 — Zones floues sans réponse dans les specs

### Z-01 🔵 Workflow par type de texte : CGI vs Convention vs Accord de siège

Le TDR mentionne un « éditeur visuel de workflows BPM » mais ne donne aucun mapping :

| Type de texte 1 | Circuit d'instruction | Signataire final | Durée cible |
|---|---|---|---|
| Code Général des Impôts | ??? | ??? | ??? |
| Accord de siège | Circuit MAE + OTR | ??? | ??? |
| Zone Franche | SAZOF → MEF | ??? | ??? |
| Code des Investissements | API-ZF → MEF | ??? | ??? |
| Code Minier | DGMG → MEF | ??? | ??? |
| Code des Hydrocarbures | DGMG + MAE → MEF | ??? | ??? |
| Conventions particulières | ??? | ??? | ??? |

**Décision requise du MOA :** Fournir le mapping `Type de texte 1 → circuit workflow` avec signataires et délais légaux pour chacun.

---

### Z-02 🔵 Notion de « quota » : comment est-il défini par mesure ?

La maquette (`types/index.ts`) et OASE-4 modélisent `quota_consomme / quota_total` sur la **demande**.  
Mais la MRD ne contient **aucune colonne quota**.

Questions sans réponse :
- Le quota est-il défini par mesure (ex. : enveloppe annuelle globale par code additionnel) ?
- Ou par bénéficiaire × mesure (ex. : agrément Zone Franche avec plafond d'investissement) ?
- Ou par convention individuelle ?
- Qui saisit le quota dans OASE ? L'instructeur ? L'administrateur ?

**Décision requise :** Modéliser la table `quotas` distincte ou enrichir `demandes` / `conventions` — voir OASE-6.

---

### Z-03 🔵 Rebasculement d'articles CGI entre éditions

L'inventaire `01_INVENTAIRE_EXONERATIONS.md` note :

> *« lorsque la base MRD fait référence à des articles antérieurs (CGI 2018, CGI 2021, CGI 2023), un rebasculement automatique de l'article cité vers son équivalent CGI 2025 est requis. »*

La MRD 2024 contient des articles de CGI d'éditions antérieures non encore migrés.

**Zone floue :** OASE doit-il stocker l'article MRD brut ET l'article CGI 2025 ? Ou migrer la référence ?

**Décision requise :** Ajouter `article_cgi_2025 VARCHAR(100)` en colonne pivot dans `bases_juridiques`, distincte de `article` (valeur brute MRD).

---

### Z-04 🔵 Normalisation des valeurs MRD : qui est responsable ?

La table de normalisation (`MRD_2024_normalisation_proposee.md`) montre 246 modifications nécessaires :
- Portée : « Permanente » vs « permanente » vs « Permanent » vs « Permanante »
- Impôt : « IRPP » vs « Impôt sur le revenu des Personnes Physiques (IRPP) » (5 variantes)
- SI : « SYDONIA WORLD » vs « Sydonia World » vs « SYDONIA »

**Zone floue :** La normalisation est-elle faite **avant l'import** (ETL/seed) ou **dans l'application** (validation formulaire) ?

**Décision requise :** Appliquer la normalisation lors du seed SQL (migration + seed). Les valeurs brutes MRD sont archivées en colonne `*_brut` pour traçabilité.

---

### Z-05 🔵 Versioning SCD Type 2 : périmètre et déclencheur

OASE-4 prévoit `version INT DEFAULT 1` dans `bases_juridiques`.  
Mais le **déclencheur** n'est pas défini :

- Modification d'un article du CGI en LFI → nouvelle version ?
- Changement de conformité UEMOA → nouvelle version ?
- Correction d'une erreur de saisie → nouvelle version ou correction directe ?

**Zone floue :** Le CdC §3.1 mentionne « gestion des référentiels » mais ne spécifie pas la stratégie de versioning.

**Décision requise :** Définir les événements déclencheurs du versioning et la politique de rétroactivité (les demandes déjà approuvées sont-elles rattachées à l'ancienne version ou à la nouvelle ?).

---

### Z-06 🔵 Code additionnel Sydonia/E-TAX : clé de liaison ou attribut ?

La MRD a deux colonnes codes additionnels :
- `Nouveaux Code(s) additionnels concerné(s) (Douanes)` → code Sydonia
- `Code(s) additionnels concerné(s) (impôts)` → code E-TAX

OASE-4 stocke `code_additionnel_douane VARCHAR(20)` et `code_additionnel_impots VARCHAR(20)`.

**Zone floue :** Certaines lignes MRD ont **plusieurs codes additionnels** dans la même cellule (ex. `141\n142`).

**Décision requise :** Créer une table `codes_additionnels(base_juridique_id, code, source ENUM('sydonia','etax'), is_principal BOOLEAN)` pour gérer la relation 1-N.

---

### Z-07 🔵 Bénéficiaires des Accords de siège : personne physique ou morale ?

398 mesures (30,2 %) sont liées à des Accords de siège (ONU, ambassades, ONG...).  
La table `beneficiaires` OASE-4 n'a pas de distinction **institution → accord de siège**.

**Zone floue :** Un accord de siège donne des droits à l'institution ET à ses employés (expatriés). Deux entités différentes peuvent bénéficier de la même mesure.

**Décision requise :** Clarifier si OASE gère les bénéficiaires individuels (expatriés) ou seulement les institutions bénéficiaires. Modéliser `accord_siege_id FK NULL` dans `beneficiaires` si nécessaire.

---

## PARTIE 4 — Schéma `bases_juridiques` révisé (post-OASE-5)

Suite aux corrections C-01 → C-08, la table `bases_juridiques` doit être complétée comme suit (delta uniquement) :

```sql
-- Colonnes à AJOUTER à la table bases_juridiques (delta vs OASE-4)

-- C-01 : Nature de la mesure (forme juridique)
nature_mesure           VARCHAR(50)   NOT NULL DEFAULT 'Exonération',
  -- valeurs : 'Exonération','Exemption','Abattement','Réduction d''impôt','Taux réduit','Crédit d''impôt'

-- C-02 : Impôt concerné
impot_concerne          VARCHAR(100)  NOT NULL,
  -- ex : 'Taxe sur la Valeur Ajoutée (TVA)', 'Droit de douane (DD)'...

-- C-04 : Organes
organe_gestion          VARCHAR(20)   NULL,
  -- 'CI', 'CDDI', 'CDDI/CI', 'OTR'
organe_attribution      VARCHAR(100)  NULL,
  -- 'OTR', 'SAZOF', 'DGMG', 'Ministère en charge des mines'

-- C-03 : Système d'information + mode
systeme_information     VARCHAR(100)  NULL,
  -- 'Sydonia World', 'E-TAX', 'Base DLFC', 'Base service gestionnaire', 'DAS', NULL
mode_instruction        VARCHAR(20)   NOT NULL DEFAULT 'manuel',
  -- 'automatique' (si SI connu), 'semi_automatique', 'manuel' (si SI = ND ou NULL)

-- C-05 : Portée enrichie
portee_categorie        VARCHAR(50)   NOT NULL DEFAULT 'Permanente',
  -- 'Permanente','Temporaire_Determinee','Temporaire_Phase','Liee_Convention'
portee_duree_mois       INT           NULL,    -- si calculable
portee_description      TEXT          NULL,    -- valeur brute MRD

-- C-08 : Code mesure avec format stable
-- (renommer N° d'ordre MRD en code_mesure_mrd séparé)
code_mesure_mrd         INT           NULL,    -- N° d'ordre original MRD (1..1316)
-- code_mesure reste VARCHAR(20) UNIQUE ex : 'MRD-2024-0042'

-- Z-03 : Article CGI 2025 vs article brut
article_cgi_2025        VARCHAR(100)  NULL,    -- article normalisé CGI édition 2025
  -- article (existant) = valeur brute MRD

-- P1 : Objectif et branche
objectif_type           VARCHAR(50)   NULL,    -- 'Economique','Social','Economique et social'
branche_activite        VARCHAR(100)  NULL,

-- P2 : Données évaluation
est_evaluee_2024        BOOLEAN       DEFAULT FALSE,
donnees_disponibles     BOOLEAN       DEFAULT FALSE,
fonction_budgetaire     VARCHAR(100)  NULL,
```

### Table complémentaire : `codes_additionnels` (Z-06)

```sql
CREATE TABLE codes_additionnels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_juridique_id   UUID NOT NULL REFERENCES bases_juridiques(id),
    code                VARCHAR(50) NOT NULL,
    source              VARCHAR(20) NOT NULL CHECK (source IN ('sydonia','etax','autre')),
    est_principal       BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);
-- Index pour lookup rapide
CREATE INDEX idx_codes_additionnels_bj ON codes_additionnels(base_juridique_id);
CREATE INDEX idx_codes_additionnels_code ON codes_additionnels(code, source);
```

---

## PARTIE 5 — Récapitulatif décisions requises du MOA

| # | Question | Urgence | Bloquant pour |
|---|---|---|---|
| D-01 | Workflow par type de texte 1 (CI, CDDI, ZF, Mines, MAE...) | **CRITIQUE** | OASE-7, OASE-11 |
| D-02 | Traitement des 274 mesures sans SI (manuel obligatoire ?) | **CRITIQUE** | OASE-11, OASE-21 |
| D-03 | Comportement quand mesure non-conforme UEMOA (bloquer / alerter / continuer) | **HAUTE** | OASE-7, moteur règles |
| D-04 | Format stable du `code_mesure` (MRD-YYYY-NNNN ?) | **HAUTE** | OASE-11, OASE-12 |
| D-05 | Quota : défini par mesure, bénéficiaire, convention ou agrément ? | **HAUTE** | OASE-11 |
| D-06 | Versioning SCD T2 : événements déclencheurs + rétroactivité | **HAUTE** | OASE-12 |
| D-07 | Normalisation MRD : ETL pre-import ou validation in-app ? | **MOYENNE** | OASE-12, OASE-13 |
| D-08 | Bénéficiaires accords de siège : institution seule ou expatriés aussi ? | **MOYENNE** | OASE-11 |
| D-09 | Codes additionnels multiples (N\n142) : table dédiée ou JSONB ? | **MOYENNE** | OASE-12 |

---

## PARTIE 6 — Ce qui est cohérent et confirmé

Les points suivants sont **alignés entre toutes les sources** et ne nécessitent pas de décision :

- ✅ 7 personas, leurs rôles et espaces : cohérents entre types/index.ts, 08_FLUX_PAR_PERSONA.md, CdC, TDR
- ✅ Statuts de la demande (`en_cours`, `approuve`, `rejete`, `expire`...) : cohérents entre maquette et GAP V2
- ✅ Architecture MFA + PIN de signature : mentionnée dans TDR, CdC et maquette — alignée
- ✅ Audit trail SHA-256 chainé : demandé dans CdC §5.2 et modélisé dans types/index.ts
- ✅ QR Code sur attestations : présent dans maquette et TDR
- ✅ OpenRouter IA pour génération de rapports : présent dans maquette (openrouter.ts) et prévu dans CdC
- ✅ Connecteurs Sydonia, SIGTAS, SIGFiP, GUDEF : listés dans CdC, modélisés dans maquette
- ✅ RBAC par institution (CI vs CDDI vs SAZOF) : cohérent dans tous les documents
- ✅ Portail Open Data public anonymisé : prévu TDR §3.4, présent maquette `/opendata`
- ✅ 1 316 mesures MRD = source de données initiale pour le seed — confirmé TDR + CdC + inventaire

---

*Livrable OASE-5 — Analyse croisée MRD 2024 + specs OASE. Alimentation directe de OASE-6 (Domain model) et OASE-11 (Schéma relationnel).*
