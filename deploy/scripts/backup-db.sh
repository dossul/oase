#!/usr/bin/env bash
# ============================================================
# OASE - Backup MySQL quotidien
# ============================================================
# Usage (cron) :
#   0 3 * * * /opt/oase/scripts/backup-db.sh >> /var/log/oase-backup.log 2>&1
#
# Sortie : /opt/oase/backups/oase_YYYY-MM-DD_HHMMSS.sql.gz
# Retention : 7 jours locaux (ajouter cron distant pour plus)
# ============================================================

set -euo pipefail

BACKUP_DIR="/opt/oase/backups"
CONTAINER="oase-db"
RETENTION_DAYS=7
DATE=$(date +%Y-%m-%d_%H%M%S)
FILENAME="${BACKUP_DIR}/oase_${DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Debut dump ${CONTAINER}"

# mysqldump via docker exec, puis gzip
docker exec "${CONTAINER}" sh -c \
  'exec mysqldump --single-transaction --quick --routines --triggers \
   --events --hex-blob -u root -p"$MYSQL_ROOT_PASSWORD" oase' \
  | gzip > "${FILENAME}"

# Verif integrite
if [ ! -s "${FILENAME}" ]; then
    echo "[$(date)] ERREUR : backup vide ou absent" >&2
    exit 1
fi

SIZE=$(du -h "${FILENAME}" | cut -f1)
echo "[$(date)] OK : ${FILENAME} (${SIZE})"

# Retention
find "${BACKUP_DIR}" -name "oase_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Retention ${RETENTION_DAYS}j appliquee"
