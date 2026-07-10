# OASE — User Stories P5 (Organe de Contrôle)

> **Issue Plane :** OASE-36
> **Persona :** P5 — Organe de Contrôle (IGF, Cour des Comptes, FMI)
> **Statut :** Rédigé
> **Date :** 10 juillet 2026
> **Référence :** `maquette/src/views/audit/*`

---

## Vue d'ensemble

P5 audite les exonérations et vérifie la conformité. Il dispose de 5 écrans :
- `DashboardView` — vue audit
- `DossiersView` — dossiers audités
- `AnomaliesView` — anomalies détectées
- `MissionsView` — missions d'audit
- `JournalView` — journal d'audit log

**MFA :** Oui. **Signatures :** Oui.

---

## US-P5-01 — Dashboard audit

**En tant qu'** auditeur, **je veux** visualiser les KPIs d'audit, **afin de** planifier mes missions.

**Critères d'acceptation :**
- [ ] 5 KPI : dossiers à risque, anomalies en cours, missions actives, taux de conformité, écart budget global
- [ ] Heatmap des risques par secteur/région
- [ ] Top 10 des dossiers à fort montant à contrôler

---

## US-P5-02 — Détecter les anomalies

**En tant qu'** auditeur, **je veux** détecter automatiquement les anomalies, **afin de** lancer des contrôles ciblés.

**Critères d'acceptation :**
- [ ] Moteur de règles : montant > seuil, durée > max, doublons, incohérence sectorielle
- [ ] Score de risque (0-100) par dossier
- [ ] Liste des dossiers avec score > 70
- [ ] Détail des facteurs de risque pour chaque dossier

---

## US-P5-03 — Conduire une mission d'audit

**En tant qu'** auditeur, **je veux** créer et suivre une mission d'audit, **afin de** structurer mon travail.

**Critères d'acceptation :**
- [ ] Création : titre, période, équipe, dossiers ciblés
- [ ] Plan d'audit : checklist + étapes
- [ ] Suivi de l'avancement
- [ ] Génération du rapport final (PDF)
- [ ] Clôture avec signature

---

## US-P5-04 — Consulter le journal d'audit log

**En tant qu'** auditeur, **je veux** consulter l'historique complet des actions, **afin de** détecter des manipulations.

**Critères d'acceptation :**
- [ ] Recherche : par utilisateur, par entité, par action, par période
- [ ] Affichage : timestamp, utilisateur, action, entité, IP, empreinte SHA-256
- [ ] Vérification de la chaîne (`verifyChain()`) en temps réel
- [ ] Alerte si rupture de chaîne
- [ ] Export CSV pour analyse externe

---

## US-P5-05 — Saisir une anomalie

**En tant qu'** auditeur, **je veux** saisir une anomalie détectée, **afin de** la transmettre aux agents concernés.

**Critères d'acceptation :**
- [ ] Saisie : titre, description, gravité (faible/moyenne/critique), entité concernée
- [ ] Pièce jointe possible
- [ ] Notification automatique à l'agent responsable
- [ ] Suivi du traitement de l'anomalie
- [ ] Clôture avec motif de résolution

---

## Récapitulatif

| ID | Titre | Priorité | Statut |
|---|---|---|---|
| US-P5-01 | Dashboard audit | Haute | ✅ |
| US-P5-02 | Détecter les anomalies | Haute | ✅ |
| US-P5-03 | Conduire une mission | Haute | ✅ |
| US-P5-04 | Consulter audit log | Haute | ✅ |
| US-P5-05 | Saisir une anomalie | Haute | ✅ |

**Total : 5 user stories.**

---

*Document lié à OASE-36.*
