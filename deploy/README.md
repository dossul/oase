# OASE - Stack Docker

Ce dossier contient toute l'infrastructure Docker pour OASE (dev + prod).

## Architecture

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │  Traefik (existant)
              │  *.ulia.site
              └────────┬────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
  oase.ulia.site              api.oase.ulia.site
  (frontend Nginx)            (NestJS API)
        │                             │
        │                             ▼
        │                      ┌──────────────┐
        │                      │  oase-db     │
        │                      │  MySQL 8.0   │
        │                      └──────────────┘
        ▼
   Static files
   (Vite dist/)
```

## Fichiers

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Stack dev (locale, pas de Traefik) |
| `docker-compose.prod.yml` | Stack prod (Traefik + GHCR) |
| `api.Dockerfile` | Build image NestJS (multi-stage) |
| `frontend.Dockerfile` | Build image Vue/Vite (multi-stage) |
| `nginx.conf` | Reverse proxy interne (frontend → API) |
| `.env.prod.example` | Template des variables prod |
| `scripts/deploy.sh` | Déploiement manuel via SSH |
| `scripts/backup-db.sh` | Dump MySQL quotidien |
| `scripts/restore-db.sh` | Restore depuis dump |

## Démarrage rapide

### Dev local

```bash
cd deploy
cp .env.prod.example .env
docker compose up -d --build
```

App dispo sur http://localhost:8080 (front) et http://localhost:3000 (api).

### Prod

Voir `docs/DEPLOIEMENT_DOCKER.md` à la racine du projet.

```bash
# Sur le VPS
cd /opt/oase
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Healthchecks

| Endpoint | Vérifie |
|---|---|
| http://localhost:3000/api/v1/health | API up |
| http://localhost:8080/healthz | Frontend Nginx up |
| `docker compose ps` | Tous services healthy |
trigger CD
