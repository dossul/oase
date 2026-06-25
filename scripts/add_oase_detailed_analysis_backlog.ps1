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
    @{ n='[UI/UX] Inventorier exhaustivement tous les ecrans OASE'; p='urgent'; d='Analyser tous les ecrans, routes, layouts, composants et espaces utilisateurs existants. Livrable : tableau ecran par ecran avec route, persona, objectif, actions possibles, donnees affichees, formulaires, boutons, erreurs et dependances backend.' },
    @{ n='[UI/UX] Decrire minutieusement le flux utilisateur par persona'; p='urgent'; d='Documenter les parcours complets P1 a P7 : entree, authentification, tableau de bord, actions metier, validations, notifications, sorties et cas alternatifs. Chaque flux doit etre decrit comme un scenario reel utilisable pour implementation backend et tests E2E.' },
    @{ n='[UI/UX] Analyser la coherence visuelle et ergonomique des interfaces'; p='high'; d='Verifier navigation, hierarchie visuelle, lisibilite, coherence des libelles, etats vides, messages erreur, feedback utilisateur, responsive, accessibilite de base et coherence entre modules.' },
    @{ n='[Formulaires] Inventorier tous les formulaires OASE'; p='urgent'; d='Lister chaque formulaire : champs, type de champ, valeur obligatoire, validation attendue, message erreur, donnees envoyees au backend, endpoint cible, comportement success/error et sauvegarde brouillon si applicable.' },
    @{ n='[Formulaires] Definir les regles de validation frontend/backend'; p='urgent'; d='Pour chaque formulaire, definir les contraintes metier et techniques : required, format, taille, type fichier, montant, date, coherence entre champs, controle role/persona et validation cote serveur.' },
    @{ n='[User Stories] Rediger les user stories P1 beneficiaire'; p='urgent'; d='Rediger les user stories detaillees du beneficiaire : creation compte, connexion, depot demande, ajout pieces, suivi dossier, reponse complement, consultation exonérations actives, telechargement acte, notifications.' },
    @{ n='[User Stories] Rediger les user stories P2 agent instructeur'; p='urgent'; d='Rediger les user stories detaillees de l agent instructeur : consulter file, filtrer dossiers, ouvrir dossier, verifier pieces, demander complement, instruire, proposer decision, consulter historique.' },
    @{ n='[User Stories] Rediger les user stories P3 agence de promotion'; p='high'; d='Rediger les user stories API-ZF/SAZOF : suivre conventions, agrements, beneficiaires, engagements, alertes obligations, consultation dossiers lies et reporting.' },
    @{ n='[User Stories] Rediger les user stories P4 decideur strategique'; p='high'; d='Rediger les user stories decideur : consulter KPIs, filtrer par periode/secteur/regime, analyser impact budgetaire, exporter rapports, consulter tendances et arbitrer scenarios.' },
    @{ n='[User Stories] Rediger les user stories P5 controle audit'; p='high'; d='Rediger les user stories controle : consulter dossiers en lecture, detecter anomalies, creer mission, saisir constat, recommander action, suivre correction, exporter preuve.' },
    @{ n='[User Stories] Rediger les user stories P6 portail public'; p='medium'; d='Rediger les user stories citoyen/partenaire : consulter donnees agregees, filtrer tableaux publics, telecharger jeux de donnees, lire rapports, sans acces aux donnees confidentielles.' },
    @{ n='[User Stories] Rediger les user stories P7 administration'; p='high'; d='Rediger les user stories admin : creer utilisateurs, roles, permissions, workflows, connecteurs, parametres, superviser logs, monitorer disponibilite et securite.' },
    @{ n='[Use Cases] Produire les cas d utilisation metier complets'; p='urgent'; d='Decrire les use cases essentiels avec acteur principal, preconditions, declencheur, scenario nominal, variantes, erreurs, permissions, donnees manipulees et postconditions.' },
    @{ n='[Use Cases] Modeliser le cycle complet demande exoneration'; p='urgent'; d='Decrire bout en bout le cycle demande : brouillon, soumission, instruction, complement, validation, decision, signature, notification, activation, suivi, expiration et archivage.' },
    @{ n='[Use Cases] Modeliser les cas d erreur et cas limites'; p='high'; d='Identifier les cas limites : piece manquante, dossier invalide, permission refusee, session expiree, doublon beneficiaire, montant incoherent, connecteur indisponible, export impossible.' },
    @{ n='[Tests E2E] Definir strategie Playwright globale'; p='urgent'; d='Definir l architecture des tests Playwright : projets navigateurs, fixtures, authentification par persona, jeux de donnees, screenshots, traces, videos, retries et integration CI.' },
    @{ n='[Tests E2E] Tester authentification et securite'; p='urgent'; d='Tests E2E login, logout, session expiree, mot de passe incorrect, MFA si applicable, redirection par role, acces interdit, protection routes et absence fuite donnees.' },
    @{ n='[Tests E2E] Tester parcours beneficiaire complet'; p='urgent'; d='Tester depot complet d une demande par beneficiaire : formulaire, upload pieces, brouillon, soumission, suivi statut, notifications, consultation detail et telechargement document.' },
    @{ n='[Tests E2E] Tester instruction back-office complete'; p='urgent'; d='Tester file de dossiers, recherche, filtres, ouverture detail, verification pieces, demande complement, validation/rejet, historique, permissions et feedback utilisateur.' },
    @{ n='[Tests E2E] Tester tableaux de bord et exports'; p='high'; d='Tester affichage KPIs, filtres, graphiques, chargement donnees, etats vides, exports CSV/PDF/Excel si prevus, et coherence des valeurs affichees.' },
    @{ n='[Tests E2E] Tester administration utilisateurs roles workflows'; p='high'; d='Tester creation utilisateur, modification role, activation/desactivation, permissions, creation workflow, modification et verification des effets sur les acces.' },
    @{ n='[Tests E2E] Tester portail public et anonymisation'; p='medium'; d='Tester acces public sans compte, affichage donnees agregees, filtres, telechargement datasets, absence de donnees personnelles ou confidentielles.' },
    @{ n='[Tests Browser] Verifier zero erreur console sur tous les parcours'; p='urgent'; d='Mettre en place une verification browser/Playwright qui echoue si console.error, pageerror, requete 4xx/5xx inattendue ou warning critique apparait pendant les parcours principaux.' },
    @{ n='[Tests Browser] Verifier rendu visuel et responsive'; p='high'; d='Tester les principaux ecrans en desktop, tablette et mobile : pas de debordement, pas de composant casse, formulaires utilisables, navigation visible et boutons accessibles.' },
    @{ n='[Tests Browser] Verifier reseau API et etats de chargement'; p='high'; d='Verifier que chaque action declenche les appels API attendus, gere loading/success/error, evite double submit, et affiche un message clair en cas d echec reseau.' },
    @{ n='[Qualite] Definir Definition of Done frontend/backend'; p='urgent'; d='Etablir la checklist DoD : user story couverte, use case valide, formulaire teste, permissions testees, E2E vert, zero console error, zero pageerror, responsive verifie, documentation mise a jour.' },
    @{ n='[Qualite] Produire matrice de couverture exigences vers tests'; p='high'; d='Construire une matrice reliant PRD/TDR/ecrans/user stories/use cases/API/tests E2E pour verifier que chaque exigence importante est couverte avant codage backend.' }
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
