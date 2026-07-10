# Deploiement OASE - Docker + CI/CD

## Vue d'ensemble

OASE est deploye sur le VPS Hostinger (KVM 8 - 32 GB RAM) sous l'infrastructure
Docker existante (Traefik + proxy-network). Le deploiement est automatise via
GitHub Actions (build + push GHCR + deploiement SSH).

```
                    Internet
                       |
                       v
              +-----------------+
              |  Traefik (proxy)|
              |  *.ulia.site    |
              +--------+--------+
                       |
        +--------------+--------------+
        |                             |
        v                             v
  oase.ulia.site              api.oase.ulia.site
  (frontend Nginx)            (NestJS API)
        |                             |
        |                             v
        |                      +--------------+
        |                      |  oase-db     |
        |                      |  MySQL 8.0   |
        |                      +--------------+
        v
   Static files
   (Vite dist/)
```

## Architecture

| Service | Image | Port interne | Memoire |
|---|---|---|---|
| `oase-db` | mysql:8.0 | 3306 (interne) | ~350 MB |
| `oase-api` | oase-api:latest | 3000 | ~250-500 MB |
| `oase-frontend` | oase-frontend:latest | 80 | ~25 MB |

Reseaux utilises :
- `proxy-network` (existant) : routage Traefik
- `oase-net` (nouveau) : communication interne API <-> DB <-> Frontend

Domaines :
- `https://oase.ulia.site` -> Frontend (Vue/Vite)
- `https://api.oase.ulia.site` -> API (NestJS)

## Structure du repo

```
oase/
|-- deploy/                          # Infra Docker
|   |-- docker-compose.yml           # Stack dev (build local)
|   |-- docker-compose.local-prod.yml # Stack prod VPS (images locales)
|   |-- docker-compose.prod.yml      # Stack prod CI/CD (images GHCR)
|   |-- api.Dockerfile               # Image NestJS
|   |-- frontend.Dockerfile          # Image Vite + Nginx
|   |-- nginx.conf                   # Config Nginx frontend
|   |-- traefik-frontend.yml         # Config Traefik file-based (workaround)
|   |-- env.prod.template            # Template variables prod
|   |-- .env.prod.example            # Exemple dev
|   |-- README.md                    # Doc deploy/
|   +-- scripts/
|       |-- deploy.sh                # Deploiement manuel
|       |-- backup-db.sh             # Dump MySQL
|       |-- restore-db.sh            # Restore dump
|       |-- gen_env_prod.py          # Genere .env avec secrets aleatoires
|       |-- add_dns.py               # Ajout records DNS Hostinger
|       +-- helpers (check, list...)
|
|-- .github/workflows/
|   |-- ci.yml                       # Tests + lint (existant)
|   +-- cd.yml                       # Build + push GHCR + deploy (nouveau)
|
|-- oase-api/                        # Backend NestJS (existant)
|-- maquette/                        # Frontend Vue (existant, repo separe)
+-- docs/
    +-- DEPLOIEMENT_DOCKER.md        # Ce fichier
```

## Deploiement initial (deja fait)

### 1. Preparation VPS

```bash
ssh root@147.93.85.22
mkdir -p /opt/oase/{deploy,backups}
```

### 2. Generation des secrets

```bash
# Genere DB_ROOT_PASSWORD, DB_PASS, JWT_SECRET, JWT_REFRESH_SECRET
python deploy/scripts/gen_env_prod.py
# Pose /opt/oase/deploy/.env avec chmod 600
```

### 3. Configuration DNS (Hostinger)

Via API :
```python
# deploy/scripts/add_dns.py
# Ajoute oase.ulia.site et api.oase.ulia.site -> 147.93.85.22
```

Ou manuellement via hPanel : https://hpanel.hostinger.com -> DNS Zone Editor

### 4. Deploiement Traefik file-based

```bash
# Contourne un bug Traefik qui ne detecte pas les labels du container oase-frontend
scp deploy/traefik-frontend.yml root@147.93.85.22:/opt/docker-infra/traefik/dynamic/oase.yml
```

### 5. Build des images et lancement

```bash
ssh root@147.93.85.22
cd /opt/oase
tar -xzf /tmp/oase-deploy-src.tar.gz -C /opt/oase/  # source code

# Build
docker build -f deploy/api.Dockerfile -t oase-api:latest .
docker build -f deploy/frontend.Dockerfile -t oase-frontend:latest .

# Tag (pour le compose local-prod)
docker tag oase-api:latest oase-api:latest
docker tag oase-frontend:latest oase-frontend:latest

# Lancer
cd /opt/oase
docker compose -f deploy/docker-compose.local-prod.yml --env-file deploy/.env up -d
```

