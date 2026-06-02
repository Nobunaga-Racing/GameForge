import { useState, useEffect } from 'react'
import { serversApi } from '../../lib/api'
import { FormGroup, GameIcon } from '../ui'
import toast from 'react-hot-toast'

const STEPS = ['Jeu', 'Configuration', 'Installation', 'Confirmation']

export function NewServerWizard({ open, onClose, onCreated }) {
  const [step, setStep]       = useState(0)
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    gameId: '', name: '', port: '', maxPlayers: '',
    password: '', adminPassword: '', map: '',
    ramMin: '2G', ramMax: '4G',
    autoRestart: true, autoUpdate: true,
    installMethod: 'steamcmd',
    template: 'empty',
  })

  useEffect(() => {
    serversApi.games().then(r => setGames(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function selectGame(g) {
    set('gameId', g.id)
    set('port', String(g.defaultPort))
    set('maxPlayers', String(g.defaultMaxPlayers))
    if (!form.name) set('name', `Mon serveur ${g.name}`)
  }

  async function submit() {
    setLoading(true)
    try {
      const { data: server } = await serversApi.create({
        ...form,
        port: parseInt(form.port),
        maxPlayers: parseInt(form.maxPlayers),
      })
      toast.success(`Serveur "${server.name}" créé !`)
      onCreated(server)
      onClose()
      setStep(0)
      setForm({ gameId:'', name:'', port:'', maxPlayers:'', password:'', adminPassword:'', map:'',
        ramMin:'2G', ramMax:'4G', autoRestart:true, autoUpdate:true, installMethod:'steamcmd', template:'empty' })
    } catch (e) {
      toast.error(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const selectedGame = games.find(g => g.id === form.gameId)

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
      zIndex:100, display:'flex', alignItems:'center', justifyContent:'center',
      backdropFilter:'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background:'var(--bg-panel)', border:'1px solid var(--border-medium)',
        borderRadius:20, width:'min(640px, 95vw)', maxHeight:'90vh',
        overflowY:'auto', position:'relative',
        boxShadow:'0 20px 60px rgba(0,0,0,0.6)'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'24px 28px 20px', borderBottom:'1px solid var(--border-faint)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--cyan-dim)',
            border:'1px solid rgba(0,212,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
            {selectedGame ? <GameIcon gameId={form.gameId} size={36} /> : '🎮'}
          </div>
          <div>
            <div className="font-display font-extrabold text-[18px]" style={{ letterSpacing:'-0.5px' }}>Nouveau serveur</div>
            <div className="text-[12.5px]" style={{ color:'var(--text-muted)', marginTop:2 }}>
              Étape {step + 1} / {STEPS.length} — {STEPS[step]}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ marginLeft:'auto' }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ display:'flex', gap:6, padding:'16px 28px 0' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex:1, height:4, borderRadius:4,
              background: i <= step ? 'var(--cyan)' : 'var(--bg-elevated)',
              opacity: i === step ? 0.6 : 1 }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding:'20px 28px' }}>

          {/* Step 0 — Game selection */}
          {step === 0 && (
            <div>
              <div className="font-semibold text-[14px] mb-3">Quel jeu souhaitez-vous héberger ?</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                {games.map(g => (
                  <div key={g.id} onClick={() => selectGame(g)}
                    style={{
                      padding:'12px 8px', borderRadius:10, cursor:'pointer', transition:'all 0.15s',
                      textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      background: form.gameId === g.id ? 'var(--cyan-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${form.gameId === g.id ? 'var(--cyan)' : 'var(--border-faint)'}`,
                    }}>
                    <GameIcon gameId={g.id} size={32} />
                    <span style={{ fontSize:11, fontWeight:600,
                      color: form.gameId === g.id ? 'var(--cyan)' : 'var(--text-secondary)' }}>
                      {g.name.split(':')[0].trim().split(' ').slice(0,2).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Basic config */}
          {step === 1 && (
            <div>
              <div className="font-semibold text-[14px] mb-3">Configuration de base</div>
              <FormGroup label="Nom du serveur">
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mon super serveur" />
              </FormGroup>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <FormGroup label="Max joueurs">
                  <input className="input" type="number" value={form.maxPlayers} onChange={e => set('maxPlayers', e.target.value)} />
                </FormGroup>
                <FormGroup label="Port">
                  <input className="input" type="number" value={form.port} onChange={e => set('port', e.target.value)} />
                </FormGroup>
              </div>
              <FormGroup label="Mot de passe (optionnel)">
                <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Laisser vide pour serveur public" />
              </FormGroup>
              <FormGroup label="Template de départ">
                <select className="input" value={form.template} onChange={e => set('template', e.target.value)}>
                  <option value="empty">🆕 Serveur vide</option>
                  <option value="pvp">⚔️ PvP Compétitif</option>
                  <option value="pve">🌿 PvE Débutant</option>
                  <option value="hardcore">💀 Hardcore</option>
                </select>
              </FormGroup>
            </div>
          )}

          {/* Step 2 — Install options */}
          {step === 2 && (
            <div>
              <div className="font-semibold text-[14px] mb-3">Options d'installation</div>
              <FormGroup label="Méthode d'installation">
                <select className="input" value={form.installMethod} onChange={e => set('installMethod', e.target.value)}>
                  <option value="steamcmd">SteamCMD (automatique — recommandé)</option>
                  <option value="docker">Docker (isolé)</option>
                  <option value="manual">Fichiers existants (avancé)</option>
                </select>
              </FormGroup>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {[
                  { key:'autoUpdate',  title:'Mise à jour automatique', desc:'Mettre à jour lors des nouvelles versions' },
                  { key:'autoRestart', title:'Redémarrage automatique', desc:'Relancer en cas de crash détecté' },
                ].map(({ key, title, desc }) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-faint)' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{title}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>{desc}</div>
                    </div>
                    <div className={`toggle ${form[key] ? 'on' : ''}`} onClick={() => set(key, !form[key])} />
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-faint)', borderRadius:10, padding:12, fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono', marginTop:14 }}>
                Jeu: {selectedGame?.name || '?'}<br />
                AppID Steam: {selectedGame?.steamAppId || 'Non-Steam'}<br />
                Port: {form.port} | Max joueurs: {form.maxPlayers}
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div>
              <div className="font-semibold text-[14px] mb-3">Récapitulatif & Lancement</div>
              <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:12, padding:16, marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <GameIcon gameId={form.gameId} size={36} />
                  <div>
                    <div className="font-display font-bold text-[15px]">{form.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{selectedGame?.name}</div>
                  </div>
                  <span className="badge badge-installing" style={{ marginLeft:'auto' }}>SteamCMD</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12 }}>
                  {[
                    ['Max joueurs', form.maxPlayers],
                    ['Port', form.port],
                    ['Template', form.template],
                    ['Auto-update', form.autoUpdate ? '✓ Activé' : '✗'],
                    ['Auto-restart', form.autoRestart ? '✓ Activé' : '✗'],
                    ['Méthode', form.installMethod],
                  ].map(([k, v]) => (
                    <div key={k}><span style={{ color:'var(--text-muted)' }}>{k}: </span><span style={{ fontFamily:'JetBrains Mono' }}>{v}</span></div>
                  ))}
                </div>
              </div>
              <div style={{ background:'var(--cyan-dim)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:10, padding:'10px 12px', fontSize:12, color:'var(--text-secondary)' }}>
                ℹ Le serveur sera créé et l'installation démarrera automatiquement si SteamCMD est configuré.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 28px', borderTop:'1px solid var(--border-faint)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s-1) : onClose()}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
            ← Retour
          </button>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary"
              disabled={step === 0 && !form.gameId}
              onClick={() => setStep(s => s+1)}>
              Suivant →
            </button>
          ) : (
            <button className="btn btn-primary" disabled={loading} onClick={submit}>
              {loading ? '⏳ Création...' : '🚀 Lancer l\'installation'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
