# OASE-7 — Statuts métier des demandes et machines d'état

> **Issue Plane :** OASE-7  
> **Date :** 2026-06-16  
> **Sources :** OASE-6 (Domain Model), types/index.ts, 06_WORKFLOWS.md, GAP V2, TDR §4.2, CdC §3.3  
> **Objet :** Définition exhaustive des statuts, transitions autorisées, acteurs, règles de garde et effets de bord pour toutes les entités à cycle de vie dans OASE.

---

## 1. Machine d'état — `Demande`

### 1.1 Statuts

| Statut | Code | Couleur UI | Description |
|---|---|---|---|
| Brouillon | `brouillon` | Gris | Saisie en cours, non soumise |
| Soumis | `soumis` | Bleu clair | Soumise par P1, en attente de prise en charge |
| En instruction | `en_instruction` | Bleu | Prise en charge par un instructeur P2 |
| Action requise | `action_requise` | Orange | P1 doit compléter le dossier |
| Approuvé | `approuve` | Vert | Circuit validé, attestation générée |
| Rejeté | `rejete` | Rouge | Refusé avec motif obligatoire |
| Expiré | `expire` | Gris foncé | Date d'échéance dépassée sans décision |
| Archivé | `archive` | Neutre | Clôturé définitivement |

### 1.2 Diagramme de transitions

```
                    ┌─────────────┐
                    │  brouillon  │◄──────────────────────────────┐
                    └──────┬──────┘                               │
                           │ soumettre()                          │
                           │ [montant > 0]                        │
                           │ [beneficiaire.statut_fiscal ≠ dette] │
                           ▼                                      │
                    ┌─────────────┐                               │
                    │   soumis    │                               │
                    └──────┬──────┘                               │
                           │ prendre_en_charge(instructeur)       │
                           │ [instructeur.role ∈ {agent_ci,       │
                           │   agent_cddi, agent_dgbf, agent_dgtcp,│
                           │   agent_agence}]                     │
                           ▼                                      │
              ┌────────────────────────┐                          │
              │    en_instruction      │◄─────────────────────────┤
              └──┬──────────┬──────────┘         retour_instruction│
                 │          │                                      │
   approuver()  │          │ demander_complement()                │
   [toutes       │          │ [motif obligatoire]                  │
    étapes OK]   │          ▼                                      │
                 │   ┌────────────────┐                           │
                 │   │ action_requise │──────── completer() ──────┘
                 │   └────────────────┘  [P1 soumet pièces manquantes]
                 │
                 ├──────────────────────────────► rejeter()
                 │                               [motif obligatoire]
                 ▼                                      │
          ┌───────────┐                         ┌──────┴──────┐
          │  approuve │                         │   rejete    │
          └─────┬─────┘                         └──────┬──────┘
                │                                      │
          archiver()                             archiver()
                │                                      │
                ▼                                      ▼
          ┌───────────┐                         ┌──────────────┐
          │  archive  │                         │   archive    │
          └───────────┘                         └──────────────┘

  [ANY] ──expirer()──► expire  (job CRON quotidien)
  expire ──archiver()──► archive
```

### 1.3 Tableau des transitions

