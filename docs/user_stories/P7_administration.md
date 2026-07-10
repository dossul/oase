# OASE — User Stories P7 (Administrateur Système)

> **Issue Plane :** OASE-38
> **Persona :** P7 — Administrateur Système
> **Statut :** Rédigé
> **Date :** 10 juillet 2026
> **Référence :** `maquette/src/views/admin/*`

---

## Vue d'ensemble

P7 gère les utilisateurs, workflows, paramètres et supervise le système. Il dispose de 14 écrans :
- `UtilisateursView` — gestion utilisateurs
- `RolesView` — RBAC
- `WorkflowView` — templates de workflow
- `ParametresView` — paramètres globaux
- `MonitoringView` — santé système
- `ReglesView` — règles métier
- `GedView` — gestion électronique de documents
- `ConnecteursView` — connecteurs SI
- `FormulairesView` — formulaires dynamiques
- `GouvernanceDonneesView` — gouvernance des données
- `RequetesDynamiquesView` — requêtes SQL/NoSQL
- `DictionnaireO2View` — dictionnaire OpenData
- `PublicationOpenDataView` — publication open data
- (sera complété par les vues à venir)

**MFA :** Oui + accès restreint par IP. **Signatures :** Oui.

---

## US-P7-01 — Gérer les utilisateurs

**En tant qu'** administrateur, **je veux** gérer le cycle de vie des utilisateurs, **afin de** maintenir la base à jour.

**Critères d'acceptation :**
- [ ] CRUD : créer, désactiver, réactiver, supprimer (soft delete)
- [ ] Affectation de rôle(s) + institution
- [ ] Reset MFA / PIN en cas de perte
- [ ] Désactivation en masse
- [ ] Historique des actions sur le compte
- [ ] Toutes opérations journalisées

---

## US-P7-02 — Configurer le RBAC

**En tant qu'** administrateur, **je veux** configurer les rôles et leurs permissions, **afin de** contrôler l'accès.

**Critères d'acceptation :**
- [ ] Liste des 15 rôles canoniques
- [ ] Pour chaque rôle : permissions granulaires (CRUD par entité)
- [ ] RLS applicatif (10 règles RLS-01 à RLS-10)
- [ ] Test d'un rôle avant activation
- [ ] Backup de la matrice RBAC

---

## US-P7-03 — Superviser le système

**En tant qu'** administrateur, **je veux** superviser l'état du système, **afin de** réagir aux incidents.

**Critères d'acceptation :**
- [ ] Dashboard : CPU, RAM, disque, requêtes/sec, latence
- [ ] Liste des erreurs en temps réel (filtre par niveau)
- [ ] Métriques par module
- [ ] Alertes (seuils paramétrables)
- [ ] Intégration possible avec Prometheus / Grafana

---

## US-P7-04 — Configurer les paramètres globaux

**En tant qu'** administrateur, **je veux** configurer les paramètres système, **afin d'** adapter l'application au contexte.

**Critères d'acceptation :**
- [ ] Paramètres SMTP (notifications email)
- [ ] Plafonds et seuils d'exonération
- [ ] Délais SLA par régime
- [ ] Format des numéros de demande
- [ ] Mode maintenance
- [ ] Modifications versionnées et journalisées

---

## US-P7-05 — Gérer les workflows

**En tant qu'** administrateur, **je veux** créer et modifier les templates de workflow, **afin de** faire évoluer les circuits d'instruction.

**Critères d'acceptation :**
- [ ] Éditeur drag & drop des étapes
- [ ] Configuration des conditions d'entrée/sortie
- [ ] Versioning des templates
- [ ] Test sur dossier fictif
- [ ] Activation / désactivation

---

## US-P7-06 — Configurer les règles métier

**En tant qu'** administrateur, **je veux** gérer les règles de blocage et d'alerte, **afin de** faire respecter la politique fiscale.

**Critères d'acceptation :**
- [ ] Liste des 5 règles de blocage (bloc-01 à bloc-05)
- [ ] Éditeur DSL simple (SI ... ALORS ...)
- [ ] Test de la règle sur dossiers existants
- [ ] Activation / désactivation sans déploiement

---

## US-P7-07 — Gérer la gouvernance des données

**En tant qu'** administrateur, **je veux** superviser la qualité des données, **afin de** garantir leur fiabilité.

**Critères d'acceptation :**
- [ ] Liste des contrôles qualité (champs obligatoires, formats, cohérence)
- [ ] Résultat du dernier contrôle par table
- [ ] Purge des données obsolètes
- [ ] Archivage annuel
- [ ] Statistiques de complétude

---

## US-P7-08 — Gérer les connecteurs SI

**En tant qu'** administrateur, **je veux** superviser les connecteurs SI (Sydonia, E-TAX, SIGFiP, GUDEF), **afin de** détecter les pannes.

*Note : la configuration réelle des connecteurs est hors périmètre MVP — voir issue séparée.*

**Critères d'acceptation :**
- [ ] Liste des connecteurs configurés
- [ ] État : OK / KO / désactivé
- [ ] Logs d'appel (succès / erreur)
- [ ] Test manuel d'un appel
- [ ] Activation / désactivation

---

## US-P7-09 — Requêtes dynamiques

**En tant qu'** administrateur, **je veux** exécuter des requêtes SQL sur la base, **afin d'** investiguer des problèmes.

**Critères d'acceptation :**
- [ ] Éditeur SQL avec coloration syntaxique
- [ ] Lecture seule (pas de DROP / UPDATE / DELETE)
- [ ] Timeout 30s
- [ ] Export du résultat (CSV, XLSX)
- [ ] Toutes requêtes journalisées

---

## US-P7-10 — Gestion électronique de documents (GED)

**En tant qu'** administrateur, **je veux** gérer le stockage des pièces, **afin d'** éviter la saturation.

**Critères d'acceptation :**
- [ ] Liste des fichiers stockés (taille, date, propriétaire)
- [ ] Recherche full-text
- [ ] Suppression logique
- [ ] Politique de rétention (5 ans par défaut)
- [ ] Statistiques d'usage

---

## Récapitulatif

| ID | Titre | Priorité | Statut |
|---|---|---|---|
| US-P7-01 | Gérer utilisateurs | Haute | ✅ |
| US-P7-02 | Configurer RBAC | Haute | ✅ |
| US-P7-03 | Superviser système | Haute | ✅ |
| US-P7-04 | Paramètres globaux | Haute | ✅ |
| US-P7-05 | Gérer workflows | Moyenne | ✅ |
| US-P7-06 | Règles métier | Moyenne | ✅ |
| US-P7-07 | Gouvernance données | Moyenne | ✅ |
| US-P7-08 | Connecteurs SI | Basse | ✅ |
| US-P7-09 | Requêtes dynamiques | Basse | ✅ |
| US-P7-10 | GED | Moyenne | ✅ |

**Total : 10 user stories.**

---

*Document lié à OASE-38. Les connecteurs SI réels (Sydonia, E-TAX, SIGFiP, GUDEF) sont hors périmètre MVP — voir backlog Phase F.*
