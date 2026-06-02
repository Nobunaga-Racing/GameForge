import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
})

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gf_token')
      localStorage.removeItem('gf_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login:   (data)    => api.post('/auth/login', data),
  me:      ()        => api.get('/auth/me'),
  users:   ()        => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  deleteUser: (id)   => api.delete(`/auth/users/${id}`),
}

// ── Servers ───────────────────────────────────────────────────
export const serversApi = {
  list:       ()          => api.get('/servers'),
  games:      ()          => api.get('/servers/games'),
  get:        (id)        => api.get(`/servers/${id}`),
  create:     (data)      => api.post('/servers', data),
  update:     (id, data)  => api.patch(`/servers/${id}`, data),
  delete:     (id)        => api.delete(`/servers/${id}`),
  install:    (id)        => api.post(`/servers/${id}/install`),
  start:      (id)        => api.post(`/servers/${id}/start`),
  stop:       (id)        => api.post(`/servers/${id}/stop`),
  restart:    (id)        => api.post(`/servers/${id}/restart`),
  command:    (id, cmd)   => api.post(`/servers/${id}/command`, { command: cmd }),
  logs:       (id, n=100) => api.get(`/servers/${id}/logs?limit=${n}`),
  metrics:    (id)        => api.get(`/servers/${id}/metrics`),
  backup:     (id, label) => api.post(`/servers/${id}/backup`, { label }),
}

// ── Backups ───────────────────────────────────────────────────
export const backupsApi = {
  list:    (serverId) => api.get(`/backups${serverId ? `?serverId=${serverId}` : ''}`),
  restore: (id)       => api.post(`/backups/${id}/restore`),
  delete:  (id)       => api.delete(`/backups/${id}`),
}

// ── Mods ──────────────────────────────────────────────────────
export const modsApi = {
  list:   (serverId) => api.get(`/mods${serverId ? `?serverId=${serverId}` : ''}`),
  add:    (data)     => api.post('/mods', data),
  update: (id, data) => api.patch(`/mods/${id}`, data),
  delete: (id)       => api.delete(`/mods/${id}`),
}

// ── System ────────────────────────────────────────────────────
export const systemApi = {
  info:          () => api.get('/system'),
  settings:      () => api.get('/settings'),
  saveSettings:  (d) => api.patch('/settings', d),
  notifications: () => api.get('/notifications'),
  markAllRead:   () => api.patch('/notifications/read-all'),
}

// ── WebSocket ─────────────────────────────────────────────────
export function createWS(token) {
  const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000')
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
  return new WebSocket(`${wsBase}/ws?token=${token}`)
}
