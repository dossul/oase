# OASE-39, 40, 41 — Use Cases métier complets

> **Issues Plane :** OASE-39 (use cases), OASE-40 (cycle demande), OASE-41 (cas limites)  
> **Date :** 2026-06-16  
> **Sources :** OASE-6 (domain model), OASE-7 (transitions), OASE-28 (flux persona)

---

## UC-01 · Soumettre une demande d'exonération (P1)

| | |
|---|---|
| **Acteur** | Opérateur économique (P1) |
| **Précondition** | Authentifié · Profil bénéficiaire créé · `statut_fiscal = conforme` |
| **Déclencheur** | Bénéficiaire clique "Nouvelle demande" |
| **Postcondition** | Demande créée avec statut `brouillon` puis `soumis` · Pièces jointes uploadées · Email confirmation envoyé |

**Flux nominal :**

```
1. P1 choisit base juridique dans le référentiel MRD
   └─ Système : vérifie que mesure est_active = true
2. P1 saisit montant estimé et date d'échéance souhaitée
3. P1 upload les pièces rang 1 obligatoires
   └─ Système : vérifie MIME (PDF/JPG/PNG) · taille ≤ 10MB · calcule SHA-256
4. P1 optionnellement upload les pièces rang 2
5. P1 confirme la déclaration sur l'honneur
6. P1 clique "Soumettre"
   └─ Système :
      a. Vérifie E-TAX (mode mock ou réel) → statut_fiscal ≠ 'dette_active'
      b. Vérifie pièces rang 1 toutes présentes
      c. Vérifie quota non épuisé
      d. Crée référence OASE (format : OASE-YYYY-NNNNNN)
      e. Crée `EtapeWorkflow` initiale selon le type de texte juridique
      f. Met statut = 'soumis'
      g. Crée entrée audit log (sha256)
      h. Envoi email notification
      i. Retourne : { reference, statut, date_soumission }
```

**Flux alternatifs :**

- **A1 — Brouillon auto-sauvegardé** (à tout moment des étapes 1-5)
  - P1 quitte le formulaire sans soumettre
  - Système sauvegarde brouillon toutes les 2 min
  - Retour : statut = `brouillon`

- **A2 — Statut fiscal dette active** (étape 6a)
  - Système retourne `403 STATUT_FISCAL_DETTE_ACTIVE`
  - Message : "Dépôt impossible — dette fiscale active. Contactez le Centre des Impôts."
  - Action bloquante, brouillon conservé

- **A3 — Quota épuisé** (étape 6c)
  - Système retourne `422 QUOTA_EPUISE`
  - Message : "Quota épuisé pour cette mesure. Soumission impossible sans révision budgétaire."
  - Action bloquante, brouillon conservé

- **A4 — Pièces rang 1 manquantes** (étape 6b)
  - Système retourne `422 PIECES_RANG_UN_MANQUANTES`
  - Liste des catégories manquantes affichée
  - Redirection vers étape 2 du tunnel

---

## UC-02 · Instruire une demande (P2)

| | |
|---|---|
| **Acteur** | Agent instructeur (P2) |
| **Précondition** | Authentifié · Rôle = agent_ci / agent_cddi / agent_dgbf · Statut demande = `soumis` |
| **Déclencheur** | Agent clique "Prendre en charge" |
| **Postcondition** | Étape workflow validée · Demande avance ou reste `en_instruction` |

**Flux nominal :**

```
1. P2 consulte la file d'attente (filtre automatique sur son organe)
2. P2 clique "Prendre en charge" sur une demande
   └─ Système : statut → 'en_instruction' · agent_id = P2.id · création audit log
3. P2 visionne les pièces jointes (PDF.js intégré)
4. P2 valide l'étape courante
   └─ Système : PIN vérifié (bcrypt) · étape → 'validee'
   └─ Si dernière étape non-approbation → prochaine étape → 'en_cours'
   └─ Si dernière étape = approbation → statut → 'attente_decision'
5. P2 ajoute un commentaire optionnel (audit log)
```

**Flux alternatifs :**

- **A1 — Demander un complément** (après étape 3)
  - P2 clique "Demander complément"
  - P2 saisit motif (20–2000 car.)
  - Système : statut → 'action_requise' · notification P1 · création audit log

