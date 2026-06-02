import { useState, useEffect } from 'react'
import { modsApi } from '../lib/api'
import { SectionHeader, EmptyState, AlertItem, Spinner } from '../components/ui'
import { GameIcon } from '../components/ui'
import toast from 'react-hot-toast'

export default function Mods({ servers }) {
  const [mods,    setMods]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await modsApi.list()
      setMods(data)
    } catch {}
    finally { setLoading(false) }
  }

  async function toggleMod(mod) {
    try {
      const { data } = await modsApi.update(mod.id, { enabled: !mod.enabled })
      setMods(m => m.map(x => x.id === mod.id ? data : x))
    } catch (e) { toast.error(e.message) }
  }

  async function deleteMod(id) {
    try {
      await modsApi.delete(id)
      setMods(m => m.filter(x => x.id !== id))
      toast.success('Mod supprimé')
    } catch (e) { toast.error(e.message) }
  }

  const updates = mods.filter(m => m.status === 'update_available')
  const filtered = filter === 'all' ? mods : mods.filter(m => m.serverId === filter)

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Gestionnaire de mods" sub={`${mods.length} mods installés`}>
        <select className="input" style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
          value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tous les serveurs</option>
          {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm">+ Ajouter mod</button>
      </SectionHeader>

      {updates.length > 0 && (
        <div className="mb-4">
          <AlertItem type="warn"
            title={`${updates.length} mod(s) nécessitent une mise à jour`}
            message="Des mises à jour sont disponibles via Steam Workshop" />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="◧" title="Aucun mod installé"
          desc="Ajoutez des mods depuis Steam Workshop ou manuellement"
          action={<button className="btn btn-primary btn-sm">+ Ajouter un mod</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(mod => {
            const server = servers.find(s => s.id === mod.serverId)
            return (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-card)',
                border: '1px solid var(--border-faint)', borderRadius: 12,
                transition: 'border-color 0.15s' }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, border: '1px solid var(--border-faint)', flexShrink: 0 }}>
                  {mod.source === 'workshop' ? '🎮' : '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{mod.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {server?.name} • {mod.source} {mod.workshopId ? `• ID: ${mod.workshopId}` : ''} • v{mod.version}
                  </div>
                </div>
                <span className={`badge ${mod.status === 'update_available' ? 'badge-starting' : 'badge-online'}`}>
                  {mod.status === 'update_available' ? '⚠ Mise à jour' : '✓ À jour'}
                </span>
                {mod.status === 'update_available' && (
                  <button className="btn btn-primary btn-sm">↑ Mettre à jour</button>
                )}
                <div className={`toggle ${mod.enabled ? 'on' : ''}`} onClick={() => toggleMod(mod)} />
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteMod(mod.id)}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
