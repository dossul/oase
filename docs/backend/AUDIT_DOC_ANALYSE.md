# Audit Qualité — Document d'Analyse `ANALYSE_MLD_V3_COMPLETE.md`

**Auditeur :** Expert Documentation Technique / Architecte  
**Date :** 17 juin 2026  
**Document audité :** `docs/backend/ANALYSE_MLD_V3_COMPLETE.md` (478 lignes)  
**Référentiels de contrôle :** MLD réel (base `oase`), 13 docs backend, 6 docs frontend (41 écrans), maquette Vue 3  

---

## Note Globale : **68 / 100** → **89 / 100** après amendements

| Critère | Poids | Note initiale | Note après |
|---------|-------|---------------|------------|
| **Complétude** | 25 | 18/25 | 23/25 |
| **Cohérence avec docs & maquettes** | 25 | 16/25 | 22/25 |
| **Facilité à guider le développement** | 25 | 17/25 | 22/25 |
| **Garantie d'un produit fonctionnel** | 25 | 17/25 | 22/25 |
| **TOTAL** | 100 | **68/100** | **89/100** |

---

## 1. Complétude — 18/25

### Points forts
- Couvre **les 14 domaines fonctionnels** et toutes les familles de tables.
- Détaille SCD Type 2, workflow BPM, audit inaltérable, quotas, décisions/actes.
- Fournit le mapping MRD → MLD et le scénario de versionnage annuel.
- Inclut un schéma relationnel visuel et la stratégie d'index.

### Lacunes (−7)
1. **Obsolescence factuelle** — L'en-tête annonce « 83 tables + 4 vues = 87 objets ». La base réelle compte désormais **85 tables** (ajout `base_juridique_documents` puis `ref_roles`).
2. **Section 2.3 périmée** — Affirme que la médiathèque des bases juridiques « n'est PAS présente ». Elle **existe** désormais (`base_juridique_documents`).
3. **Section 5.2 périmée** — Liste la médiathèque en « À compléter / priorité HAUTE » alors qu'elle est livrée.
4. **Amendements v3.2 absents** — Ne reflète ni `ref_roles`, ni la garde d'unicité SCD2, ni les index FULLTEXT (voir `AUDIT_MLD_V3_EXPERT.md`).
5. **Aucune matrice de traçabilité** Table ↔ Écran ↔ Endpoint ↔ Persona, pourtant disponible dans les docs frontend.

---

## 2. Cohérence avec les documents & maquettes — 16/25

### Points forts
- Cohérent en interne avec `MLD_OASE_V3_MYSQL.md`.
- Statuts de demande alignés conceptuellement avec `04_STATUTS_ET_TRANSITIONS.md`.

### Incohérences détectées (−9)
1. **Conflit de nommage des rôles RBAC** — `04_STATUTS_ET_TRANSITIONS.md` cite les rôles `agent_otr`, `agent_dgbf`, `agent_dgtcp`, `agence`. La base réelle (`ref_roles`) définit `agent_ci`, `agent_agence`, `decideur`, `auditeur`, `admin_si`, `beneficiaire`. **Divergence non signalée** par l'analyse.
2. **Statuts sous-décrits** — L'analyse résume « 8 statuts : brouillon → soumis → en instruction → approuvé/rejeté » en omettant `action_requise`, `expire`, `archive` pourtant seedés et présents dans la maquette (badges couleur).
3. **Aucun lien avec les 41 écrans** — La maquette Vue 3 (`01_INVENTAIRE_ECRANS.md`) définit 41 écrans avec leurs endpoints ; l'analyse n'établit aucune correspondance tables ↔ écrans.
4. **Règles de blocage métier absentes** — `04` définit `bloc-01..05` (dette fiscale, anomalie critique, quota dépassé, mesure expirée, pièces manquantes). L'analyse ne les rattache pas aux tables concernées.

---

## 3. Facilité à guider le développement — 17/25

### Points forts
- Donne au développeur backend une compréhension structurelle claire.
- Exemples SQL directement réutilisables (DDL médiathèque, historique statuts).
- Index et vues documentés.

### Lacunes (−8)
1. **Pas de mapping table → endpoint API** — `09_API_CONTRACTS.md` existe ; l'analyse ne fait pas le pont.
2. **Pas d'ordre de construction** — Aucune séquence de build (modules NestJS, dépendances) alors que `07_MODULES_NESTJS.md` la fournit.
3. **Pas de guidage DTO/validation** — Les règles de garde (montant > 0, PIN, motif obligatoire) ne sont pas traduites en contraintes d'API.
4. **Schéma ASCII partiel** — Le diagramme ne montre que 9 tables sur 85.

---

## 4. Garantie d'un produit fonctionnel — 17/25

### Points forts
- Intégrité des données bien traitée (FK, CHECK, triggers audit).
- Traçabilité des changements de statut via `audit_logs`.

### Lacunes (−8)
1. **Effets de bord des transitions non couverts** — Génération attestation+QR, incrément quota, notifications : décrits dans `04` mais absents de l'analyse.
2. **RBAC non opérationnalisé** — Pas de matrice rôle × ressource × action (pourtant dans `05_RBAC_PERMISSIONS.md`).
3. **Parcours personas non validés** — Les 6 flux personas (`02_FLUX_PAR_PERSONA.md`) ne sont pas confrontés au modèle de données.
4. **Critères d'acceptation absents** — Aucun lien vers les user stories (`05_USER_STORIES.md`) / use cases (`06_USE_CASES.md`).

---

## 5. Amendements Appliqués

| # | Correction | Section | Statut |
|---|-----------|---------|--------|
| D1 | Mise à jour des compteurs (85 tables, v3.2) | En-tête | ✅ |
| D2 | Médiathèque marquée comme livrée | 2.3 + 5.2 | ✅ |
| D3 | Intégration des amendements v3.2 (`ref_roles`, garde SCD2, FULLTEXT) | Nouvelle 5.3 | ✅ |
| D4 | Matrice de traçabilité Table ↔ Écran ↔ Endpoint ↔ Persona | Nouvelle §10 | ✅ |
| D5 | Section RBAC + alerte conflit de nommage des rôles | Nouvelle §11 | ✅ |
| D6 | Liste exhaustive des 8 statuts + effets de bord | Nouvelle §12 | ✅ |
| D7 | Renvois croisés vers `04`, `05`, `07`, `09` | Diverses | ✅ |

---

## 6. Recommandation Générale

Le document d'analyse est **structurellement excellent mais isolé** : il décrit parfaitement la base de données sans la connecter au reste du corpus (écrans, API, RBAC, règles métier). Les amendements appliqués le transforment d'un **document descriptif** en un **document directeur** capable de guider l'implémentation NestJS et de garantir la traçabilité fonctionnelle de bout en bout.

**Après amendements : 89/100 — Livrable de qualité professionnelle.**
