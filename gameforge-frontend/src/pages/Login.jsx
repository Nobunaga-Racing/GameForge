import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Identifiants incorrects')
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-void)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        top: '30%', left: '40%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      <div style={{ width: 380, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--cyan), var(--grape))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>⚙</div>
          <h1 className="font-display font-extrabold text-[28px]" style={{ letterSpacing: '-1px' }}>
            GameForge
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Game Server Manager
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
          borderRadius: 18, padding: '28px 28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <h2 className="font-display font-bold text-[17px] mb-5" style={{ letterSpacing: '-0.3px' }}>
            Connexion
          </h2>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Nom d'utilisateur
              </label>
              <input className="input" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin" autoFocus autoComplete="username" required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Mot de passe
              </label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 14 }}>
              {loading ? '⏳ Connexion...' : '→ Se connecter'}
            </button>
          </form>

          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-elevated)',
            borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            Défaut : admin / admin
          </div>
        </div>
      </div>
    </div>
  )
}
