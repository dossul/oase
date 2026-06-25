# OASE-9 — Architecture backend NestJS

> **Issue Plane :** OASE-9  
> **Date :** 2026-06-16  
> **Sources :** OASE-6 (Domain Model), OASE-7 (Statuts), OASE-8 (RBAC), TDR §5 (phases), CdC §4 (technique), types/index.ts  
> **Objet :** Architecture cible NestJS, choix de stack, structure des modules, stratégie de déploiement (cPanel demo + VM production).

---

## 1. Contraintes déterminantes

| Contrainte | Source | Impact |
|---|---|---|
| Hébergement demo sur cPanel mutualisé | TDR §5 | Pas de Docker, pas de WebSocket natif, PM2 via SSH ou cPanel Node.js |
| Production sur VM Linux (MEF/OTR) | CdC §4.6 | Nginx reverse-proxy + PM2 cluster + systemd |
| MySQL (ou PostgreSQL) existant MEF | CdC §4.5 | ORM avec support des deux — Prisma ✓ |
| 1 316 mesures MRD + potentiellement 500+ utilisateurs simultanés | TDR §3.3 | Pool de connexions géré, pagination obligatoire |
| Interopérabilité Sydonia, SIGTAS, SIGFiP, GUDEF, E-TAX | CdC §4.3 | Module Connecteur isolé, circuit-breaker |
| Audit trail inaltérable + GED + signatures TSA | CdC §5.2 | S3-compatible pour fichiers, hash chaîné en DB |
| Open Data public sans authentification | TDR §3.4 | Endpoint `/public` sans JWT, rate-limited |
| RGPD-compatible + normes UEMOA transparence | TDR §2.3 | Chiffrement au repos, anonymisation export |

---

## 2. Stack technique définitive

| Couche | Technologie | Version | Justification |
|---|---|---|---|
| **Runtime** | Node.js | 20 LTS | Support LTS 2026, cPanel compatible |
| **Framework** | NestJS | 10.x | DI, modules, guards, interceptors natifs |
| **ORM** | Prisma | 5.x | Migrations typées, support MySQL + PostgreSQL |
| **Base de données** | PostgreSQL 15 (prod) / MySQL 8 (fallback cPanel) | — | Prisma abstrait les deux |
| **Auth** | JWT (access 15min + refresh 7j) + TOTP MFA | jsonwebtoken, otplib | CdC §5.1 |
| **Validation** | class-validator + class-transformer | — | Pipes NestJS natifs |
| **File storage** | MinIO (auto-hébergé) ou S3 API compatible | — | CdC §5.2 GED |
| **Queue / jobs** | BullMQ + Redis | — | CRON alertes, génération PDF async |
| **PDF** | Puppeteer (headless Chrome) | — | Attestations avec QR Code |
| **QR Code** | qrcode | — | Attestations |
| **Crypto** | Node.js crypto (SHA-256), bcrypt | — | Hash audit + PIN |
| **Email** | Nodemailer + SMTP MEF | — | Notifications |
| **Swagger** | @nestjs/swagger | — | Documentation API auto |
| **Tests** | Jest + supertest | — | Unit + e2e |
| **Process manager** | PM2 | — | Cluster prod + cPanel Node.js |
| **Reverse proxy** | Nginx | — | SSL termination, static files |
| **Logging** | Winston + @nestjs/winston | — | JSON structured logs |

---

## 3. Structure du projet

