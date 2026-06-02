import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { serversApi } from '../lib/api'
import { StatusBadge, GameIcon, ProgressBar, StatCard, ConfigCard, FormGroup, ToggleRow, SectionHeader, Spinner } from '../components/ui'
import { Console } from '../components/servers/Console'
import toast from 'react-hot-toast'

const TABS = ['Aperçu', 'Configuration', 'Mods', 'Joueurs', 'Console', 'Backups']

export default function ServerDetail({ servers, onRefresh }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab]       = useState(0)
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  // Also update from parent servers list (WebSocket updates)
  useEffect(() => {
    const s = servers.find(s => s.id === id)
    if (s) setServer(s)
  }, [servers, id])

  async function load() {
    setLoading(true)
    try {
      const { data } = await serversApi.get(id)
      setServer(data)
      setConfig(data)
    } catch { navigate('/') }
    finally { setLoading(false) }
  }

  async function action(fn, label) {
    try {
      await fn()
      toast.success(label)
      setTimeout(load, 1000)
    } catch (e) { toast.error(e.response?.data?.error || e.message) }
  }

  async function saveConfig() {
    setSaving(true)
    try {
      await serversApi.update(id, config)
      toast.success('Configuration sauvegardée')
      onRefresh()
    } catch (e) { toast.error(e.response?.data?.error || e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
  if (!server)  return null

  const m = server.metrics || {}

  return (
    <div className="animate-fade-in">
      {/* Server header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <GameIcon gameId={server.gameId} size={52} />
        <div>
          <h1 className="font-display font-extrabold text-[22px]" style={{ letterSpacing:'-0.5px' }}>
            {server.name}
          </h1>
          <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
            <StatusBadge status={server.status} />
            <span style={{ fontSize:11, fontFamily:'JetBrains Mono', background:'var(--cyan-dim)', color:'var(--cyan)',
              border:'1px solid rgba(0,212,255,0.2)', padding:'3px 8px', borderRadius:20 }}>
              {server.gameName}
            </span>
            {m.players !== undefined && (
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono', background:'var(--neon-dim)', color:'var(--neon)',
                border:'1px solid rgba(0,255,148,0.2)', padding:'3px 8px', borderRadius:20 }}>
                {m.players} / {server.maxPlayers} joueurs
              </span>
            )}
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => action(() => serversApi.backup(id, 'Backup manuel'), 'Backup créé')}>
            💾 Backup
          </button>
          {server.status === 'online' ? (
            <>
              <button className="btn btn-ghost" onClick={() => action(() => serversApi.restart(id), 'Redémarrage en cours')}>
                ↻ Restart
              </button>
              <button className="btn btn-danger" onClick={() => action(() => serversApi.stop(id), 'Arrêt en cours')}>
                ⏹ Arrêter
              </button>
            </>
          ) : (
            <button className="btn btn-success" onClick={() => action(() => serversApi.start(id), 'Démarrage en cours')}>
              ▶ Démarrer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg-panel)',
        padding:4, borderRadius:14, border:'1px solid var(--border-faint)', overflowX:'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className="btn"
            style={{
              background: tab === i ? 'var(--bg-elevated)' : 'transparent',
              color: tab === i ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: tab === i ? 600 : 400,
              border: '1px solid transparent',
              flexShrink:0,
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <OverviewTab server={server} m={m} />}
      {tab === 1 && <ConfigTab config={config} setConfig={setConfig} server={server} saving={saving} onSave={saveConfig} />}
      {tab === 2 && <ModsTab serverId={id} />}
      {tab === 3 && <PlayersTab players={m.players || 0} max={server.maxPlayers} />}
      {tab === 4 && <Console serverId={id} height={400} />}
      {tab === 5 && <BackupsTab serverId={id} />}
    </div>
  )
}

function OverviewTab({ server, m }) {
  const uptime = server.lastStarted
    ? Math.floor((Date.now() - new Date(server.lastStarted)) / 3600000)
    : 0
  return (
    <div className="animate-fade-in">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="UPTIME" value={`${uptime}h`} sub={`Depuis ${new Date(server.lastStarted||Date.now()).toLocaleTimeString()}`} accent="cyan" />
        <StatCard label="JOUEURS" value={m.players ?? 0} sub={`/ ${server.maxPlayers} max`} accent="neon" />
        <StatCard label="CPU" value={`${Math.round(m.cpu||0)}%`} sub="utilisation processeur" accent="flame" />
        <StatCard label="RAM" value={`${Math.round((m.ram||0)/1024*10)/10}GB`} sub="mémoire utilisée" accent="grape" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <ConfigCard title="Informations serveur" icon="🖥️">
          {[
            ['Adresse IP', `${window.location.hostname}:${server.port}`],
            ['Map', server.map || 'défaut'],
            ['Mot de passe', server.password ? '🔒 Protégé' : '🔓 Public'],
            ['Auto-restart', server.autoRestart ? '✓ Activé' : '✗ Désactivé'],
            ['Auto-update', server.autoUpdate ? '✓ Activé' : '✗ Désactivé'],
            ['Crashs', server.crashCount || 0],
          ].map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-faint)', fontSize:13 }}>
              <span style={{ color:'var(--text-muted)' }}>{k}</span>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:12 }}>{v}</span>
            </div>
          ))}
        </ConfigCard>
        <ConfigCard title="Ressources" icon="📊">
          <ProgressBar label="CPU" value={m.cpu||0} color="var(--cyan)" showVal />
          <ProgressBar label="RAM" value={m.ram||0} max={8192} color="var(--grape)" showVal />
          <ProgressBar label="Joueurs" value={m.players||0} max={server.maxPlayers} color="var(--neon)" showVal />
        </ConfigCard>
      </div>
    </div>
  )
}

function ConfigTab({ config, setConfig, server, saving, onSave }) {
  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }))
  return (
    <div className="animate-fade-in">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        <ConfigCard title="Paramètres généraux" icon="⚙️">
          <FormGroup label="Nom du serveur">
            <input className="input" value={config.name||''} onChange={e => set('name', e.target.value)} />
          </FormGroup>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <FormGroup label="Max joueurs">
              <input className="input" type="number" value={config.maxPlayers||''} onChange={e => set('maxPlayers', parseInt(e.target.value))} />
            </FormGroup>
            <FormGroup label="Port">
              <input className="input" type="number" value={config.port||''} onChange={e => set('port', parseInt(e.target.value))} />
            </FormGroup>
          </div>
          <FormGroup label="Mot de passe">
            <input className="input" type="password" value={config.password||''} onChange={e => set('password', e.target.value)} placeholder="Laisser vide = public" />
          </FormGroup>
        </ConfigCard>
        <ConfigCard title="Options" icon="🔧">
          <ToggleRow title="Redémarrage automatique" desc="Relancer en cas de crash" value={config.autoRestart} onChange={v => set('autoRestart', v)} />
          <ToggleRow title="Mise à jour automatique" desc="Mettre à jour automatiquement" value={config.autoUpdate} onChange={v => set('autoUpdate', v)} />
          {server.gameId === 'minecraft' && <>
            <FormGroup label="RAM min (-Xms)"><input className="input" value={config.ramMin||'2G'} onChange={e => set('ramMin', e.target.value)} /></FormGroup>
            <FormGroup label="RAM max (-Xmx)"><input className="input" value={config.ramMax||'4G'} onChange={e => set('ramMax', e.target.value)} /></FormGroup>
          </>}
        </ConfigCard>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn btn-ghost">Annuler</button>
        <button className="btn btn-primary" disabled={saving} onClick={onSave}>
          {saving ? '⏳ Sauvegarde...' : '✓ Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

function ModsTab({ serverId }) {
  return (
    <div className="animate-fade-in">
      <SectionHeader title="Mods installés">
        <button className="btn btn-primary btn-sm">+ Ajouter</button>
      </SectionHeader>
      <div style={{ color:'var(--text-muted)', fontSize:13, padding:'20px 0' }}>
        Aucun mod installé sur ce serveur.
      </div>
    </div>
  )
}

function PlayersTab({ players, max }) {
  const fakeNames = ['Dragon404','NightWolf','BlackHawk','ShadowFox','IceBlade','StormRider','Phantom','Ghost']
  const online = Array.from({ length: Math.min(players, 8) }, (_, i) => ({
    name: fakeNames[i], ping: Math.floor(Math.random()*80+10), time: `${Math.floor(Math.random()*4)+1}h${Math.floor(Math.random()*60).toString().padStart(2,'0')}`
  }))
  return (
    <div className="animate-fade-in">
      <SectionHeader title={`Joueurs connectés (${players}/${max})`}>
        <button className="btn btn-ghost btn-sm">+ Inviter</button>
      </SectionHeader>
      <div className="card overflow-hidden" style={{ padding:0 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-faint)' }}>
              {['Joueur','Durée','Ping','Action'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:600,
                  color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.5px', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {online.map((p, i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--border-faint)' }}>
                <td style={{ padding:'10px 12px', fontWeight:500 }}>{p.name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text-secondary)' }}>{p.time}</td>
                <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12,
                  color: p.ping < 50 ? 'var(--neon)' : p.ping < 100 ? 'var(--gold)' : 'var(--red)' }}>
                  {p.ping}ms
                </td>
                <td style={{ padding:'10px 12px' }}>
                  <button className="btn btn-ghost btn-sm">Kick</button>
                </td>
              </tr>
            ))}
            {online.length === 0 && (
              <tr><td colSpan={4} style={{ padding:'20px 12px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Aucun joueur connecté</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BackupsTab({ serverId }) {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('../lib/api').then(({ backupsApi }) => {
      backupsApi.list(serverId).then(r => setBackups(r.data)).catch(() => {}).finally(() => setLoading(false))
    })
  }, [serverId])

  async function createBackup() {
    const { serversApi } = await import('../lib/api')
    try {
      await serversApi.backup(serverId, 'Backup manuel')
      toast.success('Backup créé')
      const { backupsApi } = await import('../lib/api')
      backupsApi.list(serverId).then(r => setBackups(r.data))
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader title={`Sauvegardes (${backups.length})`}>
        <button className="btn btn-primary btn-sm" onClick={createBackup}>+ Créer backup</button>
      </SectionHeader>
      <div className="card overflow-hidden" style={{ padding:0 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border-faint)' }}>
              {['Date','Type','Taille','Actions'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:600,
                  color:'var(--text-muted)', fontFamily:'JetBrains Mono', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backups.map(b => (
              <tr key={b.id} style={{ borderBottom:'1px solid var(--border-faint)' }}>
                <td style={{ padding:'10px 12px', fontSize:12 }}>{new Date(b.createdAt).toLocaleString()}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span className={`badge ${b.type === 'manual' ? 'badge-online' : 'badge-installing'}`}>{b.type}</span>
                </td>
                <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text-secondary)' }}>
                  {Math.round(b.size / 1024)} KB
                </td>
                <td style={{ padding:'10px 12px', display:'flex', gap:4 }}>
                  <button className="btn btn-ghost btn-sm">↓ Restaurer</button>
                  <button className="btn btn-danger btn-sm">✕</button>
                </td>
              </tr>
            ))}
            {!loading && backups.length === 0 && (
              <tr><td colSpan={4} style={{ padding:'20px 12px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Aucune sauvegarde</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
