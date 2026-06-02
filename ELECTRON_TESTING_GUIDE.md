# 🧪 GUIDE COMPLET DE TEST - GameForge Electron

## ⚠️ PRÉREQUIS ABSOLUS

Avant de commencer, assure-toi d'avoir installé :

```bash
# Vérifier Node.js (v18+)
node --version
npm --version

# Si absent :
# https://nodejs.org/en/download/
```

---

## 📋 ÉTAPE 1 : CLONER ET CHECKOUT LA BRANCHE

```bash
# À la racine du projet
git clone https://github.com/Nobunaga-Racing/GameForge.git
cd GameForge

# Checkout la branche electron-desktop
git checkout electron-desktop

# Vérifier qu'on est bien sur la bonne branche
git branch -a
# Tu devrais voir : * electron-desktop
```

---

## 🔧 ÉTAPE 2 : INSTALLATION DES DÉPENDANCES

### 2.1 Installer les dépendances racine (Electron)

```bash
# À la racine du projet (GameForge/)
npm install
```

**Cela installe :**
- `electron` v28.0.0
- `electron-builder` v24.6.4
- `electron-is-dev` v3.0.0
- `concurrently` v8.2.2

### 2.2 Installer les dépendances du backend

```bash
cd gameforge
npm install
cd ..
```

**Cela installe :** Node.js backend (express, lowdb, ws, etc.)

### 2.3 Installer les dépendances du frontend

```bash
cd gameforge-frontend
npm install
cd ..
```

**Cela installe :** React, Vite, Tailwind, etc.

---

## ✅ ÉTAPE 3 : VÉRIFIER LA STRUCTURE

Assure-toi que tu as cette structure :

```
GameForge/
├── electron/
│   ├── main.js                ✅ Doit exister
│   ├── preload.js             ✅ Doit exister
│   ├── about.html             ✅ Doit exister
│   └── assets/
│       └── icon.ico           ⚠️ À créer (voir ci-dessous)
├── gameforge/
│   ├── package.json           ✅ Backend
│   ├── server.js              ✅ Modifié
│   ├── src/
│   └── node_modules/
├── gameforge-frontend/
│   ├── package.json           ✅ Frontend
│   ├── vite.config.js         ✅ Modifié
│   ├── src/
│   │   ├── main.jsx           ✅ Modifié
│   │   └── lib/
│   │       └── api.js         ✅ Créé
│   └── node_modules/
├── package.json               ✅ Créé (racine)
└── .gitignore                 ✅ Créé
```

### ⚠️ Créer l'icône (IMPORTANT)

Crée le dossier `electron/assets/` s'il n'existe pas :

```bash
mkdir -p electron/assets
```

Puis place une icône `icon.ico` dedans. **Tu peux générer rapidement une placeholder :**

**Option 1 : Utiliser une icône en ligne**
- Va sur https://icoconvert.com/
- Upload une image PNG 256x256
- Télécharge le .ico
- Place-la dans `electron/assets/icon.ico`

**Option 2 : Créer une simple icône texte temporaire (pour test)**
```bash
# Sur Windows (PowerShell)
# Crée un fichier vide pour le test
New-Item -ItemType File -Path electron/assets/icon.ico -Force

# Sur macOS/Linux
touch electron/assets/icon.ico
```

---

## 🧪 ÉTAPE 4 : TEST DE DÉVELOPPEMENT

### 4.1 Test du Backend SEUL

```bash
cd gameforge
npm start
```

**Attendu :**
```
╔══════════════════════════════════════════╗
║         🎮  GameForge v1.0.0             ║
╠══════════════════════════════════════════╣
║  API    → http://localhost:3000          ║
║  WS     → ws://localhost:3000/ws         ║
║  Login  → admin / admin                  ║
╚══════════════════════════════════════════╝
```

**Test :** Ouvre `http://localhost:3000/health` dans le navigateur
→ Tu devrais voir : `{"status":"ok","version":"1.0.0",...}`

**Arrêter :** `Ctrl+C`

---

### 4.2 Test du Frontend SEUL (développement)

```bash
# Depuis la racine (GameForge/)
cd gameforge-frontend
npm run dev
```

**Attendu :**
```
VITE v8.0.1  ready in 234 ms

➜  Local:   http://localhost:5173/
```

**Test :** Ouvre `http://localhost:5173` → Interface React
→ Tu devrais voir la page de login

**Arrêter :** `Ctrl+C`

---

### 4.3 Test Frontend + Backend ENSEMBLE (mode dev)

Dans **deux terminaux différents** :

**Terminal 1 - Backend :**
```bash
cd gameforge
npm start
```

**Terminal 2 - Frontend :**
```bash
cd gameforge-frontend
npm run dev
```

**Test :**
1. Ouvre `http://localhost:5173`
2. Login avec `admin` / `admin`
3. Tu devrais voir le dashboard

**Points à vérifier :**
- ✅ Page de login s'affiche
- ✅ Connexion fonctionne
- ✅ Dashboard charge
- ✅ Pas d'erreurs CORS
- ✅ WebSocket se connecte

