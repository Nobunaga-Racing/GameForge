const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../services/database')
const { authMiddleware, requireRole } = require('../middleware/auth')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Champs requis manquants' })

    const db = await getDb()
    const user = db.data.users.find(u => u.username === username)
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, email: user.email }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const db = await getDb()
  const user = db.data.users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'Introuvable' })
  res.json({ id: user.id, username: user.username, role: user.role, email: user.email })
})

// POST /api/auth/users  (superadmin only)
router.post('/users', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const { username, password, role, email } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username et password requis' })
    const db = await getDb()
    if (db.data.users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = { id: uuidv4(), username, password: hash, role: role || 'operator', email: email || '', createdAt: new Date().toISOString() }
    db.data.users.push(user)
    await db.write()
    res.status(201).json({ id: user.id, username: user.username, role: user.role, email: user.email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/users
router.get('/users', authMiddleware, requireRole('superadmin'), async (req, res) => {
  const db = await getDb()
  res.json(db.data.users.map(u => ({ id: u.id, username: u.username, role: u.role, email: u.email, createdAt: u.createdAt })))
})

// DELETE /api/auth/users/:id
router.delete('/users/:id', authMiddleware, requireRole('superadmin'), async (req, res) => {
  const db = await getDb()
  const idx = db.data.users.findIndex(u => u.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' })
  if (db.data.users[idx].username === 'admin') return res.status(403).json({ error: 'Impossible de supprimer l\'admin principal' })
  db.data.users.splice(idx, 1)
  await db.write()
  res.json({ success: true })
})

module.exports = router