- **A2 — Dossier déjà pris en charge** (étape 2)
  - Système retourne `409 DEMANDE_DEJA_PRISE_EN_CHARGE`
  - Nom de l'instructeur affiché

- **A3 — Anomalie critique détectée** (après étape 3)
  - P2 clique "Signaler anomalie"
  - Système crée anomalie gravité 'critique' · bloque approbation
  - Anomalie visible P5 (contrôle)

---

## UC-03 · Approuver / Rejeter une demande (P2/P4)

| | |
|---|---|
| **Acteur** | Décideur (agent_financier / decideur / admin_mef) |
| **Précondition** | Toutes les étapes workflow validées · Anomalies critiques = 0 · Quota non épuisé |
| **Déclencheur** | Appel à l'API `POST /demandes/:id/approuver` |
| **Postcondition** | Statut = `approuve` · Attestation PDF générée · SI notifiés · Quota mis à jour |

**Flux nominal :**

```
1. Décideur saisit son PIN (signature électronique)
   └─ Système : vérification bcrypt · compteur tentatives (max 3)
2. Décideur ajoute commentaire optionnel
3. Décideur clique "Approuver"
   └─ Système :
      a. Vérifie toutes étapes workflow = 'validee'
      b. Vérifie anomalies critiques = 0
      c. Vérifie quota < 100%
      d. Vérifie PIN valide
      e. statut → 'approuve'
      f. Génère attestation PDF (Puppeteer · QR code · hash)
      g. Met à jour quota (consomme += montant)
      h. Notifie Sydonia (décision approbation)
      i. Notifie E-TAX (sync exonération)
      j. Comptabilise dans GUDEF (non bloquant)
      k. Crée audit log (sha256)
      l. Email P1 avec attestation téléchargeable
```

**Flux alternatif — Rejet :**

```
1. Décideur saisit motif de rejet (obligatoire, 20–2000 car.)
2. Décideur saisit PIN
3. Décideur clique "Rejeter"
   └─ Système :
      a. Motif vérifié non vide
      b. statut → 'rejete'
      c. Crée audit log
      d. Email P1 avec motif complet
```

**Flux erreur :**

| Condition | Code erreur | Message |
|-----------|-------------|---------|
| Étape non validée | `ETAPES_WORKFLOW_INCOMPLETES` | Toutes les étapes doivent être validées |
| Anomalie critique | `ANOMALIE_CRITIQUE_NON_RESOLUE` | Anomalie {id} bloque l'approbation |
| Quota épuisé | `QUOTA_EPUISE` | Quota consommé à 100% |
| PIN invalide (3×) | `PIN_BLOQUE` | Compte verrouillé 15 minutes |

---

## UC-04 · Répondre à une demande de complément (P1)

| | |
|---|---|
| **Acteur** | Opérateur économique |
| **Précondition** | Demande en statut `action_requise` · Notification reçue |
| **Postcondition** | Pièces ajoutées · statut → `en_instruction` · reprise par instructeur |

```
1. P1 reçoit email "Action requise sur OASE-YYYY-NNNNNN"
2. P1 se connecte · va dans liste demandes · filtre "Action requise"
3. P1 lit le motif du complément
4. P1 upload les nouveaux documents demandés
5. P1 optionnellement ajoute un commentaire de réponse
6. P1 clique "Soumettre le complément"
   └─ Système :
      a. Vérifie les nouvelles pièces (MIME · taille · SHA-256)
      b. statut → 'en_instruction'
      c. Notification instructeur
      d. Création audit log
```

---

## UC-05 · Importer le référentiel MRD (P7)

| | |
|---|---|
| **Acteur** | Administrateur SI |
| **Précondition** | Rôle admin_si · Fichier CSV/JSON MRD 2024 disponible |
| **Postcondition** | Bases juridiques mises à jour (SCD Type 2) · Rapport import généré |

```
1. P7 accède à Configuration > Import MRD
2. P7 sélectionne le fichier CSV ou JSON
3. P7 choisit le mode : 'upsert' (défaut) · 'append_only' · 'replace_all'
4. Système affiche aperçu des 10 premières lignes
5. P7 clique "Lancer l'import"
   └─ Système :
      a. Démarre job asynchrone (BullMQ)
      b. Pour chaque ligne :
         - Si code_mesure existe et modifié → archive version actuelle (SCD T2)
         - Crée nouvelle version avec date_debut = aujourd'hui
         - Si code_mesure inexistant → création nouvelle
      c. Génère rapport : { importees, archivees, erreurs, ignorees }
6. Notification P7 à la fin du job · rapport téléchargeable
```

