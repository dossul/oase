@echo off
REM ============================================================
REM OASE - Script de deploiement depuis Windows
REM ============================================================
REM Date    : 2026-07-10
REM Auteur  : Mavis (deployee pour Ulrich)
REM Usage   : Double-clic ou `deploy-oase.bat` depuis C:\wamp64\www\oase\deploy\
REM
REM Prerequis :
REM   - OpenSSH client installe (inclus dans Windows 10+)
REM   - Cle SSH dans C:\Users\%USERNAME%\.ssh\kvm8_key
REM   - Ce script place dans C:\wamp64\www\oase\deploy\
REM ============================================================

setlocal enabledelayedexpansion

REM --- Config ---
set VPS_HOST=147.93.85.22
set VPS_USER=root
set SSH_KEY=%USERPROFILE%\.ssh\kvm8_key
set REMOTE_DIR=/opt/oase
set COMPOSE_FILE=docker-compose.local-prod.yml

REM --- Couleurs ---
for /F "tokens=*" %%i in ('echo prompt $E ^| cmd') do set "ESC=%%i"
set GREEN=%ESC%[32m
set YELLOW=%ESC%[33m
set RED=%ESC%[31m
set CYAN=%ESC%[36m
set NC=%ESC%[0m

echo.
echo %CYAN%========================================%NC%
echo %CYAN%   OASE - Deploiement depuis Windows%NC%
echo %CYAN%========================================%NC%
echo.
echo   VPS       : %VPS_USER%@%VPS_HOST%
echo   SSH Key   : %SSH_KEY%
echo   Remote dir: %REMOTE_DIR%
echo   Compose   : %COMPOSE_FILE%
echo.

REM --- Verifications ---
echo %YELLOW%[1/6]%NC% Verification de la cle SSH...
if not exist "%SSH_KEY%" (
    echo %RED%[ERREUR]%NC% Cle SSH introuvable : %SSH_KEY%
    echo   Copies ta cle dans %USERPROFILE%\.ssh\kvm8_key
    pause
    exit /b 1
)
echo   OK - Cle trouvee

echo.
echo %YELLOW%[2/6]%NC% Test de la connexion SSH...
ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no -o ConnectTimeout=10 %VPS_USER%@%VPS_HOST% "echo OK" >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERREUR]%NC% Connexion SSH impossible
    echo   Verifie ta cle, le reseau, le firewall
    pause
    exit /b 1
)
echo   OK - Connexion SSH reussie

echo.
echo %YELLOW%[3/6]%NC% Git pull sur le VPS...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %REMOTE_DIR% && git fetch origin && git reset --hard origin/main 2>&1" | findstr /v "^From"
if errorlevel 1 (
    echo %RED%[ERREUR]%NC% Git pull a echoue
    pause
    exit /b 1
)
echo   OK - Code a jour

echo.
echo %YELLOW%[4/6]%NC% Build image oase-api (~2-3 min)...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %REMOTE_DIR% && docker build --no-cache -t oase-api:latest -f deploy/api.Dockerfile . 2>&1" | findstr /v "DEPRECATED\|WARNING" | findstr /R "^#" /v
if errorlevel 1 (
    echo %RED%[ERREUR]%NC% Build API a echoue
    pause
    exit /b 1
)
echo   OK - oase-api:latest

echo.
echo %YELLOW%[5/6]%NC% Build image oase-frontend (~1 min)...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %REMOTE_DIR% && docker build --no-cache -t oase-frontend:latest -f deploy/frontend.Dockerfile . 2>&1" | findstr /v "DEPRECATED\|WARNING" | findstr /R "^#" /v
if errorlevel 1 (
    echo %RED%[ERREUR]%NC% Build Frontend a echoue
    pause
    exit /b 1
)
echo   OK - oase-frontend:latest

echo.
echo %YELLOW%[6/6]%NC% Restart du stack...
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %REMOTE_DIR% && docker compose -f deploy/%COMPOSE_FILE% up -d --force-recreate" | findstr /v "WARN\|networks"
if errorlevel 1 (
    echo %RED%[ERREUR]%NC% Restart du stack a echoue
    pause
    exit /b 1
)
echo   OK - Stack redemarre

echo.
echo %CYAN%==> Attente MySQL (max 30s)...%NC%
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "for i in \$(seq 1 15); do docker exec oase-db mysqladmin ping -h localhost >/dev/null 2>&1 && echo 'MySQL OK' && break; sleep 2; done"

echo.
echo %CYAN%==> Migrations Prisma...%NC%
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "cd %REMOTE_DIR% && docker exec oase-api npx prisma migrate deploy 2>&1" | findstr /v "WARN\|warn"

echo.
echo %CYAN%==> Nettoyage images orphelines...%NC%
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "docker image prune -f >/dev/null 2>&1 && echo OK"

echo.
echo %CYAN%========================================%NC%
echo %CYAN%   Statut final%NC%
echo %CYAN%========================================%NC%
ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep oase"

echo.
echo %GREEN%========================================%NC%
echo %GREEN%   DEPLOY OK !%NC%
echo %GREEN%========================================%NC%
echo.
echo   URLs :
echo     - App    : https://oase.ulia.site/
echo     - API    : https://api.oase.ulia.site/api/v1/health
echo.
echo   Logs en direct (Ctrl+C pour quitter) :
echo     ssh -i "%SSH_KEY%" %VPS_USER%@%VPS_HOST% "docker compose -f %REMOTE_DIR%/deploy/%COMPOSE_FILE% logs -f"
echo.
pause
