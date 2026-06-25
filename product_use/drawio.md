# Documentation Draw.io - Usage

Draw.io (diagrams.net) est une application web visuelle permettant de créer des diagrammes très avancés (réseaux, UML, architecture cloud, etc.).

## Informations de connexion
- **URL** : `https://drawio.ulia.site`
- **Serveur** : KVM 8 (`147.93.85.22`)
- **Sécurité** : Basic Auth activé via Traefik.
  - **Login** : `admin`
  - **Mot de passe** : `Passe12345!++`

## Usage API vs Interface Client
**Attention :** Contrairement à Kroki, Draw.io n'est **pas** une API REST de génération d'images. C'est une application côté client (Single Page Application). Tout le rendu se fait dans votre navigateur, pas sur le serveur.

Par conséquent, il n'y a pas d'API REST directe de type `POST /generate` pour convertir du texte en image depuis Python ou Dify.

## Comment l'utiliser avec vos applications
Si vous développez une application web (React, Vue, etc.) et que vous souhaitez intégrer l'éditeur Draw.io, vous devez utiliser leur protocole d'Iframe (Embed mode) :

1. **Intégration via Iframe** :
   ```html
   <iframe src="https://admin:Passe12345!++@drawio.ulia.site/?embed=1&ui=min&spin=1"></iframe>
   ```
   *(Notez l'inclusion du Basic Auth dans l'URL pour passer la sécurité de Traefik).*

2. **Communication avec l'Iframe (Javascript)** :
   Votre application mère communique avec l'iframe Draw.io via des `postMessage`.
   Vous pouvez envoyer du XML à Draw.io pour qu'il le dessine, ou demander à Draw.io de vous renvoyer le SVG/XML quand l'utilisateur a fini de dessiner.

## URL Parameters utiles
Vous pouvez modifier le comportement de Draw.io en ajoutant des paramètres à l'URL :
- `?ui=min` : Interface minimaliste
- `?ui=dark` : Force le mode sombre
- `?lang=fr` : Force la langue française
- `?url=https://mon-site.com/mon-schema.xml` : Demande à Draw.io de charger automatiquement ce fichier au démarrage (attention au Basic Auth qui peut bloquer les requêtes externes non authentifiées).