---

## UC-06 · Vérifier l'intégrité de l'audit log (P5)

| | |
|---|---|
| **Acteur** | Auditeur / Corps de contrôle |
| **Précondition** | Rôle = corps_controle · Accès audit log |
| **Postcondition** | Résultat vérification chaîne SHA-256 |

```
1. P5 accède à Contrôle > Journal d'audit
2. P5 clique "Vérifier l'intégrité"
   └─ Système : parcourt audit_logs par ordre chronologique
      a. Vérifie hash[i] = SHA-256(hash[i-1] + donnees[i])
      b. Si rupture détectée → retourne { verified: N, break_at: id }
      c. Si OK → retourne { verified: N, breaks: [] }
3. P5 exporte le rapport CSV signé
```

---

## UC-07 · Vérifier l'authenticité d'une attestation (P6)

| | |
|---|---|
| **Acteur** | Citoyen / Douanier / Agent fiscal |
| **Précondition** | Aucune (public) |
| **Postcondition** | Résultat valide / invalide / révoqué |

```
1. Utilisateur accède à /attestations/verifier (sans authentification)
2. Saisit le hash QR (ou scan QR via caméra)
3. Système :
   a. Hash la référence OASE + timestamp décision
   b. Compare avec hash stocké
   c. Retourne :
      - valide=true : référence, date, type mesure, statut actuel
      - valide=false : "Attestation non reconnue dans le système OASE"
      - statut='rejete' ou 'expire' : message explicite
```

---

## UC-08 · Gérer les utilisateurs (P7)

| | |
|---|---|
| **Acteur** | Administrateur SI |
| **Précondition** | Rôle admin_si |
| **Postcondition** | Utilisateur créé / modifié / désactivé · Session révoquée si désactivation |

```
1. P7 accède à Administration > Utilisateurs
2. P7 clique "Nouvel utilisateur"
   └─ Saisit : nom, prénom, email, rôle, institution, mfa_active (true obligatoire pour P2→P7)
3. Système : envoie email d'activation avec lien temporaire (TTL 24h)
4. P7 peut :
   - Modifier rôle / institution (audit log)
   - Désactiver compte → toutes les sessions JWT révoquées
   - Réinitialiser MFA → QR code généré · ancien secret invalidé · audit log
   - Réinitialiser PIN → force nouveau PIN à la prochaine connexion
5. Impossible de supprimer le dernier administrateur → erreur `DERNIER_ADMIN`
```

---

## UC-09 · Cas limites et erreurs (OASE-41)

| Scénario | Comportement attendu |
|---|---|
| **Double soumission** (double clic sur "Soumettre") | Bouton désactivé côté client + clé unique côté serveur → 2ème rejetée (idempotence) |
| **Token expiré pendant saisie formulaire** | Toast "Session expirée" → redirect `/login` · données du formulaire sauvegardées dans localStorage |
| **Déconnexion pendant upload fichier** | Progress annulé · pièce partielle supprimée côté S3 (cron cleanup) |
| **Accès direct URL `/backoffice/demandes` par P1** | Guard frontend + NestJS `RbacGuard` → 403 |
| **Tentative approbation avec PIN erroné 3×** | Compte verrouillé 15 min · audit log `PIN_BLOQUE` · notification admin |
| **Révocation MFA d'un utilisateur connecté** | Session invalide au prochain refresh (401) → redirect `/login` |
| **Import MRD avec colonne manquante** | Ligne ignorée · rapport avec code erreur "COLONNE_MANQUANTE" |
| **Connecteur Sydonia en timeout** | Circuit Breaker open · fallback mock si demo · alerte admin en prod |
| **Quota atteint 80% pendant approbation** | Approbation toujours autorisée · alerte décideur visible post-action |
| **Attestation vérifiée après décision annulée** | Retourne "statut : rejeté" si décision contestée et révisée |

---

*Livrables OASE-39 à 41 — Use Cases métier complets + cas limites.*
