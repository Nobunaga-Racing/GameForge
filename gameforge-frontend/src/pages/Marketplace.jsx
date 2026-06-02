import { GameIcon } from '../components/ui'

const TEMPLATES = [
  { id:1, gameId:'ark',          name:'ARK PvP Hardcore',        tags:['PvP','ARK'],        desc:'Config PvP intense. XP x3, Taming x5, Harvest x3. Inclut Primal Fear + S+.', stars:4.9, dl:1248 },
  { id:2, gameId:'valheim',      name:'Valheim Coop Friendly',   tags:['PvE','Valheim'],     desc:'10 joueurs avec Valheim Plus. Mort non punitive, ressources augmentées.', stars:4.6, dl:834 },
  { id:3, gameId:'minecraft',    name:'Minecraft ATM9 Server',   tags:['Survie','Minecraft'],desc:'All The Mods 9 — 400+ mods, config 8 GB RAM. Anti-lag, backups auto 2h.', stars:4.8, dl:2103 },
  { id:4, gameId:'dayz',         name:'DayZ Livonia PvPvE',      tags:['PvP','DayZ'],        desc:'Map Livonia, 60 joueurs, safe zones. Mods: Trader, BuildAnywhere, Code Lock.', stars:4.4, dl:567 },
  { id:5, gameId:'satisfactory', name:'Satisfactory Phase 4',    tags:['Coop','Satis'],      desc:'4 joueurs, save Phase 4 incluse. Config réseau optimisée.', stars:4.7, dl:392 },
  { id:6, gameId:'arma3',        name:'Arma 3 Milsim Ready',     tags:['Milsim','Arma'],     desc:'ACE3 + ACRE2 + RHS. Zeus activé, missions coop incluses. 40 joueurs.', stars:4.5, dl:289 },
  { id:7, gameId:'enshrouded',   name:'Enshrouded Coop 16p',     tags:['Coop','Enshrouded'], desc:'16 joueurs, 8 GB RAM recommandé, backups toutes les heures.', stars:4.3, dl:178 },
  { id:8, gameId:'valheim',      name:'Valheim Hardcore Norse',  tags:['Hardcore','Valheim'],desc:'Mort permanente, ressources réduites. Pour les vrais guerriers.', stars:4.2, dl:145 },
  { id:9, gameId:'minecraft',    name:'MC Vanilla Optimisé',     tags:['Vanilla','MC'],      desc:'Minecraft vanilla pur avec Paper, Aikar flags. 20 joueurs smooth.', stars:4.7, dl:1890 },
]

const TAG_COLORS = {
  PvP:'flame', PvE:'neon', Coop:'neon', Survie:'neon', Hardcore:'red',
  Milsim:'grape', Vanilla:'cyan', ARK:'cyan', Valheim:'grape',
  Minecraft:'neon', Satis:'flame', DayZ:'red', Arma:'grape', Enshrouded:'grape', MC:'neon',
}

export default function Marketplace() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="font-display font-bold text-[15px]">Marketplace</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Templates et configurations prêts à l'emploi</p>
        </div>
        <button className="btn btn-primary btn-sm">+ Publier ma config</button>
      </div>

      {/* Filter tags */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Tous', 'ARK', 'Valheim', 'Minecraft', 'DayZ', 'PvP', 'PvE', 'Hardcore'].map((t, i) => (
          <button key={t} className={`btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-ghost'}`}>{t}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {TEMPLATES.map(tpl => (
          <div key={tpl.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)',
            borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.transform = 'translateY(0)' }}>

            {/* Thumb */}
            <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-faint)' }}>
              <GameIcon gameId={tpl.gameId} size={48} />
            </div>

            {/* Body */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                {tpl.tags.map(tag => {
                  const c = TAG_COLORS[tag] || 'cyan'
                  return (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono',
                      padding: '2px 7px', borderRadius: 20,
                      background: `var(--${c}-dim, var(--cyan-dim))`,
                      color: `var(--${c}, var(--cyan))`,
                      border: `1px solid rgba(0,212,255,0.15)`,
                    }}>{tag}</span>
                  )
                })}
              </div>
              <div className="font-display font-bold text-[13.5px] mb-1">{tpl.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                {tpl.desc}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--gold)' }}>
                  {'★'.repeat(Math.round(tpl.stars))} {tpl.stars}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                  ↓ {tpl.dl.toLocaleString()}
                </span>
                <button className="btn btn-primary btn-sm">Installer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
