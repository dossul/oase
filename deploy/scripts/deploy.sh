#!/usr/bin/env bash
# ============================================================
# OASE - Script de deploiement manuel (sans CI/CD)
# ============================================================
# Usage (sur le VPS) :
#   cd /opt/oase
#   ./scripts/deploy.sh
#
# Ce qu'il fait :
#   1. Pull les dernieres images depuis GHCR
#   2. Redemarre les conteneurs
#   3. Lance les migrations Prisma
#   4. Affiche les logs
# ============================================================

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
GHCR_OWNER="dossul"
IMAGES=("oase-api" "oase-frontend")

echo "==> Verifications prealables"
if [ ! -f ".env" ]; then
    echo "ERREUR : fichier .env manquant."
    echo "  cp env.prod.template .env && nano .env"
    exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
    echo "ERREUR : ${COMPOSE_FILE} introuvable."
    echo "  Lancer depuis /opt/oase/"
    exit 1
fi

echo ""
echo "==> Pull des images depuis GHCR"
docker compose -f "${COMPOSE_FILE}" pull

echo ""
echo "==> Arret + redemarrage"
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

echo ""
echo "==> Attente sante MySQL (max 60s)"
timeout 60 bash -c '
  until docker compose -f docker-compose.prod.yml exec -T oase-db mysqladmin ping -h localhost >/dev/null 2>&1; do
    sleep 2
  done
' || { echo "ERREUR : MySQL pas healthy"; exit 1; }

echo ""
echo "==> Migrations Prisma"
docker compose -f "${COMPOSE_FILE}" exec -T oase-api npx prisma migrate deploy

echo ""
echo "==> Statut final"
docker compose -f "${COMPOSE_FILE}" ps

echo ""
echo "==> Logs (Ctrl+C pour quitter)"
docker compose -f "${COMPOSE_FILE}" logs -f --tail=50
