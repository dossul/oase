@echo off
REM ============================================================
REM OASE — Script de réconciliation Prisma ↔ MySQL v3.3
REM Exécute l'introspection et prépare le schema complet
REM ============================================================

echo === OASE Prisma Reconciliation v3.3 ===
echo.

REM Configuration
set OASE_DIR=c:\wamp64\www\oase\oase-api
set DB_URL=mysql://root:@localhost:3306/oase

echo [1/6] Verification de l'environnement...
cd %OASE_DIR%
if errorlevel 1 (
    echo ERREUR: Dossier %OASE_DIR% non trouve
    exit /b 1
)

echo [2/6] Configuration DATABASE_URL...
echo DATABASE_URL=%DB_URL% > .env
echo "DATABASE_URL configure pour MySQL 'oase'"

echo [3/6] Introspection Prisma (db pull)...
npx prisma db pull --force
if errorlevel 1 (
    echo ERREUR: Introspection echouee
    exit /b 1
)
echo "✓ Introspection complete - schema.prisma genere"

echo [4/6] Validation du schema...
npx prisma validate
if errorlevel 1 (
    echo ERREUR: Schema invalide
    exit /b 1
)
echo "✓ Schema valide"

echo [5/6] Generation du client Prisma...
npx prisma generate
if errorlevel 1 (
    echo ERREUR: Generation client echouee
    exit /b 1
)
echo "✓ Client Prisma genere (@prisma/client)"

echo [6/6] Verification du nombre de modeles...
findstr /C:"model " prisma\schema.prisma | find /C "model " > tmp.txt
set /p MODEL_COUNT=<tmp.txt
del tmp.txt
echo "Nombre de modeles detectes: %MODEL_COUNT%"
echo "Attendu: 85 modeles"

echo.
echo === Reconciliation terminee ===
echo Prochaines etapes:
echo   1. Lancer 'npx prisma studio' pour visualiser les tables
echo   2. Executer 'npx prisma db seed' pour peupler les donnees
echo   3. Commencer le developpement NestJS (Phase B)
pause
