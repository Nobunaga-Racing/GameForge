import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'

const NAV = [
  { to: '/',            icon: '⬡', label: 'Dashboard' },
  { to: '/monitoring',  icon: '◈', label: 'Monitoring' },
  { to: '/mods',        icon: '◧', label: 'Mods & Workshop' },
  { to: '/backups',     icon: '◫', label: 'Sauvegardes' },
  { to: '/marketplace', icon: '◈', label: 'Marketplace' },
  { to: '/settings',    icon: '◎', label: 'Paramètres' },
]

export function Sidebar({ servers = [], onlineCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const statusDot = (status) => {
    const colors = { online:'var(--neon)', crashed:'var(--red)', installing:'var(--grape)' }
    const glow   = { online:`0 0 6px var(--neon)`, crashed:`0 0 6px var(--red)` }
    return (
      <span style={{
        width:8, height:8, borderRadius:'50%', flexShrink:0,
        background: colors[status] || 'var(--text-muted)',
        boxShadow: glow[status] || 'none',
        display:'inline-block'
      }} />
    )
  }

  return (
    <aside style={{
      width: 260, minWidth: 260,
      background: 'var(--bg-deep)',
      borderRight: '1px solid var(--border-faint)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      position: 'relative', zIndex: 10,
    }}>

      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border-faint)' }}>
        <div className="flex items-center gap-2.5 font-display font-extrabold text-[18px]" style={{ letterSpacing:'-0.5px' }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: 'linear-gradient(135deg, var(--cyan), var(--grape))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, flexShrink:0
          }}>⚙</div>
          GameForge
          <span style={{
            fontSize:9, fontWeight:600, background:'var(--cyan-dim)',
            color:'var(--cyan)', border:'1px solid rgba(0,212,255,0.2)',
            padding:'2px 5px', borderRadius:4, letterSpacing:'0.5px', marginLeft:'auto'
          }}>v1.0</span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ padding:'12px 12px 0' }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase',
          color:'var(--text-muted)', padding:'6px 8px 4px', fontFamily:'JetBrains Mono, monospace' }}>
          Navigation
        </div>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10,
            padding:'8px 10px', borderRadius:10, cursor:'pointer',
            transition:'all 0.15s', textDecoration:'none', marginBottom:1,
            color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
            background: isActive ? 'var(--cyan-dim)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(0,212,255,0.2)' : 'transparent'}`,
            fontSize:13.5,
          })}>
            <span style={{ width:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Servers list */}
      <nav style={{ padding:'8px 12px 0', marginTop:8 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase',
          color:'var(--text-muted)', padding:'6px 8px 4px', fontFamily:'JetBrains Mono, monospace' }}>
          Serveurs ({onlineCount} en ligne)
        </div>
        {servers.length === 0 && (
          <div style={{ fontSize:12, color:'var(--text-muted)', padding:'8px 10px' }}>
            Aucun serveur — créez-en un !
          </div>
        )}
        {servers.map(srv => (
          <NavLink key={srv.id} to={`/servers/${srv.id}`} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10,
            padding:'7px 10px', borderRadius:10, cursor:'pointer',
            transition:'all 0.15s', textDecoration:'none', marginBottom:1,
            color: isActive ? 'var(--grape)' : 'var(--text-secondary)',
            background: isActive ? 'var(--grape-dim)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(155,110,255,0.2)' : 'transparent'}`,
            fontSize:12.5,
          })}>
            {statusDot(srv.status)}
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {srv.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ marginTop:'auto', padding:12, borderTop:'1px solid var(--border-faint)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, cursor:'pointer' }}
             onClick={() => navigate('/settings')}>
          <div style={{
            width:30, height:30, borderRadius:'50%',
            background: 'linear-gradient(135deg, var(--cyan), var(--grape))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700, flexShrink:0
          }}>
            {user?.username?.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {user?.username}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{user?.role}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); logout() }}
            className="btn btn-ghost btn-sm" title="Déconnexion">⏏</button>
        </div>
      </div>
    </aside>
  )
}
