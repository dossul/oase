# OASE-28 — Flux utilisateur détaillé par persona

> **Issue Plane :** OASE-28  
> **Date :** 2026-06-16  
> **Sources :** `comprehension/06_WORKFLOWS.md`, `comprehension/08_FLUX_PAR_PERSONA.md`

---

## Flux transversal — Authentification

```
Tous les utilisateurs :

/login ──[email+mdp]──► POST /auth/login
                              │
              ┌───────────────┴───────────────┐
         mfa_required=false              mfa_required=true
              │                               │
    → espace persona                 /auth/mfa
                                          │
                              ──[code TOTP 6 chiffres]──►
                              POST /auth/mfa/verify
                                          │
                                    → espace persona

Rôles avec MFA obligatoire : P2 (agent), P3 (agence), P4 (décideur),
                             P5 (contrôle), P7 (admin)
Rôles sans MFA : P1 (bénéficiaire), P6 (public — sans auth)
```

---

## P1 — Opérateur économique (Bénéficiaire)

### Flux 1a : Dépôt d'une nouvelle demande

```
B-01 Dashboard
   │
   └─[+ Nouvelle demande]──► B-04 Choix base juridique
                                   │
                    ┌──────────────┴────────────────┐
               Recherche MRD                   Sélection mesure
               (filtre texte / nature)          (affiche description,
                                                 organe compétent)
                                   │
                              [Suivant]──► B-05 Informations + pièces
                                                │
                                    ┌───────────┼───────────┐
                               Montant    Pièces rang 1  Pièces rang 2
                               estimé     (obligatoires)  (optionnelles)
                                                │
                              Validation frontend (taille, MIME, nb)
                                                │
                              [Suivant]──► B-06 Récapitulatif
                                                │
                                    [Soumettre] (case cochée)
                                                │
                              POST /demandes/:id/soumettre
                                                │
                              ┌─────────────────┴──────────────────┐
                         Succès ──► B-02 Liste (statut: "soumis")    Erreur (dette fiscale,
                                                                      pièces manquantes)
                                                                       → message inline
```

### Flux 1b : Répondre à une demande de complément

```
Email notification → /beneficiaire/demandes/:id (statut: action_requise)
   │
   └─[Voir le motif]──► B-03 Détail demande
                              │  "Motif : RCCM expiré — fournir RCCM renouvelé"
                              │
                         [Répondre au complément]
                              │
                         Upload nouveau RCCM
                              │
                         POST /pieces-jointes/upload
                              │
                         POST /demandes/:id/soumettre-complement
                              │
                         → statut revient à "en_instruction"
```

### Flux 1c : Télécharger une attestation

```
B-02 Liste → demande "approuvée" → [Télécharger attestation]
   │
   GET /attestations/:id/download
   │
   URL signée S3 (TTL 15min) → téléchargement PDF
```

---

## P2 — Agent instructeur (OTR-CI / OTR-CDDI / DGBF)

### Flux 2a : Instruction d'un dossier

```
C-01 Dashboard (badge file d'attente)
   │
   └─[File d'instruction]──► C-02 Liste (filtre: soumis / action_requise)
                                   │
                         [Prendre en charge]
                                   │
                         POST /demandes/:id/prendre-en-charge
                         → statut: "en_instruction"
                                   │
                         C-03 Instruction détail
                              │
                    ┌─────────┼──────────────────────────┐
             [Visionner    [Valider étape]          [Demander complément]
              pièces]           │                        │
                         saisie PIN                motif texte libre
                         commentaire               POST /demandes/:id/
                                │                   demander-complement
                    POST /workflow/etapes/:id/valider
                                │
                         → étape suivante activée
                         (ou décision finale si dernière étape)
```

### Flux 2b : Approbation finale

