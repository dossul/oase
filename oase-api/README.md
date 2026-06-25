# OASE API

API backend NestJS pour le suivi automatisé des exonérations (OASE).

## Prérequis

- Node.js 20+
- MySQL 8 / MariaDB 10.6+
- Une base `oase` initialisée avec Prisma Migrate et le seed démo

## Installation

```bash
npm install
npx prisma generate
```

## Configuration

```bash
cp .env.example .env
# Editer .env avec votre DATABASE_URL
```

## Démarrage

```bash
npm run start:dev
```

L'API est disponible sur :
- `http://localhost:3000/api/v1`
- Swagger UI : `http://localhost:3000/api/docs`
- Health : `http://localhost:3000/api/v1/health`

## Scripts utiles

```bash
npm run build              # Build production
npm run start:prod         # Démarrage production
npm run test               # Tests unitaires
npm run test:e2e           # Tests E2E
npm run lint               # ESLint
npm run prisma:validate    # Validation schema Prisma
npm run prisma:migrate     # Application migrations
npm run seed               # Seed demo
npm run integration:test   # Test reset + seed sur oase_test
```

## Structure

```
src/
  app.module.ts         # Module racine
  main.ts               # Point d'entrée NestJS
  config/               # Validation configuration
  prisma/               # PrismaService global
  health/               # Endpoint /health
  common/               # Enums, helpers, pipes
```

## Phase A — Réconciliation

- Schema Prisma v3.3 (85 modèles) : `prisma/schema.prisma`
- Migration baseline : `prisma/migrations/001_init_v33/`
- Seed démo : `prisma/seed.js`
- Test d'intégrité : `scripts/integration-test.js`
