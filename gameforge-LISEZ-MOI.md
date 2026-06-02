# 🎮 GameForge — Guide de démarrage rapide (Windows)

## Structure du projet

```
gameforge-backend/    ← Serveur Node.js (API + WebSocket)
gameforge-frontend/   ← Interface React (ce que tu vois dans le navigateur)
```

## Démarrage en 3 étapes

### 1. Démarrer le backend

```bash
cd gameforge-backend
npm install
npm start
```
→ L'API tourne sur http://localhost:3000

### 2. Démarrer le frontend (développement)

```bash
cd gameforge-frontend
npm install
npm run dev
```
→ L'interface est sur http://localhost:5173

### 3. Ouvrir le navigateur

Aller sur **http://localhost:5173**  
Login : **admin** / **admin**

---

## Pour Windows — deux terminaux

Ouvre **deux fenêtres PowerShell** :

**Fenêtre 1 (backend) :**
```powershell
cd C:\GameForge\gameforge-backend
npm install
npm start
```

**Fenêtre 2 (frontend) :**
```powershell
cd C:\GameForge\gameforge-frontend
npm install
npm run dev
```

---

## Déploiement (optionnel — tout en un)

Pour n'avoir qu'un seul serveur à lancer :
```bash
cd gameforge-frontend
npm run build
cp -r dist/* ../gameforge-backend/public/
```
Puis seulement `npm start` dans le backend → http://localhost:3000