```
C-04 Décision (étape "Approbation finale UPF/MEF")
   │
   ┌────────────────────────────────┐
[Approuver]                    [Rejeter]
   │                               │
saisie PIN                    motif rejet
commentaire                   saisie PIN
   │                               │
POST /demandes/:id/approuver   POST /demandes/:id/rejeter
   │
   └─► Attestation PDF générée
       Notification P1
       Sync Sydonia + E-TAX
       Comptabilisation GUDEF
```

---

## P3 — Agence de promotion (API, ZATP, SAZOF, CSFM)

```
D-01 Dashboard (périmètre agence)
   │
   ├─[Demandes périmètre]──► D-02 Vue filtrée (RLS: scope=agence)
   │                              │
   │                    [Instruire si compétent]──► D-03 Instruction
   │                                                (idem flux P2)
   │
   └─[Rapports]──► D-04 Rapport PDF/Excel mensuel
                         (dépenses fiscales secteur de l'agence)
```

---

## P4 — Décideur stratégique (UPF, DGTCP, MEF, OIIL)

```
E-01 Dashboard exécutif
   │
   ├─[Tableau fiscal]──► E-02 Graphiques dépenses fiscales
   │                         (par type impôt, nature, secteur, tendance)
   │
   ├─[Quotas]──► E-03 Vue globale quotas
   │                  (alertes rouge: consommation > 80%)
   │
   ├─[Rapports]──► E-04 Génération rapport PDF (MRE / annuel)
   │
   └─[Approbations en attente]──► E-05 File décision
                                      │
                                 [Approuver / Rejeter]
                                      │
                                 saisie PIN
                                 POST /demandes/:id/approuver
```

---

## P5 — Corps de contrôle (IGF, Cour des Comptes, FMI)

```
F-01 Dashboard contrôle (lecture seule)
   │
   ├─[Anomalies]──► F-02 Liste anomalies détaillée
   │                     (gravité, statut, catégorie)
   │
   ├─[Audit log]──► F-03 Journal complet
   │                     [Vérifier intégrité] → POST /audit-logs/verify-chain
   │                     Résultat: { verified: 1847, breaks: [] }
   │
   └─[Rapports]──► F-04 Rapport de conformité export PDF
```

---

## P6 — Portail public (Citoyen / Observateur)

```
G-01 Portail (sans authentification)
   │
   ├─[Statistiques]──► KPIs anonymisés (GET /public/stats)
   │
   ├─[Catalogue]──► G-02 Bases juridiques publiques (sans données bénéficiaires)
   │
   └─[Vérifier attestation]──► G-03 Saisir hash QR Code
                                      │
                                 POST /public/attestations/verifier
                                      │
                              ┌───────┴──────────┐
                         valide=true          valide=false
                         (référence, date,    "Attestation non reconnue
                          type mesure)         dans le système OASE"
```

---

## P7 — Administrateur système

```
H-01 Dashboard admin
   │
   ├─[Utilisateurs]──► H-02 CRUD (créer, modifier rôle, reset MFA/PIN)
   │
   ├─[Workflows]──► H-03 Config templates (étapes, organe compétent)
   │
   ├─[Connecteurs]──► H-04 Statut circuit breaker, tester ping
   │                        [Forcer open/close] → maintenance
   │
   ├─[Import MRD]──► H-05 Upload CSV, suivi progression, rapport erreurs
   │
   └─[Logs]──► H-06 Erreurs applicatifs dernières 24h
```

---

## Règles de navigation globales

| Règle | Implémentation |
|---|---|
| Route inconnue → redirige vers espace persona | `router.beforeEach` guard |
| Token expiré (401) → retour `/login` | Axios interceptor response |
| Accès route non autorisée (403) → page 403 | `router.beforeEach` + rôle check |
| URL directe `/backoffice/**` par P1 → 403 | NestJS `RbacGuard` + frontend guard |
| Rafraîchissement auto token (< 2min expiration) | Axios interceptor request |

---

*Livrable OASE-28 — Flux utilisateur 7 personas.*