---

## 🎯 ÉTAPE 5 : TEST ELECTRON (CRITICAL)

### 5.1 Build Frontend d'abord

```bash
# Depuis la racine
npm run frontend:build
```

**Attendu :**
```
✓ 1234 modules transformed
dist/index.html   45 kB
dist/assets/...   xxx kB
```

**Vérifier :** Le dossier `gameforge-frontend/dist/` doit contenir :
- `index.html`
- `assets/` (avec JS/CSS compilé)

### 5.2 Lancer Electron

```bash
# Depuis la racine
npm run electron:dev
```

**Attendu :**
1. Une fenêtre Electron s'ouvre
2. Tu vois les DevTools en bas
3. Console affiche :
   ```
   [Electron] Application démarrée
   [Backend] Démarrage du serveur...
   [Backend stdout] 🎮 GameForge v1.0.0
   [Frontend] Electron détecté
   [Frontend] Backend prêt: true
   ```
4. L'interface se charge
5. Tu peux te connecter avec `admin` / `admin`

### 🐛 Si ça ne marche pas :

**Problème : "Cannot find module 'electron'"**
```bash
npm install
```

**Problème : "Backend not ready"**
- Vérifier que le port 3000 est libre
- Vérifier que `gameforge/` a node_modules
- Regarder les logs du backend

**Problème : "Frontend charge pas / Page blanche"**
- Vérifier que `gameforge-frontend/dist/index.html` existe
- Ouvrir DevTools (F12) et regarder les erreurs
- Vérifier que l'URL du backend est correcte

**Problème : "Icon not found"**
- Créer `electron/assets/icon.ico` (même vide, c'est OK pour le test)

---

## 📝 ÉTAPE 6 : CHECKLIST DE TEST COMPLET

### Backend
- [ ] `npm start` dans `gameforge/` fonctionne
- [ ] `http://localhost:3000/health` retourne du JSON
- [ ] Pas d'erreurs dans la console
- [ ] CORS configuré correctement

### Frontend (Dev)
- [ ] `npm run dev` dans `gameforge-frontend/` fonctionne
- [ ] `http://localhost:5173` se charge
- [ ] Page de login visible
- [ ] Pas d'erreurs réseau

### Frontend (Build)
- [ ] `npm run frontend:build` crée `dist/`
- [ ] `dist/index.html` existe
- [ ] `dist/assets/` n'est pas vide

### Electron (Intégration)
- [ ] Backend démarre avant la fenêtre
- [ ] Fenêtre s'ouvre et affiche le frontend
- [ ] Pas d'erreurs console
- [ ] Login fonctionne
- [ ] Dashboard se charge correctement
- [ ] WebSocket se connecte (voir badge "Connecté" en haut)
- [ ] Icône Windows en haut à gauche affiche l'app

### Fermeture
- [ ] Fermer la fenêtre Electron arrête le backend proprement
- [ ] Pas de processus Node.js orphelins
- [ ] Pas d'erreurs lors de l'arrêt

---

## 🔍 ÉTAPE 7 : LOGS À REGARDER

### Logs Electron (terminal)
```bash
[Electron] Application démarrée
[Backend] Démarrage du serveur...
[Backend stdout] GameForge v1.0.0
[Frontend] Electron détecté
```

### Logs DevTools Electron (F12)
```
[Frontend] Backend prêt: true
api.js: Backend URL detected: http://localhost:3000
```

### Pas d'erreurs comme :
```
❌ CORS error
❌ Cannot GET /
❌ Backend not running
❌ Timeout waiting for backend
```

---

## 🚀 ÉTAPE 8 : COMMANDES UTILES PENDANT LE TEST

```bash
# Vérifier les ports en écoute
# Windows (PowerShell)
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# macOS/Linux
lsof -i :3000
lsof -i :5173

# Tuer un processus bloquant
# Windows
taskkill /PID [PID] /F

# macOS/Linux
kill -9 [PID]

# Nettoyer les caches
rm -rf gameforge-frontend/dist
rm -rf gameforge/node_modules gameforge-frontend/node_modules node_modules
npm install
```

---

## ✅ QUAND TOUT FONCTIONNE

Si tous les tests passent ✅, tu peux passer à l'étape **BUILD** :

```bash
# Générer l'installateur Windows
npm run electron:build
```

Le .exe sera dans `out/GameForge Setup 1.0.0.exe`

---

## 📞 DÉPANNAGE RAPIDE

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Port 3000 déjà utilisé | Autre app | `taskkill /PID xxx /F` |
| "Cannot find dist/" | Build non lancé | `npm run frontend:build` |
| Electron ne se lance pas | Manque electron | `npm install` |
| Login ne marche pas | Backend pas prêt | Attendre 15s |
| Page blanche | Chemin frontend faux | Vérifier `dist/index.html` |
| Icon error | Fichier manquant | Créer `electron/assets/icon.ico` |

---

**Une fois tous les tests ✅, contacte-moi pour passer au BUILD FINAL ! 🚀**
