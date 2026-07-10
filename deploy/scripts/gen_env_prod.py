"""Genere et pousse le .env prod OASE sur le VPS avec des secrets aleatoires."""
import os
import secrets
import subprocess
import sys

SSH_KEY = r"C:\Users\lenovo\.ssh\kvm8_key"
VPS_HOST = "147.93.85.22"
VPS_PATH = "/opt/oase/deploy/.env"

# Secrets forts
db_root = secrets.token_hex(24)
db_pass = secrets.token_hex(24)
jwt_secret = secrets.token_hex(32)
jwt_refresh = secrets.token_hex(32)

env_content = f"""NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://oase:{db_pass}@oase-db:3306/oase?charset=utf8mb4
JWT_SECRET={jwt_secret}
JWT_REFRESH_SECRET={jwt_refresh}
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
DB_ROOT_PASSWORD={db_root}
DB_NAME=oase
DB_USER=oase
DB_PASS={db_pass}
CORS_ORIGINS=https://oase.ulia.site,https://api.oase.ulia.site
LOG_LEVEL=info
"""

# Backup local pour traçabilite
backup = r"C:\wamp64\www\oase\deploy\.env.prod.local"
with open(backup, "w", encoding="utf-8") as f:
    f.write(env_content)
print(f"Backup local: {backup}")

# Push via SSH + heredoc
ssh_cmd = [
    "ssh",
    "-i", SSH_KEY,
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    f"root@{VPS_HOST}",
    f"cat > {VPS_PATH} <<'OASE_ENV_EOF'\n{env_content}OASE_ENV_EOF\nchmod 600 {VPS_PATH}\nwc -l {VPS_PATH}",
]

result = subprocess.run(ssh_cmd, capture_output=True, text=True)
if result.returncode != 0:
    print("ERREUR SSH:", result.stderr, file=sys.stderr)
    sys.exit(1)
print("Env pousse sur VPS:", result.stdout)
