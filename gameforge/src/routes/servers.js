const router = require('express').Router()
const { getDb } = require('../services/database')
const serverManager = require('../services/serverManager')
const { authMiddleware, requireRole } = require('../middleware/auth')

// All routes require auth
router.use(authMiddleware)

// GET /api/servers — list all servers with live metrics
router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    const servers = db.data.servers.map(s => ({
      ...s,
      password: undefined,
      adminPassword: undefined,
      metrics: serverManager.getServerMetrics(s.id)
    }))
    res.json(servers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/servers/games — list supported games
router.get('/games', (req, res) => {
  const defs = serverManager.getAllGameDefs()
  res.json(Object.entries(defs).map(([id, d]) => ({
    id,
    name: d.name,
    steamAppId: d.steamAppId,
    defaultPort: d.defaultPort,
    defaultMaxPlayers: d.defaultMaxPlayers,
    platform: d.platform
  })))
})

// GET /api/servers/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const server = db.data.servers.find(s => s.id === req.params.id)
    if (!server) return res.status(404).json({ error: 'Serveur introuvable' })
    res.json({
      ...server,
      password: undefined,
      adminPassword: undefined,
      metrics: serverManager.getServerMetrics(server.id),
      logs: serverManager.getLogs(server.id, 50)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/servers — create server
router.post('/', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const server = await serverManager.createServer(req.body)
    res.status(201).json(server)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/servers/:id — update config
router.patch('/:id', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const db = await getDb()
    const idx = db.data.servers.findIndex(s => s.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Serveur introuvable' })

    // Merge updates (protect internal fields)
    const forbidden = ['id', 'createdAt', 'status', 'serverDir']
    const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => !forbidden.includes(k)))
    Object.assign(db.data.servers[idx], update, { updatedAt: new Date().toISOString() })
    await db.write()
    res.json(db.data.servers[idx])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/servers/:id
router.delete('/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const db = await getDb()
    const srv = db.data.servers.find(s => s.id === req.params.id)
    if (!srv) return res.status(404).json({ error: 'Introuvable' })
    if (srv.status === 'online') await serverManager.stopServer(req.params.id)
    const idx = db.data.servers.findIndex(s => s.id === req.params.id)
    db.data.servers.splice(idx, 1)
    await db.write()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── ACTIONS ────────────────────────────────────────────────────

// POST /api/servers/:id/install
router.post('/:id/install', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    res.json({ message: 'Installation démarrée — suivez la progression dans la console' })
    serverManager.installServer(req.params.id).catch(console.error)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/servers/:id/start
router.post('/:id/start', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const server = await serverManager.startServer(req.params.id)
    res.json({ message: 'Démarrage en cours', server })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/servers/:id/stop
router.post('/:id/stop', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    await serverManager.stopServer(req.params.id)
    res.json({ message: 'Arrêt en cours' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/servers/:id/restart
router.post('/:id/restart', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    res.json({ message: 'Redémarrage en cours' })
    serverManager.restartServer(req.params.id).catch(console.error)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/servers/:id/command
router.post('/:id/command', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const { command } = req.body
    if (!command) return res.status(400).json({ error: 'Commande manquante' })
    await serverManager.sendCommand(req.params.id, command)
    res.json({ message: 'Commande envoyée' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/servers/:id/logs
router.get('/:id/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const logs = serverManager.getLogs(req.params.id, limit)
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/servers/:id/backup
router.post('/:id/backup', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const backup = await serverManager.createBackup(req.params.id, req.body.label)
    res.status(201).json(backup)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/servers/:id/metrics
router.get('/:id/metrics', async (req, res) => {
  const metrics = serverManager.getServerMetrics(req.params.id)
  if (!metrics) return res.status(404).json({ error: 'Métriques non disponibles' })
  res.json(metrics)
})

module.exports = router
