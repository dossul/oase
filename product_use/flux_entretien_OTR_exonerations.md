# Flux d'entretien OTR sur les exonérations

## Objectif

Ce schema sert de support d'entretien avec l'OTR pour clarifier le circuit reel des exonérations et identifier les points de blocage a integrer dans OASE.

## Branches du flux

1. `Cadrage institutionnel`
   - quels services doivent etre presents pendant l'entretien
   - qui porte la donnee officielle cote OTR

2. `Branche CI`
   - demande d'attestation
   - verification des pieces de premier rang
   - emission et suivi des attestations
   - rattachement aux SI `E-TAX`, `DLFC`, `DAS`

3. `Branche CDDI`
   - declaration dans `Sydonia World`
   - usage du `code additionnel`
   - controle des pieces
   - production du quittancement et du montant exonere

4. `Consolidation`
   - comment OTR consolide `CI + CDDI`
   - frequence, format et responsable du reporting

5. `Gouvernance`
   - partage vers `UPF`, `API-ZF`, `MAE`, `DGBF`
   - contraintes juridiques et techniques

## Questions critiques a pousser

- Qui emet formellement l'attestation cote `CI` et avec quel numero unique ?
- Comment une attestation `CI` est-elle reliee aux montants reellement exoneres dans les SI ?
- Le `code additionnel` est-il obligatoire dans tous les cas cote `CDDI` ?
- Existe-t-il une table de correspondance `code additionnel -> base juridique -> mesure MRD` ?
- Quelle est la source officielle du montant exonere : `Sydonia`, `E-TAX`, `DLFC`, `DAS` ou un retraitement Excel ?
- Qui consolide la donnee OTR et a quelle periodicite ?
- Quels exports ou echantillons documentaires peuvent etre remis a l'equipe projet ?

## Fichiers

- Source Excalidraw : `flux_entretien_OTR_exonerations.excalidraw.json`
- Rendu image : `flux_entretien_OTR_exonerations.svg`