```
oase-backend/
├── prisma/
│   ├── schema.prisma          # Schéma Prisma complet (OASE-11)
│   ├── migrations/            # Migrations versionnées
│   └── seed/
│       ├── seed.ts            # Entry point seed
│       ├── mrd-import.ts      # Import 1316 mesures MRD
│       └── fixtures/          # Données demo (OASE-12)
│
├── src/
│   ├── main.ts                # Bootstrap + Swagger + global pipes
│   ├── app.module.ts          # Root module
│   │
│   ├── config/
│   │   ├── app.config.ts      # PORT, NODE_ENV, CORS
│   │   ├── database.config.ts # DATABASE_URL, pool size
│   │   ├── jwt.config.ts      # JWT_SECRET, ACCESS_TTL, REFRESH_TTL
│   │   ├── storage.config.ts  # S3_ENDPOINT, BUCKET_NAME
│   │   └── redis.config.ts    # REDIS_URL
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── rbac.guard.ts
│   │   │   ├── scope.guard.ts
│   │   │   └── pin.guard.ts
│   │   ├── interceptors/
│   │   │   ├── audit-log.interceptor.ts   # Enregistre toutes les mutations
│   │   │   └── transform.interceptor.ts   # Envelope { data, meta }
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── uuid-validation.pipe.ts
│   │   └── dto/
│   │       ├── pagination.dto.ts          # page, limit, sort, order
│   │       └── response.dto.ts            # { data, meta, errors }
│   │
│   ├── prisma/
│   │   └── prisma.service.ts   # PrismaClient singleton + onModuleInit
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts  # POST /auth/login, /auth/refresh, /auth/logout
│   │   ├── auth.service.ts     # login(), refreshToken(), validateMfa()
│   │   ├── mfa.service.ts      # generateSecret(), verifyTotp()
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── verify-mfa.dto.ts
│   │
│   ├── utilisateurs/
│   │   ├── utilisateurs.module.ts
│   │   ├── utilisateurs.controller.ts
│   │   ├── utilisateurs.service.ts
│   │   └── dto/
│   │
│   ├── institutions/
│   │   └── ...
│   │
│   ├── beneficiaires/
│   │   ├── beneficiaires.module.ts
│   │   ├── beneficiaires.controller.ts
│   │   ├── beneficiaires.service.ts
│   │   └── dto/
│   │
│   ├── bases-juridiques/
│   │   ├── bases-juridiques.module.ts
│   │   ├── bases-juridiques.controller.ts
│   │   ├── bases-juridiques.service.ts
│   │   ├── mrd-import.service.ts    # Import / versioning SCD T2
│   │   └── dto/
│   │
│   ├── demandes/
│   │   ├── demandes.module.ts
│   │   ├── demandes.controller.ts
│   │   ├── demandes.service.ts
│   │   ├── state-machine.service.ts  # Guards + transitions OASE-7
│   │   ├── reference.service.ts      # Génère OASE-YYYY-NNNNNN
│   │   └── dto/
│   │
│   ├── pieces-jointes/
│   │   ├── pieces-jointes.module.ts
│   │   ├── pieces-jointes.controller.ts  # POST /pieces (multipart)
│   │   ├── pieces-jointes.service.ts
│   │   └── storage.service.ts       # Upload S3/MinIO + SHA-256
│   │
│   ├── workflow/
│   │   ├── workflow.module.ts
│   │   ├── workflow.controller.ts
│   │   ├── workflow.service.ts
│   │   ├── workflow-router.service.ts   # Détermine séquence selon type_texte_1
│   │   └── templates/                   # Définitions JSON des circuits
│   │       ├── cgi-ci.json
│   │       ├── cgi-cddi.json
│   │       ├── zone-franche.json
│   │       ├── accord-siege.json
│   │       ├── minier.json
│   │       └── manuel.json
│   │
│   ├── decisions/
│   │   └── ...
│   │
│   ├── conventions/
│   │   └── ...
│   │
│   ├── quotas/
│   │   └── ...
│   │
│   ├── anomalies/
│   │   ├── anomalies.module.ts
│   │   ├── anomalies.controller.ts
│   │   ├── anomalies.service.ts
│   │   └── rules-engine.service.ts   # Moteur règles paramétrables
│   │
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit.controller.ts        # GET /audit (lecture seule)
│   │   └── audit.service.ts           # createEntry() + hash chaîné
│   │
│   ├── connecteurs/
│   │   ├── connecteurs.module.ts
│   │   ├── connecteurs.controller.ts
│   │   ├── connecteurs.service.ts
│   │   ├── circuit-breaker.service.ts
│   │   └── adapters/
│   │       ├── sydonia.adapter.ts
│   │       ├── sigtas.adapter.ts
│   │       ├── sigfip.adapter.ts
│   │       ├── gudef.adapter.ts
│   │       └── etax.adapter.ts
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   └── email.service.ts
│   │
│   ├── attestations/
│   │   ├── attestations.module.ts
│   │   └── attestations.service.ts   # Puppeteer PDF + QR + SHA-256
│   │
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   ├── echeances.job.ts          # CRON quotidien alertes J-30/J-7/J0
│   │   ├── quota-alerte.job.ts
│   │   └── archivage.job.ts
│   │
│   └── open-data/
│       ├── open-data.module.ts
│       ├── open-data.controller.ts   # Routes publiques sans JWT
│       └── open-data.service.ts      # Requêtes agrégées anonymisées
│
├── test/
│   ├── auth.e2e-spec.ts
│   ├── demandes.e2e-spec.ts
│   └── rbac.e2e-spec.ts
│
├── .env.example
├── .env.production
├── package.json
├── tsconfig.json
├── nest-cli.json
└── ecosystem.config.js        # PM2 cluster config
```

