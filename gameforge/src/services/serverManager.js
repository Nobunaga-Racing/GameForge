const { spawn, execSync } = require('child_process')
const { EventEmitter } = require('events')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('./database')

// Game definitions: SteamAppID, default ports, install args
const GAME_DEFINITIONS = {
  ark: {
    name: 'ARK: Survival Evolved',
    steamAppId: '376030',
    defaultPort: 7777,
    defaultMaxPlayers: 70,
    defaultMap: 'TheIsland',
    startArgs: (cfg) => [
      `${cfg.map}?listen`,
      `-Port=${cfg.port}`,
      `-QueryPort=${cfg.queryPort || cfg.port + 1}`,
      `-MaxPlayers=${cfg.maxPlayers}`,
      cfg.password ? `-ServerPassword=${cfg.password}` : '',
      cfg.adminPassword ? `-ServerAdminPassword=${cfg.adminPassword}` : '',
      `-automanagedmods`,
      `-NoBattlEye`
    ].filter(Boolean),
    executable: 'ShooterGameServer',
    platform: 'linux'
  },
  valheim: {
    name: 'Valheim',
    steamAppId: '896660',
    defaultPort: 2456,
    defaultMaxPlayers: 10,
    startArgs: (cfg) => [
      `-name`, cfg.serverName || cfg.name,
      `-port`, String(cfg.port),
      `-world`, cfg.worldName || 'Dedicated',
      `-password`, cfg.password || '',
      `-public`, cfg.public ? '1' : '0'
    ],
    executable: 'valheim_server.x86_64',
    platform: 'linux'
  },
  minecraft: {
    name: 'Minecraft',
    steamAppId: null, // Not Steam
    defaultPort: 25565,
    defaultMaxPlayers: 20,
    startArgs: (cfg) => [
      `-Xms${cfg.ramMin || '2G'}`,
      `-Xmx${cfg.ramMax || '4G'}`,
      '-jar', 'server.jar', 'nogui'
    ],
    executable: 'java',
    platform: 'all'
  },
  satisfactory: {
    name: 'Satisfactory',
    steamAppId: '1690800',
    defaultPort: 7777,
    defaultMaxPlayers: 4,
    startArgs: (cfg) => [
      `-Port=${cfg.port}`,
      `-log`,
      `-unattended`
    ],
    executable: 'FactoryServer.sh',
    platform: 'linux'
  },
  dayz: {
    name: 'DayZ',
    steamAppId: '223350',
    defaultPort: 2302,
    defaultMaxPlayers: 60,
    startArgs: (cfg) => [
      `-config=serverDZ.cfg`,
      `-port=${cfg.port}`,
      `-profiles=profiles`,
      `-dologs`, `-adminlog`, `-netlog`, `-freezecheck`
    ],
    executable: 'DayZServer',
    platform: 'linux'
  },
  arma3: {
    name: 'Arma 3',
    steamAppId: '233780',
    defaultPort: 2302,
    defaultMaxPlayers: 40,
    startArgs: (cfg) => [
      `-port=${cfg.port}`,
      `-config=server.cfg`,
      `-profiles=profiles`,
      cfg.mods?.length ? `-mod=${cfg.mods.join(';')}` : ''
    ].filter(Boolean),
    executable: 'arma3server_x64',
    platform: 'linux'
  },
  enshrouded: {
    name: 'Enshrouded',
    steamAppId: '2278520',
    defaultPort: 15636,
    defaultMaxPlayers: 16,
    startArgs: (cfg) => [],
    executable: 'enshrouded_server',
    platform: 'linux'
  },
  ets2: {
    name: 'Euro Truck Simulator 2',
    steamAppId: '1948160',
    defaultPort: 27015,
    defaultMaxPlayers: 8,
    startArgs: (cfg) => [],
    executable: 'eurotrucks2_server',
    platform: 'linux'
  },
  ats: {
    name: 'American Truck Simulator',
    steamAppId: '2239530',
    defaultPort: 27015,
    defaultMaxPlayers: 8,
    startArgs: (cfg) => [],
    executable: 'amtrucks_server',
    platform: 'linux'
  },
  fs25: {
    name: 'Farming Simulator 25',
    steamAppId: '2300320',
    defaultPort: 10823,
    defaultMaxPlayers: 16,
    startArgs: (cfg) => [],
    executable: 'dedicatedServer',
    platform: 'linux'
  },
  icarus: {
    name: 'Icarus',
    steamAppId: '2089820',
    defaultPort: 17777,
    defaultMaxPlayers: 8,
    startArgs: (cfg) => [],
    executable: 'IcarusServer.sh',
    platform: 'linux'
  },
  spaceengineers: {
    name: 'Space Engineers',
    steamAppId: '298740',
    defaultPort: 27016,
    defaultMaxPlayers: 16,
    startArgs: (cfg) => [],
    executable: 'SpaceEngineersDedicated.exe',
    platform: 'windows'
  },
  wreckfest: {
    name: 'Wreckfest',
    steamAppId: '870530',
    defaultPort: 33540,
    defaultMaxPlayers: 24,
    startArgs: (cfg) => [],
    executable: 'Wreckfest_server',
    platform: 'linux'
  },
  dune: {
    name: 'Dune: Awakening',
    steamAppId: null,
    defaultPort: 7777,
    defaultMaxPlayers: 40,
    startArgs: (cfg) => [],
    executable: 'DuneServer',
    platform: 'linux'
  }
}

