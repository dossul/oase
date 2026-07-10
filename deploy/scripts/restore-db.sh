#!/usr/bin/env bash
# ============================================================
# OASE - Restore MySQL depuis un dump
# ============================================================
# Usage :
#   ./scripts/restore-db.sh backups/oase_2026-07-10_030000.sql.gz
# ============================================================

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <fichier.sql.gz>"
    echo "Ex:   $0 backups/oase_2026-07-10_030000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER="oase-db"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERREUR : fichier ${BACKUP_FILE} introuvable"
    exit 1
fi

echo "ATTENTION : cette operation va ECRASER la base 'oase'."
echo "Fichier : ${BACKUP_FILE}"
read -p "Continuer ? (oui/non) " CONFIRM

if [ "${CONFIRM}" != "oui" ]; then
    echo "Annule."
    exit 0
fi

echo "==> Arret de l'API (pour eviter les conflits)"
docker compose -f docker-compose.prod.yml stop oase-api

echo "==> Decompression + import"
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" \
  mysql -u root -p"$(grep DB_ROOT_PASSWORD .env | cut -d= -f2)" oase

echo "==> Redemarrage API"
docker compose -f docker-compose.prod.yml start oase-api

echo "OK : restore termine"
