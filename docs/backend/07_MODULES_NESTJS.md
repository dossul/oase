# OASE-10 — Structure détaillée des modules NestJS

> **Issue Plane :** OASE-10  
> **Date :** 2026-06-16  
> **Sources :** OASE-6 (Domain Model), OASE-8 (RBAC), OASE-9 (Architecture)  
> **Objet :** Définition de chaque module NestJS : responsabilités, providers, imports/exports, endpoints et DTOs.

---

## Conventions

- **Un module = une ressource ou une capacité technique transversale**
- Chaque module expose son propre `Service` et importe `PrismaModule`
- Les modules métier importent `AuditModule` pour tracer les mutations
- Les DTOs suivent le naming : `CreerXxxDto`, `ModifierXxxDto`, `FiltrerXxxDto`, `XxxResponseDto`
- Tous les endpoints sont préfixés `/api/v1/`

---

## 1. `AppModule` (root)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, dbConfig, jwtConfig] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    InstitutionsModule,
    BeneficiairesModule,
    BasesJuridiquesModule,
    DemandesModule,
    PiecesJointesModule,
    WorkflowModule,
    DecisionsModule,
    ConventionsModule,
    QuotasModule,
    AnomaliesModule,
    AuditModule,
    ConnecteursModule,
    NotificationsModule,
    AttestationsModule,
    JobsModule,
    OpenDataModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

---

## 2. `PrismaModule`

**Rôle :** Singleton PrismaClient partagé.

```
prisma/
  prisma.module.ts    @Global() @Module — exporte PrismaService
  prisma.service.ts   extends PrismaClient, onModuleInit(), onModuleDestroy()
```

**Aucun endpoint** — module technique pur.

---

## 3. `AuthModule`

**Rôle :** Authentification JWT + MFA TOTP + gestion refresh tokens.

| Endpoint | Méthode | Rôle requis | Description |
|---|---|---|---|
| `/auth/login` | POST | public | Email + mot de passe → JWT access + refresh |
| `/auth/mfa/verify` | POST | public (step 2) | Code TOTP → JWT final avec claims rôle |
| `/auth/refresh` | POST | public (refresh token) | Rotation refresh → nouvel access token |
| `/auth/logout` | POST | any | Révoque refresh token (blacklist Redis) |
| `/auth/pin/set` | POST | any authentifié | Définit ou modifie PIN de signature |
| `/auth/me` | GET | any authentifié | Profil courant + permissions |

**Providers :** `AuthService`, `MfaService`, `TokenBlacklistService`  
**Strategies :** `JwtStrategy`, `LocalStrategy`

---

## 4. `UtilisateursModule`

**Rôle :** CRUD utilisateurs, gestion comptes.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/utilisateurs` | POST | `admin_si` | Créer un compte |
| `/utilisateurs` | GET | `admin_si` | Liste paginée + filtres |
| `/utilisateurs/:id` | GET | `admin_si` | Détail |
| `/utilisateurs/:id` | PATCH | `admin_si` | Modifier rôle/institution/statut |
| `/utilisateurs/:id/reset-mfa` | POST | `admin_si` | Régénère le secret TOTP |
| `/utilisateurs/:id/reset-pin` | POST | `admin_si` | Réinitialise le PIN |

**DTOs :** `CreerUtilisateurDto`, `ModifierUtilisateurDto`, `FiltrerUtilisateursDto`

---

## 5. `InstitutionsModule`

**Rôle :** Référentiel des institutions (OTR-CI, OTR-CDDI, DGBF, SAZOF...).

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/institutions` | GET | any authentifié | Liste toutes les institutions |
| `/institutions/:id` | GET | any authentifié | Détail |
| `/institutions` | POST | `admin_si` | Créer |
| `/institutions/:id` | PATCH | `admin_si` | Modifier |

---

## 6. `BeneficiairesModule`

