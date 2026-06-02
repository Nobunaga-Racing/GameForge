import { app, BrowserWindow, Menu, ipcMain, Notification } from 'electron';
import isDev from 'electron-is-dev';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;
let backendProcess = null;
let backendReady = false;

const BACKEND_PORT = 3000;
const BACKEND_HOST = 'http://localhost';

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    show: false, // Ne pas montrer jusqu'à prêt
  });

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Charger l'application
  const startURL = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, '../gameforge-frontend/dist/index.html')}`;

  mainWindow.loadURL(startURL);

  // DevTools en développement
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Démarrer le serveur backend Node.js
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, '../gameforge');
    
    console.log('[Backend] Démarrage du serveur...');
    console.log('[Backend] Répertoire:', backendDir);

    backendProcess = spawn('node', ['server.js'], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: isDev ? 'development' : 'production',
      },
    });

    // Écouter la sortie du backend
    backendProcess.stdout.on('data', (data) => {
      console.log('[Backend stdout]', data.toString());
      if (data.toString().includes('GameForge v1.0.0')) {
        backendReady = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend stderr]', data.toString());
    });

    backendProcess.on('error', (err) => {
      console.error('[Backend] Erreur:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log('[Backend] Processus terminé avec le code:', code);
      backendReady = false;
    });

    // Timeout si le backend ne démarre pas après 15s
    setTimeout(() => {
      if (!backendReady) {
        console.warn('[Backend] Timeout, mais continuation...');
        resolve(); // On continue même si pas prêt
      }
    }, 15000);
  });
}

// Arrêter le backend proprement
function stopBackend() {
  return new Promise((resolve) => {
    if (backendProcess) {
      console.log('[Backend] Arrêt du serveur...');
      backendProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (backendProcess) {
          backendProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    } else {
      resolve();
    }
  });
}

// IPC: vérifier si le backend est prêt
ipcMain.handle('backend:ready', () => {
  return backendReady;
});

// IPC: obtenir l'URL du backend
ipcMain.handle('backend:url', () => {
  return BACKEND_HOST + ':' + BACKEND_PORT;
});

// IPC: obtenir la version
ipcMain.handle('app:version', () => {
  return app.getVersion();
});

// IPC: montrer une notification
ipcMain.handle('notification:show', (event, { title, body, icon }) => {
  new Notification({
    title,
    body,
    icon: icon ? path.join(__dirname, 'assets', icon) : undefined,
  }).show();
});

// Créer le menu
function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rétablir', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Plein écran', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Zoom avant', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Réinitialiser le zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 400,
              height: 300,
              modal: true,
              parent: mainWindow,
              show: false,
            });
            aboutWindow.loadFile(path.join(__dirname, 'about.html'));
            aboutWindow.once('ready-to-show', () => aboutWindow.show());
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Quand Electron est prêt
app.on('ready', async () => {
  console.log('[Electron] Application démarrée');
  
  try {
    await startBackend();
  } catch (err) {
    console.error('[Electron] Erreur au démarrage du backend:', err);
  }

  createWindow();
  createMenu();
});

// Quand toutes les fenêtres sont fermées
app.on('window-all-closed', async () => {
  console.log('[Electron] Toutes les fenêtres fermées');
  await stopBackend();
  
  // Sur macOS, laisser l'app ouverte jusqu'à Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Quand l'app est réactivée (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Gérer l'arrêt propre
process.on('SIGTERM', async () => {
  console.log('[Electron] SIGTERM reçu');
  await stopBackend();
  app.quit();
});

process.on('SIGINT', async () => {
  console.log('[Electron] SIGINT reçu');
  await stopBackend();
  app.quit();
});
