import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { useMusic } from '../app/useMusic';
import { fireConfetti } from '../app/bus';
import { Bar, Btn, Screen, Sheet, StarsRow } from '../ui/kit';
import { RewardChips } from '../ui/RewardChips';
import { GAME_INFO } from '../ui/icons';
import { STAR_MILESTONES, WORLDS, WORLD_PERFECT_REWARD, levelsOfWorld, TOTAL_STARS } from '../game/data/worlds';
import { worldIsPerfect } from '../game/engine/levels';
import { stateMetric } from '../game/engine/metrics';
import { SecretSpot } from '../ui/SecretSpot';
import { Hint } from '../ui/Hint';

export function MapScreen() {
  const g = useGame(); const nav = useNav(); const { api } = useApp(); const act = useAct();
  const stars = stateMetric(g, 'stars');
  const firstOpen = WORLDS.filter((w) => g.worlds[w.id]?.unlocked).map((w) => w.num).pop() || 1;
  const [wn, setWn] = useState(firstOpen);
  const [ms, setMs] = useState(false);
  const world = WORLDS[wn - 1]; const wp = g.worlds[world.id]; const levels = levelsOfWorld(wn);
  const got = levels.reduce((a, l) => a + (g.levels[l.id]?.stars || 0), 0);
  useMusic(world.music);
  const perfect = worldIsPerfect(g, wn); const perfectClaimed = !!wp?.rewardClaimed;
  const claimable = STAR_MILESTONES.filter((m) => stars >= m.stars && !g.collections.starMilestonesClaimed[m.id]).length;
  return (
    <Screen title="🗺️ Карта миров" right={<button className="pill" onClick={() => setMs(true)} aria-label="Награды за звёзды">⭐ {stars}/{TOTAL_STARS}{claimable > 0 ? ' 🎁' : ''}</button>} bg={world.theme.sky1 + '66'}>
      <div className="stack">
        <Hint id="map" text="Проходи уровни по порядку и собирай звёзды: за них открываются новые миры и награды." />
        <div className="chip-row" role="tablist">
          {WORLDS.map((w) => { const open = g.worlds[w.id]?.unlocked; return <button key={w.id} role="tab" aria-selected={w.num === wn} className={`chip ${w.num === wn ? 'on' : ''}`} onClick={() => setWn(w.num)}>{open ? w.num : '🔒'} {w.subtitle}</button>; })}
        </div>
        <div className="card stack" style={{ background: `linear-gradient(180deg, ${world.theme.sky1}, ${world.theme.sky2})`, color: wn >= 3 && wn !== 4 ? '#fff' : undefined }}>
          <div className="bold" style={{ fontSize: 20 }}>{world.name}</div>
          <div className="small">{world.desc}</div>
          {wp?.unlocked ? <div className="row between"><span className="small">⭐ {got}/{levels.length * 3}</span><div style={{ width: '60%' }}><Bar value={got} max={levels.length * 3} /></div></div> : <div className="bold">🔒 Нужно звёзд: {world.unlockStars} (у тебя {stars})</div>}
          {wp?.unlocked && perfect && !perfectClaimed && <Btn small color="pink" onClick={() => { const r = act(() => api.claimWorldPerfect(wn), { sfx: 'win' }); if (r.ok) fireConfetti(); }}>🏆 Забрать награду за идеальный мир</Btn>}
          {wp?.unlocked && perfectClaimed && <div className="small">🏆 Идеальный мир пройден!</div>}
        </div>
        {wp?.unlocked && <div className="stack" style={{ gap: 14 }}>
          {levels.map((l, i) => { const st = g.levels[l.id]; const lock = !st || st.status === 'locked'; const info = l.game.kind === 'task' ? '📋' : l.game.kind === 'gauntlet' ? '🏁' : GAME_INFO[l.game.kind].emoji; return (
            <div key={l.id} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start', paddingInline: 18 }}>
              <button className="tile" onClick={() => nav.push('level', { id: l.id })} aria-label={`Уровень ${l.index}: ${l.name}${lock ? ' (закрыт)' : ''}`} style={{ width: '72%', flexDirection: 'row', gap: 10, padding: 10, opacity: lock ? .55 : 1, outline: st?.status === 'open' ? '4px solid var(--banana)' : undefined, background: l.boss ? 'linear-gradient(135deg,#fff,#FFE9A8)' : '#fff' }}>
                <span className="emoji l" style={{ filter: lock ? 'grayscale(1)' : undefined }}>{lock ? '🔒' : l.boss ? '👑' : info}</span>
                <span style={{ flex: 1, textAlign: 'left' }}><span className="bold" style={{ display: 'block' }}>{l.index}. {l.name}</span><span className="tiny muted" style={{ display: 'block' }}>{l.goal}</span><StarsRow n={st?.stars || 0} /></span>
              </button>
            </div>); })}
        </div>}
      </div>
      {wp?.unlocked && (wn === 1 || wn === 2 || wn === 4) && <SecretSpot id={`sec-world${wn}`} />}
      {ms && <Sheet onClose={() => setMs(false)} title="Награды за звёзды">
        <div className="stack">
          {STAR_MILESTONES.map((m) => { const done = g.collections.starMilestonesClaimed[m.id]; const ok = stars >= m.stars; return (
            <div key={m.id} className="row between" style={{ gap: 8, opacity: done ? .55 : 1 }}>
              <div style={{ flex: 1 }}><div className="bold">⭐ {m.stars}</div><div className="small muted">{m.text}</div></div>
              {done ? <span>✅</span> : <Btn small disabled={!ok} onClick={() => { const r = act(() => api.claimStarMilestone(m.id), { sfx: 'win' }); if (r.ok) fireConfetti(); }}>{ok ? 'Забрать' : `Ещё ${m.stars - stars}`}</Btn>}
            </div>); })}
          <div className="hr" /><div className="small muted">Идеальный мир (все 3 звезды на каждом уровне):</div><RewardChips r={WORLD_PERFECT_REWARD} />
        </div>
      </Sheet>}
    </Screen>
  );
}