| De | Vers | Action | Acteur autorisé | Règles de garde | Effets de bord |
|---|---|---|---|---|---|
| `brouillon` | `soumis` | `soumettre` | P1 (beneficiaire) | `montant_fcfa > 0` ; toutes pièces de 1er rang présentes ; `statut_fiscal ≠ dette_active` | Génère `reference` OASE-YYYY-NNNNNN ; crée `Notification(SOUMISSION)` à instructeurs ; crée `AuditLog(SOUMETTRE_DEMANDE)` |
| `soumis` | `en_instruction` | `prendre_en_charge` | P2 (`agent_ci`/`agent_cddi`/`agent_dgbf`/`agent_dgtcp`/`agent_agence`) | Instructeur actif ; rôle compatible avec `organe_gestion` de la mesure | Affecte `instructeur_id` ; crée première `EtapeWorkflow` ; `Notification(INSTRUCTION)` à P1 |
| `en_instruction` | `action_requise` | `demander_complement` | P2 (instructeur affecté) | `motif` non vide | `Notification(COMPLEMENT)` à P1 avec motif ; `AuditLog` |
| `action_requise` | `en_instruction` | `completer` | P1 (bénéficiaire) | Au moins une pièce ajoutée depuis le changement de statut | `Notification(RETOUR_INSTRUCTION)` à P2 ; `AuditLog` |
| `en_instruction` | `approuve` | `approuver` | P2/P4 selon étape finale | Toutes `EtapeWorkflow.statut = valide` ; PIN saisi valide ; `Anomalie.gravite = critique` absente | Génère `Decision(approbation)` ; génère PDF attestation + QR Code + SHA-256 ; incrémente `Quota.consomme` ; `Notification(APPROBATION)` à P1 ; `AuditLog(APPROUVER_DEMANDE)` |
| `en_instruction` | `rejete` | `rejeter` | P2 (instructeur) | `motif_rejet` non vide | Génère `Decision(rejet)` ; `Notification(REJET)` à P1 avec motif ; `AuditLog` |
| `approuve` | `archive` | `archiver` | P7 (admin) ou automatique | `date_archivage` atteinte (configurable) | `AuditLog(ARCHIVER)` |
| `rejete` | `archive` | `archiver` | P7 ou automatique | Délai légal de conservation écoulé | `AuditLog(ARCHIVER)` |
| `expire` | `archive` | `archiver` | P7 ou automatique | — | `AuditLog(ARCHIVER)` |
| `[tout]` | `expire` | `expirer` | SYSTEM (CRON) | `date_echeance < NOW()` et statut ∉ {approuve, rejete, archive} | `Notification(ECHEANCE)` à P1 et instructeur ; `AuditLog` |

### 1.4 Règles de blocage

```
RULE bloc-01 : dette_active
  IF beneficiaire.statut_fiscal = 'dette_active'
  THEN BLOCK soumettre()
  MESSAGE "Dossier bloqué : situation fiscale non conforme (OTR). 
           Régularisez votre situation avant de déposer une demande."

RULE bloc-02 : anomalie_critique
  IF demande.anomalies WHERE gravite = 'critique' AND statut ≠ 'traitee'
  THEN BLOCK approuver()
  MESSAGE "Une anomalie critique non résolue bloque l'approbation. 
           Consultez le module Contrôle."

RULE bloc-03 : quota_depasse
  IF quota.consomme + demande.montant_fcfa > quota.total
  THEN BLOCK approuver()
  MESSAGE "Le quota de la mesure {code_mesure} est épuisé pour cet exercice."

RULE bloc-04 : mesure_expiree
  IF base_juridique.date_abrogation < NOW()
  THEN BLOCK soumettre() AND BLOCK approuver()
  MESSAGE "La mesure {code_mesure} n'est plus en vigueur depuis le {date_abrogation}."

RULE bloc-05 : pieces_manquantes
  IF pieces_premier_rang.count < pieces_requises_par_mesure
  THEN BLOCK soumettre()
  MESSAGE "Pièces obligatoires manquantes : {liste_pieces_manquantes}."
```

---

## 2. Machine d'état — `EtapeWorkflow`

### 2.1 Statuts

| Statut | Description |
|---|---|
| `en_attente` | Étape pas encore démarrée (étapes suivantes) |
| `en_cours` | Étape active — acteur peut agir |
| `valide` | Étape signée et validée (PIN requis pour certaines) |
| `rejete` | Étape refusée → déclenche `Demande.rejeter()` |
| `annule` | Annulée suite à un retour en arrière |

### 2.2 Séquences standard par `type_texte_1`

#### CGI (CI — impôts internes)
```
1. Vérification pièces P1          [agent_ci]
2. Contrôle conformité juridique   [agent_ci]
3. Visa DGBF                       [agent_dgbf]
4. Approbation finale OTR/MEF      [decideur]
```

#### CGI / Code Douanes (CDDI — douanes)
```
1. Contrôle documentaire douanes   [agent_cddi]
2. Vérification code additionnel   [agent_cddi]
3. Liquidation Sydonia             [agent_cddi] — mode automatique si SI = Sydonia
4. Validation finale               [agent_cddi]
```

