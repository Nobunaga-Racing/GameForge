import { useState, useEffect, useRef } from 'react'
import { serversApi } from '../../lib/api'
import { useWebSocket } from '../../hooks/useWebSocket'

export function Console({ serverId, height = 220 }) {
  const [logs, setLogs]     = useState([])
  const [cmd, setCmd]       = useState('')
  const bodyRef             = useRef(null)
  const { on, subscribe, send } = useWebSocket()

  useEffect(() => {
    if (!serverId) return
    // Load history
    serversApi.logs(serverId, 50).then(r => setLogs(r.data)).catch(() => {})
    // Subscribe to live logs
    subscribe(serverId)
  }, [serverId])

  useEffect(() => {
    const unsub = on('log', (entry) => {
      if (entry.serverId !== serverId) return
      setLogs(prev => [...prev.slice(-499), entry])
    })
    return unsub
  }, [serverId])

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [logs])

  async function sendCmd(e) {
    if (e.key !== 'Enter' || !cmd.trim()) return
    send({ type: 'command', serverId, command: cmd })
    setCmd('')
  }

  const levelStyle = {
    OK:    { color: 'var(--neon)' },
    INFO:  { color: 'var(--cyan)' },
    WARN:  { color: 'var(--gold)' },
    ERROR: { color: 'var(--red)' },
    CMD:   { color: 'var(--grape)' },
  }

  return (
    <div style={{ background:'var(--bg-deep)', border:'1px solid var(--border-faint)', borderRadius:14, overflow:'hidden' }}>
      {/* Title bar */}
      <div style={{ display:'flex', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--border-faint)', background:'var(--bg-panel)', gap:8 }}>
        {['#ff5f56','#ffbd2e','#27c93f'].map(c => (
          <span key={c} style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }} />
        ))}
        <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:6, fontFamily:'JetBrains Mono' }}>
          server.log
        </span>
        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--neon)', fontFamily:'JetBrains Mono' }} className="pulse-dot">
          ● LIVE
        </span>
      </div>

      {/* Log body */}
      <div ref={bodyRef} style={{ height, overflowY:'auto', padding:'12px 16px', fontFamily:'JetBrains Mono', fontSize:12, lineHeight:1.8 }}>
        {logs.length === 0 && (
          <div style={{ color:'var(--text-muted)' }}>En attente de logs...</div>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ display:'flex', gap:10 }}>
            <span style={{ color:'var(--text-muted)', flexShrink:0 }}>
              {new Date(l.time).toTimeString().slice(0,8)}
            </span>
            <span style={{ ...(levelStyle[l.level] || {}), flexShrink:0, minWidth:50 }}>
              [{l.level}]
            </span>
            <span style={{ color:'var(--text-secondary)' }}>{l.message}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border-faint)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ color:'var(--cyan)', fontFamily:'JetBrains Mono', fontSize:13 }}>$</span>
        <input
          style={{ flex:1, background:'transparent', border:'none', outline:'none',
            color:'var(--text-primary)', fontFamily:'JetBrains Mono', fontSize:13 }}
          placeholder="Entrer une commande..."
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={sendCmd}
        />
      </div>
    </div>
  )
}
