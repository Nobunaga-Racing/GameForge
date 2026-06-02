import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = {
  '/':            ['Dashboard',    'Vue globale de tous les serveurs'],
  '/monitoring':  ['Monitoring',   'CPU, RAM, réseau en temps réel'],
  '/mods':        ['Mods & Workshop', 'Gestion des modifications'],
  '/backups':     ['Sauvegardes',  'Historique et restauration'],
  '/marketplace': ['Marketplace',  'Templates communautaires'],
  '/settings':    ['Paramètres',   'Configuration de GameForge'],
}

export function Topbar({ onNewServer, notifications = [], connected }) {
  const { pathname } = useLocation()
  const [title, sub] = TITLES[pathname] || ['Serveur', 'Gestion du serveur']
  const unread = notifications.filter(n => !n.read).length

  return (
    <header style={{
      height: 60, minHeight: 60,
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border-faint)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16, zIndex: 5,
    }}>
      <div>
        <div className="font-display font-bold text-[16px]" style={{ letterSpacing:'-0.3px' }}>{title}</div>
        <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:4 }}>{sub}</span>
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        {/* WS status */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: connected ? 'var(--neon)' : 'var(--text-muted)' }}>
          <span className={connected ? 'pulse-dot' : ''} style={{
            width:6, height:6, borderRadius:'50%',
            background: connected ? 'var(--neon)' : 'var(--text-muted)',
            display:'inline-block'
          }} />
          {connected ? 'Live' : 'Déconnecté'}
        </div>

        {/* Notifications bell */}
        <div style={{ position:'relative' }}>
          <button className="btn btn-ghost btn-icon" style={{ fontSize:16 }}>🔔</button>
          {unread > 0 && (
            <span style={{
              position:'absolute', top:4, right:4,
              width:7, height:7, background:'var(--red)',
              borderRadius:'50%', border:'1.5px solid var(--bg-deep)',
              boxShadow:'0 0 6px var(--red)'
            }} />
          )}
        </div>

        <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
          ↻ Rafraîchir
        </button>
        <button className="btn btn-primary btn-sm" onClick={onNewServer}>
          + Nouveau serveur
        </button>
      </div>
    </header>
  )
}