**Rôle :** Gestion des bénéficiaires (profil, statut fiscal, accords de siège).

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/beneficiaires/me` | GET | `beneficiaire` | Mon propre profil |
| `/beneficiaires/me` | PATCH | `beneficiaire` | Modifier mes coordonnées |
| `/beneficiaires` | POST | `beneficiaire`, `admin_si` | Créer un profil |
| `/beneficiaires` | GET | P2/P3/P4/P5/`admin_si` | Liste paginée + filtres |
| `/beneficiaires/:id` | GET | P2/P3/P4/P5/`admin_si` | Détail |
| `/beneficiaires/:id/statut-fiscal` | GET | P2/P4/`admin_si` | Statut fiscal temps réel (via connecteur OTR) |
| `/beneficiaires/:id/accords-siege` | GET | `agent_mae`, `admin_si` | Accords de siège liés |

**DTOs :** `CreerBeneficiaireDto`, `ModifierBeneficiaireDto`, `FiltrerBeneficiairesDto`  
**Dépendances :** `ConnecteursModule` (sync statut fiscal)

---

## 7. `BasesJuridiquesModule`

**Rôle :** Référentiel des 1 316 mesures MRD, versioning SCD T2, import initial.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/bases-juridiques` | GET | any authentifié | Liste paginée + filtres multiples |
| `/bases-juridiques/:id` | GET | any authentifié | Détail complet avec codes additionnels |
| `/bases-juridiques/:id/versions` | GET | `admin_si`, `auditeur` | Historique SCD T2 |
| `/bases-juridiques/:id/codes-additionnels` | GET | P2/P3/`admin_si` | Codes Sydonia / E-TAX |
| `/bases-juridiques` | POST | `admin_si` | Créer une mesure |
| `/bases-juridiques/:id` | PATCH | `admin_si` | Mettre à jour (crée nouvelle version) |
| `/bases-juridiques/:id/desactiver` | POST | `admin_si` | Désactiver une mesure |
| `/bases-juridiques/import/mrd` | POST | `admin_si` | Import CSV/JSON MRD (bulk) |

**Providers :** `BasesJuridiquesService`, `MrdImportService`, `VersioningService`

**DTOs :**
```typescript
class FiltrerBasesJuridiquesDto {
  type_texte_1?: string;
  impot_concerne?: string;
  nature_mesure?: string;
  organe_gestion?: string;
  mode_instruction?: string;
  est_active?: boolean;
  conformite_directive_uemoa?: string;
  page?: number;
  limit?: number;
  search?: string;        // fulltext sur libelle + support_juridique_base
  sort?: string;          // code_mesure | libelle | created_at
}
```

---

## 8. `DemandesModule` ⭐ (module central)

**Rôle :** Cycle de vie complet des demandes — toutes les transitions de statut.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/demandes` | POST | `beneficiaire` | Créer brouillon |
| `/demandes` | GET | P1…P7 (périmètre RLS) | Liste paginée |
| `/demandes/:id` | GET | (idem) | Détail complet |
| `/demandes/:id` | PATCH | `beneficiaire` | Modifier brouillon |
| `/demandes/:id/soumettre` | POST | `beneficiaire` | brouillon → soumis |
| `/demandes/:id/prendre-en-charge` | POST | P2/P3 | soumis → en_instruction |
| `/demandes/:id/demander-complement` | POST | P2/P3 | en_instruction → action_requise |
| `/demandes/:id/completer` | POST | `beneficiaire` | action_requise → en_instruction |
| `/demandes/:id/approuver` | POST | `decideur` | en_instruction → approuve |
| `/demandes/:id/rejeter` | POST | P2/P3/`decideur` | en_instruction → rejete |
| `/demandes/:id/archiver` | POST | `admin_si` | → archive |
| `/demandes/:id/etapes` | GET | P2/P3/P4 | Toutes les étapes du workflow |
| `/demandes/:id/pieces` | GET | (périmètre) | Pièces jointes de la demande |
| `/demandes/:id/decisions` | GET | (périmètre) | Historique décisions |
| `/demandes/:id/anomalies` | GET | P2/P4/P5 | Anomalies liées |
| `/demandes/stats/par-statut` | GET | P4/P5/`admin_si` | Comptages par statut |
| `/demandes/export` | GET | P2/P4/P5 | Export Excel/CSV filtré |

**Providers :** `DemandesService`, `StateMachineService`, `ReferenceService`  
**Dépendances :** `WorkflowModule`, `QuotasModule`, `AnomaliesModule`, `AttestationsModule`, `NotificationsModule`, `ConnecteursModule`

**DTOs :**
```typescript
class CreerDemandeDto {
  @IsUUID() base_juridique_id: string;
  @IsPositive() montant_fcfa: number;
  @IsString() secteur: string;
  @IsDateString() @IsOptional() date_echeance?: string;
}

class ApprouverDemandeDto {
  @IsString() @Length(4, 6) pin: string;
  @IsString() @IsOptional() commentaire?: string;
}

