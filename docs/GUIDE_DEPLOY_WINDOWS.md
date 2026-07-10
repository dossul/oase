# Guide de deploiement OASE - depuis Windows

**Date de derniere mise a jour :** 2026-07-10 22:52 UTC
**Auteur du setup :** Mavis (pour Ulrich Dossougoin)
**Mode :** Manuel (le CI/CD GitHub Actions a ete abandonne, voir section 8)

---

## 1. Vue d'ensemble

OASE est deploye sur un VPS Hostinger (KVM 8 / 32 GB RAM) a l'IP `147.93.85.22`. Le trafic est route par Traefik (existant) avec HTTPS automatique (Let's Encrypt).

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

| Service | Port interne | Memoire | Image |
|---|---|---|---|
| `oase-db` | 3306 (interne) | ~350 MB | mysql:8.0 |
| `oase-api` | 3000 (interne) | ~250-500 MB | oase-api:latest |
| `oase-frontend` | 80 (interne) | ~25 MB | oase-frontend:latest |

**Domaines :**
- `https://oase.ulia.site` -> Frontend Vue 3 + Vite + Vuetify
- `https://api.oase.ulia.site` -> API NestJS + Prisma

**RAM utilisee :** ~1 GB / 11 GB disponibles (largement comfortable)

---

## 2. Prerequis cote Windows

| Outil | Installation |
|---|---|
| **OpenSSH client** | Inclus dans Windows 10+ (Activer dans Parametres > Apps > Optional features) |
| **Git pour Windows** | https://git-scm.com/download/win |
| **Cle SSH** | `C:\Users\<ton_user>\.ssh\kvm8_key` (cle OpenSSH ed25519 deja generee) |

### Verifier la cle SSH

```powershell
Test-Path C:\Users\$env:USERNAME\.ssh\kvm8_key
# Doit retourner True
```

### Verifier OpenSSH

```powershell
ssh -V
# Doit afficher OpenSSH_8.x ou plus
```

---

## 3. Premier deploiement (deja fait le 2026-07-10)

### Etape 1 - Cloner le repo (si pas deja fait)

```powershell
cd C:\wamp64\www
git clone https://github.com/dossul/oase.git
cd oase
```

### Etape 2 - Generer les secrets de prod

```powershell
cd C:\wamp64\www\oase\deploy
python scripts\gen_env_prod.py
# Genere /opt/oase/deploy/.env sur le VPS avec secrets aleatoires forts
```

### Etape 3 - Lancer le script de deploiement Windows

```powershell
cd C:\wamp64\www\oase\deploy
.\deploy-from-windows.bat
```

Le script :
1. Verifie la cle SSH
2. Teste la connexion
3. Pull le code via Git
4. Build les 2 images Docker
5. Restart le stack
6. Lance les migrations Prisma
7. Affiche le statut final

**Duree totale :** 3-5 minutes (surtout le build NestJS)

---

## 4. Deploiements suivants (workflow quotidien)

### A. Deploiement one-click (recommande)

```powershell
# Depuis n'importe ou, en double-cliquant ou en PowerShell :
C:\wamp64\www\oase\deploy\deploy-from-windows.bat
```

### B. Deploiement manuel (pour debug)

```powershell
# Connexion SSH
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22

# Sur le VPS :
cd /opt/oase
git pull
docker build --no-cache -t oase-api:latest -f deploy/api.Dockerfile .
docker build --no-cache -t oase-frontend:latest -f deploy/frontend.Dockerfile .
docker compose -f deploy/docker-compose.local-prod.yml up -d --force-recreate
docker exec oase-api npx prisma migrate deploy
```

---

## 5. Commandes utiles

### Voir les logs en temps reel

```powershell
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22 "docker compose -f /opt/oase/deploy/docker-compose.local-prod.yml logs -f"
```

### Statut du stack

```powershell
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep oase"
```

### Health check API

```powershell
curl.exe -k https://api.oase.ulia.site/api/v1/health
# Retour attendu : {"status":"ok","info":{},"error":{},"details":{}}
```

### Connexion MySQL

```powershell
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22 "docker exec -it oase-db mysql -uoase -p[DB_PASS] oase"
# Le DB_PASS est dans /opt/oase/deploy/.env sur le VPS
```

### Backup manuel

```powershell
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22 "/opt/oase/deploy/scripts/backup-db.sh"
# Dump cree dans /opt/oase/backups/oase_YYYY-MM-DD_HHMMSS.sql.gz
```

### Restore

```powershell
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22
cd /opt/oase
./deploy/scripts/restore-db.sh backups/oase_2026-07-10_120000.sql.gz
```

### Seed (donnees de demo)

```powershell
ssh -i C:\Users\$env:USERNAME\.ssh\kvm8_key root@147.93.85.22
cd /opt/oase
docker exec oase-api node prisma/seed.js
# Login : admin@oase.tg / Oase@2026!
```

---

## 6. Arborescence du projet

