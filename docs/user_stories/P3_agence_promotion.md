# OASE — User Stories P3 (Agence de Promotion)

> **Issue Plane :** OASE-34
> **Persona :** P3 — Agence de Promotion (API, ZATP, SAZOF, CSFM)
> **Statut :** Rédigé
> **Date :** 10 juillet 2026
> **Référence :** `maquette/src/views/agences/*`

---

## Vue d'ensemble

P3 suit les conventions et agréments de son périmètre (agence). Il dispose de 4 écrans :
- `DashboardView` — KPIs agence
- `ConventionsView` — conventions signées
- `EngagementsView` — engagements des entreprises
- `AgrementsView` — agréments accordés

**MFA :** Oui. **Signatures :** Oui (PIN).

---

## US-P3-01 — Dashboard agence

**En tant qu'** agent d'agence de promotion, **je veux** visualiser les KPIs de mon agence, **afin de** suivre mon activité.

**Critères d'acceptation :**
- [ ] 4 KPI : conventions en cours, agréments émis ce mois, entreprises suivies, montant cumulé
- [ ] Graphique d'évolution mensuelle sur 12 mois
- [ ] Liste des conventions arrivant à échéance (< 60 jours)

---

## US-P3-02 — Gérer les conventions

**En tant qu'** agent d'agence, **je veux** créer et suivre les conventions, **afin de** les attribuer aux entreprises de mon périmètre.

**Critères d'acceptation :**
- [ ] Création d'une convention : n°, entreprise, type, durée, contreparties
- [ ] Modification tant que non signée
- [ ] Suivi : statut (brouillon, signée, résiliée), contreparties réalisées vs attendues
- [ ] Génération PDF de la convention
- [ ] Signature électronique via PIN

---

## US-P3-03 — Suivre les engagements des entreprises

**En tant qu'** agent d'agence, **je veux** suivre la réalisation des engagements des entreprises conventionnées, **afin de** vérifier la conformité aux contreparties.

**Critères d'acceptation :**
- [ ] Tableau : entreprise, engagement prévu, réalisé, %, écart
- [ ] Alerte si écart > 20% ou retard > 6 mois
- [ ] Saisie d'un justificatif pour expliquer un écart
- [ ] Vue chronologique des réalisations

---

## US-P3-04 — Émettre des agréments

**En tant qu'** agent d'agence, **je veux** émettre des agréments, **afin de** permettre aux entreprises de bénéficier d'exonérations.

**Critères d'acceptation :**
- [ ] Création d'un agrément : entreprise, type d'avantage, durée, conditions
- [ ] Validation par le P4 (décideur stratégique) pour les montants > seuil
- [ ] Notification automatique à l'entreprise
- [ ] Lien automatique avec les futures demandes d'exonération de l'entreprise

---

## Récapitulatif

| ID | Titre | Priorité | Statut |
|---|---|---|---|
| US-P3-01 | Dashboard agence | Haute | ✅ |
| US-P3-02 | Gérer les conventions | Haute | ✅ |
| US-P3-03 | Suivre les engagements | Moyenne | ✅ |
| US-P3-04 | Émettre des agréments | Haute | ✅ |

**Total : 4 user stories.**

---

*Document lié à OASE-34.*
