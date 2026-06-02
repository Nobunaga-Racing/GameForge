const jwt = require('jsonwebtoken')
const { getDb } = require('../services/database')

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const db = await getDb()
    const user = db.data.users.find(u => u.id === payload.userId)
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' })
    req.user = { id: user.id, username: user.username, role: user.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }
    next()
  }
}

module.exports = { authMiddleware, requireRole }