```
C:\wamp64\www\oase\
|-- .github/workflows/
|   |-- ci.yml                    (tests + lint, desactive par defaut)
|   `-- cd.yml                    (CD via SSH - desactive, voir section 8)
|
|-- deploy/                       # Infrastructure Docker
|   |-- deploy-from-windows.bat   # SCRIPT WINDOWS ONE-CLICK
|   |-- docker-compose.yml        # Stack dev (build local)
|   |-- docker-compose.local-prod.yml  # Stack prod VPS (images locales)
|   |-- docker-compose.prod.yml   # Stack prod GHCR (pour CI/CD futur)
|   |-- api.Dockerfile            # Image NestJS (multi-stage)
|   |-- frontend.Dockerfile       # Image Vue/Vite (multi-stage)
|   |-- nginx.conf                # Config Nginx frontend
|   |-- traefik-frontend.yml      # Config Traefik file-based (workaround)
|   |-- env.prod.template         # Template variables prod
|   |-- README.md                 # Doc deploy/
|   `-- scripts/
|       |-- deploy.sh             # Deploiement manuel sur VPS
|       |-- backup-db.sh          # Dump MySQL
|       |-- restore-db.sh         # Restore dump
|       |-- gen_env_prod.py       # Genere .env avec secrets forts
|       `-- add_dns.py            # Ajout records DNS Hostinger
|
|-- oase-api/                     # Backend NestJS (existant)
|-- maquette/                     # Frontend Vue (existant, repo separe)
|-- docs/
|   |-- DEPLOIEMENT_DOCKER.md     # Doc infrastructure
|   |-- GUIDE_DEPLOY_WINDOWS.md   # CE FICHIER
|   `-- CHANGELOG_OASE.md         # Historique des changements
|
`-- README.md
```

---

## 7. Stack sur le VPS

```
/opt/oase/
|-- deploy/                       # Compose files + scripts
|   |-- docker-compose.local-prod.yml
|   |-- .env                      # Secrets prod (chmod 600)
|   `-- scripts/
|-- oase-api/                     # Source (clone git)
|-- maquette/                     # Source (clone git)
|-- backups/                      # Dumps MySQL
`-- .git/                         # Repo git pour les pulls
```

Reseaux Docker :
- `proxy-network` (existant) : routage Traefik
- `oase-net` (nouveau) : communication interne API <-> DB <-> Frontend

---

## 8. Pourquoi pas CI/CD GitHub Actions ?

On a essaye de mettre en place un workflow CD GitHub Actions, mais il y a eu plusieurs problemes :

1. **BuildKit cache bug** : `"/src": not found` sur le runner GitHub Actions
2. **Format de la cle SSH** : inconu dans certains cas
3. **4 secondes pour fail** : erreur trop rapide pour debuger

**Solution choisie :** deploys manuels depuis Windows via le script `.bat`. Plus fiable, plus rapide, et tu gardes le controle.

**Pour reactiver le CI plus tard :**
- Le workflow `.github/workflows/cd.yml` est toujours la (en mode debug)
- Faudra investiguer les logs GitHub Actions (auth requise)
- Alternative : utiliser GitLab CI, Drone, ou un runner GitHub Actions self-hosted sur le VPS

---

## 9. Troubleshooting

### Le build NestJS echoue (timeout, OOM)

Si tu as un out-of-memory pendant le build :
```bash
# Sur le VPS, en SSH :
docker build --no-cache -t oase-api:latest -f deploy/api.Dockerfile . \
  --memory=2g --memory-swap=4g
```

### Le frontend nginx healthcheck est "unhealthy"

C'est normal - le healthcheck interne utilise `localhost` au lieu de `127.0.0.1` et ne resout pas dans le container Alpine. **L'app fonctionne quand meme.** Pour le rendre healthy :
- Modifier le healthcheck dans `deploy/frontend.Dockerfile` :
  ```
  HEALTHCHECK CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1
  ```
- Reconstruire + redemarrer

### DNS ne propage pas

Les nouveaux records DNS peuvent prendre 5 a 30 minutes a se propager.

```powershell
nslookup oase.ulia.site
# Doit retourner 147.93.85.22
```

Si ca ne marche pas, verifier dans hPanel -> DNS Zone Editor.

### Container redemarre en boucle

```bash
ssh root@147.93.85.22
cd /opt/oase
docker logs oase-api --tail 50
docker logs oase-frontend --tail 50
docker logs oase-db --tail 50
```

### Le secret `.env` a change / perdu

Re-genere avec :
```powershell
cd C:\wamp64\www\oase\deploy
python scripts\gen_env_prod.py
```

---

## 10. Contacts et ressources

- **Operateur** : Ulrich Dossougoin
- **Email** : dossulrich@gmail.com
- **Repo GitHub** : https://github.com/dossul/oase
- **VPS** : Hostinger KVM 8 - 32 GB RAM - 147.93.85.22
- **Domaine** : ulia.site (Hostinger DNS)
- **API Hostinger** : token dans `C:\laragon\www\mng_vps_hostinger_ul1\.env`

---

## 11. URLs importantes

| URL | Usage |
|---|---|
| `https://oase.ulia.site/login` | Page de login OASE |
| `https://api.oase.ulia.site/api/v1/health` | Health check API |
| `https://traefik.ulia.site` | Dashboard Traefik |
| `https://portainer.ulia.site` | Gestion Docker |
| `https://netdata.ulia.site` | Monitoring systeme |
