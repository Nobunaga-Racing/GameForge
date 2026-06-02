# 🏗️ GUIDE COMPLET DE BUILD - GameForge Desktop

**⚠️ PRÉREQUIS : Tous les tests du `ELECTRON_TESTING_GUIDE.md` doivent être ✅ RÉUSSIS**

---

## 📋 ÉTAPE 1 : VÉRIFIER LA CONFIGURATION

### 1.1 Vérifier le fichier package.json racine

Le `package.json` à la racine DOIT avoir cette section `build` :

```json
"build": {
  "appId": "com.gameforge.app",
  "productName": "GameForge",
  "files": [
    "electron/**/*",
    "gameforge/package.json",
    "gameforge/server.js",
    "gameforge/src/**/*",
    "gameforge/data/**/*",
    "gameforge-frontend/dist/**/*",
    "node_modules/**/*"
  ],
  "directories": {
    "buildResources": "assets"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "GameForge"
  }
}
```

### 1.2 Vérifier que l'icône existe

```bash
# À la racine du projet
ls -la electron/assets/icon.ico

# Si absent, créer un fichier vide (pour le test)
mkdir -p electron/assets
touch electron/assets/icon.ico
```

### 1.3 Vérifier la version

```bash
# Voir la version dans package.json racine
cat package.json | grep version

# Tu devrais voir : "version": "1.0.0"
```

---

## 🧹 ÉTAPE 2 : NETTOYER LES ARTEFACTS PRÉCÉDENTS

```bash
# À la racine du projet

# Supprimer les anciens builds
rm -rf out/
rm -rf dist/
rm -rf gameforge-frontend/dist/

# Sur Windows (PowerShell)
# Remove-Item -Recurse -Force out
# Remove-Item -Recurse -Force gameforge-frontend/dist
```

---

## 🔨 ÉTAPE 3 : BUILD DU FRONTEND

C'est CRITIQUE - le frontend doit être compilé pour Electron :

```bash
# À la racine du projet
npm run frontend:build
```

**Attendu :**
```
✓ 1234 modules transformed
dist/index.html   45 kB
dist/assets/chunk-abc.js  xyz kB
dist/assets/chunk-def.css yyy kB
```

**Vérifier :**
```bash
# Le dossier dist/ doit exister et être rempli
ls gameforge-frontend/dist/
# Tu devrais voir : index.html, assets/

# Vérifier le contenu
cat gameforge-frontend/dist/index.html | head -20
# Tu dois voir du HTML
```

---

## 🚀 ÉTAPE 4 : BUILD ELECTRON (NSIS INSTALLER)

### 4.1 Build pour Windows

```bash
# À la racine du projet
npm run electron:build
```

**Cela va :**
1. ✅ Vérifier tous les fichiers (electron/, gameforge/, gameforge-frontend/dist/)
2. ✅ Créer un bundle Electron
3. ✅ Générer un installateur NSIS
4. ✅ Mettre les fichiers dans `out/`

**Temps attendu :** 2-5 minutes

**Output attendu :**
```
  › electron-builder version=24.6.4
  › packaging       platform=win32 arch=x64 electron=28.0.0 wine=
  › electron-builder arg=[--config.productName=GameForge]

  › building        target=nsis file=out/GameForge Setup 1.0.0.exe
  › Packaging in C:\...\out

✓ NSIS installer       file=out/GameForge Setup 1.0.0.exe
```

### 4.2 Vérifier les fichiers générés

```bash
# Voir ce qui a été créé
ls -la out/

# Tu devrais voir :
# - GameForge Setup 1.0.0.exe    ← INSTALLATEUR PRINCIPAL
# - GameForge 1.0.0.exe          ← Exécutable portable (optionnel)
```

---

## 🧪 ÉTAPE 5 : TESTER L'INSTALLATEUR

### 5.1 Sur Windows

**Sur ta machine de test :**

1. **Fermer Electron** s'il est encore ouvert
2. **Naviguer** vers `out/GameForge Setup 1.0.0.exe`
3. **Double-cliquer** pour lancer l'installation
4. **Suivre** l'assistant d'installation
   - Choisir le dossier d'installation (ou laisser par défaut)
   - Cliquer "Installer"
5. **Attendre** la fin de l'installation
6. **Cocher** "Lancer GameForge" à la fin
7. **Vérifier** que l'application démarre

**Points de contrôle :**
- ✅ Installateur crée le dossier dans `Program Files/GameForge/`
- ✅ Raccourci Desktop créé
- ✅ Raccourci Menu Démarrer créé
- ✅ Application démarre correctement
- ✅ Backend lance automatiquement
- ✅ Login fonctionne
- ✅ Dashboard affiche les serveurs

### 5.2 Test de fonctionnalité COMPLET

Une fois l'app installée et lancée :

1. **Login**
   - [ ] Se connecter avec `admin` / `admin`
   - [ ] Dashboard se charge

2. **Serveurs**
   - [ ] Voir la liste des serveurs
   - [ ] WebSocket connecté (badge vert "Connecté")

3. **Menu**
   - [ ] File → Quitter ferme proprement l'app
   - [ ] Edit → Copier/Coller fonctionne
   - [ ] View → Zoom fonctionne
   - [ ] Help → À propos ouvre une fenêtre modale

4. **Backend**
   - [ ] API répond correctement
   - [ ] Base de données persiste
   - [ ] Pas d'erreurs dans les logs

5. **Arrêt**
   - [ ] Fermer la fenêtre arrête l'app proprement
   - [ ] Pas de processus orphelins
   - [ ] Pas d'erreurs dans Event Viewer Windows

