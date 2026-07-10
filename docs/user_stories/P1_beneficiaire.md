# OASE — User Stories P1 (Bénéficiaire / Opérateur Économique)

> **Issue Plane :** OASE-32
> **Persona :** P1 — Opérateur Économique / Bénéficiaire
> **Statut :** Rédigé
> **Date :** 10 juillet 2026
> **Référence écrans maquette :** `maquette/src/views/portail/*`

---

## Vue d'ensemble

Le persona **P1** est l'opérateur économique qui dépose et suit ses demandes d'exonération fiscale/douanière via le portail OASE. Il interagit avec 5 écrans principaux :
- `DashboardView` — tableau de bord
- `NewDemandeView` — création de demande
- `DemandeDetailView` — suivi d'une demande
- `ExonerationsActivesView` — exonérations en cours de validité
- `ProfilView` — gestion de son profil

**MFA :** Non (P1 utilise email + mot de passe).
**Signatures :** Oui — PIN de signature 4-6 chiffres pour valider les actes.

---

## US-P1-01 — Connexion par email et mot de passe

| Champ | Valeur |
|---|---|
| **ID** | US-P1-01 |
| **Persona** | P1 |
| **Écran** | `/login` |
| **Endpoint** | `POST /api/v1/auth/login` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** me connecter avec mon email institutionnel et mon mot de passe, **afin de** accéder à mon portail d'exonération.

**Critères d'acceptation :**
- [ ] Saisir email valide + mot de passe ≥ 8 caractères
- [ ] Si credentials OK et pas de MFA → redirection `/portail/dashboard` avec token (15 min access + 7j refresh)
- [ ] Si credentials OK et MFA actif → affichage écran de saisie du code TOTP
- [ ] Si credentials KO → message « Email ou mot de passe incorrect » (pas de fuite d'info sur l'existence du compte)
- [ ] 10 tentatives / minute max (rate limit)
- [ ] Échec de connexion journalisé dans `audit_logs` (action `LOGIN_ECHEC`)

---

## US-P1-02 — Voir son tableau de bord personnalisé

| Champ | Valeur |
|---|---|
| **ID** | US-P1-02 |
| **Persona** | P1 |
| **Écran** | `/portail/dashboard` |
| **Endpoint** | `GET /api/v1/dashboards/p1` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire connecté, **je veux** voir mon tableau de bord, **afin de** visualiser d'un coup d'œil l'état de mes demandes.

**Critères d'acceptation :**
- [ ] 4 KPI visibles : demandes en cours, validées, rejetées, exonérations actives
- [ ] Filtres rapides par statut (toutes / en instruction / validées / rejetées)
- [ ] Alerte proéminente si une exonération arrive à expiration dans < 30 jours
- [ ] Bouton d'action « Nouvelle demande » accessible en un clic
- [ ] Tableau des 10 dernières demandes avec colonne statut (badge coloré)
- [ ] Loading state géré (spinner), error state géré (toast + retry)

---

## US-P1-03 — Créer une nouvelle demande d'exonération

| Champ | Valeur |
|---|---|
| **ID** | US-P1-03 |
| **Persona** | P1 |
| **Écran** | `/portail/nouvelle-demande` |
| **Endpoint** | `POST /api/v1/demandes` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** initier une nouvelle demande d'exonération, **afin de** solliciter un avantage fiscal ou douanier.

**Critères d'acceptation :**
- [ ] Wizard multi-étapes : type de régime → informations générales → références juridiques → pièces jointes → récapitulatif
- [ ] Choix du régime conditionne l'affichage des étapes (ex : franchise douanière = 2 écrans, code des investissements = 5 écrans)
- [ ] Sauvegarde automatique en brouillon toutes les 30 secondes
- [ ] Validation côté client (règles `frontend/04_VALIDATION.md`) ET côté backend (DTO + class-validator)
- [ ] Si soumission complète → demande en statut `brouillon` → confirmation modale → bouton « Soumettre définitivement »
- [ ] Numéro de demande OASE-YYYY-NNNN attribué automatiquement
- [ ] Soumission définitive déclenche création du workflow d'instruction

---