class RejeterDemandeDto {
  @IsString() @MinLength(20) motif_rejet: string;
  @IsString() @Length(4, 6) pin: string;
}
```

---

## 9. `PiecesJointesModule`

**Rôle :** Upload, stockage S3, validation et vérification des pièces.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/pieces-jointes/upload` | POST | `beneficiaire` | Multipart — upload + calcul SHA-256 |
| `/pieces-jointes/:id` | GET | (périmètre) | Métadonnées |
| `/pieces-jointes/:id/download` | GET | (périmètre) | URL signée S3 (TTL 15min) |
| `/pieces-jointes/:id/valider` | POST | P2/P3 | Marquer valide |
| `/pieces-jointes/:id/invalider` | POST | P2/P3 | Marquer invalide avec motif |

**Providers :** `PiecesJointesService`, `StorageService`  
**Config :** max 10MB/fichier, MIME : pdf|jpg|png|xlsx|docx

---

## 10. `WorkflowModule`

**Rôle :** Gestion des templates de workflow et des étapes.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/workflow/templates` | GET | `admin_si` | Liste tous les templates |
| `/workflow/templates/:id` | GET | `admin_si` | Détail JSON du template |
| `/workflow/templates/:id` | PUT | `admin_si` | Modifier un template |
| `/workflow/etapes/:id/valider` | POST | P2/P3/P4 | Valider une étape (PIN requis) |
| `/workflow/etapes/:id/rejeter` | POST | P2/P3/P4 | Rejeter une étape |

**Providers :** `WorkflowService`, `WorkflowRouterService`

---

## 11. `DecisionsModule`

**Rôle :** Enregistrement immuable des décisions formelles.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/decisions/:id` | GET | (périmètre) | Détail décision |
| `/decisions/:id/document` | GET | (périmètre) | PDF de la décision (URL signée) |

*Les décisions sont créées par `DemandesModule.approuver()` — aucun POST direct.*

---

## 12. `ConventionsModule`

**Rôle :** Gestion des conventions d'investissement, ZF, accords de siège.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/conventions` | GET | P3/P4/`auditeur`/`admin_si` | Liste paginée |
| `/conventions/:id` | GET | P1(soi)/P3/P4/`auditeur` | Détail |
| `/conventions` | POST | P3/P4 | Créer |
| `/conventions/:id` | PATCH | P3/P4 | Modifier |
| `/conventions/:id/suspendre` | POST | P3/P4 | Suspendre |
| `/conventions/:id/resilier` | POST | P4 | Résilier |
| `/conventions/:id/demandes` | GET | (périmètre) | Demandes rattachées |

---

## 13. `QuotasModule`

**Rôle :** Définition et suivi des plafonds de consommation.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/quotas` | GET | P4/`admin_si` | Tous les quotas |
| `/quotas/base-juridique/:bjId` | GET | P2/P4 | Quota(s) d'une mesure |
| `/quotas` | POST | P4/`admin_si` | Définir un quota |
| `/quotas/:id` | PATCH | P4/`admin_si` | Modifier le total |
| `/quotas/:id/historique` | GET | P4/`auditeur` | Historique consommation |

---

## 14. `AnomaliesModule`

**Rôle :** Détection (moteur règles) et traitement des anomalies.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/anomalies` | GET | P4/P5/`admin_si` | Liste paginée + filtres |
| `/anomalies/:id` | GET | (périmètre) | Détail |
| `/anomalies` | POST | `auditeur` | Créer manuellement |
| `/anomalies/:id/examiner` | POST | `auditeur` | → en_examen |
| `/anomalies/:id/traiter` | POST | `auditeur` | → traitee (avec commentaire) |
| `/anomalies/:id/classer` | POST | `auditeur` | → classee |
| `/anomalies/stats` | GET | P4/P5 | Comptages par gravité/catégorie |

**Providers :** `AnomaliesService`, `RulesEngineService`

---

## 15. `AuditModule`

**Rôle :** Journal inaltérable — lecture seule + hash chaîné.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/audit` | GET | P4/`auditeur`/`admin_si` | Liste paginée (filtre: entite, action, user, date) |
| `/audit/:id` | GET | P4/`auditeur`/`admin_si` | Entrée individuelle |
| `/audit/verify-chain` | GET | `admin_si` | Vérifie l'intégrité de la chaîne SHA-256 |
| `/audit/export` | GET | P4/`auditeur` | Export CSV signé |

**Providers :** `AuditService` (createEntry, verifyChain)  
*Pas de POST/PATCH/DELETE exposés — écriture via `AuditLogInterceptor` uniquement.*

---

## 16. `ConnecteursModule`

**Rôle :** Interface vers SI externes + circuit-breaker + healthcheck.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/connecteurs` | GET | `admin_si` | Liste + statut temps réel |
| `/connecteurs/:id` | GET | `admin_si` | Détail + métriques |
| `/connecteurs/:id` | PATCH | `admin_si` | Modifier config (chiffré) |
| `/connecteurs/:id/test` | POST | `admin_si` | Test de connectivité |
| `/connecteurs/:id/maintenance` | POST | `admin_si` | Forcer maintenance |
| `/connecteurs/health` | GET | `admin_si` | Statut global tous connecteurs |

