#!/bin/bash
set -e
DBP=$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2)
docker exec oase-db mysql -uroot -p"$DBP" oase -B -e "SELECT email, role, mfaActive FROM utilisateurs ORDER BY role;"