class ServerManager extends EventEmitter {
  constructor() {
    super()
    this.processes = new Map()   // serverId -> ChildProcess
    this.metrics = new Map()     // serverId -> { cpu, ram, players, history }
    this.logBuffers = new Map()  // serverId -> string[]
    this._metricsInterval = null
  }

  getGameDef(gameId) {
    return GAME_DEFINITIONS[gameId] || null
  }

  getAllGameDefs() {
    return GAME_DEFINITIONS
  }

  // ── CREATE SERVER ──────────────────────────────────────────────
  async createServer(data) {
    const db = await getDb()
    const gameDef = GAME_DEFINITIONS[data.gameId]
    if (!gameDef) throw new Error(`Jeu inconnu: ${data.gameId}`)

    const id = uuidv4()
    const serverDir = path.join(process.env.SERVERS_DIR || './data/servers', id)
    fs.mkdirSync(serverDir, { recursive: true })

    const server = {
      id,
      name: data.name,
      gameId: data.gameId,
      gameName: gameDef.name,
      port: data.port || gameDef.defaultPort,
      queryPort: (data.port || gameDef.defaultPort) + 1,
      maxPlayers: data.maxPlayers || gameDef.defaultMaxPlayers,
      map: data.map || gameDef.defaultMap || '',
      password: data.password || '',
      adminPassword: data.adminPassword || '',
      serverName: data.serverName || data.name,
      worldName: data.worldName || 'Dedicated',
      ramMin: data.ramMin || '2G',
      ramMax: data.ramMax || '4G',
      public: data.public !== false,
      autoRestart: data.autoRestart !== false,
      autoUpdate: data.autoUpdate !== false,
      mods: data.mods || [],
      status: 'stopped',
      serverDir,
      installed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStarted: null,
      uptime: 0,
      crashCount: 0,
      template: data.template || null
    }

    db.data.servers.push(server)
    await db.write()

    this._initMetrics(id)
    this.emit('serverCreated', server)
    return server
  }

