#!/bin/bash
DBP=$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2)
docker exec oase-db mysql -uroot -p"$DBP" oase -B -e "SELECT COUNT(*) AS users FROM utilisateurs; SELECT COUNT(*) AS inst FROM institutions;"