#### Zone Franche / Code Investissements
```
1. Instruction SAZOF / API-ZF      [agent_agence]
2. Avis technique sectoriel        [agent_ministere] (optionnel)
3. Visa DGBF                       [agent_dgbf]
4. Signature convention MEF        [decideur]
```

#### Accord de siège (MAE)
```
1. Réception MAE                   [agent_mae]
2. Vérification liste bénéficiaires[agent_mae]
3. Validation OTR                  [agent_cddi]
4. Notification automatique Sydonia [system — si code additionnel présent]
```

#### Code Minier / Hydrocarbures (DGMG)
```
1. Instruction DGMG                [agent_dgmg]
2. Avis technique mines            [agent_dgmg]
3. Validation OTR                  [agent_ci]
4. Arrêté ministériel              [decideur]
```

#### Mode manuel (274 mesures sans SI)
```
1. Saisie manuelle instructeur     [agent_ci | agent_cddi]
2. Vérification documentaire       [agent_ci | agent_cddi]
3. Décision manuelle               [agent_ci | agent_cddi | decideur]
→ Aucun push automatique vers SI externe
```

---

## 3. Machine d'état — `Convention`

| Statut | Code | Transitions entrantes | Transitions sortantes |
|---|---|---|---|
| Active | `active` | Création | → suspendue, → expirée |
| Suspendue | `suspendue` | active | → active (levée suspension), → résiliée |
| Résiliée | `resiliee` | suspendue, active | — (terminal) |
| Expirée | `expiree` | active (CRON: date_fin < NOW()) | → archivée |

**Règle :** Une convention `resiliee` ou `expiree` bloque la création de nouvelles demandes rattachées à cette convention.

---

## 4. Machine d'état — `Anomalie`

| Statut | Code | Acteur | Description |
|---|---|---|---|
| Nouvelle | `nouvelle` | SYSTEM / P5 | Vient d'être détectée |
| En examen | `en_examen` | P5 (auditeur) | Prise en charge |
| Traitée | `traitee` | P5 | Résolue avec commentaire |
| Classée | `classee` | P5 | Non-actionnable, documentée |

**Règle critique :** `gravite = critique AND statut ≠ traitee` → bloque `approuver()` sur la demande liée.

---

## 5. Machine d'état — `Connecteur`

| Statut | Code | Déclencheur | Action OASE |
|---|---|---|---|
| Actif | `actif` | Heartbeat OK | Traitement normal |
| Erreur | `erreur` | `taux_erreur > 5%` / timeout | Basculement `fallback_manuel = true` ; alerte P7 |
| Maintenance | `maintenance` | P7 (planifié) | Mode manuel activé ; notifications P1/P2 |
| Inactif | `inactif` | P7 (désactivation) | Bloque toute demande nécessitant ce SI |

---

## 6. Alertes d'échéance (CdC §4.2)

Toutes les alertes sont générées par un job CRON quotidien à 06h00 (heure Lomé — UTC+0).

| Déclencheur | Destinataires | Canal | Délai |
|---|---|---|---|
| `demande.date_echeance - 30j` | P1 (bénéficiaire) + instructeur | in-app + email | J-30 |
| `demande.date_echeance - 7j` | P1 + instructeur + P4 | in-app + email | J-7 |
| `demande.date_echeance atteinte` | P1 + instructeur + P4 + P7 | in-app + email + SMS | J0 → `expire` |
| `convention.date_fin - 90j` | P3 (agence) + P4 | in-app + email | J-90 |
| `convention.date_fin - 30j` | P3 + P4 + P1 | in-app + email | J-30 |
| `base_juridique.date_abrogation - 60j` | P4 (UPF) + P7 | in-app | J-60 |
| `quota.consomme / quota.total ≥ 80%` | P4 (UPF) + instructeur | in-app | temps réel |
| `quota.consomme = quota.total` | P4 + P2 + P1 | in-app + email | temps réel → bloc |
| `connecteur.taux_erreur > 5% sur 15min` | P7 (DSI) | in-app + SMS | temps réel |

---

