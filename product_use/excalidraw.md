# Documentation Excalidraw - Usage

Excalidraw est un outil de tableau blanc virtuel (whiteboard) avec un rendu de style "dessin à main levée". Idéal pour les schémas rapides, les wireframes, ou les explications visuelles.

## Informations de connexion
- **URL** : `https://draw.ulia.site`
- **Serveur** : KVM 8 (`147.93.85.22`)
- **Sécurité** : Basic Auth activé via Traefik.
  - **Login** : `admin`
  - **Mot de passe** : `Passe12345!++`

## Usage API vs Interface Client
Tout comme Draw.io, Excalidraw est une application **côté client**. Elle n'offre pas d'API REST sur le serveur pour générer des images à partir de texte.

*Note : Si vous avez besoin de générer un rendu au style "Excalidraw" depuis un script ou une IA, vous devez utiliser l'API de **Kroki** avec le format `excalidraw`.*

## Intégration dans des applications
Excalidraw est conçu pour être facilement intégrable dans des applications web via son package npm officiel.

1. **Intégration React (Méthode officielle)** :
   Si vous développez un frontend en React (ex: Next.js), vous pouvez utiliser le composant `@excalidraw/excalidraw` pour l'embarquer nativement dans votre code sans passer par une iframe.

2. **Intégration via Iframe** :
   ```html
   <iframe src="https://admin:Passe12345!++@draw.ulia.site/" width="100%" height="800"></iframe>
   ```
   *Attention au Basic Auth qui peut bloquer l'affichage si le navigateur de l'utilisateur ne gère pas correctement les identifiants dans l'URL.*

## Sécurité et Iframe (Content Security Policy)
Si vous utilisez Excalidraw en direct sur `https://draw.ulia.site` et que vous essayez d'y insérer une URL externe (via l'outil "Intégration web" de l'interface), vous risquez de voir l'erreur :
> "Intégrer cet URL n'est actuellement pas autorisé..."

C'est une protection CSP (Content Security Policy) intégrée en dur dans le code source d'Excalidraw pour empêcher l'exécution de scripts malveillants (XSS). Seule une petite liste blanche (YouTube, Figma, Spotify, Github, etc.) est autorisée. Vous ne pouvez pas "embed" vos propres applications (comme Dify ou Chatwoot) à l'intérieur d'un dessin Excalidraw hébergé de cette manière.