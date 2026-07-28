# OASE — Runbook : mise à jour du serveur VPS (production)

> **Version :** 1.0 — 2026-07-27
> **Cible :** VPS Hostinger `147.93.85.22` (`/opt/oase`), stack Docker `oase-db` / `oase-api` / `oase-web` (Traefik).
> **URLs :** app `https://oase.ulia.site` · API `https://api.oase.ulia.site/api/v1`.
> **Principe directeur :** **le local remplace la prod** (code + base de données), avec sauvegarde préalable systématique.

> ⛔ **POLITIQUE DE DÉPLOIEMENT (décision projet, 2026-07-27) :** le déploiement **Vercel est INTERDIT** pour ce projet. Le **VPS Docker est le SEUL canal autorisé**. Les artefacts Vercel (`maquette/vercel.json`, lien `.vercel/`) ont été supprimés ; ne pas les réintroduire. Toute mise en ligne passe par ce runbook.

---

## 0. Prérequis (poste Windows de déploiement)

| Item | Détail |
|---|---|
| Clé SSH | `C:\Users\<user>\.ssh\kvm8_key` (accès `root@147.93.85.22`) |
| Dépôts à jour | `C:/wamp64/www/oase` (backend+docs, branche `main`) et `C:/wamp64/www/oase/maquette` (frontend, branche `master`) — **dépôts git séparés** |
| MySQL local | WAMP `C:\wamp64\bin\mysql\mysql9.1.0\bin\` (`mysqldump.exe`) |
| Build local vert | `oase-api`: `npm run build` + `npx jest` (367/367) · `maquette`: `npm run build` (vite) + `npx vue-tsc -b --noEmit` |
| Tests E2E verts | recette `29/29` (voir §7) |

⚠️ **Particularité du VPS :** `/opt/oase` n'est **pas** un dépôt git (copie simple) — seul `/opt/oase/maquette` est un clone git. Le backend/docs se synchronisent donc par **tar over SSH**, pas par `git pull`.

---

## 1. Commit & push (les 2 dépôts)

```bash
# Backend + docs (dépôt racine)
cd /c/wamp64/www/oase
git add -A -- oase-api deploy docs
git commit -m "..."
git push origin <branche-de-travail>
git branch -f main <branche-de-travail> && git push origin main   # main = référence de prod

# Frontend (dépôt maquette)
cd /c/wamp64/www/oase/maquette
git add -A && git commit -m "..." && git push origin master
```

---

## 2. Sauvegarde de la base prod (TOUJOURS avant toute action DB)

```bash
ssh -i ~/.ssh/kvm8_key root@147.93.85.22 \
  "DBPWD=\$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2); \
   docker exec oase-db mysqldump -u root -p\"\$DBPWD\" --single-transaction --routines --triggers oase \
   | gzip > /opt/oase/backups/oase_pre_<AAAAMMJJ>.sql.gz && ls -la /opt/oase/backups/"
```

---

## 3. Synchronisation du code

```bash
# 3a. Backend + deploy + docs (tar over SSH — /opt/oase n'est pas un repo git)
cd /c/wamp64/www/oase
tar czf - --exclude=node_modules --exclude=dist --exclude=logs --exclude=.git --exclude=test-results \
  oase-api deploy docs | ssh -i ~/.ssh/kvm8_key root@147.93.85.22 "tar xzf - -C /opt/oase"

# 3b. Frontend (clone git sur le VPS)
ssh -i ~/.ssh/kvm8_key root@147.93.85.22 \
  "cd /opt/oase/maquette && git fetch origin && git reset --hard origin/master"
```

---

## 4. (Option) Remplacement de la base prod par le dump local

> Uniquement quand la donnée locale doit devenir la référence (seeds, réparations de données…).

```bash
# 4a. Dump local
/c/wamp64/bin/mysql/mysql9.1.0/bin/mysqldump.exe -u root --single-transaction --routines --triggers oase \
  | gzip > /tmp/oase_local_<AAAAMMJJ>.sql.gz
scp -i ~/.ssh/kvm8_key /tmp/oase_local_<AAAAMMJJ>.sql.gz root@147.93.85.22:/opt/oase/backups/

# 4b. Restore (API arrêtée pour éviter les conflits)
ssh -i ~/.ssh/kvm8_key root@147.93.85.22 \
  "cd /opt/oase/deploy && docker compose -f docker-compose.local-prod.yml stop oase-api && \
   DBPWD=\$(grep DB_ROOT_PASSWORD .env | cut -d= -f2) && \
   gunzip -c /opt/oase/backups/oase_local_<AAAAMMJJ>.sql.gz | docker exec -i oase-db mysql -u root -p\"\$DBPWD\" oase"
```

**Après un restore de dump complet**, la table `_prisma_migrations` peut contenir des échecs enregistrés (P3009) ou des migrations « déjà dans le schéma » → les marquer appliquées (cf. §5b).

---

## 5. Build des images + redémarrage

```bash
ssh -i ~/.ssh/kvm8_key root@147.93.85.22 " \
  cd /opt/oase && \
  docker build -t oase-api:latest -f deploy/api.Dockerfile . && \
  docker build -t oase-frontend:latest -f deploy/frontend.Dockerfile . && \
  cd deploy && docker compose -f docker-compose.local-prod.yml up -d --force-recreate && \
  sleep 30 && docker ps --format '{{.Names}} {{.Status}}' | grep oase"
