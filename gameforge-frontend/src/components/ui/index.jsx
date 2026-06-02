// Stat card
export function StatCard({ label, value, sub, accent = 'cyan', icon }) {
  const accents = {
    cyan:   'bg-cyan',
    neon:   'bg-neon',
    flame:  'bg-flame',
    grape:  'bg-grape',
  }
  const colors = {
    cyan:  'var(--cyan)',
    neon:  'var(--neon)',
    flame: 'var(--flame)',
    grape: 'var(--grape)',
  }
  return (
    <div className="card p-5 relative overflow-hidden">
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background: colors[accent], opacity:0.7 }} />
      <div className="font-mono text-[11px] mb-2" style={{ color:'var(--text-muted)', letterSpacing:'0.3px' }}>{label}</div>
      <div className="font-display text-[28px] font-extrabold" style={{ letterSpacing:'-1px' }}>{value}</div>
      {sub && <div className="text-[11.5px] mt-1" style={{ color:'var(--text-secondary)' }}>{sub}</div>}
      {icon && <div className="absolute top-4 right-4 text-[22px] opacity-20">{icon}</div>}
    </div>
  )
}

// Section header
export function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="font-display font-bold text-[15px]" style={{ letterSpacing:'-0.2px' }}>{title}</h2>
        {sub && <p className="text-[12px] mt-0.5" style={{ color:'var(--text-muted)' }}>{sub}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    online:     'badge-online',
    offline:    'badge-offline',
    stopped:    'badge-offline',
    starting:   'badge-starting',
    crashed:    'badge-crashed',
    installing: 'badge-installing',
    error:      'badge-crashed',
  }
  const labels = {
    online:'Online', offline:'Offline', stopped:'Arrêté',
    starting:'Démarrage', crashed:'Crash', installing:'Installation', error:'Erreur'
  }
  return (
    <span className={`badge ${map[status] || 'badge-offline'}`}>
      <span className="badge-dot" />
      {labels[status] || status}
    </span>
  )
}

// Progress bar
export function ProgressBar({ value, max = 100, color = 'var(--cyan)', label, showVal }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="mb-3">
      {(label || showVal) && (
        <div className="flex justify-between text-[11px] mb-1" style={{ color:'var(--text-secondary)' }}>
          {label && <span>{label}</span>}
          {showVal && <span style={{ color }}>{value}{typeof max === 'number' && max !== 100 ? ` / ${max}` : '%'}</span>}
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width:`${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// Toggle switch
export function Toggle({ value, onChange }) {
  return (
    <div
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => onChange?.(!value)}
    />
  )
}

// Form group
export function FormGroup({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

// Card with title
export function ConfigCard({ title, icon, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-[13.5px] mb-4 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

// Toggle row (label + description + toggle)
export function ToggleRow({ title, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor:'var(--border-faint)' }}>
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        {desc && <div className="text-[11.5px] mt-0.5" style={{ color:'var(--text-muted)' }}>{desc}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

// Empty state
export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-[40px] mb-3 opacity-30">{icon}</div>
      <h3 className="text-[15px] font-semibold mb-1.5" style={{ color:'var(--text-secondary)' }}>{title}</h3>
      <p className="text-[13px]" style={{ color:'var(--text-muted)' }}>{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Alert item
export function AlertItem({ type, title, message, time }) {
  const styles = {
    error:   { bg: 'var(--red-dim)',   border: 'rgba(255,59,92,0.2)',  icon: '💥' },
    warn:    { bg: 'var(--gold-dim)',  border: 'rgba(255,214,10,0.2)', icon: '⚠️' },
    info:    { bg: 'var(--cyan-dim)',  border: 'rgba(0,212,255,0.2)',  icon: 'ℹ️' },
    success: { bg: 'var(--neon-dim)',  border: 'rgba(0,255,148,0.2)',  icon: '✓' },
  }
  const s = styles[type] || styles.info
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl text-[13px]"
         style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-base flex-shrink-0">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{title}</div>
        {message && <div className="text-[12px] mt-0.5" style={{ color:'var(--text-secondary)' }}>{message}</div>}
      </div>
      {time && <span className="font-mono text-[11px] flex-shrink-0" style={{ color:'var(--text-muted)' }}>{time}</span>}
    </div>
  )
}

// Spinner
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid var(--border-subtle)',
      borderTopColor: 'var(--cyan)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
  )
}

// Game icon badge
export function GameIcon({ gameId, size = 42 }) {
  const icons = {
    ark:'🦕', valheim:'⚔️', minecraft:'⛏️', satisfactory:'🏭',
    dayz:'🧟', arma3:'🪖', enshrouded:'🌫️', ets2:'🚛',
    ats:'🚚', fs25:'🚜', icarus:'🌙', spaceengineers:'🚀',
    wreckfest:'🏎️', dune:'🏜️',
  }
  return (
    <div style={{ width:size, height:size, borderRadius:10, background:'var(--bg-elevated)',
      border:'1px solid var(--border-faint)', display:'flex', alignItems:'center',
      justifyContent:'center', fontSize: size * 0.46, flexShrink:0 }}>
      {icons[gameId] || '🎮'}
    </div>
  )
}
