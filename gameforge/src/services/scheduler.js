const cron = require('node-cron')
const { getDb } = require('./database')
const serverManager = require('./serverManager')

const scheduledTasks = new Map()

async function startScheduler() {
  console.log('[Scheduler] Démarrage du planificateur de tâches')

  // Auto-backup every 2 hours for running servers
  cron.schedule('0 */2 * * *', async () => {
    console.log('[Scheduler] Exécution des sauvegardes automatiques')
    const db = await getDb()
    for (const server of db.data.servers) {
      if (server.status === 'online' && server.autoBackup !== false) {
        try {
          await serverManager.createBackup(server.id, 'Sauvegarde automatique')
          console.log(`[Scheduler] Backup créé: ${server.name}`)
        } catch (err) {
          console.error(`[Scheduler] Erreur backup ${server.name}:`, err.message)
        }
      }
    }
  })

  // Clean old backups every day at 3am (keep last 10 per server)
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Nettoyage des vieilles sauvegardes')
    const db = await getDb()
    const byServer = {}
    db.data.backups.forEach(b => {
      if (!byServer[b.serverId]) byServer[b.serverId] = []
      byServer[b.serverId].push(b)
    })
    let removed = 0
    for (const [serverId, backups] of Object.entries(byServer)) {
      const sorted = backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const toRemove = sorted.slice(10) // keep 10 most recent
      toRemove.forEach(b => {
        const idx = db.data.backups.findIndex(x => x.id === b.id)
        if (idx !== -1) { db.data.backups.splice(idx, 1); removed++ }
      })
    }
    if (removed > 0) {
      await db.write()
      console.log(`[Scheduler] ${removed} backup(s) supprimé(s)`)
    }
  })

  // Check for crashed servers every minute + auto-restart
  cron.schedule('* * * * *', async () => {
    const db = await getDb()
    for (const server of db.data.servers) {
      if (server.status === 'crashed' && server.autoRestart) {
        const lastCrash = server.lastCrashAt ? new Date(server.lastCrashAt) : null
        const now = new Date()
        // Auto-restart if crashed more than 1 minute ago (avoid crash loop)
        if (!lastCrash || (now - lastCrash) > 60000) {
          console.log(`[Scheduler] Auto-restart: ${server.name}`)
          server.lastCrashAt = now.toISOString()
          await db.write()
          serverManager.startServer(server.id).catch(e => console.error('[Scheduler]', e.message))
        }
      }
    }
  })

  // Check server health every 30s (detect frozen processes)
  cron.schedule('*/30 * * * * *', async () => {
    const db = await getDb()
    for (const server of db.data.servers) {
      if (server.status === 'online') {
        const metrics = serverManager.getServerMetrics(server.id)
        // Could add logic to detect frozen servers here
      }
    }
  })

  console.log('[Scheduler] Tâches planifiées:')
  console.log('  - Sauvegardes auto: toutes les 2h')
  console.log('  - Nettoyage backups: quotidien à 3h')
  console.log('  - Vérification crashes: chaque minute')
}

module.exports = { startScheduler }
