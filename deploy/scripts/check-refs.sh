#!/bin/bash
DBP=$(grep DB_ROOT_PASSWORD /opt/oase/deploy/.env | cut -d= -f2)
docker exec oase-db mysql -uroot -p"$DBP" oase -B -e "SELECT * FROM ref_statuts_fiscal; SELECT * FROM ref_types_beneficiaire;"
