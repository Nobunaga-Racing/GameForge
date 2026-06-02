import { useNavigate } from 'react-router-dom'
import { serversApi } from '../../lib/api'
import { StatusBadge, GameIcon, ProgressBar } from '../ui'
import toast from 'react-hot-toast'

export function ServerCard({ server, onRefresh }) {
  const navigate = useNavigate()
  const m = server.metrics || {}

  async function action(fn, label) {
    try {
      await fn()
      toast.success(label)
      setTimeout(onRefresh, 800)
    } catch (e) {
      toast.error(e.response?.data?.error || e.message)
    }
  }

  return (
    <div className="card p-4 cursor-pointer hover:border-medium transition-all duration-200"
         style={{ ':hover': { transform:'translateY(-1px)' } }}
         onClick={() => navigate(`/servers/${server.id}`)}>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <GameIcon gameId={server.gameId} />
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-[14px] truncate">{server.name}</div>
          <div className="text-[11.5px] mt-0.5" style={{ color:'var(--text-muted)' }}>{server.gameName}</div>
        </div>
        <StatusBadge status={server.status} />
      </div>

      {/* Crash message */}
      {server.status === 'crashed' && (
        <div className="text-[12px] p-2.5 rounded-lg mb-3" style={{
          background:'var(--red-dim)', border:'1px solid rgba(255,59,92,0.2)', color:'var(--red)'
        }}>
          ⚠ Crash détecté — vérifiez les logs
        </div>
      )}

      {/* Metrics */}
      {server.status === 'online' && (
        <>
          <ProgressBar label="CPU" value={m.cpu || 0} color="var(--cyan)" showVal />
          <ProgressBar label="RAM" value={m.ram || 0} max={8192} color="var(--grape)" showVal />
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { val: m.players ?? 0, lbl: 'Joueurs' },
              { val: server.maxPlayers, lbl: 'Max' },
              { val: `${Math.round(Math.random()*40+15)}ms`, lbl: 'Ping' },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="text-center">
                <div className="font-mono text-[15px] font-bold">{val}</div>
                <div className="text-[10px] mt-0.5" style={{ color:'var(--text-muted)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
        {!server.installed ? (
          <button className="btn btn-primary btn-sm flex-1"
            onClick={() => action(() => serversApi.install(server.id), 'Installation démarrée')}>
            📦 Installer
          </button>
        ) : server.status === 'online' ? (
          <>
            <button className="btn btn-danger btn-sm"
              onClick={() => action(() => serversApi.stop(server.id), 'Arrêt en cours')}>
              ⏹
            </button>
            <button className="btn btn-ghost btn-sm"
              onClick={() => action(() => serversApi.restart(server.id), 'Redémarrage en cours')}>
              ↻
            </button>
          </>
        ) : server.status === 'stopped' ? (
          <button className="btn btn-success btn-sm"
            onClick={() => action(() => serversApi.start(server.id), 'Démarrage en cours')}>
            ▶ Démarrer
          </button>
        ) : server.status === 'crashed' ? (
          <button className="btn btn-success btn-sm"
            onClick={() => action(() => serversApi.start(server.id), 'Redémarrage en cours')}>
            ↻ Redémarrer
          </button>
        ) : null}
        <button className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/servers/${server.id}`)}>
          ⚙ Config
        </button>
      </div>
    </div>
  )
}

// Empty "add new" card
export function AddServerCard({ onClick }) {
  return (
    <div onClick={onClick}
      className="card flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[200px]"
      style={{ borderStyle:'dashed', borderColor:'var(--border-subtle)' }}>
      <div style={{
        width:48, height:48, borderRadius:'50%',
        background:'var(--bg-elevated)',
        border:'2px dashed var(--border-medium)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, color:'var(--text-muted)'
      }}>+</div>
      <div className="text-center">
        <div className="text-[14px] font-semibold" style={{ color:'var(--text-secondary)' }}>Nouveau serveur</div>
        <div className="text-[12px] mt-0.5" style={{ color:'var(--text-muted)' }}>Configurer en quelques clics</div>
      </div>
    </div>
  )
}
