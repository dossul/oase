param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$ErrorActionPreference = 'Stop'
$BASE_URL = 'https://plane.ulia.site/api/v1'
$WS = 'iltic'
$PROJ_OASE = '66bc716c-8e92-45d7-9b1a-4756610a2451'
$headers = @{
    'X-API-Key' = $ApiKey
    'Content-Type' = 'application/json; charset=utf-8'
}

$states = (Invoke-RestMethod -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/states/" -Headers $headers).results
$STATE_BACKLOG = ($states | Where-Object { $_.group -eq 'backlog' } | Select-Object -First 1).id
if (-not $STATE_BACKLOG) { throw 'Aucun etat backlog trouve pour le projet OASE.' }

$items = @(
    @{ n='[Analyse] Cartographier les sources OASE'; p='urgent'; d='Lire et organiser les sources de verite OASE : kb, comprehension, elaboration_rapport et maquette. Livrable : liste des sources utiles et role de chaque dossier.' },
    @{ n='[Analyse] Generer le graphe de connaissance OASE'; p='urgent'; d='Utiliser Graphify pour produire une cartographie des concepts, modules, personas, workflows et dependances. Livrables : GRAPH_REPORT.md, graph.json et graph.html.' },
    @{ n='[Docs] Produire le langage metier commun OASE'; p='urgent'; d='Rediger docs/backend/01_CONTEXT_OASE.md avec les definitions metier : exoneration, demande, decision, beneficiaire, base juridique, convention, agrement, quota, echeance, alerte, audit.' },
    @{ n='[Analyse] Identifier les contradictions et zones floues'; p='high'; d='Comparer PRD, TDR, cahier des charges, rapports et ecrans existants. Livrable : docs/backend/00_POINTS_A_CLARIFIER.md.' },
    @{ n='[Backend] Definir le domain model OASE'; p='urgent'; d='Definir les objets metier principaux : User, Institution, Beneficiary, ExonerationRequest, ExonerationDecision, Exoneration, LegalBasis, Document, Workflow, Alert, AuditLog.' },
    @{ n='[Workflow] Definir les statuts metier des demandes'; p='urgent'; d='Definir les statuts et transitions : brouillon, soumis, en instruction, a completer, valide, rejete, expire, archive.' },
    @{ n='[Securite] Definir les roles et permissions RBAC'; p='high'; d='Definir les roles P1 a P7, les permissions par module, institution et perimetre de donnees. Livrable : matrice RBAC.' },
    @{ n='[Backend] Choisir architecture NestJS compatible cPanel et VM'; p='high'; d='Documenter architecture cible : NestJS, MySQL, Prisma, JWT, PM2/Nginx en production, compatibilite cPanel pour demo.' },
    @{ n='[Backend] Definir la structure des modules NestJS'; p='high'; d='Definir les modules auth, users, institutions, beneficiaries, requests, exonerations, legal-bases, documents, workflows, alerts, audit, reports et connectors.' },
    @{ n='[Database] Concevoir le modele relationnel OASE'; p='urgent'; d='Preparer le modele relationnel MySQL : tables, relations, contraintes, index et historisation. Livrable : docs/backend/05_DATABASE_MODEL.md.' },
    @{ n='[Database] Creer le schema Prisma initial'; p='high'; d='Creer backend/prisma/schema.prisma a partir du modele valide. Inclure utilisateurs, roles, demandes, exonerations, documents, workflows, audit et alertes.' },
    @{ n='[Database] Preparer les seeds de demonstration'; p='medium'; d='Preparer institutions, personas, roles, permissions, statuts, types d exonerations et bases juridiques de demonstration.' },
    @{ n='[API] Definir le contrat API Auth'; p='high'; d='Definir endpoints login, refresh token, logout, MFA, recuperation mot de passe et profil courant. Livrable : docs/backend/06_API_CONTRACT.md.' },
    @{ n='[API] Definir le contrat API beneficiaire'; p='high'; d='Definir endpoints profil, depot de demande, pieces justificatives, suivi dossier, exonerations actives et telechargement documents.' },
    @{ n='[API] Definir le contrat API instruction'; p='high'; d='Definir endpoints liste dossiers, detail dossier, verification pieces, demande de complement, validation, rejet et historique.' },
    @{ n='[API] Definir le contrat API tableaux de bord'; p='medium'; d='Definir endpoints KPIs, filtres, agregations, exports et indicateurs par regime, secteur, impot, beneficiaire et periode.' },
    @{ n='[API] Definir le contrat API administration'; p='medium'; d='Definir endpoints utilisateurs, roles, permissions, workflows, connecteurs, parametres, logs et supervision.' },
    @{ n='[Securite] Implementer authentification securisee'; p='high'; d='Implementer JWT, refresh tokens, gestion session, MFA et protection des routes avec guards NestJS.' },
    @{ n='[Audit] Journaliser les actions sensibles'; p='high'; d='Journaliser connexion, creation demande, modification dossier, validation, rejet, export, administration et acces aux documents.' },
    @{ n='[Connecteurs] Preparer architecture des integrations'; p='medium'; d='Preparer integration avec SYDONIA, SIGTAS, SIGFiP et GUDEF. Livrable : modele Connector, ConnectorSyncLog et strategie de mocks.' },
    @{ n='[Connecteurs] Creer connecteurs simules pour demo'; p='medium'; d='Creer connecteurs mockes pour simuler statuts de connexion, reponses API, erreurs et journaux de synchronisation.' },
    @{ n='[Docs] Rediger le PRD backend'; p='high'; d='Produire docs/backend/03_BACKEND_PRD.md avec perimetre MVP, regles metier, personas, workflows, API attendues et contraintes techniques.' },
    @{ n='[Docs] Rediger le plan de livraison MVP'; p='medium'; d='Definir lots de livraison backend, ordre d implementation, dependances et priorites.' },
    @{ n='[DevOps] Preparer le deploiement cPanel'; p='medium'; d='Documenter variables environnement, build, demarrage Node.js, migration Prisma, logs et contraintes cPanel.' },
    @{ n='[DevOps] Preparer le deploiement VM Ubuntu'; p='medium'; d='Documenter Nginx, PM2, SSL, backups, logs, variables environnement et supervision production.' }
)

$existing = (Invoke-RestMethod -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/issues/?per_page=100" -Headers $headers).results
$created = @()
$skipped = @()

foreach ($item in $items) {
    if ($existing | Where-Object { $_.name -eq $item.n }) {
        $skipped += $item.n
        continue
    }

    $body = @{
        name = $item.n
        description_html = "<p>$($item.d)</p>"
        state = $STATE_BACKLOG
        priority = $item.p
    } | ConvertTo-Json -Depth 10

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $res = Invoke-RestMethod -Method POST -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/issues/" -Headers $headers -Body $bytes
    $created += [PSCustomObject]@{ sequence_id = $res.sequence_id; name = $res.name; priority = $res.priority }
}

Write-Output "CREATED=$($created.Count)"
$created | Sort-Object sequence_id | Format-Table -AutoSize
Write-Output "SKIPPED=$($skipped.Count)"