## 7. Implémentation NestJS — Guards et interceptors

```typescript
// Transitions gardées via un service dédié
export class DemandeStateMachine {

  private readonly transitions: Record<StatutDemande, TransitionConfig[]> = {
    brouillon: [
      {
        to: 'soumis',
        action: 'soumettre',
        roles: ['beneficiaire'],
        guards: [
          'MontantPositifGuard',
          'PiecesRangUneGuard',
          'StatutFiscalGuard',       // vérifie OTR via ConnecteurGateway
          'MesureActiveGuard',
        ],
        effects: [
          'GenererReferenceEffect',
          'NotifierInstructeursEffect',
          'AuditLogEffect',
        ],
      },
    ],
    en_instruction: [
      {
        to: 'approuve',
        action: 'approuver',
        roles: ['agent_ci', 'agent_cddi', 'agent_dgbf', 'decideur'],
        guards: [
          'ToutesEtapesValidesGuard',
          'PinSignatureGuard',
          'AnomaliesCritiquesGuard',
          'QuotaDisponibleGuard',
        ],
        effects: [
          'GenererAttestationEffect',   // PDF + QR + SHA-256
          'IncrementerQuotaEffect',
          'NotifierBeneficiaireEffect',
          'PushSIExterneEffect',        // Sydonia / E-TAX si mode = automatique
          'AuditLogEffect',
        ],
      },
      // ... autres transitions
    ],
  };

  async transition(
    demande: Demande,
    action: string,
    acteur: Utilisateur,
    payload?: TransitionPayload,
  ): Promise<Demande> {
    const config = this.findTransition(demande.statut, action);
    await this.checkRoles(acteur, config.roles);
    await this.runGuards(demande, acteur, config.guards, payload);
    const updated = await this.applyTransition(demande, config.to);
    await this.runEffects(updated, acteur, config.effects, payload);
    return updated;
  }
}
```

---

## 8. Enum SQL et TypeScript définitifs

```sql
-- PostgreSQL ENUMs
CREATE TYPE statut_demande AS ENUM (
  'brouillon', 'soumis', 'en_instruction', 'action_requise',
  'approuve', 'rejete', 'expire', 'archive'
);

CREATE TYPE statut_etape AS ENUM (
  'en_attente', 'en_cours', 'valide', 'rejete', 'annule'
);

CREATE TYPE statut_convention AS ENUM (
  'active', 'suspendue', 'resiliee', 'expiree'
);

CREATE TYPE statut_anomalie AS ENUM (
  'nouvelle', 'en_examen', 'traitee', 'classee'
);

CREATE TYPE statut_connecteur AS ENUM (
  'actif', 'erreur', 'maintenance', 'inactif'
);
```

```typescript
// TypeScript (Prisma-compatible)
export type StatutDemande =
  | 'brouillon' | 'soumis' | 'en_instruction' | 'action_requise'
  | 'approuve'  | 'rejete' | 'expire'         | 'archive';

export type StatutEtape =
  | 'en_attente' | 'en_cours' | 'valide' | 'rejete' | 'annule';

export type StatutConvention =
  | 'active' | 'suspendue' | 'resiliee' | 'expiree';

export const STATUT_LABELS: Record<StatutDemande, string> = {
  brouillon:        'Brouillon',
  soumis:           'Soumis',
  en_instruction:   'En instruction',
  action_requise:   'Action requise',
  approuve:         'Approuvé',
  rejete:           'Rejeté',
  expire:           'Expiré',
  archive:          'Archivé',
};

export const STATUT_COLORS: Record<StatutDemande, string> = {
  brouillon:        '#9E9E9E',
  soumis:           '#42A5F5',
  en_instruction:   '#1565C0',
  action_requise:   '#FF8F00',
  approuve:         '#2E7D32',
  rejete:           '#C62828',
  expire:           '#546E7A',
  archive:          '#616161',
};
```

---

*Livrable OASE-7 — Statuts et transitions. Alimente OASE-8 (RBAC — qui peut déclencher quoi), OASE-11 (schéma Prisma avec enums), OASE-12 (seed de démonstration avec dossiers dans chaque statut).*
