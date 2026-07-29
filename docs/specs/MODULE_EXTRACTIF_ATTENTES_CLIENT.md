# Module Extractif (DGMG / ITIE) — Attentes du client selon le cahier des charges

**Projet OASE — Togo / MEF**
**Rédigé le 2026-07-29 après lecture intégrale des sources listées en §1**
**Statut : document d'analyse — aucune ligne de ce document n'est une promesse d'implémentation ; il formalise ce que le client attend, puis mesure l'écart avec l'existant.**

---

## 1. Sources lues (exhaustivité)

### 1.1 Documents ITIE (`kb/itie/` — 5 fichiers, lus en totalité)

| Fichier | Contenu |
|---|---|
| `Eléments de réponse à la sollicitation de données dans le cadre du projet OASE.pdf` | Réponse du **Secrétariat Technique ITIE-Togo** (Cellule collecte des données, Lomé, 05/06/2026) : processus ITIE en 6 phases, fiche de collecte, liste des 8 productions statistiques attendues |
| `Annexe1.1 Formulaire de déclaration_Régies Financières_2024.xlsx` | Formulaire ITIE complet pour les **régies financières** : 20 états (nomenclature des flux par entité, détail des paiements, exportations, production, redevance minière, communes, social, environnement, dividendes, subventions, participations, prêts/garanties, relations entreprises d'État, coûts des projets, transferts infranationaux, **registre des licences**, **octroi des licences**, périmètres) |
| `Annexe1.2 Formulaire de déclaration_Entreprises Privées_2024.xlsx` | Formulaire ITIE **sociétés extractives privées** : 21 états (fiche signalétique, mêmes flux + structure de capital, **propriété effective**, répertoire des permis, troc-projet, emploi, questionnaire général) |
| `Annexe1.3 Formulaire de déclaration_Entreprises d'Etat- 2024.xlsx` | Formulaire ITIE **entreprises d'État** : 27 états (privées + première vente, consultations communautaires, gouvernance, participation, relations financières avec l'État, financements tiers, **dépenses quasi-budgétaires**) |
| `Formulaire de collecte des données pour le Rapport de cadrage ITIE 2024.docx` | Liste de cadrage : ~100 sociétés extractives avec NIF / N° employeur CNSS, montants des paiements 2024 à collecter |

### 1.2 Cahier des charges OASE (`kb/` — passages extractif/mines/conventions lus en totalité)

- `PRD OASE_synthese.docx` (v2.0, avril 2026) — vision produit, modules 1-7, OS1-OS10, profils
- `Besoins_informations_documentaires.V1.docx` — codes sectoriels (minier, hydrocarbures) dans le référentiel OS1
- `Grilles_entretiens_OASE_v1.docx` — grille 7 « Ministères sectoriels (Mines…) » : agréments sectoriels, conventions signées au Cabinet sans instruction, fichiers de suivi Excel
- `Structures_acteurs.V1.docx` — DGMG absente des P1 mais présente via « Ministères sectoriels » (P2) ; ITIE non citée comme structure mais ses flux recoupent OTR/DGTCP/DGMG

---

## 2. Ce que le client attend du module extractif — synthèse

Le module extractif d'OASE (profil `agent_dgmg`, Direction Générale des Mines et de la Géologie) n'est **pas** un simple tableau de bord. D'après les documents, il doit couvrir **4 missions** :

### Mission A — Répertoire minier (registre des permis et licences)

Source : Annexe 1.1, feuilles « 16.Registre des Licences » et « 17.Octrois des licences » + Annexe 1.2/1.3 « Répertoire des permis ».

Le client attend un **répertoire national des titres miniers** avec, par permis :

- Société titulaire, **type de permis** (recherche / exploitation / carrière), **substance principale**
- Date de demande, **date d'octroi**, durée (ans), superficie (km²), localité, **coordonnées géographiques**
- Existence d'un **rapport d'étude d'impact environnemental public** (oui/non + lien ou obstacles à la publication)
- Mode d'octroi : appel d'offres ouvert / international / restreint / gré à gré / premier venu-premier servi, avec **critères techniques et financiers**, identité de l'attributaire, ancien titulaire (transferts), liste des candidats et **bénéficiaires effectifs** en cas d'appel d'offres
- **Consultations communautaires** : nombre de personnes consultées (hommes/femmes), processus, **consentement libre, préalable et éclairé (CLPE)**

### Mission B — Suivi financier du secteur (flux ITIE)

Source : Annexe 1.1 feuille « 1.Formulaire déclaration » (nomenclature complète des flux) + feuilles 4-8 + réponse du ST-ITIE.

Le client attend le suivi des **flux financiers du secteur extractif**, par entité et par société :