```

> Le conteneur `oase-api` exécute `npx prisma migrate deploy` au démarrage (CMD de l'image) : les nouvelles migrations s'appliquent seules.
> 💡 Ajouter `--no-cache` au build API si un doute sur du code non rafraîchi (cache Docker).

### 5b. Résolution des migrations en échec (P3009 / « déjà appliquée »)

Si le dump restauré contient déjà le schéma final, `migrate deploy` échoue sur les migrations intermédiaires :

```bash
ssh -i ~/.ssh/kvm8_key root@147.93.85.22 "DBPWD=\$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2); \
  docker run --rm --network oase-net -e DATABASE_URL=\"mysql://root:\$DBPWD@oase-db:3306/oase\" \
  --entrypoint npx oase-api:latest prisma migrate resolve --applied <nom_migration>"
# Puis : ... prisma migrate deploy  → « No pending migrations to apply. »
```

### 5c. Seed complémentaire éventuelle (ex. données de référence)

```bash
# Exporter une table locale et l'importer en prod (idempotent)
/c/wamp64/bin/mysql/mysql9.1.0/bin/mysqldump.exe -u root --no-create-info --insert-ignore oase <table> \
  | ssh -i ~/.ssh/kvm8_key root@147.93.85.22 \
  "DBPWD=\$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2); \
   docker exec -i oase-db mysql -u root -p\"\$DBPWD\" oase"
```

---

## 6. Vérifications — règle des 3 vérifications (V1/V2/V3)

| # | Type | Commande | Attendu |
|---|---|---|---|
| **V1** | Live E2E | `cd maquette && TEST_BASE_URL=https://oase.ulia.site TEST_API_URL=https://api.oase.ulia.site/api/v1 npx playwright test e2e/recette` (+ `p4-decideur.spec.ts` isolément) | **29/29 PASS** |
| **V2** | Bundle servi | `curl -s https://oase.ulia.site/ \| grep -oE '/assets/index-[^"]*\.js'` | hash ≠ précédent déploiement |
| **V3** | API indépendante | `curl https://api.oase.ulia.site/api/v1/health` + logins des comptes clés | 200 + **16/16 logins** |

Contrôles additionnels usuels :
```bash
# Endpoints clés (token admin)
curl -s -o /dev/null -w '%{http_code}' https://api.oase.ulia.site/api/v1/connecteurs -H "Authorization: Bearer $T"
curl -s -o /dev/null -w '%{http_code}' https://api.oase.ulia.site/api/v1/admin/monitoring -H "Authorization: Bearer $T"
curl -s -o /dev/null -w '%{http_code}' https://api.oase.ulia.site/api/v1/rapports/opendata   # public, sans token
# Scan « 0 donnée fictive » : aucune valeur de démo (TOGO STEEL, 847,3 Mds, hashes TSA…) visible sur les vues clés
```

---

## 7. Rollback

```bash
# Code : rebuild des images sur le commit précédent (maquette : git reset --hard <sha> sur le VPS ; oase-api : re-tar depuis le checkout local voulu)
# Base : restore du backup du §2
ssh -i ~/.ssh/kvm8_key root@147.93.85.22 \
  "cd /opt/oase/deploy && docker compose -f docker-compose.local-prod.yml stop oase-api && \
   DBPWD=\$(grep DB_ROOT_PASSWORD .env | cut -d= -f2) && \
   gunzip -c /opt/oase/backups/oase_pre_<AAAAMMJJ>.sql.gz | docker exec -i oase-db mysql -u root -p\"\$DBPWD\" oase && \
   docker compose -f docker-compose.local-prod.yml up -d"
```

---

## 8. Pièges connus (vécus le 2026-07-27)

| Piège | Symptôme | Parade |
|---|---|---|
| `.env.local` dans le contexte Docker | mode démo (sélecteur persona) actif en prod | `.dockerignore` racine (`**/.env*`) + double garde `import.meta.env.DEV` |
| `src/generated/prisma` désynchronisé du schema | build Docker KO (TS2339) alors que le local « passe » (tsbuildinfo périmé) | `npx prisma generate` + commit du client régénéré ; build local depuis `rm -rf dist` |
| tsbuildinfo incrémental | erreurs TS fantômes locales | supprimer `dist/**/tsconfig*.tsbuildinfo` avant diagnostic |
| Cache Docker sur `COPY src` | ancien code dans l'image | `docker build --no-cache` |
| `docker compose up` avant migration | API crash-loop P3009 | §5b (`migrate resolve --applied`) |
| Fichiers modifiés non commités avant sync tar | VPS ≠ local (md5 différent) | `git status` propre avant §3 ; vérifier `md5sum` local vs VPS en cas de doute |
| Uploads/attestations EACCES | 500 mkdir `/app/uploads` | dossiers créés + `chown oase` dans `api.Dockerfile` + volumes `oase_uploads_data` / `oase_attestations_data` |

---

*Runbook tenu à jour à chaque déploiement significatif. Dernier déploiement validé : 2026-07-27 (recette 29/29 en ligne).*
