import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('gf_user') || 'null'))
  const [token, setToken]     = useState(() => localStorage.getItem('gf_token') || null)
  const [loading, setLoading] = useState(false)

  async function login(username, password) {
    setLoading(true)
    try {
      const { data } = await authApi.login({ username, password })
      localStorage.setItem('gf_token', data.token)
      localStorage.setItem('gf_user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('gf_token')
    localStorage.removeItem('gf_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === 'superadmin' }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
