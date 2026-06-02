import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Backend
  backend: {
    isReady: () => ipcRenderer.invoke('backend:ready'),
    getUrl: () => ipcRenderer.invoke('backend:url'),
  },
  
  // App
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
  },
  
  // Notifications
  notification: {
    show: (title, body, icon) => ipcRenderer.invoke('notification:show', { title, body, icon }),
  },
});