---

## 📦 ÉTAPE 6 : OPTIONS DE BUILD SUPPLÉMENTAIRES

### 6.1 Build Portable (sans installateur)

```bash
# À la racine du projet
npm run electron:build:portable
```

**Résultat :**
- `out/GameForge 1.0.0.exe` ← Exécutable standalone
- Pas d'installation requise
- Peut être distribué sur clé USB

### 6.2 Build mode DEV (debug)

```bash
npm run electron:dev
```

Utilise le Vite dev server au lieu du build compilé. Utile pour déboguer.

### 6.3 Build personnalisé complet

```bash
npm run build:dist
```

Build complet avec tous les checks.

---

## 🔍 ÉTAPE 7 : VÉRIFIER LES LOGS DE BUILD

Si le build échoue, regarder les logs :

```bash
# Logs verbeux (beaucoup plus d'informations)
npm run electron:build -- --verbose

# Ou directement avec electron-builder
npx electron-builder --verbose
```

**Erreurs courantes :**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `ENOENT: no such file or directory, stat '.../gameforge-frontend/dist/index.html'` | Frontend pas buildé | Lancer `npm run frontend:build` |
| `Cannot find module 'electron'` | Dépendances manquantes | Lancer `npm install` à la racine |
| `error ERR_ELECTRON_BUILDER_CANNOT_EXECUTE` | electron-builder pas installé | `npm install --save-dev electron-builder` |
| `Icon file not found` | Icône manquante | Créer `electron/assets/icon.ico` |
| `Port 3000 already in use` | Electron toujours ouvert | Fermer Electron complètement |

---

## 📊 ÉTAPE 8 : CHECKLIST DE BUILD FINAL

### Avant le build
- [ ] Tous les tests du `ELECTRON_TESTING_GUIDE.md` sont ✅
- [ ] `npm run frontend:build` réussit
- [ ] `gameforge-frontend/dist/index.html` existe
- [ ] `electron/assets/icon.ico` existe
- [ ] `package.json` racine a la section `build`
- [ ] Pas de processus Node.js en arrière-plan
- [ ] Port 3000 libre (vérifier avec `netstat -ano | findstr :3000`)

### Build
- [ ] `npm run electron:build` réussit sans erreurs
- [ ] Pas de warnings
- [ ] `out/GameForge Setup 1.0.0.exe` créé
- [ ] Fichier > 150 MB (contient Node.js + tout le code)

### Post-build
- [ ] L'installateur est exécutable
- [ ] Installation réussit
- [ ] Application démarre correctement
- [ ] Login fonctionne
- [ ] Backend se lance automatiquement
- [ ] Interface réactive et fluide

---

## 🎯 DISTRIBUTABLES FINAUX

Une fois le build réussi, tu as :

```
out/
├── GameForge Setup 1.0.0.exe    ← INSTALATEUR RECOMMANDÉ
├── GameForge 1.0.0.exe          ← Portable (optionnel)
└── builder-effective-config.yaml ← Config de build (info)
```

**À distribuer :**
- ✅ **`out/GameForge Setup 1.0.0.exe`** ← Envoie CELUI-CI
- Taille : ~200-300 MB
- Fonctionne sur Windows 7+ (64-bit)

---

## 🔐 SIGNER L'INSTALLATEUR (OPTIONNEL - PRODUCTION)

Si tu veux un build "professionnel" signé :

1. **Obtenir un certificat de signature** (coûte $)
2. **Configurer dans package.json :**
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "password",
     "signingHashAlgorithms": ["sha256"]
   }
   ```
3. **Lancer le build**

---

## 📝 RELEASE NOTES (À CRÉER)

Crée un fichier `RELEASE_NOTES.md` pour ta version :

```markdown
# GameForge 1.0.0 - Release Notes

## ✨ Nouvelles fonctionnalités
- [x] Application Desktop Electron
- [x] Backend Node.js intégré
- [x] Installation automatique
- [x] Lancement automatique du serveur

## 🐛 Corrections
- Fixed CORS issues
- Fixed WebSocket connectivity

## 📦 Installation
1. Télécharger `GameForge Setup 1.0.0.exe`
2. Double-cliquer
3. Suivre l'assistant

## 🎮 Utilisation
- Login: admin / admin
- Créer des serveurs de jeux
- Gérer via le dashboard

## 📋 Système requis
- Windows 7 64-bit ou supérieur
- 4 GB RAM minimum
- 10 GB espace disque
```

---

## ✅ PROCHAINES ÉTAPES APRÈS BUILD RÉUSSI

1. **Tester en profondeur** sur une vraie machine Windows
2. **Créer un tag Git** :
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
3. **Créer une Release GitHub** avec le .exe
4. **Partager** le lien de téléchargement

---

## 🚨 SI LE BUILD ÉCHOUE

Diagnostic rapide :

```bash
# 1. Vérifier l'installation des dépendances
npm ls electron
npm ls electron-builder

# 2. Réinstaller complètement
rm -rf node_modules
npm install

# 3. Vérifier les fichiers de build
ls -R gameforge-frontend/dist/
ls -R electron/

# 4. Nettoyer le cache
rm -rf out/
npm cache clean --force

# 5. Relancer le build
npm run electron:build
```

---

**Une fois tous les tests ✅ ET LE BUILD réussi, l'application est PRÊTE À LA DISTRIBUTION ! 🎉**

Pour toute question ou problème : consulte cette doc et `ELECTRON_TESTING_GUIDE.md`
