import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './store/auth'
import App from './App'
import './index.css'

// Initialiser Electron si disponible
if (window.electron) {
  console.log('[Frontend] Electron détecté')
  window.electron.backend.isReady().then(ready => {
    console.log('[Frontend] Backend prêt:', ready)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
