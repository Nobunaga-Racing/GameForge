# GameForge — Frontend React

Interface utilisateur React + Vite + Tailwind CSS.

## Installation

```bash
npm install
```

## Développement

```bash
# Assurer que le backend tourne sur localhost:3000
npm run dev
# → http://localhost:5173
```

## Production

```bash
npm run build
# Les fichiers sont dans dist/
# Copier dist/ dans le dossier public/ du backend
```

## Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       ← Navigation latérale
│   │   └── Topbar.jsx        ← Barre du haut
│   ├── servers/
│   │   ├── ServerCard.jsx    ← Carte serveur
│   │   ├── Console.jsx       ← Console WebSocket live
│   │   └── NewServerWizard.jsx ← Wizard création
│   └── ui/
│       └── index.jsx         ← Composants réutilisables
├── hooks/
│   └── useWebSocket.js       ← Hook WebSocket temps réel
├── lib/
│   └── api.js                ← Client API (axios)
├── pages/
│   ├── Login.jsx             ← Page connexion
│   ├── Dashboard.jsx         ← Dashboard principal
│   ├── ServerDetail.jsx      ← Détail serveur (onglets)
│   ├── Monitoring.jsx        ← Graphiques CPU/RAM
│   ├── Mods.jsx              ← Gestionnaire de mods
│   ├── Backups.jsx           ← Sauvegardes
│   ├── Marketplace.jsx       ← Templates communautaires
│   └── Settings.jsx          ← Paramètres
└── store/
    └── auth.jsx              ← Contexte authentification
```