## US-P1-04 — Suivre l'avancement d'une demande

| Champ | Valeur |
|---|---|
| **ID** | US-P1-04 |
| **Persona** | P1 |
| **Écran** | `/portail/demandes/:id` |
| **Endpoint** | `GET /api/v1/demandes/:id` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** consulter le détail d'une demande précise, **afin de** connaître son statut actuel, l'étape en cours et l'historique.

**Critères d'acceptation :**
- [ ] Header : n° demande, type de régime, date de dépôt, statut courant (badge)
- [ ] Timeline verticale des étapes du workflow avec date/acteur pour chaque transition
- [ ] Section « Pièces jointes » avec liste des fichiers uploadés (taille, type, date, hash SHA-256)
- [ ] Section « Commentaires / Demande de complément » si l'instructeur a demandé des infos
- [ ] Si demande rejetée → motif de rejet visible + lien vers procédure de recours
- [ ] Si demande validée → attestation téléchargeable + QR code de vérification

---

## US-P1-05 — Joindre une pièce justificative

| Champ | Valeur |
|---|---|
| **ID** | US-P1-05 |
| **Persona** | P1 |
| **Écran** | `/portail/demandes/:id` (section pièces) |
| **Endpoint** | `POST /api/v1/demandes/:id/pieces-jointes` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** téléverser les pièces justificatives demandées, **afin de** compléter mon dossier.

**Critères d'acceptation :**
- [ ] Drag & drop + sélecteur de fichier
- [ ] Formats acceptés : PDF, JPG, PNG, DOCX, XLSX (max 10 Mo par fichier)
- [ ] Calcul automatique du hash SHA-256 à l'upload
- [ ] Antivirus scan simulé avant stockage (rejet si positif)
- [ ] Affichage immédiat du fichier uploadé avec preview (image/PDF)
- [ ] Possibilité de supprimer un fichier tant que la demande n'est pas soumise
- [ ] Limite de 20 pièces par demande

---

## US-P1-06 — Consulter ses exonérations actives

| Champ | Valeur |
|---|---|
| **ID** | US-P1-06 |
| **Persona** | P1 |
| **Écran** | `/portail/exonerations` |
| **Endpoint** | `GET /api/v1/demandes?statut=validee&actif=true` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** voir la liste de mes exonérations en cours de validité, **afin de** savoir lesquelles je peux utiliser et quand elles expirent.

