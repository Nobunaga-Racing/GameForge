# 🎮 GameForge — Game Server Manager

Application web locale pour créer, configurer et gérer des serveurs de jeux vidéo dédiés.

## ✅ Prérequis

- **Node.js** v18 ou supérieur → https://nodejs.org
- **SteamCMD** (pour les jeux Steam) → voir section ci-dessous
- **OS** : Linux recommandé (Windows supporté en mode simulation)

## 🚀 Installation

```bash
# 1. Décompresser l'archive et entrer dans le dossier
cd gameforge

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement (optionnel)
cp .env.example .env
# Editer .env selon vos besoins

# 4. Démarrer le serveur
npm start
```

Ouvrir ensuite **http://localhost:3000** dans le navigateur.

**Identifiants par défaut :** `admin` / `admin`  
⚠️ Changer le mot de passe en production !

## 📦 Installation de SteamCMD (Linux)

```bash
# Ubuntu/Debian
sudo add-apt-repository multiverse
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install steamcmd

# Le chemin sera : /usr/games/steamcmd
# Mettre à jour .env : STEAMCMD_PATH=/usr/games/steamcmd
```

## 🎮 Jeux supportés

| Jeu | AppID Steam | Port défaut | Max joueurs |
|-----|-------------|-------------|-------------|
| ARK: Survival Evolved | 376030 | 7777 | 70 |
| Valheim | 896660 | 2456 | 10 |
| Satisfactory | 1690800 | 7777 | 4 |
| DayZ | 223350 | 2302 | 60 |
| Arma 3 | 233780 | 2302 | 40 |
| Enshrouded | 2278520 | 15636 | 16 |
| Euro Truck Simulator 2 | 1948160 | 27015 | 8 |
| American Truck Simulator | 2239530 | 27015 | 8 |
| Farming Simulator 25 | 2300320 | 10823 | 16 |
| Icarus | 2089820 | 17777 | 8 |
| Space Engineers | 298740 | 27016 | 16 |
| Wreckfest | 870530 | 33540 | 24 |
| Minecraft | (non-Steam) | 25565 | 20 |
| Dune: Awakening | (à venir) | 7777 | 40 |

## 📡 API REST

### Authentification
```
POST /api/auth/login          { username, password }  → { token, user }
GET  /api/auth/me             (auth) → user info
POST /api/auth/users          (superadmin) → créer utilisateur
GET  /api/auth/users          (superadmin) → lister utilisateurs
```

### Serveurs
```
GET    /api/servers           → liste tous les serveurs + métriques
GET    /api/servers/:id       → détails + logs + métriques
POST   /api/servers           → créer un serveur
PATCH  /api/servers/:id       → modifier la configuration
DELETE /api/servers/:id       → supprimer

POST   /api/servers/:id/install   → installer via SteamCMD
POST   /api/servers/:id/start     → démarrer
POST   /api/servers/:id/stop      → arrêter
POST   /api/servers/:id/restart   → redémarrer
POST   /api/servers/:id/command   { command } → envoyer commande console
POST   /api/servers/:id/backup    { label } → créer backup
GET    /api/servers/:id/logs      ?limit=100 → logs
GET    /api/servers/:id/metrics   → CPU/RAM/joueurs
GET    /api/servers/games         → liste des jeux supportés
```

### Backups
```
GET    /api/backups            ?serverId=xxx → liste
POST   /api/backups/:id/restore → restaurer
DELETE /api/backups/:id        → supprimer
```

### Système
```
GET  /api/system    → infos OS + stats globales
GET  /api/settings  → paramètres app
PATCH /api/settings → modifier paramètres
GET  /api/notifications → alertes récentes
```

## 🔌 WebSocket (temps réel)

```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=VOTRE_JWT')

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  // Types reçus :
  // connected, servers:list, server:updated,
  // metrics:update, log, notification, pong
}

// S'abonner aux logs d'un serveur
ws.send(JSON.stringify({ type: 'subscribe:server', serverId: 'xxx' }))

// Envoyer une commande console
ws.send(JSON.stringify({ type: 'command', serverId: 'xxx', command: 'status' }))
```

## 🗂️ Structure des fichiers

```
gameforge/
├── server.js               ← Point d'entrée
├── .env                    ← Configuration
├── package.json
├── src/
│   ├── services/
│   │   ├── database.js     ← Base de données JSON (lowdb)
│   │   ├── serverManager.js ← Gestion des processus serveurs
│   │   ├── websocket.js    ← Temps réel
│   │   └── scheduler.js    ← Sauvegardes auto, auto-restart
│   ├── routes/
│   │   ├── auth.js         ← Login, utilisateurs
│   │   ├── servers.js      ← CRUD + actions serveurs
│   │   └── api.js          ← Backups, mods, settings
│   └── middleware/
│       └── auth.js         ← JWT middleware
├── public/                 ← Frontend (HTML/CSS/JS)
│   └── index.html          ← Dashboard (copier gameforge.html ici)
└── data/                   ← Données (auto-créé)
    ├── gameforge.json      ← Base de données
    ├── servers/            ← Fichiers des serveurs de jeux
    ├── backups/            ← Sauvegardes
    └── logs/               ← Logs par serveur
```

## 🔐 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `superadmin` | Tout — créer/supprimer serveurs, gérer utilisateurs |
| `operator` | Démarrer/arrêter/configurer serveurs, créer backups |
| `viewer` | Lecture seule — voir l'état des serveurs |

## ⚙️ Configuration (.env)

```env
PORT=3000
JWT_SECRET=changer_ce_secret_en_production
STEAMCMD_PATH=/usr/games/steamcmd
SERVERS_DIR=./data/servers
BACKUPS_DIR=./data/backups
LOGS_DIR=./data/logs
```

## 🐳 Docker (optionnel)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t gameforge .
docker run -p 3000:3000 -v $(pwd)/data:/app/data gameforge
```

## 🗺️ Prochaines étapes

- [ ] Connecter le frontend HTML au backend via l'API REST
- [ ] Ajouter des pages de configuration par jeu dans le frontend
- [ ] Intégration Discord webhooks (déjà dans les settings)
- [ ] Support Docker pour isoler chaque serveur de jeu
- [ ] Marketplace de templates
- [ ] Support multi-machine (agent distant)
