const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')
const { join } = require('path')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')

const DB_PATH = process.env.DB_PATH || './data/gameforge.json'

let db

async function getDb() {
  if (db) return db
  const adapter = new JSONFile(DB_PATH)
  db = new Low(adapter, getDefaultData())
  await db.read()

  // Merge defaults for any missing keys
  const defaults = getDefaultData()
  for (const key of Object.keys(defaults)) {
    if (db.data[key] === undefined) {
      db.data[key] = defaults[key]
    }
  }

  // Seed default admin if no users
  if (db.data.users.length === 0) {
    const hash = await bcrypt.hash('admin', 10)
    db.data.users.push({
      id: uuidv4(),
      username: 'admin',
      password: hash,
      role: 'superadmin',
      email: 'admin@gameforge.local',
      createdAt: new Date().toISOString()
    })
    await db.write()
    console.log('[DB] Admin user created — login: admin / password: admin')
  }

  await db.write()
  return db
}

function getDefaultData() {
  return {
    users: [],
    servers: [],
    backups: [],
    mods: [],
    notifications: [],
    settings: {
      steamcmdPath: '/opt/steamcmd/steamcmd.sh',
      serversDir: './data/servers',
      backupsDir: './data/backups',
      discord: { enabled: false, webhookUrl: '', channelLogs: '', channelAlerts: '' },
      notifications: {
        serverCrash: true,
        updateAvailable: true,
        cpuHigh: true,
        backupDone: false
      }
    }
  }
}

module.exports = { getDb }