- **Flux DGMG** : frais d'instruction, droits fixes, redevances superficiaires, **redevances minières (substance minière et carrière)**, pénalités
- **Production** : par mois, type/qualité, quantités brute/nette, valeur (FCFA/USD), région, permis, code HS
- **Exportations & ventes** : déclaration d'exportation, valeur FOB, entité acheteuse (affiliée ou non), pays destinataire
- **Redevance minière** : volumes produits/vendus/traités, valeur marchande, chiffre d'affaires, redevance calculée
- **Transferts aux communes** : CFLDR (0,75 % du CA, décret 2017-023) dû vs encaissé, par société et par commune, années 2017-2023+
- **Dépenses sociales obligatoires et volontaires** (bénéficiaires, montants numéraire/nature, domaines, **ventilation par genre**, base juridique, divulgation des contrats)
- **Paiements environnementaux** (ANGE) obligatoires et volontaires
- Flux croisés avec les autres régies : CI (IS, TVA, redressements…), CDDI (droits de douane), DGTCP (dividendes, taxes écologiques), DGTLS, CNSS, TdE

### Mission C — Conventions extractives et avantages fiscaux (cœur OASE)

Source : PRD modules 1-3 + grille 7 ministères sectoriels + panneaux de la maquette existante (« phases recherche/exploitation », « passage Conseil des ministres », « suivi premier baril », « code additionnel et flux Sydonia », « référence budgétaire, ITIE », « diffusion confidentielle des actes »).

Le client attend le suivi des **conventions extractives** (régimes Minier et Hydrocarbures du référentiel OASE) avec :

- **Workflow visible par étapes** : demande de permis → négociation → **Conseil des ministres** → ratification / application OTR → suivi
- **Avantages différenciés par phase** (recherche vs exploitation) — la fiscalité minière change selon la phase
- **Suivi des obligations** : premier baril / début de production, engagements (emplois, investissement), annexes techniques
- **Contrôle des coûts** (Annexe 1.1 feuille 14) : cadre juridique du suivi des coûts, audits, redressements émis/notifiés/recouvrés, coûts non recouvrables, remises gracieuses
- **Référence budgétaire** : inscription de la dépense fiscale en LFI, articulation CONEDEF, **flux SYDONIA** (code additionnel douanier)
- **Diffusion confidentielle des actes** : les conventions minières comportent des clauses de confidentialité — accès restreint, journalisation des consultations
- **Alertes d'échéance** : `POST /conventions/alertes/echeance` existe déjà côté backend — à rendre visible

### Mission D — Production des livrables ITIE

Source : réponse du ST-ITIE (§2 « Liste des informations statistiques à produire »).

Le client attend qu'OASE produise, pour le rapport ITIE, les **8 sorties statistiques** :

1. Contribution du secteur extractif au **PIB**
2. Contribution aux **exportations**
3. Contribution aux **revenus budgétaires**
4. Contribution à l'**emploi**
5. **Gestion et répartition** des recettes
6. **Dépenses sociales et économiques**
7. **Répartition des revenus par entités gouvernementales** (DGMG / CI / CDDI / DGTCP / ANGE / communes…)
8. **Analyse des paiements et revenus** (rapprochement entreprises ↔ régies — la **réconciliation ITIE**)

Et le processus en 6 phases : cadrage (périmètre, seuil de matérialité) → collecte → assurance qualité → analyse des écarts par le GMP → rapportage → publication.

Le **périmètre de réconciliation 2024** est déjà défini par le client : 11 sociétés dans le périmètre (SNPT, SCANTOGO MINES, TdE, WACEM, TOGO CARRIERE, CIMCO, POMAR, GRANUTOGO, TOGO RAIL, BRASSERIE DU BENIN, STM) et ~160 sociétés hors périmètre nécessitant tout de même une déclaration des régies.

---

## 3. Écart avec l'existant — mesuré le 2026-07-29 (honnêteté totale)

| Attente (§2) | Existant en production | Écart |
|---|---|---|
| Répertoire minier (permis, licences, coordonnées, CLPE) | **Rien** — aucune table, aucun écran | 100 % |
| Flux financiers ITIE (production, exportations, redevances, CFLDR, social, environnement) | **Rien** — aucune table, aucun écran | 100 % |
| Conventions extractives (workflow 5 étapes, avantages par phase, contrôle des coûts) | Table `conventions` générique (référence, régime, dates, montant, emplois) + endpoints `GET/POST/PATCH renouveler/POST alertes` + dashboard liste — **0 convention en base** | Structure partielle (~20 %), données 0, workflow ITIE absent |
| Livrables ITIE (8 statistiques, réconciliation) | **Rien** | 100 % |
| UI extractif | 1 écran `/extractif/dashboard` : liste conventions (vide) + panneaux descriptifs **statiques** (« dans la maquette ») | Vitrine seulement |
| Tests E2E | Smoke : page rendue, `GET /conventions` 200 (tableau vide accepté), 0 erreur | Prouve le rendu, **pas la fonction** — insuffisant (signalé par le client) |