**Providers :** `ConnecteursService`, `CircuitBreakerService`, adapters Sydonia/SIGTAS/SIGFiP/GUDEF/E-TAX

---

## 17. `NotificationsModule`

**Rôle :** Notifications in-app, email (SMTP), SMS.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/notifications` | GET | any authentifié | Mes notifications non lues |
| `/notifications/:id/lire` | POST | any authentifié | Marquer lue |
| `/notifications/tout-lire` | POST | any authentifié | Tout marquer lu |

*Les notifications sont créées par les effets des transitions — aucun POST direct.*

---

## 18. `AttestationsModule`

**Rôle :** Génération PDF + QR Code + SHA-256 + vérification.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/attestations/:id/download` | GET | `beneficiaire`(soi)/P2/P4 | Télécharger l'attestation |
| `/attestations/verifier` | POST | public | Vérifier l'authenticité par QR hash |

**Providers :** `AttestationsService` (Puppeteer + qrcode + crypto)

---

## 19. `JobsModule`

**Rôle :** Jobs CRON planifiés (alertes, archivage, sync).

| Job | Schedule | Description |
|---|---|---|
| `EcheancesJob` | `0 6 * * *` (06h00 Lomé) | Alertes J-30/J-7/J0 sur demandes et conventions |
| `QuotaAlerteJob` | `*/15 * * * *` (toutes les 15min) | Seuil 80% quota → notification P4 |
| `ArchivageJob` | `0 2 * * *` (02h00) | Archive les demandes approuvées/rejetées après délai |
| `ConnecteurHealthJob` | `*/5 * * * *` | Heartbeat SI externes → met à jour `statut` connecteur |
| `SyncStatutFiscalJob` | `0 7 * * 1-5` (lun-ven 07h00) | Rafraîchit `statut_fiscal` des bénéficiaires actifs |

---

## 20. `OpenDataModule`

**Rôle :** API publique sans authentification — données agrégées et anonymisées.

| Endpoint | Méthode | Rôle | Description |
|---|---|---|---|
| `/public/stats` | GET | public | KPIs globaux (nb demandes, montant total, top mesures) |
| `/public/mesures` | GET | public | Liste mesures actives (sans PII, sans article) |
| `/public/mesures/:id` | GET | public | Détail mesure (libellé, nature, impôt, portée) |
| `/public/attestations/verifier` | POST | public | Vérifie authenticité d'une attestation par hash QR |
| `/public/rapports` | GET | public | Rapports dépenses fiscales agrégés par année |
| `/public/datasets` | GET | public | Datasets téléchargeables (CSV/JSON anonymisé) |

**Providers :** `OpenDataService` — requêtes sur vues matérialisées, **sans** `JwtAuthGuard`  
**Rate limit spécifique :** 30 req/min par IP (via `ThrottlerGuard` custom)

---

## 21. Résumé des dépendances inter-modules

```
AppModule
├── AuthModule
│   └── UtilisateursModule (lecture profil)
├── DemandesModule ──────────────────────────────────────────┐
│   ├── WorkflowModule                                       │
│   ├── QuotasModule                                         │
│   ├── AnomaliesModule ← RulesEngineService                 │
│   ├── AttestationsModule                                   │
│   ├── NotificationsModule                                  │
│   └── ConnecteursModule (push SI après approbation)        │
├── BasesJuridiquesModule                                    │
├── BeneficiairesModule                                      │   (scope check)
│   └── ConnecteursModule (statut fiscal OTR)                │
├── AuditModule ◄────────────────────────────────────────────┘
│   (tous les modules métier importent AuditModule)
├── JobsModule
│   ├── NotificationsModule
│   ├── ConnecteursModule
│   └── DemandesModule
└── OpenDataModule (aucune dépendance métier — vues agrégées)
```

---

*Livrable OASE-10 — Modules NestJS. Alimente OASE-11 (Prisma schema = toutes les tables de tous les modules) et les API contracts OASE-14 à OASE-18.*
