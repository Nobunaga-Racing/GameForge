import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { StatCard, SectionHeader, ConfigCard, ProgressBar } from '../components/ui'
import { systemApi } from '../lib/api'

export default function Monitoring({ servers }) {
  const [sysInfo, setSysInfo] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    systemApi.info().then(r => setSysInfo(r.data)).catch(() => {})
  }, [])

  // Build history from server metrics
  useEffect(() => {
    const point = { time: new Date().toLocaleTimeString().slice(0, 5) }
    servers.filter(s => s.status === 'online').forEach(s => {
      point[s.name.slice(0, 10)] = Math.round(s.metrics?.cpu || 0)
    })
    setHistory(prev => [...prev.slice(-19), point])
  }, [servers])

  const online = servers.filter(s => s.status === 'online')
  const totalPlayers = servers.reduce((a, s) => a + (s.metrics?.players || 0), 0)
  const totalRam = online.reduce((a, s) => a + (s.metrics?.ram || 0), 0)
  const avgCpu = online.length
    ? Math.round(online.reduce((a, s) => a + (s.metrics?.cpu || 0), 0) / online.length)
    : 0

  const COLORS = ['var(--cyan)', 'var(--neon)', 'var(--grape)', 'var(--flame)', 'var(--gold)']

  const tooltipStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 12,
  }

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="CPU GLOBAL"      value={`${avgCpu}%`}                          sub={`${online.length} serveurs actifs`}          accent="cyan"  icon="◈" />
        <StatCard label="RAM GLOBALE"     value={`${Math.round(totalRam/1024*10)/10}GB`} sub={`/ ${sysInfo?.totalRam || '?'} GB total`}    accent="grape" icon="◫" />
        <StatCard label="JOUEURS"         value={totalPlayers}                           sub="connectés en ce moment"                      accent="neon"  icon="◎" />
        <StatCard label="STOCKAGE"        value="—"                                      sub="données non disponibles"                     accent="flame" icon="◧" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div className="card p-4">
          <div className="font-mono text-[12px] mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
            CPU PAR SERVEUR — EN TEMPS RÉEL
          </div>
          {history.length < 2 ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              En attente de données...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={history}>
                <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                {online.map((s, i) => (
                  <Line key={s.id} type="monotone" dataKey={s.name.slice(0, 10)}
                    stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <div className="font-mono text-[12px] mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
            ÉTAT DES SERVEURS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {servers.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun serveur configuré</div>
            )}
            {servers.map((s, i) => (
              <div key={s.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: COLORS[i % COLORS.length] }}>
                    {Math.round(s.metrics?.cpu || 0)}%
                  </span>
                </div>
                <ProgressBar value={s.metrics?.cpu || 0} color={COLORS[i % COLORS.length]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System info + RAM per server */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ConfigCard title="Informations système" icon="🖥️">
          {sysInfo ? [
            ['Plateforme',   sysInfo.platform],
            ['Architecture', sysInfo.arch],
            ['CPUs',         sysInfo.cpus],
            ['RAM totale',   `${sysInfo.totalRam} GB`],
            ['RAM libre',    `${sysInfo.freeRam} GB`],
            ['Node.js',      sysInfo.nodeVersion],
            ['Hostname',     sysInfo.hostname],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-faint)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{v}</span>
            </div>
          )) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement...</div>}
        </ConfigCard>

        <ConfigCard title="RAM par serveur" icon="💾">
          {servers.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun serveur</div>}
          {servers.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 12 }}>
              <ProgressBar
                label={s.name}
                value={s.metrics?.ram || 0}
                max={8192}
                color={COLORS[i % COLORS.length]}
                showVal
              />
            </div>
          ))}
        </ConfigCard>
      </div>
    </div>
  )
}
