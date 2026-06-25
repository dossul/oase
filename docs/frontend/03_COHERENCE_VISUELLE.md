# OASE-29 — Cohérence visuelle et ergonomique

> **Issue Plane :** OASE-29  
> **Date :** 2026-06-16  
> **Source :** maquette Vue 3 + `comprehension/01_ARCHITECTURE.md`

---

## 1. Système de design

### Palette de couleurs

| Token | Couleur | Usage |
|---|---|---|
| `--color-primary` | `#2563EB` (bleu MEF) | CTA principaux, liens, focus ring |
| `--color-primary-dark` | `#1D4ED8` | Hover boutons primaires |
| `--color-secondary` | `#0F172A` | Textes principaux, titres |
| `--color-success` | `#16A34A` | Statut "approuvé", badge conforme, étape validée |
| `--color-warning` | `#D97706` | Quota 80%, délai proche, statut "action_requise" |
| `--color-danger` | `#DC2626` | Quota épuisé, rejet, erreur, anomalie critique |
| `--color-info` | `#0EA5E9` | Statut "en_instruction", information neutre |
| `--color-muted` | `#6B7280` | Labels secondaires, textes désactivés |
| `--color-surface` | `#F8FAFC` | Fond général |
| `--color-card` | `#FFFFFF` | Cards, modals |
| `--color-border` | `#E2E8F0` | Séparateurs, bordures inputs |

### Typographie

| Usage | Font | Taille | Poids |
|---|---|---|---|
| Titre page H1 | Inter | 24px | 700 |
| Titre section H2 | Inter | 18px | 600 |
| Sous-titre H3 | Inter | 16px | 600 |
| Corps texte | Inter | 14px | 400 |
| Label formulaire | Inter | 13px | 500 |
| Aide / caption | Inter | 12px | 400 |
| Référence (monospace) | JetBrains Mono | 13px | 500 |

### Espacement (base 4px)

| Token | Valeur | Usage |
|---|---|---|
| `space-1` | 4px | Padding interne minimal |
| `space-2` | 8px | Gap inter-éléments |
| `space-3` | 12px | Padding cards compact |
| `space-4` | 16px | Padding cards standard |
| `space-6` | 24px | Espacement sections |
| `space-8` | 32px | Marges de page |

---

## 2. Composants transversaux

### Badges de statut demande

| Statut | Couleur | Icône |
|---|---|---|
| `brouillon` | Gris | `📝 Brouillon` |
| `soumis` | Bleu clair | `📨 Soumis` |
| `en_instruction` | Bleu | `🔄 En instruction` |
| `action_requise` | Orange | `⚠️ Action requise` |
| `approuve` | Vert | `✅ Approuvé` |
| `rejete` | Rouge | `❌ Rejeté` |
| `expire` | Gris foncé | `⏰ Expiré` |
| `archive` | Gris | `📁 Archivé` |

### Badges de statut fiscal (OTR)

| Statut | Couleur | Texte |
|---|---|---|
| `conforme` | Vert | `Statut fiscal conforme` |
| `dette_active` | Rouge | `Dette fiscale active — dépôt bloqué` |
| `inconnu` | Orange | `Statut non vérifié` |

### Indicateur circuit breaker (P7)

| État | Couleur | Point |
|---|---|---|
| `actif` / closed | Vert | ● Actif |
| `erreur` / open | Rouge | ● Hors ligne |
| `maintenance` | Orange | ● Maintenance |
| `half_open` | Jaune | ● Récupération |

---

## 3. Layout par espace

### P1 Bénéficiaire — Layout minimal

```
┌──── Header (Logo MEF + Nom Utilisateur + Déconnexion) ────┐
│                                                             │
│  ┌── Sidebar compact ──┐  ┌─── Contenu principal ────────┐ │
│  │ • Accueil           │  │                               │ │
│  │ • Mes demandes      │  │  [Contenu vue courante]       │ │
│  │ • Nouvelle demande  │  │                               │ │
│  │ • Mon profil        │  │                               │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### P2/P4 Backoffice — Layout dense

```
┌── Header (Logo + Utilisateur + Rôle badge + Institution) ──┐
│                                                              │
│ ┌── Sidebar navigation ──┐  ┌── Contenu + breadcrumb ─────┐ │
│ │ Dashboard              │  │  Page > Sous-page           │ │
│ │ File d'instruction [8] │  │                             │ │
│ │ Bases juridiques       │  │  [DataTable / Form / Detail] │ │
│ │ Quotas       [!]       │  │                             │ │
│ │ Anomalies    [3]       │  │                             │ │
│ │ Conventions            │  │                             │ │
│ │ Audit log              │  │                             │ │
│ └────────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Règles d'ergonomie critiques

### Formulaires
- Tous les champs obligatoires : label suffixé `*` en rouge
- Validation inline (pas de scroll-to-error) : message sous le champ en rouge `text-danger`
- Bouton Soumettre désactivé tant que le formulaire est invalide
- Spinner sur le bouton Soumettre pendant la requête (prevent double-submit)
- Message de confirmation visuel 3s après succès (toast vert)

### Tableaux de données
- Ligne hover : fond `#F1F5F9`
- Tri par clic sur en-tête de colonne (indicateur ▲/▼)
- Pagination : 20 items par page par défaut, sélecteur 10/20/50
- Filtre actif : badge bleu sur le bouton filtre + nb de filtres actifs

### Actions destructives
- Bouton Rejeter : couleur `--color-danger`, confirmation modal avant exécution
- Confirmation modal : répéter l'action en texte "Confirmer le rejet de OASE-2024-000002"
- Pas de suppression définitive sans double confirmation (soft delete)

### Accessibilité
- Focus visible sur tous les éléments interactifs (ring bleu `2px`)
- Contraste texte/fond : minimum 4.5:1 (WCAG AA)
- ARIA labels sur tous les boutons icône
- Navigation clavier complète (Tab, Enter, Escape)

---

## 5. Problèmes identifiés dans la maquette (GAP V2)

| Problème | Sévérité | Recommandation |
|---|---|---|
| Pas de gestion de l'état "action_requise" dans la liste P1 | Haute | Ajouter badge orange + lien direct vers l'action |
| Pas de visualisation du workflow en cours (étapes) sur B-03 | Haute | Stepper horizontal avec étapes validées/en cours |
| Quota non affiché lors de la sélection de base juridique (B-04) | Moyenne | Afficher jauge quota restant lors de la sélection |
| Montant FCFA sans formatage milliers | Faible | `Intl.NumberFormat('fr-FR')` |
| Pas de confirmation après upload pièce jointe | Faible | Toast + nom fichier dans liste uploadée |
| MFA : pas de lien "Je n'ai plus mon téléphone" | Moyenne | Renvoyer vers admin pour reset MFA |

---

*Livrable OASE-29 — Cohérence visuelle et ergonomique.*
