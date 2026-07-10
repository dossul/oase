#!/bin/bash
DBP=$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2)
docker exec oase-db mysql -uroot -p"$DBP" oase -B -e "SELECT id, code_mesure FROM bases_juridiques; SELECT id, base_juridique_id FROM base_juridique_versions LIMIT 10;"
