# OASE-32 à 38 — User Stories par persona

> **Issues Plane :** OASE-32 (P1), OASE-33 (P2), OASE-34 (P3), OASE-35 (P4), OASE-36 (P5), OASE-37 (P6), OASE-38 (P7)  
> **Date :** 2026-06-16  
> **Format :** En tant que [persona], je veux [action] afin de [bénéfice]. Critères d'acceptance : …

---

## P1 — Opérateur économique (Bénéficiaire)

### US-P1-01 · Créer mon profil bénéficiaire
**En tant qu'** opérateur économique,  
**je veux** créer mon profil avec mon NIF et RCCM,  
**afin de** pouvoir déposer des demandes d'exonération.

**Critères d'acceptance :**
- Le formulaire valide le format NIF `TG-XXX-YYYY-X-NNNN`
- Un NIF déjà enregistré retourne l'erreur `NIF_DEJA_UTILISE`
- Après création, je suis redirigé vers mon dashboard

### US-P1-02 · Consulter mon statut fiscal OTR
**En tant qu'** opérateur économique,  
**je veux** voir mon statut fiscal en temps réel sur mon profil,  
**afin de** savoir si je suis éligible à déposer une demande.

**Critères d'acceptance :**
- Badge vert "Conforme" si aucune dette
- Badge rouge "Dette active" avec montant si dette connue dans E-TAX
- Bouton "Mettre à jour" re-interroge E-TAX (max 1 fois / 5 min)

### US-P1-03 · Sélectionner une base juridique pour ma demande
**En tant qu'** opérateur économique,  
**je veux** rechercher et choisir la mesure d'exonération applicable,  
**afin de** déposer une demande conforme.

**Critères d'acceptance :**
- Recherche full-text sur libellé et référence article
- Filtres fonctionnels : type impôt, nature mesure
- Quota restant affiché lors de la sélection
- Mesure inactive → message explicatif + suggestion alternative si disponible

### US-P1-04 · Déposer une demande d'exonération
**En tant qu'** opérateur économique,  
**je veux** soumettre un dossier complet en 3 étapes,  
**afin d'** obtenir une décision formelle avec attestation.

**Critères d'acceptance :**
- Tunnel 3 étapes avec barre de progression
- Pièces rang 1 manquantes : liste précise des documents requis
- Brouillon sauvegardé automatiquement toutes les 2 min
- Confirmation de soumission : référence OASE affichée + email envoyé

### US-P1-05 · Suivre l'avancement de mes demandes
**En tant qu'** opérateur économique,  
**je veux** voir l'état de chaque demande avec l'étape en cours,  
**afin de** savoir où en est l'instruction.

**Critères d'acceptance :**
- Liste avec badge statut couleur
- Détail : stepper des étapes workflow (validées / en cours / en attente)
- Notification email à chaque changement de statut

### US-P1-06 · Répondre à une demande de complément
**En tant qu'** opérateur économique,  
**je veux** uploader de nouveaux documents suite à une demande de complément,  
**afin de** débloquer l'instruction de mon dossier.

**Critères d'acceptance :**
- Motif du complément clairement affiché
- Upload multiple accepté
- Après envoi : statut revient à "en_instruction", notification instructeur

### US-P1-07 · Télécharger mon attestation d'exonération
**En tant qu'** opérateur économique,  
**je veux** télécharger l'attestation PDF officielle avec QR Code,  
**afin de** la présenter à la douane ou à l'administration fiscale.

**Critères d'acceptance :**
- Bouton "Télécharger attestation" visible uniquement si statut = approuvé
- PDF généré côté serveur avec logo MEF, signature numérique, QR code
- URL signée S3 valable 15 min

---

## P2 — Agent instructeur (OTR-CI / OTR-CDDI / DGBF)

### US-P2-01 · Voir la file d'instruction de mon organe
**En tant qu'** agent instructeur,  
**je veux** voir uniquement les demandes relevant de mon organe de gestion,  
**afin de** traiter les dossiers de ma compétence.

**Critères d'acceptance :**
- RLS appliqué : agent OTR-CI ne voit que les demandes CGI/IRPP/IS/TVA
- Tri par date de dépôt (plus ancien en premier par défaut)
- Badge compteur sur item de menu

