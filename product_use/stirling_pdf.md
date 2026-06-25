# Documentation Stirling PDF - Accès & Usage

Stirling PDF est une suite open-source complète de manipulation de fichiers PDF (OCR, fusion, découpe, conversion, compression, etc.), auto-hébergée sur notre infrastructure.

## Informations de connexion

- **URL** : `https://pdf.ulia.site`
- **Serveur** : KVM 8 (`147.93.85.22`)
- **Sécurité** : API Key obligatoire pour l'accès API REST.
  - **API Key** : `6448aa81-0943-49d6-b3ee-165b9e8ec5c4`

## Interface Web

L'interface web est accessible directement via le navigateur à l'adresse `https://pdf.ulia.site`. Elle propose un catalogue visuel de toutes les opérations disponibles (OCR, fusion, rotation, compression, conversion, signature, etc.) sans écrire une seule ligne de code.

### Fonctionnalités principales (interface)

| Catégorie | Opérations |
|---|---|
| **OCR** | Reconnaissance de texte (français, anglais), sidecar text, force-OCR |
| **Fusion / Découpe** | Fusionner plusieurs PDF, extraire des pages, scinder par intervalle |
| **Conversion** | PDF → Word, PDF → Images, Images → PDF, HTML → PDF |
| **Sécurité** | Ajouter/supprimer mot de passe, permissions, signature numérique |
| **Optimisation** | Compression, suppression de métadonnées, redressement (deskew) |
| **Formulaires** | Remplissage, extraction de champs, aplatissement |
| **Organisation** | Rotation, réordonnancement, suppression de pages blanches |

## Usage API REST

L'API REST permet d'automatiser les opérations depuis Python ou tout autre langage. L'authentification se fait via le header `X-API-KEY`.

### Endpoint principal — OCR avec sidecar

C'est l'endpoint le plus utilisé dans notre projet OASE pour extraire du texte exploitable à partir de PDF scannés.

**URL** : `POST /api/v1/misc/ocr-pdf`

**Headers** :
```
X-API-KEY: 6448aa81-0943-49d6-b3ee-165b9e8ec5c4
```

**Paramètres (multipart/form-data)** :

| Paramètre | Valeur | Description |
|---|---|---|
| `fileInput` | `(fichier PDF)` | Le PDF source à traiter |
| `languages` | `fra`, `eng` | Langues de reconnaissance (peut être envoyé plusieurs fois) |
| `ocrType` | `force-ocr` | Force l'OCR même si le PDF contient déjà du texte |
| `ocrRenderType` | `hocr` | Type de rendu OCR (hOCR recommandé) |
| `deskew` | `true` | Redresse les pages inclinées |
| `clean` | `true` | Nettoie le bruit de fond avant OCR |
| `cleanFinal` | `true` | Nettoie le rendu final |
| `sidecar` | `true` | Génère un fichier texte sidecar (.txt) en plus du PDF OCR |

**Réponse** : Un fichier `.zip` contenant :
- Le PDF avec couche OCR intégrée (`.pdf`)
- Le fichier texte sidecar (`.txt`) avec le texte extrait, pages séparées par `\f`

### Exemple Python minimal

```python
import requests

url = "https://pdf.ulia.site/api/v1/misc/ocr-pdf"
headers = {"X-API-KEY": "6448aa81-0943-49d6-b3ee-165b9e8ec5c4"}

with open("mon_document.pdf", "rb") as f:
    response = requests.post(
        url,
        headers=headers,
        files={"fileInput": ("mon_document.pdf", f, "application/pdf")},
        data=[
            ("languages", "fra"),
            ("languages", "eng"),
            ("ocrType", "force-ocr"),
            ("ocrRenderType", "hocr"),
            ("deskew", "true"),
            ("clean", "true"),
            ("cleanFinal", "true"),
            ("sidecar", "true"),
        ],
        timeout=900,
    )

# La réponse est un ZIP contenant le PDF OCR + le fichier texte sidecar
with open("resultat.zip", "wb") as out:
    out.write(response.content)
```

### Autres endpoints utiles

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/v1/misc/ocr-pdf` | POST | OCR complet avec sidecar |
| `/api/v1/general/merge-pdfs` | POST | Fusion de plusieurs PDF |
| `/api/v1/general/split-pages` | POST | Découpe par page ou intervalle |
| `/api/v1/convert/pdf-to-img` | POST | Conversion PDF → Images |
| `/api/v1/convert/img-to-pdf` | POST | Conversion Images → PDF |
| `/api/v1/security/add-password` | POST | Ajout de mot de passe |
| `/api/v1/security/remove-password` | POST | Suppression de mot de passe |
| `/api/v1/misc/compress-pdf` | POST | Compression du fichier |
| `/api/v1/misc/auto-rename` | POST | Renommage automatique basé sur le contenu |

> **Documentation Swagger complète** : `https://pdf.ulia.site/swagger-ui/index.html`

## Script d'automatisation OASE

Un script Python complet existe pour traiter en masse les PDF du projet OASE :

- **Script** : `c:\wamp64\www\oase\pscript\stirling_reprocess_a_verifier.py`
- **Source des PDF** : `c:\wamp64\www\oase\kb\donnee_collecte`
- **Sorties OCR** : `c:\wamp64\www\oase\kb\donnee_collecte_extracted\stirling_api\`
- **Registre** : `REGISTRE_STIRLING_API.json` / `REGISTRE_STIRLING_API.md`

### Lancer le traitement en masse

```bash
# Traiter tous les documents A_VERIFIER
python pscript\stirling_reprocess_a_verifier.py

# Traiter un seul PDF spécifique
python pscript\stirling_reprocess_a_verifier.py --source-file "chemin\vers\document.pdf"

# Limiter à 5 documents
python pscript\stirling_reprocess_a_verifier.py --limit 5

# Forcer le retraitement même si déjà fait
python pscript\stirling_reprocess_a_verifier.py --force
```

### Pipeline de traitement

```
PDF source → Stirling API (OCR + sidecar) → ZIP → Extraction → .pdf OCR + .txt → Markdown structuré
```

Le script produit pour chaque document :
1. `{nom}_ocr.pdf` — PDF avec couche de texte OCR
2. `{nom}_ocr.txt` — Texte brut extrait (pages séparées par `\f`)
3. `{nom}_sidecar.md` — Markdown structuré avec en-têtes par page

## Points de vigilance

- **Timeout** : Les gros PDF (>100 pages) peuvent prendre plusieurs minutes. Le timeout par défaut est de **900 secondes** (15 min).
- **Taille maximale** : Dépend de la configuration serveur, généralement jusqu'à 100 Mo par fichier.
- **Langues** : Toujours spécifier `fra` ET `eng` pour les documents bilingues ou contenant des termes techniques anglais.
- **Chemins Windows** : Le script gère les chemins longs et les caractères spéciaux (accents, espaces) via un système de slugification.
- **Retry** : Le script effectue automatiquement jusqu'à 3 tentatives en cas d'erreur réseau (`ChunkedEncodingError`).