  // ── INSTALL (SteamCMD) ─────────────────────────────────────────
  async installServer(serverId) {
    const db = await getDb()
    const server = db.data.servers.find(s => s.id === serverId)
    if (!server) throw new Error('Serveur introuvable')

    const gameDef = GAME_DEFINITIONS[server.gameId]
    if (!gameDef?.steamAppId) {
      // Non-Steam game (Minecraft): mark as installed with instructions
      server.installed = true
      server.status = 'stopped'
      await db.write()
      this._addLog(serverId, 'INFO', `${gameDef.name} — installation manuelle requise (non-Steam)`)
      this.emit('serverUpdated', server)
      return server
    }

    server.status = 'installing'
    await db.write()
    this.emit('serverUpdated', server)

    const steamcmd = process.env.STEAMCMD_PATH || '/opt/steamcmd/steamcmd.sh'
    const installDir = server.serverDir

    this._addLog(serverId, 'INFO', `Démarrage installation via SteamCMD — AppID: ${gameDef.steamAppId}`)
    this._addLog(serverId, 'INFO', `Répertoire: ${installDir}`)

    // Check if SteamCMD exists
    if (!fs.existsSync(steamcmd)) {
      this._addLog(serverId, 'WARN', `SteamCMD non trouvé à ${steamcmd} — simulation d'installation`)
      await this._simulateInstall(serverId, server)
      return server
    }

    return new Promise((resolve, reject) => {
      const args = [
        '+force_install_dir', installDir,
        '+login', 'anonymous',
        '+app_update', gameDef.steamAppId, 'validate',
        '+quit'
      ]

      const proc = spawn(steamcmd, args)
      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim())
        lines.forEach(line => this._addLog(serverId, 'INFO', line))
      })
      proc.stderr.on('data', (data) => {
        this._addLog(serverId, 'WARN', data.toString().trim())
      })
      proc.on('close', async (code) => {
        const db2 = await getDb()
        const srv = db2.data.servers.find(s => s.id === serverId)
        if (code === 0) {
          srv.installed = true
          srv.status = 'stopped'
          this._addLog(serverId, 'OK', 'Installation terminée avec succès')
          this.emit('serverUpdated', srv)
          resolve(srv)
        } else {
          srv.status = 'error'
          this._addLog(serverId, 'ERROR', `Échec installation (code: ${code})`)
          this.emit('serverUpdated', srv)
          reject(new Error(`SteamCMD exit code ${code}`))
        }
        await db2.write()
      })
    })
  }

  async _simulateInstall(serverId, server) {
    const steps = [
      'Connexion anonyme à Steam...',
      'Vérification des fichiers...',
      'Téléchargement des dépendances...',
      `Téléchargement de ${server.gameName}...`,
      'Installation en cours (0%)...',
      'Installation en cours (25%)...',
      'Installation en cours (50%)...',
      'Installation en cours (75%)...',
      'Installation en cours (100%)...',
      'Validation des fichiers...',
      'Installation terminée !'
    ]
    for (const step of steps) {
      this._addLog(serverId, 'INFO', step)
      await new Promise(r => setTimeout(r, 300))
    }
    const db = await getDb()
    const srv = db.data.servers.find(s => s.id === serverId)
    srv.installed = true
    srv.status = 'stopped'
    await db.write()
    this.emit('serverUpdated', srv)
    return srv
  }

  // ── START ──────────────────────────────────────────────────────
  async startServer(serverId) {
    const db = await getDb()
    const server = db.data.servers.find(s => s.id === serverId)
    if (!server) throw new Error('Serveur introuvable')
    if (this.processes.has(serverId)) throw new Error('Serveur déjà en cours')

    server.status = 'starting'
    server.lastStarted = new Date().toISOString()
    await db.write()
    this.emit('serverUpdated', server)
    this._addLog(serverId, 'INFO', `Démarrage de ${server.name}...`)

    const gameDef = GAME_DEFINITIONS[server.gameId]
    const execPath = path.join(server.serverDir, gameDef?.executable || 'server')

    // If executable doesn't exist → simulate (dev mode)
    if (!fs.existsSync(execPath) && !fs.existsSync(execPath + '.sh')) {
      this._addLog(serverId, 'WARN', 'Exécutable non trouvé — mode simulation activé')
      await this._simulateRunning(serverId, server, db)
      return server
    }

    const args = gameDef.startArgs(server)
    const proc = spawn(execPath, args, {
      cwd: server.serverDir,
      env: { ...process.env, LD_LIBRARY_PATH: server.serverDir }
    })

    this.processes.set(serverId, proc)
    this._setupProcessHandlers(serverId, proc, server)

    // Mark as online after 3s
    setTimeout(async () => {
      const db2 = await getDb()
      const srv = db2.data.servers.find(s => s.id === serverId)
      if (srv && srv.status === 'starting') {
        srv.status = 'online'
        await db2.write()
        this.emit('serverUpdated', srv)
        this._addLog(serverId, 'OK', `Serveur en ligne sur le port ${srv.port}`)
      }
    }, 3000)

    return server
  }

  async _simulateRunning(serverId, server, db) {
    server.status = 'online'
    await db.write()
    this.emit('serverUpdated', server)
    this._addLog(serverId, 'OK', `[SIM] Serveur ${server.name} en ligne sur :${server.port}`)
    this._addLog(serverId, 'INFO', `[SIM] Map: ${server.map || 'default'}`)
    this._addLog(serverId, 'INFO', `[SIM] MaxPlayers: ${server.maxPlayers}`)

    // Fake process object
    const fakeProc = {
      pid: Math.floor(Math.random() * 90000) + 10000,
      _simulated: true,
      kill: async () => {
        this._addLog(serverId, 'INFO', '[SIM] Signal d\'arrêt envoyé')
        const db2 = await getDb()
        const srv = db2.data.servers.find(s => s.id === serverId)
        if (srv) { srv.status = 'stopped'; await db2.write(); this.emit('serverUpdated', srv) }
        this.processes.delete(serverId)
      }
    }
    this.processes.set(serverId, fakeProc)
  }

  _setupProcessHandlers(serverId, proc, server) {
    proc.stdout?.on('data', (data) => {
      data.toString().split('\n').filter(l => l.trim())
        .forEach(line => this._addLog(serverId, 'INFO', line))
    })
    proc.stderr?.on('data', (data) => {
      data.toString().split('\n').filter(l => l.trim())
        .forEach(line => this._addLog(serverId, 'WARN', line))
    })
    proc.on('close', async (code) => {
      this.processes.delete(serverId)
      const db2 = await getDb()
      const srv = db2.data.servers.find(s => s.id === serverId)
      if (!srv) return
      if (code !== 0 && code !== null) {
        srv.status = 'crashed'
        srv.crashCount = (srv.crashCount || 0) + 1
        this._addLog(serverId, 'ERROR', `Serveur crashé (code: ${code})`)
        this.emit('serverCrashed', srv)
        this._addNotification('error', `Crash détecté: ${srv.name}`, `Code de sortie: ${code}`)
        if (srv.autoRestart) {
          this._addLog(serverId, 'INFO', 'Redémarrage automatique dans 10s...')
          setTimeout(() => this.startServer(serverId).catch(console.error), 10000)
        }
      } else {
        srv.status = 'stopped'
        this._addLog(serverId, 'INFO', 'Serveur arrêté proprement')
      }
      await db2.write()
      this.emit('serverUpdated', srv)
    })
  }

  // ── STOP ───────────────────────────────────────────────────────
  async stopServer(serverId) {
    const proc = this.processes.get(serverId)
    const db = await getDb()
    const server = db.data.servers.find(s => s.id === serverId)
    if (!server) throw new Error('Serveur introuvable')

    this._addLog(serverId, 'INFO', 'Arrêt du serveur...')

    if (proc?._simulated) {
      await proc.kill()
    } else if (proc) {
      proc.kill('SIGTERM')
      setTimeout(() => { if (this.processes.has(serverId)) proc.kill('SIGKILL') }, 10000)
    } else {
      server.status = 'stopped'
      await db.write()
      this.emit('serverUpdated', server)
    }
    return server
  }

  // ── RESTART ────────────────────────────────────────────────────
  async restartServer(serverId) {
    this._addLog(serverId, 'INFO', 'Redémarrage en cours...')
    await this.stopServer(serverId)
    await new Promise(r => setTimeout(r, 2000))
    return this.startServer(serverId)
  }

  // ── SEND COMMAND ───────────────────────────────────────────────
  async sendCommand(serverId, command) {
    const proc = this.processes.get(serverId)
    this._addLog(serverId, 'CMD', `> ${command}`)
    if (proc && !proc._simulated && proc.stdin) {
      proc.stdin.write(command + '\n')
    } else {
      // Simulate response
      await new Promise(r => setTimeout(r, 200))
      this._addLog(serverId, 'OK', `Commande exécutée: ${command}`)
    }
  }

  // ── METRICS ────────────────────────────────────────────────────
  _initMetrics(serverId) {
    this.metrics.set(serverId, {
      cpu: 0, ram: 0, players: 0,
      network: { in: 0, out: 0 },
      history: { cpu: [], ram: [] }
    })
    this.logBuffers.set(serverId, [])
  }

  startMetricsCollection() {
    if (this._metricsInterval) return
    this._metricsInterval = setInterval(() => this._collectMetrics(), 5000)
    console.log('[Metrics] Collection démarrée (intervalle: 5s)')
  }

  async _collectMetrics() {
    const db = await getDb()
    for (const server of db.data.servers) {
      if (server.status !== 'online') continue
      const proc = this.processes.get(server.id)
      let cpu = 0, ram = 0

      if (proc && !proc._simulated && proc.pid) {
        try {
          const statOut = execSync(`ps -p ${proc.pid} -o %cpu,rss --no-headers 2>/dev/null`, { timeout: 1000 }).toString().trim()
          if (statOut) {
            const parts = statOut.split(/\s+/)
            cpu = parseFloat(parts[0]) || 0
            ram = Math.round((parseInt(parts[1]) || 0) / 1024)
          }
        } catch {}
      } else {
        // Simulated metrics
        const m = this.metrics.get(server.id) || {}
        cpu = Math.max(5, Math.min(95, (m.cpu || 30) + (Math.random() - 0.5) * 8))
        ram = Math.max(256, Math.min(7000, (m.ram || 1024) + (Math.random() - 0.5) * 50))
      }

      const m = this.metrics.get(server.id) || { history: { cpu: [], ram: [] } }
      m.cpu = Math.round(cpu * 10) / 10
      m.ram = Math.round(ram)
      m.players = m.players || Math.floor(Math.random() * (server.maxPlayers * 0.3))
      m.history.cpu = [...(m.history.cpu || []).slice(-29), m.cpu]
      m.history.ram = [...(m.history.ram || []).slice(-29), m.ram]
      this.metrics.set(server.id, m)
    }
    this.emit('metricsUpdated', this.getAllMetrics())
  }

  getAllMetrics() {
    const result = {}
    this.metrics.forEach((v, k) => { result[k] = v })
    return result
  }

  getServerMetrics(serverId) {
    return this.metrics.get(serverId) || null
  }

  // ── LOGS ───────────────────────────────────────────────────────
  _addLog(serverId, level, message) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      serverId
    }
    const buf = this.logBuffers.get(serverId) || []
    buf.push(entry)
    if (buf.length > 500) buf.shift()
    this.logBuffers.set(serverId, buf)
    this.emit('log', entry)

    // Persist to file
    const logDir = process.env.LOGS_DIR || './data/logs'
    const logFile = path.join(logDir, `${serverId}.log`)
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(logFile, `[${entry.time}] [${level}] ${message}\n`)
  }

  getLogs(serverId, limit = 100) {
    const buf = this.logBuffers.get(serverId) || []
    return buf.slice(-limit)
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────────
  async _addNotification(type, title, message) {
    const db = await getDb()
    db.data.notifications.unshift({
      id: uuidv4(),
      type, title, message,
      read: false,
      createdAt: new Date().toISOString()
    })
    if (db.data.notifications.length > 100) db.data.notifications = db.data.notifications.slice(0, 100)
    await db.write()
    this.emit('notification', { type, title, message })
  }

  // ── BACKUP ─────────────────────────────────────────────────────
  async createBackup(serverId, label = '') {
    const db = await getDb()
    const server = db.data.servers.find(s => s.id === serverId)
    if (!server) throw new Error('Serveur introuvable')

    const backupDir = process.env.BACKUPS_DIR || './data/backups'
    const backupId = uuidv4()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `${server.gameId}_${server.id}_${timestamp}.json`)
    fs.mkdirSync(backupDir, { recursive: true })

    this._addLog(serverId, 'INFO', 'Création de la sauvegarde...')

    // Save server config as backup (in real scenario, would archive the save files)
    const backupData = {
      serverId, serverName: server.name, gameId: server.gameId,
      config: server, createdAt: new Date().toISOString(), label
    }
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))

    const stats = fs.statSync(backupPath)
    const backup = {
      id: backupId,
      serverId,
      serverName: server.name,
      gameId: server.gameId,
      path: backupPath,
      size: stats.size,
      label: label || `Backup automatique`,
      type: label ? 'manual' : 'auto',
      createdAt: new Date().toISOString()
    }

    db.data.backups.unshift(backup)
    await db.write()
    this._addLog(serverId, 'OK', `Sauvegarde créée (${Math.round(stats.size / 1024)} KB)`)
    this.emit('backupCreated', backup)
    return backup
  }

  async restoreBackup(backupId) {
    const db = await getDb()
    const backup = db.data.backups.find(b => b.id === backupId)
    if (!backup) throw new Error('Sauvegarde introuvable')
    if (!fs.existsSync(backup.path)) throw new Error('Fichier de sauvegarde introuvable sur le disque')

    const data = JSON.parse(fs.readFileSync(backup.path, 'utf-8'))
    const server = db.data.servers.find(s => s.id === backup.serverId)
    if (server) {
      Object.assign(server, data.config, { id: server.id, status: 'stopped' })
      await db.write()
    }
    return backup
  }
}

// Singleton
const serverManager = new ServerManager()
module.exports = serverManager
