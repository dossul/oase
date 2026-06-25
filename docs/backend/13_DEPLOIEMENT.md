# OASE-25 & 26 — Guide de déploiement

> **Issues Plane :** OASE-25 (cPanel), OASE-26 (VM Ubuntu)  
> **Date :** 2026-06-16

---

## Déploiement A — cPanel (demo / recette)

### Prérequis

- cPanel avec Node.js App Manager (v14–v20)
- MySQL 8.0 (fourni par l'hébergeur)
- Pas de Redis — les queues BullMQ sont remplacées par des CRON cPanel

### 1. Créer la base MySQL

```sql
CREATE DATABASE oase_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'oase_user'@'localhost' IDENTIFIED BY '<mot_de_passe_fort>';
GRANT ALL PRIVILEGES ON oase_demo.* TO 'oase_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Uploader le code

```bash
# Via Git dans le terminal cPanel
git clone https://github.com/your-org/oase-backend.git oase-api
cd oase-api
npm install --production
```

### 3. Variables d'environnement

Dans cPanel → **Setup Node.js App** → **Environment Variables** :

```dotenv
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://oase_user:<pass>@localhost:3306/oase_demo
JWT_SECRET=<64 caractères aléatoires>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ENCRYPTION_KEY=<32 caractères exactement>
S3_ENDPOINT=https://s3.your-host.tg
S3_ACCESS_KEY=<key>
S3_SECRET_KEY=<secret>
S3_BUCKET=oase-documents
MAIL_HOST=mail.your-host.tg
MAIL_PORT=587
MAIL_USER=noreply@oase.mef.tg
MAIL_PASS=<pass>
# Mode demo — tous les connecteurs en mock
SYDONIA_MOCK=true
ETAX_MOCK=true
SIGFIP_MOCK=true
GUDEF_MOCK=true
DAS_MOCK=true
```

### 4. Migration Prisma + seeds

```bash
# Dans le terminal cPanel
npx prisma migrate deploy
npx prisma db seed
```

### 5. Démarrer l'application

Dans cPanel → **Setup Node.js App** :
- **Application root :** `oase-api`
- **Application startup file :** `dist/main.js`
- **Run NPM Install** → **Start App**

### 6. CRON jobs (remplace BullMQ)

Dans cPanel → **Cron Jobs** :

```
# Alertes échéances (quotidien 06h00)
0 6 * * *  cd ~/oase-api && node dist/jobs/alertes-echeances.js

# Sync statut fiscal OTR (quotidien 07h00)
0 7 * * *  cd ~/oase-api && node dist/jobs/sync-statut-fiscal.js

# Heartbeat connecteurs (toutes les 10 min)
*/10 * * * *  cd ~/oase-api && node dist/jobs/heartbeat-connecteurs.js
```

### 7. Vérification

```bash
curl https://demo.oase.mef.tg/api/v1/public/stats
# Attendu : { data: { nb_mesures_actives: 1298, ... } }
```

---

## Déploiement B — VM Ubuntu 22.04 (production)

### Prérequis

- Ubuntu 22.04 LTS
- PostgreSQL 15
- Redis 7
- Node.js 20 LTS
- PM2
- Nginx
- Certbot (SSL Let's Encrypt)
- MinIO (ou stockage S3 compatible)

### 1. Installer les dépendances système

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-client-15

# Redis 7
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Créer la base PostgreSQL

```sql
-- En tant que postgres
CREATE DATABASE oase_prod;
CREATE USER oase_app WITH ENCRYPTED PASSWORD '<mot_de_passe_fort>';
GRANT ALL PRIVILEGES ON DATABASE oase_prod TO oase_app;
```

### 3. Déployer l'application

```bash
# Créer l'utilisateur système
sudo useradd -m -s /bin/bash oase
sudo su - oase

# Cloner et installer
git clone https://github.com/your-org/oase-backend.git /home/oase/api
cd /home/oase/api
npm install
npm run build
```

### 4. Fichier `.env` production

```dotenv
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://oase_app:<pass>@localhost:5432/oase_prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=<64 caractères, généré via openssl rand -hex 32>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ENCRYPTION_KEY=<32 caractères exactement>
S3_ENDPOINT=https://s3.mef.tg
S3_ACCESS_KEY=<key>
S3_SECRET_KEY=<secret>
S3_BUCKET=oase-documents-prod
MAIL_HOST=smtp.mef.tg
MAIL_PORT=587
MAIL_USER=noreply@oase.mef.tg
MAIL_PASS=<pass>
SYDONIA_MOCK=false
ETAX_MOCK=false
SIGFIP_MOCK=false
GUDEF_MOCK=false
DAS_MOCK=false
SYDONIA_ENDPOINT=https://sydonia.otr.tg/api/v2
ETAX_ENDPOINT=https://etax.otr.tg/api/v1
ETAX_API_KEY=<fourni par OTR>
```

### 5. Migration + seeds production

```bash
cd /home/oase/api
npx prisma migrate deploy
# NE PAS exécuter prisma db seed en production (seeds = demo uniquement)
# Import MRD via l'API admin :
# POST /api/v1/bases-juridiques/import/mrd (fichier MRD 2024)
```

### 6. PM2 — cluster mode

```bash
# ecosystem.config.js (dans /home/oase/api/)
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'oase-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    max_memory_restart: '1G',
    error_file: '/var/log/oase/pm2-error.log',
    out_file: '/var/log/oase/pm2-out.log',
  }],
};
EOF

pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # suivre les instructions sudo affichées
```

### 7. Nginx — reverse proxy + SSL

```nginx
# /etc/nginx/sites-available/oase-api
server {
    listen 80;
    server_name api.oase.mef.tg;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.oase.mef.tg;

    ssl_certificate     /etc/letsencrypt/live/api.oase.mef.tg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.oase.mef.tg/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Upload pièces jointes
    client_max_body_size 15M;

    location /api/ {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/oase-api /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.oase.mef.tg
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Vérification production

```bash
# Santé API
curl https://api.oase.mef.tg/api/v1/public/stats

# Vérification SSL
curl -I https://api.oase.mef.tg

# Logs PM2
pm2 logs oase-api --lines 50

# Statut connecteurs
curl -H "Authorization: Bearer <token_admin>" \
     https://api.oase.mef.tg/api/v1/connecteurs/health
```

---

## Comparatif cPanel vs VM

| Aspect | cPanel (demo) | VM Ubuntu (prod) |
|---|---|---|
| Queues async | CRON cPanel | BullMQ + Redis |
| Base de données | MySQL 8 | PostgreSQL 15 |
| Instances | 1 (PM2 single) | N (PM2 cluster) |
| SSL | Hébergeur | Let's Encrypt / cert MEF |
| Connecteurs SI | Tous en mock | Tous réels |
| Coût | Hébergement mutualisé | VM dédiée MEF |
| Mise en place | 1h | 3h |

---

*Livrables OASE-25 & 26 — Déploiement.*