**Conclusion : le module extractif actuel est une coquille.** Le socle backend `conventions` est réel mais générique ; rien de spécifique au secteur extractif/ITIE n'existe encore.

---

## 4. Proposition de périmètre par phases (à valider par le client avant implémentation)

### Phase E1 — Fondations données (socle minimal honnête)

1. Référentiel `ref_regimes_convention` déjà peuplé (Minier, Hydrocarbures…) — **fait**
2. Créer les **sociétés extractives du périmètre ITIE** (11 + échantillon hors périmètre) comme contribuables avec NIF réels du formulaire de cadrage
3. Créer des **conventions réelles** (SNPT phosphates — régime Minier ; STM manganèse ; WACEM/SCANTOGO calcaire…) via `POST /conventions` avec montants, dates, emplois engagés
4. Dashboard extractif alimenté par ces données réelles + **alertes d'échéance** branchées sur l'endpoint existant
5. Tests E2E : le smoke doit exiger `conventions.length > 0` et vérifier les champs affichés (plus jamais de « 0 erreur » sur données vides)

### Phase E2 — Répertoire minier

Table `permis_miniers` (type, substance, dates, superficie, localité, coordonnées, statut, convention liée) + écrans DGMG : registre, octroi (mode, critères, bénéficiaires effectifs), fiche permis.

### Phase E3 — Flux et suivi financier

Tables production / exportations / redevances / transferts communes (CFLDR) + saisie DGMG + rapprochement avec les flux OTR/DGTCP déjà modélisés dans OASE.

### Phase E4 — Rapportage ITIE

Moteur des 8 statistiques + export du formulaire de déclaration (format des Annexes 1.1-1.3) + périmètre de réconciliation (cadrage : seuil de matérialité, sociétés dans/hors périmètre).

---

## 5. Questions ouvertes pour le client

1. **Périmètre immédiat** : la phase E1 (conventions réelles + dashboard alimenté) suffit-elle pour la démonstration en cours, ou le client exige-t-il déjà le répertoire minier (E2) ?
2. **Source des données permis** : la DGMG fournit-elle un extrait de son répertoire actuel (Excel/papier, cf. grille 7) pour alimenter la base, ou saisit-on à zéro ?
3. **Confidentialité** : quelles conventions minières sont diffusables telles quelles dans OASE (clauses de confidentialité, cf. PRD risques) ?
4. **ITIE** : le module doit-il produire le rapport ITIE complet (E4) ou seulement alimenter le Secrétariat Technique ITIE en données ?

---

*Document rédigé après lecture intégrale des 5 fichiers `kb/itie/` et des passages extractif/mines/conventions des 4 documents du cahier des charges `kb/`. Extraits bruts conservés dans `webbridge/itie-contenu-complet.txt` et `webbridge/kb-racine-itie.txt` pour vérification.*

---

## 6. Statut d'implémentation — 2026-07-29 : E1→E4 LIVRÉES ET TESTÉES

L'utilisateur a ordonné l'exécution complète (29/07 1h57 : « suis un ordre cohérent pour atteindre une complétude 100% de ce module et fais les 3 tests »). État final :

| Phase | Statut | Tests (3 modes : API E2E + headless + headed) |
|---|---|---|
| E1 — Conventions du périmètre ITIE | **IMPLÉMENTÉ** — 10 sociétés NIF réels, 10 conventions, dashboard alimenté (KPIs, échéances, détail) | TC-EXTR-01/02 verts ×3 modes |
| E2 — Répertoire minier | **IMPLÉMENTÉ** — table `permis_miniers`, CRUD + RBAC, écran `/extractif/repertoire`, 10 permis réalistes | TC-EXTR-03/04 verts ×3 modes |
| E3 — Flux financiers | **IMPLÉMENTÉ** — 4 tables Annexes 1.1 feuilles 3-6, 8 endpoints, écran `/extractif/flux`, 11 lignes 2024 | TC-EXTR-05/06 verts ×3 modes |
| E4 — Rapportage ITIE | **IMPLÉMENTÉ** — `/itie/statistiques` (calculées vs non calculables déclarées), export CSV Annexe 1.1, écran `/extractif/itie` | TC-EXTR-07/08 verts ×3 modes |

- Vérifications globales : suite recette 52/52 headless, 4/4 MFA isolées, Jest 427/427, MFA global désactivé post-run.
- Limites assumées (§3 du présent document, inchangées) : les indicateurs exigeant des sources externes (PIB INSEED, exportations nationales douanières, emploi sectoriel, réconciliation régies OTR/DGTCP) sont **déclarés non calculables** dans l'API et l'UI — pas de valeurs fictives.
- Les données 2024 (sociétés, conventions, permis, flux) constituent le **jeu de recette** ; la bascule vers des données de production réelles suppose l'apport DGMG (question ouverte n°2).
