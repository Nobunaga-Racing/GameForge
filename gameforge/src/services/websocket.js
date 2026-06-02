const { WebSocketServer } = require('ws')
const jwt = require('jsonwebtoken')
const { getDb } = require('../services/database')
const serverManager = require('../services/serverManager')

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', async (ws, req) => {
    // Auth via query param token
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(1008, 'Token requis')
      return
    }

    let user
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret')
      const db = await getDb()
      user = db.data.users.find(u => u.id === payload.userId)
      if (!user) throw new Error('Utilisateur introuvable')
    } catch {
      ws.close(1008, 'Token invalide')
      return
    }

    console.log(`[WS] Client connecté: ${user.username}`)
    ws._user = user
    ws._subscriptions = new Set() // serverId subscriptions

    // Send welcome + initial state
    sendJson(ws, { type: 'connected', user: { id: user.id, username: user.username, role: user.role } })

    // Send current server states
    const db = await getDb()
    sendJson(ws, {
      type: 'servers:list',
      servers: db.data.servers.map(s => ({
        ...s, password: undefined, adminPassword: undefined,
        metrics: serverManager.getServerMetrics(s.id)
      }))
    })

    // Broadcast metrics every 5s to subscribed clients
    const metricsListener = (metrics) => {
      if (ws.readyState !== ws.OPEN) return
      sendJson(ws, { type: 'metrics:update', metrics })
    }

    const logListener = (entry) => {
      if (ws.readyState !== ws.OPEN) return
      if (ws._subscriptions.has(entry.serverId) || ws._subscriptions.has('*')) {
        sendJson(ws, { type: 'log', ...entry })
      }
    }

    const serverUpdatedListener = (server) => {
      if (ws.readyState !== ws.OPEN) return
      sendJson(ws, { type: 'server:updated', server: { ...server, password: undefined, adminPassword: undefined } })
    }

    const notifListener = (notif) => {
      if (ws.readyState !== ws.OPEN) return
      sendJson(ws, { type: 'notification', ...notif })
    }

    serverManager.on('metricsUpdated', metricsListener)
    serverManager.on('log', logListener)
    serverManager.on('serverUpdated', serverUpdatedListener)
    serverManager.on('serverCreated', serverUpdatedListener)
    serverManager.on('serverCrashed', serverUpdatedListener)
    serverManager.on('notification', notifListener)

    // Handle messages from client
    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        await handleMessage(ws, msg, user)
      } catch (err) {
        sendJson(ws, { type: 'error', message: err.message })
      }
    })

    ws.on('close', () => {
      console.log(`[WS] Client déconnecté: ${user.username}`)
      serverManager.off('metricsUpdated', metricsListener)
      serverManager.off('log', logListener)
      serverManager.off('serverUpdated', serverUpdatedListener)
      serverManager.off('serverCreated', serverUpdatedListener)
      serverManager.off('serverCrashed', serverUpdatedListener)
      serverManager.off('notification', notifListener)
    })

    ws.on('error', (err) => console.error('[WS] Erreur:', err.message))
  })

  // Handle messages
  async function handleMessage(ws, msg, user) {
    switch (msg.type) {
      case 'subscribe:server':
        ws._subscriptions.add(msg.serverId)
        // Send last 50 logs
        const logs = serverManager.getLogs(msg.serverId, 50)
        sendJson(ws, { type: 'logs:history', serverId: msg.serverId, logs })
        break

      case 'unsubscribe:server':
        ws._subscriptions.delete(msg.serverId)
        break

      case 'subscribe:all':
        ws._subscriptions.add('*')
        break

      case 'command':
        if (!['superadmin', 'operator'].includes(user.role)) {
          sendJson(ws, { type: 'error', message: 'Permissions insuffisantes' })
          return
        }
        await serverManager.sendCommand(msg.serverId, msg.command)
        break

      case 'ping':
        sendJson(ws, { type: 'pong', timestamp: Date.now() })
        break

      default:
        sendJson(ws, { type: 'error', message: `Type de message inconnu: ${msg.type}` })
    }
  }

  function sendJson(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  // Broadcast to all connected clients
  wss.broadcast = (data) => {
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }

  console.log('[WS] WebSocket server démarré sur /ws')
  return wss
}

module.exports = { setupWebSocket }