---

## 4. Flux d'une requête type

```
Client (Vue 3)
    │
    ▼ HTTPS
Nginx (SSL termination + rate limit)
    │
    ▼
NestJS (port 3000 interne)
    │
    ├─ JwtAuthGuard          → valide JWT access token
    ├─ RbacGuard             → vérifie rôle via @Roles()
    ├─ ScopeGuard            → vérifie périmètre RLS
    ├─ ValidationPipe        → class-validator sur le DTO
    │
    ▼
Controller → Service
    │
    ├─ PrismaService         → requête DB (PostgreSQL)
    ├─ StateMachineService   → transition gardée (si mutation statut)
    ├─ StorageService        → upload/download S3 (si fichier)
    ├─ ConnecteurGateway     → sync SI externe (si mode automatique)
    │
    ▼
AuditLogInterceptor (after)  → enregistre mutation + hash chaîné
    │
    ▼
TransformInterceptor (after) → envelope { data, meta }
    │
    ▼
Client ← réponse JSON
```

---

## 5. Configuration des environnements

### `.env.example`

```dotenv
# Application
NODE_ENV=development
PORT=3000
APP_URL=https://oase.mef.tg
FRONTEND_URL=https://oase-app.mef.tg

# Base de données
DATABASE_URL=postgresql://oase:PASSWORD@localhost:5432/oase_prod
# ou MySQL: mysql://oase:PASSWORD@localhost:3306/oase_prod

# JWT
JWT_SECRET=CHANGE_ME_32_CHARS_MIN
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Chiffrement (MFA secrets, config connecteurs)
ENCRYPTION_KEY=CHANGE_ME_32_CHARS_MIN   # AES-256

# Redis (BullMQ + cache)
REDIS_URL=redis://localhost:6379

# Stockage fichiers (S3 / MinIO)
S3_ENDPOINT=https://s3.mef.tg
S3_ACCESS_KEY=CHANGE_ME
S3_SECRET_KEY=CHANGE_ME
S3_BUCKET_GED=oase-ged
S3_BUCKET_ATTESTATIONS=oase-attestations

# Email (SMTP MEF)
SMTP_HOST=smtp.mef.tg
SMTP_PORT=465
SMTP_USER=noreply@oase.mef.tg
SMTP_PASS=CHANGE_ME

# PDF / Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Feature flags
ENABLE_OPENROUTER_AI=true
OPENROUTER_API_KEY=CHANGE_ME
```

---

## 6. Stratégie de déploiement

### 6.1 Production — VM Linux (Ubuntu 22.04)

