# OASE-21 & 22 — Architecture connecteurs SI externes

> **Issues Plane :** OASE-21 (architecture), OASE-22 (stubs demo)  
> **Date :** 2026-06-16  
> **Sources :** CdC §4.3, OASE-6 (entité Connecteur), OASE-9 (ConnecteursModule)

---

## 1. Vue d'ensemble des SI cibles

| Code | Système | Institution | Usage OASE | Mode actuel |
|---|---|---|---|---|
| `SYDONIA` | Sydonia World | OTR-CDDI | Vérifier codes douaniers + notifier décisions | REST OAuth2 |
| `ETAX` | SIGTAS (E-TAX) | OTR-CI | Statut fiscal NIF + sync exonérations IS/TVA | REST API Key |
| `SIGFIP` | SIGFiP | DGBF | Visa budgétaire + dotation programme | SOAP/REST |
| `GUDEF` | GUDEF | DGTCP | Comptabilisation dépenses fiscales | REST |
| `DAS` | Base DLFC | DGBF | Données annexes base juridique | SOAP legacy |

---

## 2. Pattern Circuit Breaker

```
Client (DemandesService)
       │
       ▼
ConnecteursService.execute(name, fn, fallback)
       │
       ▼
CircuitBreakerService
   ┌───────────────────────────────────────────────┐
   │  CLOSED ──(N erreurs)──► OPEN ──(timeout)──► HALF_OPEN │
   │    ▲                                    │           │   │
   │    └──────── (M succès) ────────────────┘           │   │
   │                                         (1 échec)───┘   │
   └───────────────────────────────────────────────────────  ┘
       │
       ▼
 Fallback si OPEN : { source: 'fallback', statut: 'inconnu' }
 Log + alerte si N ≥ seuil critique
```

**Seuils par connecteur :**

| Connecteur | failureThreshold | timeout | requestTimeout |
|---|---|---|---|
| SYDONIA | 5 | 30s | 8s |
| ETAX | 3 | 20s | 5s |
| SIGFIP | 3 | 60s | 10s |
| GUDEF | 3 | 60s | 10s |
| DAS | 2 | 120s | 15s |

---

## 3. Fichiers implémentés

```
docs/backend/impl/connecteurs/
├── circuit-breaker.service.ts   ← Pattern générique CLOSED/OPEN/HALF_OPEN
└── adapters/
    ├── sydonia.adapter.ts        ← Sydonia World (OAuth2 + mock)
    ├── etax.adapter.ts           ← E-TAX OTR-CI (API Key + mock)
    ├── stubs.ts                  ← Toutes les données simulées (OASE-22)
    │   ├── STUB_STATUTS_FISCAUX
    │   ├── STUB_DECLARATIONS_SYDONIA
    │   ├── STUB_LIGNES_SIGFIP
    │   ├── STUB_ECRITURES_GUDEF
    │   └── DEMO_SCENARIOS (happy_path, degraded, dette_fiscale, quota_epuisé)
    ├── sigfip.adapter.ts         ← À implémenter (SOAP wrapper)
    ├── gudef.adapter.ts          ← À implémenter (REST)
    └── das.adapter.ts            ← À implémenter (SOAP legacy)
```

---

## 4. Activation mode demo (OASE-22)

```dotenv
# .env — Mode démo : tous les connecteurs en mock
SYDONIA_MOCK=true
ETAX_MOCK=true
SIGFIP_MOCK=true
GUDEF_MOCK=true
DAS_MOCK=true
```

En production : `SYDONIA_MOCK=false` + configuration OAuth2 chiffrée en base.

---

## 5. Intégration dans le workflow `Demande`

| Moment | Connecteur | Action |
|---|---|---|
| `soumettre()` | ETAX | Vérification `statut_fiscal !== 'dette_active'` (bloquant) |
| `prendre-en-charge()` | SYDONIA | Récupère déclarations douanières liées |
| `approuver()` | SYDONIA + ETAX | Notification décision (non bloquant) |
| `approuver()` | SIGFIP | Enregistrement engagement budgétaire (non bloquant) |
| `approuver()` | GUDEF | Comptabilisation dépense fiscale (non bloquant) |
| `SyncStatutFiscalJob` | ETAX | Rafraîchissement quotidien `statut_fiscal` (CRON) |
| `ConnecteurHealthJob` | Tous | Heartbeat toutes les 5 min → update `statut` en DB |

---

## 6. Variables d'environnement requises (production)

```dotenv
# Sydonia
SYDONIA_ENDPOINT=https://sydonia.otr.tg/api/v2
SYDONIA_MOCK=false

# E-TAX
ETAX_ENDPOINT=https://etax.otr.tg/api/v1
ETAX_API_KEY=<fourni par OTR>
ETAX_MOCK=false

# SIGFiP
SIGFIP_ENDPOINT=https://sigfip.dgbf.fin.tg/ws
SIGFIP_USERNAME=<fourni par DGBF>
SIGFIP_PASSWORD=<fourni par DGBF>
SIGFIP_MOCK=false

# GUDEF
GUDEF_ENDPOINT=https://gudef.tresor.fin.tg/api
GUDEF_API_KEY=<fourni par DGTCP>
GUDEF_MOCK=false

# DAS (legacy SOAP)
DAS_ENDPOINT=https://das.dgbf.fin.tg/soap
DAS_MOCK=false
```

*Note : Tous les credentials sont stockés chiffrés (AES-256-GCM) dans `connecteurs.config_auth` — jamais en clair.*

---

*Livrables OASE-21 & 22 — Connecteurs.*  
*Alimente OASE-25 & 26 (déploiements), OASE-45 (tests E2E instruction).*
