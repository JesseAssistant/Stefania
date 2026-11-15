import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useMusic } from '../app/useMusic';
import { Btn, CostView, Screen } from '../ui/kit';
import { Nanabo } from '../art/Nanabo';
import { DecorArt } from '../art/DecorArt';
import { SecretSpot } from '../ui/SecretSpot';
import { CHARACTER_MAP } from '../game/data/characters';
import { DECOR_MAP } from '../game/data/decor';
import { PERSONAL_FLOORS, PERSONAL_WALLS, personalUpgradeCost } from '../game/engine/base';
import { roomFx } from '../game/data/rooms';
import { DecorPicker } from './Room';

export function PersonalScreen() {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const pr = g.base.personalRoom; const [slot, setSlot] = useState<number | null>(null);
  const [note, setNote] = useState(pr.note);
  const c = CHARACTER_MAP[g.player.partnerId] || CHARACTER_MAP[g.player.selectedCharacterId];
  const cs = g.characters[c.id];
  useMusic('home');
  return (
    <Screen title="💖 Комната Stefania" bg={pr.wall}>
      <div className="stack">
        <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: pr.wall, height: 230, boxShadow: 'var(--shadow)' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', background: pr.floor }} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'end center', paddingBottom: 16 }}><div style={{ width: 120 }}><Nanabo look={c.look} equipped={cs.equipped} emotion="love" animate /></div></div>
          <div style={{ position: 'absolute', left: 10, right: 10, top: 10, display: 'flex', justifyContent: 'space-around' }}>{pr.decor.slice(0, 4).map((d, i) => d ? <div key={i} style={{ width: 46, height: 46 }}><DecorArt d={DECOR_MAP[d]} /></div> : <span key={i} style={{ width: 46 }} />)}</div>
          <SecretSpot id="sec-personal" />
        </div>
        <div className="card center">{pr.note ? <div className="bold">“{pr.note}”</div> : <div className="small muted">Напиши записку для своей комнаты ↓</div>}</div>
        <div className="card stack"><div className="bold">Стены</div><div className="row wrap">{PERSONAL_WALLS.map((w) => <button key={w} aria-label={`Цвет стен ${w}`} onClick={() => act(() => api.setPersonalStyle(w), { sfx: 'equip' })} style={{ width: 44, height: 44, borderRadius: 14, background: w, border: pr.wall === w ? '4px solid var(--ink)' : '2px solid rgba(0,0,0,.1)' }} />)}</div>
          <div className="bold">Пол</div><div className="row wrap">{PERSONAL_FLOORS.map((f) => <button key={f} aria-label={`Цвет пола ${f}`} onClick={() => act(() => api.setPersonalStyle(undefined, f), { sfx: 'equip' })} style={{ width: 44, height: 44, borderRadius: 14, background: f, border: pr.floor === f ? '4px solid var(--ink)' : '2px solid rgba(0,0,0,.1)' }} />)}</div>
          <div className="bold">Записка</div>
          <div className="row" style={{ gap: 8 }}><input className="field" value={note} maxLength={80} onChange={(e: { target: { value: string } }) => setNote(e.target.value)} placeholder="Например: «Лучшая комната на свете»" aria-label="Записка" /><Btn small onClick={() => act(() => api.setPersonalStyle(undefined, undefined, note), { sfx: 'good', ok: 'Записка сохранена' })}>OK</Btn></div></div>
        <div className="card stack"><div className="row between"><div className="bold">Декорации</div><span className="small muted">Уровень комнаты {pr.level} · мест {roomFx.personalDecorSlots(pr.level)}</span></div>
          <div className="grid g3">{pr.decor.map((d, i) => <button key={i} className="tile" style={{ minHeight: 84 }} onClick={() => setSlot(i)} aria-label={d ? DECOR_MAP[d].name : `Пустое место ${i + 1}`}>{d ? <><div style={{ width: 52, height: 52 }}><DecorArt d={DECOR_MAP[d]} /></div><div className="nm">{DECOR_MAP[d].name}</div></> : <><div className="emoji">➕</div><div className="tiny muted">Пусто</div></>}</button>)}</div>
          <Btn block onClick={() => act(() => api.upgradePersonalRoom(), { sfx: 'levelup' })}>Расширить комнату: <CostView cost={personalUpgradeCost(pr.level)} /></Btn></div>
      </div>
      {slot !== null && <DecorPicker room="personal" slot={slot} onClose={() => setSlot(null)} />}
    </Screen>
  );
}