### 6. Verification

```bash
# Sante API
curl -sk https://api.oase.ulia.site/api/v1/health
# -> {"status":"ok",...}

# Sante Frontend
curl -sk -I https://oase.ulia.site/
# -> HTTP/2 200

# Voir l'app
# -> https://oase.ulia.site/login
```

## CI/CD (apres configuration secrets GitHub)

### Secrets a ajouter dans GitHub repo `dossul/oase`

| Secret | Valeur |
|---|---|
| `VPS_HOST` | `147.93.85.22` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Contenu de `C:\Users\lenovo\.ssh\kvm8_key` |

### Declenchement

Le workflow CD se declenche sur :
- Push sur `main` modifiant `oase-api/`, `maquette/`, `deploy/`, ou `.github/workflows/cd.yml`
- Declenchement manuel via GitHub Actions UI

### Ce qu'il fait

1. **Build** : 2 images Docker en parallele
   - `ghcr.io/dossul/oase-api:latest`
   - `ghcr.io/dossul/oase-frontend:latest`
2. **Push GHCR** : via `docker/login-action` avec le token GitHub
3. **Deploy SSH** : sur le VPS
   - Pull des dernieres images
   - Restart du stack
   - Attente sante MySQL
   - Migration Prisma
   - Nettoyage images orphelines
4. **Smoke test** : verifie que l'API et le frontend repondent

## Operations courantes

### Voir les logs

```bash
ssh root@147.93.85.22
cd /opt/oase
docker compose -f deploy/docker-compose.local-prod.yml logs -f --tail=50

# Un service precis
docker logs oase-api --tail 100
docker logs oase-frontend --tail 100
docker logs oase-db --tail 100
```

### Backup BDD (automatique via cron)

```bash
# Cron job
0 3 * * * /opt/oase/deploy/scripts/backup-db.sh >> /var/log/oase-backup.log 2>&1

# Manuel
ssh root@147.93.85.22 /opt/oase/deploy/scripts/backup-db.sh
# Dump dans /opt/oase/backups/oase_YYYY-MM-DD_HHMMSS.sql.gz
```

### Restore

```bash
ssh root@147.93.85.22
cd /opt/oase
./deploy/scripts/restore-db.sh backups/oase_2026-07-10_030000.sql.gz
```

### Mise a jour manuelle

```bash
# 1. Pull nouveau code
cd /opt/oase
git pull

# 2. Rebuild images
docker build -f deploy/api.Dockerfile -t oase-api:latest .
docker build -f deploy/frontend.Dockerfile -t oase-frontend:latest .

# 3. Redemarrer
docker compose -f deploy/docker-compose.local-prod.yml up -d --force-recreate

# 4. Migrations Prisma
docker compose -f deploy/docker-compose.local-prod.yml exec oase-api npx prisma migrate deploy
```

### Seed (donnees de demo)

```bash
ssh root@147.93.85.22
cd /opt/oase
docker compose -f deploy/docker-compose.local-prod.yml exec oase-api node prisma/seed.js
# Login: admin / Oase@2026!
```

## Problemes connus

### 1. Traefik ne detecte pas les labels du conteneur `oase-frontend`

**Symptome** : `https://oase.ulia.site/` retourne 404, mais l'API repond.

**Cause** : Bug ou filtre de Traefik qui ne voit pas les labels du container,
malgre que les labels soient syntaxiquement corrects et le container sur
`proxy-network`.

**Workaround** : Utiliser une config Traefik file-based
(`deploy/traefik-frontend.yml`) qui definit manuellement le router + service
pour le frontend.

**A investiguer** : possible conflit avec le middleware `oase-redirect`
defini 2 fois (API + frontend), ou un cache stale.

### 2. API Hostinger DNS ne permet pas d'ajouter facilement de nouveaux records

L'API `/api/dns/v1/zones/{domain}` a un comportement etrange : ajouter un
nouveau record A reussit parfois, mais peut renvoyer des erreurs de
"duplicate" inexplicables. Le format correct est :

```json
{
  "zone": [
    {"name": "oase", "type": "A", "ttl": 300, "records": [{"content": "1.2.3.4"}]}
  ]
}
```

Important : `name` = sous-domaine, PAS le nom de zone.

## Contacts

- **Operateur** : Ulrich Dossougoin
- **Email** : dossulrich@gmail.com
- **VPS** : Hostinger KVM 8 (32 GB RAM, 147.93.85.22)
- **Domaine** : ulia.site (Hostinger DNS)
- **CI/CD** : GitHub Actions + GHCR
