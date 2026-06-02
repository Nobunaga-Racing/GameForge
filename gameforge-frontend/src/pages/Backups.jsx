import { useState, useEffect } from 'react'
import { backupsApi, serversApi } from '../lib/api'
import { SectionHeader, ConfigCard, ToggleRow, EmptyState, Spinner } from '../components/ui'
import toast from 'react-hot-toast'

export default function Backups({ servers }) {
  const [backups,  setBackups]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await backupsApi.list()
      setBackups(data)
    } catch {}
    finally { setLoading(false) }
  }

  async function createManualBackup(serverId) {
    try {
      await serversApi.backup(serverId, 'Backup manuel')
      toast.success('Sauvegarde créée')
      load()
    } catch (e) { toast.error(e.response?.data?.error || e.message) }
  }

  async function deleteBackup(id) {
    try {
      await backupsApi.delete(id)
      toast.success('Sauvegarde supprimée')
      setBackups(b => b.filter(x => x.id !== id))
    } catch (e) { toast.error(e.message) }
  }

  async function restoreBackup(id) {
    try {
      await backupsApi.restore(id)
      toast.success('Restauration effectuée — redémarrez le serveur')
    } catch (e) { toast.error(e.response?.data?.error || e.message) }
  }

  const filtered = filter === 'all' ? backups : backups.filter(b => b.serverId === filter)
  const totalSize = backups.reduce((a, b) => a + b.size, 0)

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Gestion des sauvegardes" sub={`${backups.length} sauvegardes — ${formatSize(totalSize)} total`}>
        <select className="input" style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
          value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tous les serveurs</option>
          {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => servers[0] && createManualBackup(servers[0].id)}
          disabled={!servers.length}>
          + Backup manuel
        </button>
      </SectionHeader>

      {/* Auto-backup settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <ConfigCard title="Sauvegardes automatiques" icon="⏰">
          {servers.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun serveur configuré</div>
            : servers.map(s => (
              <ToggleRow key={s.id} title={s.name} desc="Toutes les 2h — rétention 7 jours" value={true} onChange={() => {}} />
            ))
          }
        </ConfigCard>

        <ConfigCard title="Statistiques" icon="📊">
          {[
            ['Taille totale',      formatSize(totalSize)],
            ['Nombre',             backups.length],
            ['Dernière sauvegarde', backups[0] ? timeAgo(backups[0].createdAt) : '—'],
            ['Prochain backup',    'dans ~2h (auto)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-faint)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </ConfigCard>
      </div>

      {/* Backup table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-faint)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Historique</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="💾" title="Aucune sauvegarde" desc="Créez une sauvegarde manuelle ou attendez la prochaine sauvegarde automatique" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                {['Serveur', 'Date', 'Taille', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, fontSize: 13 }}>{b.serverName}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatSize(b.size)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${b.type === 'manual' ? 'badge-online' : 'badge-installing'}`}>
                      {b.type === 'manual' ? 'Manuel' : 'Auto'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => restoreBackup(b.id)}>↓ Restaurer</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteBackup(b.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round(bytes / 1024 / 1024 * 10) / 10} MB`
}

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return `il y a ${diff}s`
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  return `il y a ${Math.floor(diff / 3600)}h`
}