**Critères d'acceptation :**
- [ ] Tableau des exonérations actives : n° demande, type, base juridique, date début, date fin, montant plafond, solde consommé
- [ ] Tri par date d'expiration (ASC par défaut pour voir les urgentes en premier)
- [ ] Badge d'alerte si expiration < 30 jours
- [ ] Bouton « Demander le renouvellement » (pré-rempli avec les infos de l'exonération existante)
- [ ] Bouton « Télécharger l'attestation » (PDF + QR code)
- [ ] Filtre par année fiscale

---

## US-P1-07 — Recevoir une notification de changement de statut

| Champ | Valeur |
|---|---|
| **ID** | US-P1-07 |
| **Persona** | P1 |
| **Écran** | Cloche de notifications + email |
| **Endpoint** | `GET /api/v1/notifications`, `WS /ws/notifications` |
| **Priorité** | Moyenne |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** être notifié des changements importants sur mes demandes, **afin de** réagir rapidement (compléter un dossier, signer un acte, etc.).

**Critères d'acceptation :**
- [ ] Notification in-app (cloche) pour : demande validée, demande rejetée, demande de complément, expiration imminente
- [ ] Compteur non-lus visible sur la cloche
- [ ] WebSocket pour push temps réel
- [ ] Email envoyé en complément (SMTP configurable)
- [ ] Clic sur la notification → redirection vers l'écran concerné
- [ ] Possibilité de marquer comme lu / archiver

---

## US-P1-08 — Modifier son profil

| Champ | Valeur |
|---|---|
| **ID** | US-P1-08 |
| **Persona** | P1 |
| **Écran** | `/portail/profil` |
| **Endpoint** | `PATCH /api/v1/utilisateurs/me` |
| **Priorité** | Moyenne |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** mettre à jour mes informations de profil, **afin de** maintenir mon dossier à jour.

**Critères d'acceptation :**
- [ ] Modification : nom, prénom, téléphone, email secondaire (l'email principal n'est pas modifiable)
- [ ] Modification du mot de passe (avec saisie de l'ancien pour confirmation)
- [ ] Activation / désactivation de la MFA TOTP (avec QR code à scanner)
- [ ] Définition du PIN de signature 4-6 chiffres (avec confirmation)
- [ ] Historique des connexions (10 dernières avec IP, date, agent)
- [ ] Toutes les modifications sont journalisées dans `audit_logs`

---

## US-P1-09 — Signer un acte avec son PIN

| Champ | Valeur |
|---|---|
| **ID** | US-P1-09 |
| **Persona** | P1 |
| **Écran** | Modale de signature (déclenchée depuis `DemandeDetailView` ou `DecisionsView`) |
| **Endpoint** | `POST /api/v1/decisions/:id/actes`, `POST /api/v1/utilisateurs/me/verify-pin` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** signer électroniquement un acte en saisissant mon PIN, **afin de** valider une étape engageante (engagement de réalisation, acceptation d'attestation).

**Critères d'acceptation :**
- [ ] Modale de saisie du PIN (4-6 chiffres, masqué)
- [ ] 3 tentatives max avant verrouillage 5 min
- [ ] Signature horodatée et liée à l'utilisateur + acte + IP + agent
- [ ] Empreinte SHA-256 calculée et stockée dans `actes.signatureHash`
- [ ] PIN jamais transmis en clair dans les logs ou en base
- [ ] Confirmation visuelle post-signature (badge « Signé le XX/XX/XXXX à HH:MM »)

---

## US-P1-10 — Rechercher une demande dans l'historique

| Champ | Valeur |
|---|---|
| **ID** | US-P1-10 |
| **Persona** | P1 |
| **Écran** | `/portail/dashboard` (barre de recherche) |
| **Endpoint** | `GET /api/v1/demandes?q=...` |
| **Priorité** | Basse |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** retrouver rapidement une demande dans mon historique, **afin de** éviter de scroller indéfiniment.

**Critères d'acceptation :**
- [ ] Recherche full-text sur : n° demande, type de régime, base juridique, mot-clé commentaire
- [ ] Résultats paginés (20 par page)
- [ ] Recherche < 500 ms sur 10 000 demandes
- [ ] Highlight du terme recherché dans les résultats

---

## US-P1-11 — Exporter la liste de ses demandes

| Champ | Valeur |
|---|---|
| **ID** | US-P1-11 |
| **Persona** | P1 |
| **Écran** | `/portail/dashboard` (menu export) |
| **Endpoint** | `GET /api/v1/rapports/demandes?format=xlsx` |
| **Priorité** | Basse |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** exporter la liste de mes demandes au format Excel, **afin de** la transmettre à mon comptable ou la conserver dans mes archives.

**Critères d'acceptation :**
- [ ] Bouton « Exporter en Excel » dans le dashboard
- [ ] Fichier XLSX avec colonnes : n°, type, statut, date dépôt, date décision, montant, base juridique
- [ ] Nom de fichier : `oase_demandes_P1_<userId>_<YYYYMMDD>.xlsx`
- [ ] Génération côté serveur (pas côté client)
- [ ] Limite : 5 000 lignes max par export

---

## US-P1-12 — Répondre à une demande de complément

| Champ | Valeur |
|---|---|
| **ID** | US-P1-12 |
| **Persona** | P1 |
| **Écran** | `/portail/demandes/:id` (section commentaire instructeur) |
| **Endpoint** | `POST /api/v1/demandes/:id/commentaires` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** répondre à une demande de complément de l'instructeur, **afin de** débloquer l'instruction de mon dossier.

**Critères d'acceptation :**
- [ ] Zone de texte + possibilité d'attacher de nouvelles pièces
- [ ] Soumission crée un événement dans le workflow (statut `en_complement` → `depose`)
- [ ] Notification automatique à l'instructeur (email + in-app)
- [ ] Délai de réponse visible (« Vous avez 15 jours pour répondre »)
- [ ] Si non-réponse sous 30 jours → demande passe en `expiree` automatiquement

---

## US-P1-13 — Vérifier la validité d'une attestation via QR code

| Champ | Valeur |
|---|---|
| **ID** | US-P1-13 |
| **Persona** | P1 (partage avec tiers de confiance : douaniers, fournisseurs) |
| **Écran** | Page publique `/verifier/:hash` |
| **Endpoint** | `GET /api/v1/attestations/verifier/:hash` |
| **Priorité** | Moyenne |
| **Statut** | Implémenté (route publique, pas d'auth requise) |

**En tant que** tiers de confiance, **je veux** scanner le QR code d'une attestation OASE, **afin de** vérifier son authenticité.

**Critères d'acceptation :**
- [ ] Page publique sans authentification
- [ ] Affiche : n° attestation, nom bénéficiaire, type, date émission, date expiration, statut (valide / révoqué / expiré)
- [ ] Page d'avertissement si attestation révoquée
- [ ] Pas d'accès aux données sensibles du dossier
- [ ] Appel API journalisé (anti-fraude)

---

## US-P1-14 — Se déconnecter

| Champ | Valeur |
|---|---|
| **ID** | US-P1-14 |
| **Persona** | P1 |
| **Écran** | Menu utilisateur (toutes pages portail) |
| **Endpoint** | `POST /api/v1/auth/logout` |
| **Priorité** | Haute |
| **Statut** | Implémenté |

**En tant que** bénéficiaire, **je veux** me déconnecter de manière sécurisée, **afin de** protéger l'accès à mon compte sur un poste partagé.

**Critères d'acceptation :**
- [ ] Bouton « Déconnexion » dans le menu utilisateur
- [ ] Révoque le refresh token en base
- [ ] Supprime l'access token côté client (mémoire + localStorage)
- [ ] Redirection vers `/login`
- [ ] Échec de l'appel API = forcer la déconnexion côté client (filet de sécurité)

---

## US-P1-15 — Consulter l'aide contextuelle

| Champ | Valeur |
|---|---|
| **ID** | US-P1-15 |
| **Persona** | P1 |
| **Écran** | Toutes pages (icône `?`) |
| **Endpoint** | — (statique) |
| **Priorité** | Basse |
| **Statut** | À faire |

**En tant que** bénéficiaire, **je veux** accéder à une aide contextuelle, **afin de** comprendre les notions complexes (régimes fiscaux, types de pièces, etc.).

**Critères d'acceptation :**
- [ ] Icône `?` à côté de chaque libellé technique
- [ ] Tooltip explicatif (1-2 phrases)
- [ ] Lien « En savoir plus » vers une page de documentation
- [ ] Pas de popup bloquant

---

## Récapitulatif

| ID | Titre | Priorité | Statut |
|---|---|---|---|
| US-P1-01 | Connexion email + mot de passe | Haute | ✅ |
| US-P1-02 | Tableau de bord personnalisé | Haute | ✅ |
| US-P1-03 | Créer une demande d'exonération | Haute | ✅ |
| US-P1-04 | Suivre une demande | Haute | ✅ |
| US-P1-05 | Joindre une pièce justificative | Haute | ✅ |
| US-P1-06 | Consulter ses exonérations actives | Haute | ✅ |
| US-P1-07 | Recevoir une notification | Moyenne | ✅ |
| US-P1-08 | Modifier son profil | Moyenne | ✅ |
| US-P1-09 | Signer avec son PIN | Haute | ✅ |
| US-P1-10 | Rechercher dans l'historique | Basse | ✅ |
| US-P1-11 | Exporter en Excel | Basse | ✅ |
| US-P1-12 | Répondre à une demande de complément | Haute | ✅ |
| US-P1-13 | Vérifier une attestation via QR | Moyenne | ✅ |
| US-P1-14 | Se déconnecter | Haute | ✅ |
| US-P1-15 | Consulter l'aide contextuelle | Basse | 🚧 |

**Total : 15 user stories — 14 implémentées, 1 à finaliser (US-P1-15 aide contextuelle).**

---

*Document lié à OASE-32 — à mettre à jour si le persona P1 évolue.*