```
┌─────────────────────────────────────────────┐
│  VM MEF/OTR                                  │
│                                              │
│  Nginx :443 ──► Node.js :3000 (PM2 cluster)  │
│  Nginx :443 ──► Vue 3 build (static)         │
│                                              │
│  PostgreSQL 15 (local ou RDS)                │
│  Redis 7 (BullMQ + cache sessions)           │
│  MinIO (S3-compatible GED)                   │
└─────────────────────────────────────────────┘
```

**`ecosystem.config.js` (PM2)**
```javascript
module.exports = {
  apps: [{
    name: 'oase-api',
    script: 'dist/main.js',
    instances: 'max',       // cluster mode — 1 process / CPU core
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/oase/error.log',
    out_file:   '/var/log/oase/out.log',
  }],
};
```

### 6.2 Demo — cPanel (hébergement mutualisé)

cPanel Node.js App Manager supporte Node.js 18/20 avec PM2 intégré.

**Contraintes spécifiques cPanel :**
- Pas de port 80/443 directs → cPanel gère le proxy
- Redis non disponible → désactiver BullMQ, utiliser CRON cPanel pour les jobs
- PostgreSQL non disponible → utiliser MySQL 8 (fourni cPanel) avec `DATABASE_URL=mysql://...`
- Puppeteer non disponible (headless Chrome interdit) → générer PDF côté client ou utiliser `pdfkit`

**Adaptation `app.module.ts` selon l'environnement :**
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Queue : Redis si dispo, sinon no-op en cPanel
    process.env.REDIS_URL
      ? BullModule.forRoot({ connection: { url: process.env.REDIS_URL } })
      : [],
    PrismaModule,
    AuthModule,
    // ... autres modules
  ],
})
export class AppModule {}
```

---

## 7. Sécurité applicative

| Mesure | Implémentation |
|---|---|
| Helmet | `app.use(helmet())` — headers HTTP sécurisés |
| CORS strict | `origin: [FRONTEND_URL]` uniquement |
| Rate limiting | `@nestjs/throttler` — 100 req/min par IP, 10/min sur `/auth/login` |
| Body size | `--max-old-space-size=512`, body-parser 10MB max (GED via upload dédié) |
| JWT rotation | Refresh token rotation + blacklist Redis |
| MFA TOTP | Obligatoire P2/P4/P5/P7 — RFC 6238 |
| PIN signature | Bcrypt rounds=12, vérifié côté serveur avant `approuver()` |
| Chiffrement MFA secret | AES-256-GCM avec `ENCRYPTION_KEY` |
| SQL injection | Prisma paramétré — aucune interpolation directe |
| Upload | Validation MIME + taille + antivirus (ClamAV optionnel) |
| Logs | Structured JSON, pas de données PII dans les logs |
| HTTPS | TLS 1.2+ min, HSTS |

---

## 8. Format de réponse API unifié

```typescript
// Succès (200/201)
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 154,
    "took_ms": 12
  }
}

// Erreur (4xx/5xx)
{
  "error": {
    "code": "DEMANDE_STATUT_INVALIDE",
    "message": "Transition interdite : brouillon → approuve",
    "details": ["La demande doit d'abord être soumise."],
    "timestamp": "2026-06-16T19:00:00Z"
  }
}
```

---

## 9. Scripts NPM

```json
{
  "scripts": {
    "build":           "nest build",
    "start:dev":       "nest start --watch",
    "start:prod":      "node dist/main",
    "start:pm2":       "pm2 start ecosystem.config.js --env production",
    "db:migrate":      "prisma migrate deploy",
    "db:seed":         "ts-node prisma/seed/seed.ts",
    "db:seed:mrd":     "ts-node prisma/seed/mrd-import.ts",
    "db:studio":       "prisma studio",
    "test":            "jest",
    "test:e2e":        "jest --config jest-e2e.json",
    "test:cov":        "jest --coverage",
    "lint":            "eslint src --ext .ts --fix"
  }
}
```

---

*Livrable OASE-9 — Architecture NestJS. Alimente OASE-10 (scaffolding du projet), OASE-11 (Prisma schema), OASE-21 (déploiement).*