### US-P2-02 · Prendre en charge un dossier
**En tant qu'** agent instructeur,  
**je veux** m'affecter un dossier pour l'instruire,  
**afin d'** éviter les doublons d'instruction.

**Critères d'acceptance :**
- Bouton "Prendre en charge" visible seulement si statut = soumis
- Une demande déjà prise en charge retourne `DEMANDE_DEJA_PRISE_EN_CHARGE`
- Mon nom apparaît comme instructeur dans le dossier

### US-P2-03 · Visionner les pièces jointes d'un dossier
**En tant qu'** agent instructeur,  
**je veux** consulter toutes les pièces jointes directement dans l'interface,  
**afin de** vérifier la conformité sans télécharger chaque fichier.

**Critères d'acceptance :**
- Visionneuse PDF intégrée (iFrame ou PDF.js)
- Miniature JPEG/PNG affichée
- Hash SHA-256 affiché pour contrôle d'intégrité
- Bouton "Valider" ou "Rejeter" la pièce individuellement

### US-P2-04 · Valider une étape du workflow
**En tant qu'** agent instructeur,  
**je veux** valider l'étape du workflow qui me revient,  
**afin de** faire avancer le dossier vers la prochaine étape.

**Critères d'acceptance :**
- Saisie du PIN obligatoire (signature électronique)
- Commentaire optionnel conservé dans l'audit log
- Étape suivante activée automatiquement (notification au prochain responsable)

### US-P2-05 · Demander un complément au bénéficiaire
**En tant qu'** agent instructeur,  
**je veux** envoyer une demande de complément motivée,  
**afin d'** obtenir les pièces manquantes ou insuffisantes.

**Critères d'acceptance :**
- Motif obligatoire (min 20 caractères)
- Demande passe en "action_requise" + notification P1
- Historique de la demande de complément visible dans le dossier

### US-P2-06 · Approuver ou rejeter un dossier
**En tant que** décideur (rôle decideur / admin_mef),  
**je veux** prendre une décision finale sur un dossier complet,  
**afin d'** émettre l'attestation officielle ou de notifier le refus.

**Critères d'acceptance :**
- Toutes les étapes workflow doivent être validées
- PIN obligatoire
- Approbation : attestation PDF générée, quota mis à jour, SI notifiés
- Rejet : motif obligatoire, notification P1 avec motif

---

## P3 — Agence de promotion (API, ZATP, SAZOF, CSFM)

### US-P3-01 · Consulter les demandes de mon périmètre
**En tant qu'** agent d'agence,  
**je veux** voir uniquement les demandes liées aux investissements / zones de mon périmètre,  
**afin de** piloter mon activité de promotion.

### US-P3-02 · Instruire les demandes relevant de mon agence
**En tant qu'** agent d'agence,  
**je veux** valider les étapes workflow qui relèvent de mon agence,  
**afin d'** apposer le visa de mon institution sur le dossier.

### US-P3-03 · Générer un rapport mensuel de mon agence
**En tant qu'** directeur d'agence,  
**je veux** exporter un rapport PDF ou Excel des dépenses fiscales de mon périmètre,  
**afin de** rendre compte à ma tutelle.

---

## P4 — Décideur stratégique (UPF, DGTCP, MEF)

### US-P4-01 · Consulter les KPIs fiscaux en temps réel
**En tant que** décideur stratégique,  
**je veux** voir un tableau de bord consolidé des dépenses fiscales,  
**afin d'** apprécier l'impact budgétaire des exonérations.

**Critères d'acceptance :**
- Montant total approuvé en FCFA (formaté avec séparateurs)
- Taux d'approbation, délai moyen traitement
- Graphique tendance sur 12 mois
- Filtre par exercice budgétaire

### US-P4-02 · Surveiller la consommation des quotas
**En tant que** décideur stratégique,  
**je veux** voir les quotas de toutes les mesures avec alertes visuelles,  
**afin de** prévenir les dépassements budgétaires.

