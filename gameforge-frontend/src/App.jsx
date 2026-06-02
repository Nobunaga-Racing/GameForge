import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './store/auth'
import { serversApi, systemApi } from './lib/api'
import { useWebSocket } from './hooks/useWebSocket'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { NewServerWizard } from './components/servers/NewServerWizard'
import Dashboard    from './pages/Dashboard'
import ServerDetail from './pages/ServerDetail'
import Monitoring   from './pages/Monitoring'
import Mods         from './pages/Mods'
import Backups      from './pages/Backups'
import Marketplace  from './pages/Marketplace'
import Settings     from './pages/Settings'
import Login        from './pages/Login'

// Protected wrapper
function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// App shell with sidebar + content
function Shell({ children, servers, onRefresh, onNewServer, notifications, connected }) {
  const online = servers.filter(s => s.status === 'online').length
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar servers={servers} onlineCount={online} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar onNewServer={onNewServer} notifications={notifications} connected={connected} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-void)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { user, token } = useAuth()
  const [servers,       setServers]       = useState([])
  const [notifications, setNotifications] = useState([])
  const [wizardOpen,    setWizardOpen]    = useState(false)

  const { connected, on } = useWebSocket()

  // Load servers
  const loadServers = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await serversApi.list()
      setServers(data)
    } catch {}
  }, [token])

  const loadNotifications = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await systemApi.notifications()
      setNotifications(data)
    } catch {}
  }, [token])

  useEffect(() => {
    if (token) {
      loadServers()
      loadNotifications()
      // Refresh every 10s
      const t = setInterval(loadServers, 10000)
      return () => clearInterval(t)
    }
  }, [token])

  // WebSocket: update server state & metrics live
  useEffect(() => {
    const unsub1 = on('server:updated', ({ server }) => {
      setServers(prev => {
        const idx = prev.findIndex(s => s.id === server.id)
        if (idx === -1) return [...prev, server]
        const next = [...prev]
        next[idx] = { ...next[idx], ...server }
        return next
      })
    })
    const unsub2 = on('metrics:update', (metrics) => {
      setServers(prev => prev.map(s => ({
        ...s, metrics: metrics[s.id] || s.metrics
      })))
    })
    const unsub3 = on('notification', (n) => {
      setNotifications(prev => [{ ...n, read: false, createdAt: new Date().toISOString() }, ...prev.slice(0, 49)])
    })
    return () => { unsub1?.(); unsub2?.(); unsub3?.() }
  }, [on])

  function handleServerCreated(server) {
    setServers(prev => [...prev, server])
  }

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontSize: 13 }
        }} />
      </>
    )
  }

  const shellProps = { servers, onRefresh: loadServers, onNewServer: () => setWizardOpen(true), notifications, connected }

  return (
    <>
      <Shell {...shellProps}>
        <Routes>
          <Route path="/" element={
            <Protected><Dashboard servers={servers} onRefresh={loadServers} onNewServer={() => setWizardOpen(true)} notifications={notifications} /></Protected>
          } />
          <Route path="/servers/:id" element={
            <Protected><ServerDetail servers={servers} onRefresh={loadServers} /></Protected>
          } />
          <Route path="/monitoring" element={
            <Protected><Monitoring servers={servers} /></Protected>
          } />
          <Route path="/mods" element={
            <Protected><Mods servers={servers} /></Protected>
          } />
          <Route path="/backups" element={
            <Protected><Backups servers={servers} /></Protected>
          } />
          <Route path="/marketplace" element={
            <Protected><Marketplace /></Protected>
          } />
          <Route path="/settings" element={
            <Protected><Settings /></Protected>
          } />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>

      <NewServerWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={handleServerCreated}
      />

      <Toaster position="bottom-right" toastOptions={{
        style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontSize: 13 }
      }} />
    </>
  )
}
