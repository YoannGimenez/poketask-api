# PokéTask API

API REST pour un gestionnaire de tâches gamifiéeé avec un thème Pokémon. Les utilisateurs peuvent créer des tâches, gagner de l'expérience, débloquer des locations et capturer des Pokémon.

## 📋 Prérequis

### Logiciels requis

- **Node.js** (version 18 ou supérieure)
- **Docker** et **Docker Compose**
- **Git**

### Installation des prérequis

#### 1. Node.js
```bash
# Sur macOS avec Homebrew
brew install node

# Sur Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

#### 2. Docker
```bash
# Sur macOS avec Homebrew
brew install --cask docker

# Sur Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Vérifier l'installation
docker --version
docker-compose --version
```

## ��️ Installation

### 1. Cloner le projet
```bash
git clone <votre-repo-url>
cd poketask-api
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet suivant la structure suivante :

```env
# Configuration du serveur
PORT=3000
API_URL=http://localhost
NODE_ENV=development

# Configuration JWT
JWT_SECRET=votre-secret-jwt-super-securise

# Configuration PostgreSQL
POSTGRES_USER=poketask_user
POSTGRES_PASSWORD=votre-mot-de-passe-postgres
POSTGRES_DB=poketask_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://poketask_user:votre-mot-de-passe-postgres@localhost:5432/poketask_db

# Configuration MongoDB
MONGO_USER=poketask_user
MONGO_PASSWORD=votre-mot-de-passe-mongo
MONGO_DB=poketask_logs
MONGO_PORT=27017
MONGO_URL=mongodb://poketask_user:votre-mot-de-passe-mongo@localhost:27017/poketask_logs
```

### 4. Démarrer les bases de données avec Docker

```bash
# Démarrer les conteneurs PostgreSQL et MongoDB
docker-compose up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker ps
```

### 5. Configuration de la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations et peupler la base de données
npx prisma migrate dev
```

### 6. Démarrer l'API

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'API sera accessible sur `http://localhost:3000`

## 🧪 Tests

```bash
# Exécuter les tests en mode coverage
npx jest --coverage

```


## Documentation de l'API

### Endpoints principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérification du token

#### Tâches
- `GET /api/task/my-tasks` - Récupérer les tâches de l'utilisateur
- `POST /api/task` - Créer une tâche
- `PATCH /api/task/:id/complete` - Marquer une tâche comme complétée
- `PATCH /api/task/:id/edit` - Modifier une tâche
- `DELETE /api/task/:id/delete` - Supprimer une tâche

#### Locations
- `GET /api/location/my-locations` - Récupérer les locations débloquées
- `GET /api/location/:id/encounter` - Rencontrer un Pokémon

#### Pokémon
- `GET /api/pokemon/my-pokemons` - Récupérer la collection de Pokémon
- `POST /api/pokemon/:id/catch` - Capturer un Pokémon
- `GET /api/pokemon/starters` - Récupérer les Pokémon de départ
- `POST /api/pokemon/add-starter` - Ajouter un Pokémon de départ

#### Items
- `GET /api/item/my-items` - Récupérer les items de l'utilisateur

### Exemple d'utilisation

#### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dresseur123",
    "email": "dresseur@example.com",
    "password": "motdepasse123"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dresseur@example.com",
    "password": "motdepasse123"
  }'
```

#### Créer une tâche
```bash
curl -X POST http://localhost:3000/api/task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "title": "Faire du sport",
    "description": "30 minutes de course",
    "type": "DAILY",
    "difficulty": "NORMAL"
  }'
```