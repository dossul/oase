# OASE — User Stories P4 (Décideur Stratégique)

> **Issue Plane :** OASE-35
> **Persona :** P4 — Décideur Stratégique (UPF, MEF, OIIL)
> **Statut :** Rédigé
> **Date :** 10 juillet 2026
> **Référence :** `maquette/src/views/decideur/*`

---

## Vue d'ensemble

P4 valide les décisions à fort enjeu et pilote la politique fiscale d'exonération. Il dispose de 7 écrans :
- `DashboardView` — vision macro
- `RegistreCentralView` — registre des exonérations nationales
- `AnalyseView` — analyses stratégiques
- `SimulationView` — simulations what-if
- `RapportAnnuelView` — rapport annuel
- `ReferentielView` — référentiel des bases juridiques
- `AnalyseView` (analyses approfondies)

**MFA :** Oui. **Signatures :** Oui (PIN, double signature pour > 1 Md XOF).

---

## US-P4-01 — Dashboard macro-économique

**En tant que** décideur stratégique, **je veux** visualiser la situation macro des exonérations, **afin de** piloter la politique fiscale.

**Critères d'acceptation :**
- [ ] 6 KPI : montant total exonéré, nb entreprises, nb secteurs, ratio coût/recouvrement, écart vs budget, prévisionnel
- [ ] Carte du Togo avec chaleur par région
- [ ] Top 10 secteurs en montant exonéré
- [ ] Comparaison année N vs N-1

---

## US-P4-02 — Consulter le registre central des exonérations

**En tant que** décideur, **je veux** accéder au registre central de toutes les exonérations, **afin de** disposer d'une vision exhaustive.

**Critères d'acceptation :**
- [ ] Tableau national : n°, type, entreprise, secteur, montant, durée, statut
- [ ] Filtres avancés : région, secteur, période, montant
- [ ] Export CSV / XLSX
- [ ] Drill-down vers la fiche détaillée
- [ ] Vue cartographique

---

## US-P4-03 — Valider une décision à fort enjeu

**En tant que** décideur, **je veux** valider les décisions d'exonération dépassant un seuil, **afin de** contrôler les engagements financiers importants.

**Critères d'acceptation :**
- [ ] File des décisions en attente de validation (montant > seuil = 500 M XOF)
- [ ] Récapitulatif : dossier complet + avis instructeur + avis P2
- [ ] Choix : VALIDER / REJETER / DEMANDER_AVIS
- [ ] Double signature électronique (PIN + validation par 2 décideurs)
- [ ] Si rejet : motif obligatoire
- [ ] Notification automatique à l'instructeur et au bénéficiaire

---

## US-P4-04 — Lancer une simulation what-if

**En tant que** décideur, **je veux** simuler l'impact d'un changement de politique, **afin de** prendre des décisions éclairées.

**Critères d'acceptation :**
- [ ] Paramètres : taux d'exonération, secteurs éligibles, plafonds, durée
- [ ] Projection sur 5 ans : montant exonéré, nb entreprises, impact budgétaire
- [ ] Comparaison avec le scénario actuel
- [ ] Sauvegarde / partage de scénarios
- [ ] Export PDF de la simulation

---

## US-P4-05 — Produire le rapport annuel

**En tant que** décideur, **je veux** générer le rapport annuel des exonérations fiscales, **afin de** le présenter au parlement et aux partenaires.

**Critères d'acceptation :**
- [ ] Génération auto du rapport sur l'année N-1 (données figées au 31/12)
- [ ] Sections : synthèse, analyse par secteur, par institution, par région, par type de régime
- [ ] Graphiques exportables PNG/SVG
- [ ] Génération PDF avec page de garde et table des matières
- [ ] Comparaison avec rapport N-2
- [ ] Validation avant publication

---

## US-P4-06 — Gérer le référentiel des bases juridiques

**En tant que** décideur, **je veux** mettre à jour le référentiel des bases juridiques (codes, lois, décrets), **afin de** maintenir la conformité réglementaire.

**Critères d'acceptation :**
- [ ] CRUD complet : créer, modifier, archiver une base juridique
- [ ] Versioning : chaque base a une date d'effet et une date de fin
- [ ] SCD2 (Slowly Changing Dimension type 2) pour historique
- [ ] Lien avec les régimes d'exonération
- [ ] Modification journalisée dans `audit_logs`

---

## Récapitulatif

| ID | Titre | Priorité | Statut |
|---|---|---|---|
| US-P4-01 | Dashboard macro | Haute | ✅ |
| US-P4-02 | Registre central | Haute | ✅ |
| US-P4-03 | Valider à fort enjeu | Haute | ✅ |
| US-P4-04 | Simulation what-if | Moyenne | ✅ |
| US-P4-05 | Rapport annuel | Haute | ✅ |
| US-P4-06 | Gérer bases juridiques | Moyenne | ✅ |

**Total : 6 user stories.**

---

*Document lié à OASE-35.*
