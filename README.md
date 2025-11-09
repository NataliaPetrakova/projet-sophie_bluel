# Portfolio-architecte-sophie-bluel

Code du projet 6 d'intégrateur web.

## Architecture

Ce repo git contient les 2 briques logicielles du projet
- Frontend
- Backend

## Pour lancer le code

### Backend
Ouvrir le dossier Backend et lire le README.md

### Frontend
Ouvrir le dossier Frontend et lancer liveserver de votre IDE

## Astuce

Si vous désirez afficher le code du backend et du frontend, faites le dans 2 instances de VSCode différentes pour éviter tout problème

---

## Description du projet

Projet de création d'un site portfolio dynamique pour une architecte d'intérieur.

### Fonctionnalités principales

- **Galerie de projets dynamique** : Affichage des travaux récupérés depuis une API
- **Filtrage par catégorie** : Possibilité de filtrer les projets par catégorie
- **Authentification** : Système de connexion administrateur
- **Mode édition** : Interface d'administration avec :
  - Ajout de nouveaux projets
  - Suppression de projets existants
  - Gestion des catégories

### Technologies utilisées

- **Frontend** :
  - HTML5
  - CSS3
  - JavaScript 
  - Fetch API pour les appels HTTP

- **Backend** :
  - Node.js
  - Express
  - SQLite

### Installation et lancement

#### Prérequis
- Node.js (version 14 ou supérieure)
- Un navigateur web moderne
- Un éditeur de code (VS Code recommandé)

#### Étapes d'installation

1. **Cloner le repository**
```bash
   git clone [url-du-repo]
   cd Portfolio-architecte-sophie-bluel
```

2. **Lancer le Backend**
```bash
   cd Backend
   npm install
   npm start
```
   Le serveur démarre sur `http://localhost:5678`

3. **Lancer le Frontend**
   - Ouvrir le dossier `FrontEnd` dans VS Code
   - Lancer Live Server
   - Ou ouvrir directement `index.html` dans un navigateur

### Utilisation

#### Mode visiteur
- Accès à la galerie complète des projets
- Filtrage par catégorie (Tous, Objets, Appartements, Hôtels & restaurants)

#### Mode administrateur
1. Se connecter via la page de login
   - Email : `sophie.bluel@test.tld`
   - Mot de passe : `S0phie`
2. Accéder au mode édition
3. Gérer les projets (ajout/suppression)

### Structure du projet
```
Portfolio-architecte-sophie-bluel/
│
├── Backend/              # Serveur Node.js + API
│   ├── database.sqlite   # Base de données
│   └── ...
│
└── FrontEnd/             # Application cliente
    ├── assets/
    │   ├── icons/        # Icônes
    │   ├── images/       # Images des projets
    │   ├── style.css     # Styles CSS
    │   ├── script.js     # JavaScript principal
    │   └── login.js      # Gestion de la connexion
    ├── index.html        # Page d'accueil
    └── login.html        # Page de connexion
```

### API Endpoints

- `GET /api/works` - Récupère tous les projets
- `GET /api/categories` - Récupère toutes les catégories
- `POST /api/users/login` - Authentification
- `POST /api/works` - Ajoute un nouveau projet (authentification requise)
- `DELETE /api/works/:id` - Supprime un projet (authentification requise)

### Points d'attention

- L'URL de l'API est centralisée dans une constante `API_URL`
- Le token d'authentification est stocké dans `sessionStorage` (expire à la fermeture du navigateur)
- Validation des formulaires côté client avant envoi à l'API


---

## Auteur

PETRAKOVA Natalia - Projet OpenClassrooms

## Licence

OpenClassrooms