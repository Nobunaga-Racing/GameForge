import { StatCard, SectionHeader, AlertItem } from '../components/ui'
import { ServerCard, AddServerCard } from '../components/servers/ServerCard'
import { Console } from '../components/servers/Console'

export default function Dashboard({ servers, onRefresh, onNewServer, notifications }) {
  const online  = servers.filter(s => s.status === 'online')
  const players = servers.reduce((acc, s) => acc + (s.metrics?.players || 0), 0)
  const avgCpu  = online.length
    ? Math.round(online.reduce((a, s) => a + (s.metrics?.cpu || 0), 0) / online.length)
    : 0
  const totalRam = online.reduce((a, s) => a + (s.metrics?.ram || 0), 0)

  const firstOnline = online[0]

  return (
    <div className="animate-fade-in">
      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="SERVEURS TOTAUX" value={servers.length} sub={`${online.length} en ligne`}     accent="cyan"  icon="⬡" />
        <StatCard label="EN LIGNE"         value={online.length}  sub={`${servers.length} total`}       accent="neon"  icon="◈" />
        <StatCard label="JOUEURS"          value={players}        sub="connectés en ce moment"          accent="flame" icon="◎" />
        <StatCard label="CPU MOYEN"        value={`${avgCpu}%`}   sub={`RAM: ${Math.round(totalRam/1024*10)/10} GB`} accent="grape" icon="◫" />
      </div>

      {/* Servers grid */}
      <SectionHeader title="Serveurs" sub={`${online.length} en fonctionnement`}>
        <button className="btn btn-ghost btn-sm">Tout arrêter</button>
        <button className="btn btn-ghost btn-sm">Filtrer</button>
      </SectionHeader>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {servers.map(s => (
          <ServerCard key={s.id} server={s} onRefresh={onRefresh} />
        ))}
        <AddServerCard onClick={onNewServer} />
      </div>

      {/* Alerts + Console */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <SectionHeader title="Alertes récentes">
            <button className="btn btn-ghost btn-sm">Tout voir</button>
          </SectionHeader>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {notifications.length === 0 && (
              <div style={{ color:'var(--text-muted)', fontSize:13, padding:'12px 0' }}>Aucune alerte récente</div>
            )}
            {notifications.slice(0, 4).map((n, i) => (
              <AlertItem key={i} type={n.type} title={n.title} message={n.message}
                time={timeAgo(n.createdAt)} />
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title={firstOnline ? `Console — ${firstOnline.name}` : 'Console'}>
            <button className="btn btn-ghost btn-sm">Plein écran</button>
          </SectionHeader>
          {firstOnline
            ? <Console serverId={firstOnline.id} />
            : <div style={{ fontSize:13, color:'var(--text-muted)', padding:'12px 0' }}>Aucun serveur en ligne</div>
          }
        </div>
      </div>
    </div>
  )
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)   return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff/60)}min`
  return `${Math.floor(diff/3600)}h`
}
