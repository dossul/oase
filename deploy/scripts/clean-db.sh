#!/bin/bash
# Nettoie la base avant reseed
set -e
DBP=$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2)
docker exec oase-db mysql -uroot -p"$DBP" oase -B <<'SQL'
SET FOREIGN_KEY_CHECKS=0;
DELETE FROM utilisateurs;
DELETE FROM ref_statuts_utilisateur;
DELETE FROM institutions;
SET FOREIGN_KEY_CHECKS=1;
SELECT 'Nettoye' AS status;
SQL
