---
name: plane-oase-project-manager
description: >
  Gère les projets, issues et cycles sur l'instance Plane hébergée à plane.ulia.site.
  À utiliser pour créer, mettre à jour, organiser ou vérifier le backlog du projet OASE.
  Supporte les opérations CRUD sur les issues OASE via l'API REST Plane v1.
---

# Plane Project Manager OASE  plane.ulia.site

Ce skill permet d'interagir avec le projet **OASE** sur l'instance Plane hébergée sur **https://plane.ulia.site**, dans le workspace **iltic**, via l'API REST Plane v1.

---

## Configuration

| Paramètre | Valeur |
|-----------|--------|
| `BASE_URL` | `https://plane.ulia.site/api/v1` |
| `WORKSPACE_SLUG` | `iltic` |
| `PROJECT_ID` | `66bc716c-8e92-45d7-9b1a-4756610a2451` |
| Header d'auth | `X-API-Key: <API_KEY>` |

L'API key doit être chargée depuis une variable d'environnement ou un secret local, jamais écrite dans les rapports publics.

---

## Setup PowerShell

```powershell
$API_KEY = $env:PLANE_API_KEY
$BASE_URL = "https://plane.ulia.site/api/v1"
$WS = "iltic"
$PROJ_OASE = "66bc716c-8e92-45d7-9b1a-4756610a2451"
$headers = @{
    "X-API-Key" = $API_KEY
    "Content-Type" = "application/json"
}
```

---

## États du projet OASE

Les IDs d'état doivent toujours être récupérés depuis l'API avant toute création ou mise à jour.

```powershell
$states = (Invoke-RestMethod `
  -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/states/" `
  -Headers $headers).results

$STATE_BACKLOG     = ($states | Where-Object { $_.group -eq "backlog" } | Select-Object -First 1).id
$STATE_TODO        = ($states | Where-Object { $_.group -eq "unstarted" } | Select-Object -First 1).id
$STATE_IN_PROGRESS = ($states | Where-Object { $_.group -eq "started" } | Select-Object -First 1).id
$STATE_DONE        = ($states | Where-Object { $_.group -eq "completed" } | Select-Object -First 1).id
$STATE_CANCELLED   = ($states | Where-Object { $_.group -eq "cancelled" } | Select-Object -First 1).id
```

---

## Commandes utiles

### Lister les issues

```powershell
$issues = (Invoke-RestMethod `
  -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/issues/?per_page=100" `
  -Headers $headers).results

$issues | Sort-Object sequence_id | ForEach-Object {
    Write-Host "OASE-$($_.sequence_id): [$($_.state)] $($_.name)"
}
```

### Créer une issue

```powershell
function New-OaseIssue($name, $description, $stateId, $priority="medium") {
    $body = @{
        name = $name
        description_html = $description
        state = $stateId
        priority = $priority
    } | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Method POST `
      -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/issues/" `
      -Headers $headers -Body $body
}
```

### Mettre à jour une issue

```powershell
function Update-OaseIssue($issues, $seqId, $stateId, $priority=$null) {
    $issue = $issues | Where-Object { $_.sequence_id -eq $seqId }
    if (-not $issue) { Write-Host "OASE-$seqId non trouvé"; return }

    $body = @{ state = $stateId }
    if ($priority) { $body.priority = $priority }
    $body = $body | ConvertTo-Json -Depth 10

    Invoke-RestMethod -Method PATCH `
      -Uri "$BASE_URL/workspaces/$WS/projects/$PROJ_OASE/issues/$($issue.id)/" `
      -Headers $headers -Body $body
}
```

---

## Préfixes backlog OASE

| Préfixe | Usage |
|---------|-------|
| `[Analyse]` | Analyse documentaire, Graphify, cadrage métier |
| `[Backend]` | Architecture NestJS, modules, services métier |
| `[Database]` | Modèle relationnel, Prisma, migrations, seeds |
| `[API]` | Contrats REST, endpoints, DTO, OpenAPI |
| `[Sécurité]` | Authentification, RBAC, MFA, permissions |
| `[Audit]` | Journalisation, traçabilité, contrôle interne |
| `[Workflow]` | Statuts, transitions, validation, signature |
| `[Connecteurs]` | SYDONIA, SIGTAS, SIGFiP, GUDEF |
| `[Docs]` | Documentation backend, contexte, PRD, architecture |
| `[DevOps]` | cPanel, VM Ubuntu, PM2, Nginx, variables d'environnement |

---

## Priorités

| Valeur | Signification |
|--------|---------------|
| `urgent` | Bloquant production ou sécurité |
| `high` | Critique pour le MVP |
| `medium` | Important mais non bloquant |
| `low` | Amélioration ou confort |
| `none` | Non priorisé |

---

## Règles importantes

- Toujours récupérer les états OASE avant d'écrire dans Plane.
- Ne jamais utiliser les IDs d'un autre projet.
- Ne jamais publier l'API key dans un rapport.
- Créer les issues de cadrage avant les issues d'implémentation.
- Chaque issue doit avoir un livrable clair et des critères d'acceptation.
