const router = require('express').Router()
const { getDb } = require('../services/database')
const serverManager = require('../services/serverManager')
const { authMiddleware, requireRole } = require('../middleware/auth')

router.use(authMiddleware)

// ── BACKUPS ─────────────────────────────────────────────────────

// GET /api/backups
router.get('/backups', async (req, res) => {
  const db = await getDb()
  let backups = db.data.backups
  if (req.query.serverId) backups = backups.filter(b => b.serverId === req.query.serverId)
  res.json(backups)
})

// POST /api/backups/:id/restore
router.post('/backups/:id/restore', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const backup = await serverManager.restoreBackup(req.params.id)
    res.json({ message: 'Restauration effectuée', backup })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/backups/:id
router.delete('/backups/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const db = await getDb()
    const idx = db.data.backups.findIndex(b => b.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Introuvable' })
    db.data.backups.splice(idx, 1)
    await db.write()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── MODS ────────────────────────────────────────────────────────

// GET /api/mods?serverId=xxx
router.get('/mods', async (req, res) => {
  const db = await getDb()
  let mods = db.data.mods
  if (req.query.serverId) mods = mods.filter(m => m.serverId === req.query.serverId)
  res.json(mods)
})

// POST /api/mods
router.post('/mods', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid')
    const db = await getDb()
    const mod = {
      id: uuidv4(),
      serverId: req.body.serverId,
      name: req.body.name,
      workshopId: req.body.workshopId || null,
      source: req.body.source || 'workshop',
      version: req.body.version || '1.0',
      size: req.body.size || 0,
      enabled: true,
      status: 'installed',
      installedAt: new Date().toISOString()
    }
    db.data.mods.push(mod)
    await db.write()
    res.status(201).json(mod)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/mods/:id — toggle enabled/disabled
router.patch('/mods/:id', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const db = await getDb()
    const mod = db.data.mods.find(m => m.id === req.params.id)
    if (!mod) return res.status(404).json({ error: 'Mod introuvable' })
    Object.assign(mod, req.body)
    await db.write()
    res.json(mod)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/mods/:id
router.delete('/mods/:id', requireRole('superadmin', 'operator'), async (req, res) => {
  try {
    const db = await getDb()
    const idx = db.data.mods.findIndex(m => m.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Introuvable' })
    db.data.mods.splice(idx, 1)
    await db.write()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── NOTIFICATIONS ────────────────────────────────────────────────

// GET /api/notifications
router.get('/notifications', async (req, res) => {
  const db = await getDb()
  res.json(db.data.notifications.slice(0, 50))
})

// PATCH /api/notifications/read-all
router.patch('/notifications/read-all', async (req, res) => {
  const db = await getDb()
  db.data.notifications.forEach(n => { n.read = true })
  await db.write()
  res.json({ success: true })
})

// ── SETTINGS ────────────────────────────────────────────────────

// GET /api/settings
router.get('/settings', async (req, res) => {
  const db = await getDb()
  res.json(db.data.settings)
})

// PATCH /api/settings
router.patch('/settings', requireRole('superadmin'), async (req, res) => {
  try {
    const db = await getDb()
    db.data.settings = { ...db.data.settings, ...req.body }
    await db.write()
    res.json(db.data.settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/system — system info
router.get('/system', async (req, res) => {
  const os = require('os')
  const db = await getDb()
  const servers = db.data.servers
  res.json({
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalRam: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10,
    freeRam: Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10,
    uptime: Math.floor(os.uptime()),
    loadAvg: os.loadavg(),
    hostname: os.hostname(),
    nodeVersion: process.version,
    stats: {
      totalServers: servers.length,
      onlineServers: servers.filter(s => s.status === 'online').length,
      stoppedServers: servers.filter(s => s.status === 'stopped').length,
      crashedServers: servers.filter(s => s.status === 'crashed').length,
    }
  })
})

module.exports = router
