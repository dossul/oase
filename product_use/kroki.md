# Documentation Kroki - Usage & API

Kroki est une API qui permet de générer des diagrammes (architecture, flux, séquences) à partir de texte brut (Diagram-as-Code).
Contrairement à d'autres outils, Kroki n'a pas d'interface graphique de dessin. Il est pensé pour être intégré dans des scripts, des CI/CD, ou utilisé par des agents IA.

## Informations de connexion
- **URL** : `https://kroki.ulia.site`
- **Serveur** : KVM 8 (`147.93.85.22`)
- **Sécurité** : Basic Auth activé via Traefik.
  - **Login** : `admin`
  - **Mot de passe** : `Passe12345!++`

## Usage API (POST)
C'est la méthode recommandée pour une utilisation via script ou agent IA. Vous envoyez un payload JSON contenant le code source de votre diagramme et le format de sortie souhaité.

### Exemple de requête Python
```python
import requests

url = "https://kroki.ulia.site/"
auth = ('admin', 'Passe12345!++')

# Payload JSON
payload = {
    "diagram_source": "graph TD\n  A --> B",
    "diagram_type": "mermaid", # ex: mermaid, plantuml, structurizr, excalidraw...
    "output_format": "png"     # ex: svg, png, pdf
}

response = requests.post(url, json=payload, auth=auth)

if response.status_code == 200:
    with open("diagram.png", "wb") as f:
        f.write(response.content)
```

## Langages supportés (diagram_type)
Kroki supporte nativement des dizaines de langages :
- `mermaid` (Recommandé pour sa simplicité et son utilisation fréquente par les LLMs)
- `plantuml` (Idéal pour les diagrammes de classe, cas d'utilisation UML)
- `structurizr` (Modèle C4 pour l'architecture logicielle)
- `excalidraw` (Format JSON d'Excalidraw pour un rendu style "dessin à main levée")
- `graphviz` / `dot` (Réseaux complexes)

## Utilisation en tant qu'Outil Dify (MCP)
Pour utiliser Kroki avec vos agents Dify, créez un outil HTTP personnalisé dans Dify :
1. **Endpoint** : `POST https://kroki.ulia.site`
2. **Auth** : Basic Auth (`admin` / `Passe12345!++`)
3. **Body (JSON)** :
   ```json
   {
       "diagram_source": "{{diagram_code}}",
       "diagram_type": "mermaid",
       "output_format": "png"
   }
   ```
4. Configurez l'agent pour qu'il génère d'abord le texte Mermaid avant d'appeler cet outil.