**Critères d'acceptance :**
- Barre rouge si > 80%
- Barre critique si = 100% (bloquant)
- Notification automatique à 80% et 100%

### US-P4-03 · Produire le Rapport sur les Mesures d'Exonération (RME)
**En tant que** directeur UPF,  
**je veux** générer le rapport annuel officiel des dépenses fiscales,  
**afin de** le soumettre à l'Assemblée Nationale et aux partenaires (FMI, Banque Mondiale).

---

## P5 — Corps de contrôle (IGF, Cour des Comptes)

### US-P5-01 · Auditer le journal des actions sensibles
**En tant qu'** auditeur,  
**je veux** consulter l'intégralité du journal d'audit avec possibilité de vérifier l'intégrité de la chaîne SHA-256,  
**afin de** détecter toute manipulation des données.

**Critères d'acceptance :**
- Bouton "Vérifier l'intégrité" → retourne nb entrées vérifiées et 0 rupture
- Export CSV signé disponible
- Aucune action de modification possible (lecture seule)

### US-P5-02 · Analyser les anomalies détectées
**En tant qu'** auditeur,  
**je veux** consulter les anomalies par gravité et catégorie,  
**afin d'** identifier les risques de fraude ou de non-conformité.

---

## P6 — Portail public (Citoyen)

### US-P6-01 · Consulter les statistiques nationales des exonérations
**En tant que** citoyen,  
**je veux** accéder aux statistiques anonymisées des dépenses fiscales,  
**afin de** m'informer sur l'usage des ressources fiscales publiques.

**Critères d'acceptance :**
- Aucune authentification requise
- Données anonymisées (pas de noms de bénéficiaires)
- Mise à jour automatique quotidienne

### US-P6-02 · Vérifier l'authenticité d'une attestation
**En tant que** douanier ou agent fiscal,  
**je veux** scanner le QR Code d'une attestation pour vérifier son authenticité,  
**afin de** lutter contre les fraudes aux fausses attestations.

**Critères d'acceptance :**
- Hash QR saisie manuelle ou scan caméra (mobile-friendly)
- Résultat < 2 secondes
- Retourne : référence, date décision, type mesure, statut actuel

---

## P7 — Administrateur système

### US-P7-01 · Gérer les utilisateurs et leurs rôles
**En tant qu'** administrateur SI,  
**je veux** créer, modifier et désactiver les comptes utilisateurs,  
**afin de** contrôler les accès au système OASE.

**Critères d'acceptance :**
- Création : email d'activation automatique envoyé
- Désactivation : sessions actives révoquées immédiatement
- Impossible de supprimer le dernier administrateur (`DERNIER_ADMIN`)

### US-P7-02 · Réinitialiser le MFA d'un utilisateur
**En tant qu'** administrateur SI,  
**je veux** régénérer le secret TOTP d'un utilisateur qui a perdu son téléphone,  
**afin de** lui redonner accès au système de manière sécurisée.

**Critères d'acceptance :**
- QR Code retourné pour re-scan immédiat
- Ancien secret invalidé instantanément
- Événement `MFA_REINITIALISE` tracé dans l'audit log

### US-P7-03 · Importer le référentiel MRD
**En tant qu'** administrateur SI,  
**je veux** importer le fichier MRD (CSV/JSON) mis à jour par la DGBF,  
**afin de** maintenir le référentiel à jour sans intervention manuelle.

**Critères d'acceptance :**
- Upload fichier + aperçu 10 premières lignes avant import
- Import en arrière-plan (job asynchrone)
- Rapport final : nb importées, ignorées (SCD T2), erreurs
- Aucune mesure existante supprimée (SCD T2 = nouvelles versions uniquement)

### US-P7-04 · Surveiller l'état des connecteurs SI
**En tant qu'** administrateur SI,  
**je veux** voir le statut temps réel de chaque connecteur avec le Circuit Breaker,  
**afin de** détecter et traiter rapidement les pannes d'interopérabilité.

**Critères d'acceptance :**
- Vue rafraîchie toutes les 60s
- Bouton "Forcer maintenance" pour GUDEF / DAS lors des interventions programmées
- Alerte visuelle (badge rouge) si un connecteur est en état `open`
