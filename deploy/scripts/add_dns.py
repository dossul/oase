"""Ajoute oase.ulia.site et api.oase.ulia.site dans la zone DNS Hostinger."""
import json
import sys
import requests

API = "https://developers.hostinger.com/api/dns/v1/zones/ulia.site"
TOKEN = "AkozfLOFGY97Ix5kqAov1bpPH5AOp9AvegtUhW9i57d659d2"
IP = "147.93.85.22"

with open(r"C:\wamp64\www\oase\deploy\ulia-dns-current.json", "r", encoding="utf-8-sig") as f:
    records = json.load(f)

print(f"Records actuels: {len(records)}")

# Verifie qu'on n'ecrase pas
existing = {r["name"] for r in records}
if "oase" in existing or "api.oase" in existing:
    print("Records OASE deja presents, on quitte sans rien faire")
    sys.exit(0)

# Ajoute les 2 nouveaux records (meme format que la zone actuelle)
records.append({
    "name": "oase",
    "type": "A",
    "ttl": 300,
    "records": [{"content": IP, "is_disabled": False}]
})
records.append({
    "name": "api.oase",
    "type": "A",
    "ttl": 300,
    "records": [{"content": IP, "is_disabled": False}]
})

print(f"Total apres ajout: {len(records)}")

# PUT direct avec la liste (format retourne par GET)
r = requests.put(API,
                 headers={"Authorization": f"Bearer {TOKEN}",
                          "Content-Type": "application/json"},
                 data=json.dumps(records), timeout=30)
print(f"Status: {r.status_code}")
if r.status_code in (200, 201, 204):
    print("DNS mis a jour OK")
    r2 = requests.get(API, headers={"Authorization": f"Bearer {TOKEN}"}, timeout=30)
    final = r2.json()
    oase = [x for x in final if x.get("name") in ("oase", "api.oase")]
    print("Records OASE finaux:")
    print(json.dumps(oase, indent=2, ensure_ascii=False))
else:
    print("ERREUR:")
    print(r.text[:600])
    sys.exit(1)
