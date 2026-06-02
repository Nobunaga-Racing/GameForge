require('dotenv').config()

const express = require('express')
const http = require('http')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const fs = require('fs')

const { getDb } = require('./src/services/database')
const serverManager = require('./src/services/serverManager')
const { setupWebSocket } = require('./src/services/websocket')
const { startScheduler } = require('./src/services/scheduler')

const authRoutes = require('./src/routes/auth')
const serverRoutes = require('./src/routes/servers')
const apiRoutes = require('./src/routes/api')

const PORT = process.env.PORT || 3000

async function bootstrap() {
  // Ensure data directories exist
  const dirs = ['./data', './data/servers', './data/backups', './data/logs']
  dirs.forEach(d => fs.mkdirSync(d, { recursive: true }))

  // Init DB
  await getDb()

  const app = express()
  const server = http.createServer(app)

  // ── MIDDLEWARE ─────────────────────────────────────────────────
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    credentials: true
  }))
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(morgan('dev'))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // ── STATIC FRONTEND ────────────────────────────────────────────
  const publicDir = path.join(__dirname, 'public')
  app.use(express.static(publicDir))

  // ── API ROUTES ─────────────────────────────────────────────────
  app.use('/api/auth', authRoutes)
  app.use('/api/servers', serverRoutes)
  app.use('/api', apiRoutes)

  // ── HEALTH CHECK ───────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
  })

  // ── SPA FALLBACK ───────────────────────────────────────────────
  app.get('/{*splat}', (req, res) => {
    const indexPath = path.join(publicDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.json({
        message: 'GameForge API is running',
        version: '1.0.0',
        docs: 'GET /api/servers, POST /api/auth/login',
        ws: 'ws://localhost:' + PORT + '/ws?token=YOUR_JWT'
      })
    }
  })

  // ── ERROR HANDLER ──────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('[Error]', err.message)
    res.status(err.status || 500).json({ error: err.message || 'Erreur interne' })
  })

  // ── WEBSOCKET ──────────────────────────────────────────────────
  setupWebSocket(server)

  // ── METRICS COLLECTION ─────────────────────────────────────────
  serverManager.startMetricsCollection()

  // ── SCHEDULER ──────────────────────────────────────────────────
  await startScheduler()

  // ── INIT METRICS FOR EXISTING SERVERS ─────────────────────────
  const db = await getDb()
  db.data.servers.forEach(s => serverManager._initMetrics(s.id))

  // ── START ──────────────────────────────────────────────────────
  server.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗')
    console.log('║         🎮  GameForge v1.0.0             ║')
    console.log('╠══════════════════════════════════════════╣')
    console.log(`║  API    → http://localhost:${PORT}          ║`)
    console.log(`║  WS     → ws://localhost:${PORT}/ws         ║`)
    console.log(`║  Login  → admin / admin                  ║`)
    console.log('╚══════════════════════════════════════════╝\n')
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Server] Arrêt gracieux...')
    const db = await getDb()
    for (const srv of db.data.servers.filter(s => s.status === 'online')) {
      await serverManager.stopServer(srv.id).catch(console.error)
    }
    process.exit(0)
  })
}

bootstrap().catch(err => {
  console.error('[FATAL]', err)
  process.exit(1)
})
