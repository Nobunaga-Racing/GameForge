import { useState, useEffect } from 'react'
import { systemApi, authApi } from '../lib/api'
import { ConfigCard, FormGroup, ToggleRow, SectionHeader, Spinner } from '../components/ui'
import { useAuth } from '../store/auth'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    Promise.all([
      systemApi.settings().then(r => setSettings(r.data)),
      authApi.users().then(r => setUsers(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const set = (path, val) => {
    setSettings(prev => {
      const next = { ...prev }
      const parts = path.split('.')
      let cur = next
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] }
        cur = cur[parts[i]]
      }
      cur[parts[parts.length - 1]] = val
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      await systemApi.saveSettings(settings)
      toast.success('Paramètres sauvegardés')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Environment */}
        <ConfigCard title="Environnement" icon="🖥️">
          <FormGroup label="Chemin SteamCMD">
            <input className="input" value={settings?.steamcmdPath || ''} onChange={e => set('steamcmdPath', e.target.value)} />
          </FormGroup>
          <FormGroup label="Répertoire des serveurs">
            <input className="input" value={settings?.serversDir || ''} onChange={e => set('serversDir', e.target.value)} />
          </FormGroup>
          <FormGroup label="Répertoire des backups">
            <input className="input" value={settings?.backupsDir || ''} onChange={e => set('backupsDir', e.target.value)} />
          </FormGroup>
        </ConfigCard>

        {/* Notifications */}
        <ConfigCard title="Notifications" icon="🔔">
          {settings?.notifications && [
            { key: 'serverCrash',       title: 'Crash serveur',          desc: 'Alerte immédiate en cas de crash' },
            { key: 'updateAvailable',   title: 'Mise à jour disponible', desc: 'Nouvelles versions des jeux' },
            { key: 'cpuHigh',           title: 'CPU > 90%',              desc: 'Alerte charge élevée' },
            { key: 'backupDone',        title: 'Backup terminé',         desc: 'Confirmation de sauvegarde' },
          ].map(({ key, title, desc }) => (
            <ToggleRow key={key} title={title} desc={desc}
              value={settings.notifications[key]}
              onChange={v => set(`notifications.${key}`, v)} />
          ))}
        </ConfigCard>

        {/* Discord */}
        <div style={{
          background: '#1a1d2e', border: '1px solid rgba(88,101,242,0.3)',
          borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, background: '#5865F2', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              💬
            </div>
            <div>
              <div className="font-display font-bold text-[14px]">Intégration Discord</div>
              <div style={{ fontSize: 12, color: '#7289da' }}>Logs et alertes dans vos channels</div>
            </div>
            <div className={`toggle ${settings?.discord?.enabled ? 'on' : ''}`}
              style={{ marginLeft: 'auto' }}
              onClick={() => set('discord.enabled', !settings?.discord?.enabled)} />
          </div>
          {[
            { key: 'discord.webhookUrl',     label: 'Webhook URL',     placeholder: 'https://discord.com/api/webhooks/...' },
            { key: 'discord.channelLogs',    label: 'Channel #logs',   placeholder: '#server-logs' },
            { key: 'discord.channelAlerts',  label: 'Channel #alertes',placeholder: '#server-alerts' },
          ].map(({ key, label, placeholder }) => (
            <FormGroup key={key} label={<span style={{ color: '#7289da' }}>{label}</span>}>
              <input className="input" placeholder={placeholder}
                style={{ background: '#111322', borderColor: 'rgba(88,101,242,0.3)' }}
                value={settings?.discord?.[key.split('.')[1]] || ''}
                onChange={e => set(key, e.target.value)} />
            </FormGroup>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ borderColor: 'rgba(88,101,242,0.4)', color: '#7289da' }}>
            Tester la connexion
          </button>
        </div>

        {/* Users */}
        <ConfigCard title="Utilisateurs & Permissions" icon="👥">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 10,
                border: '1px solid var(--border-faint)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: u.role === 'superadmin'
                    ? 'linear-gradient(135deg, var(--cyan), var(--grape))'
                    : 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700 }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email || 'Pas d\'email'}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono',
                  padding: '2px 8px', borderRadius: 20,
                  background: u.role === 'superadmin' ? 'var(--cyan-dim)' : 'var(--neon-dim)',
                  color: u.role === 'superadmin' ? 'var(--cyan)' : 'var(--neon)',
                  border: `1px solid ${u.role === 'superadmin' ? 'rgba(0,212,255,0.2)' : 'rgba(0,255,148,0.2)'}`,
                }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm">+ Inviter un utilisateur</button>
        </ConfigCard>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={() => window.location.reload()}>Annuler</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? '⏳ Sauvegarde...' : '✓ Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
