import { Hint } from '../ui/Hint';
import { useGame, useNow } from '../app/ctx';
import { useNav } from '../app/nav';
import { useMusic } from '../app/useMusic';
import { Bar, CurrencyBar, Screen } from '../ui/kit';
import { ROOMS } from '../game/data/rooms';
import { ROOM_EMOJI, CurIcon } from '../ui/icons';
import { basketStatus, totalComfort, restStatus } from '../game/engine/base';
import { Banana } from '../ui/icons';
import type { Currency } from '../game/types';

export function BaseTab() {
  const g = useGame(); const nav = useNav(); const now = useNow(5000);
  useMusic('base');
  const basket = basketStatus(g, now), rest = restStatus(g, now);
  const labReady = g.base.lab.queue.filter((j) => Date.parse(j.finishAt) <= now).length;
  return (
    <Screen noBack tabs title="Моя база" right={<CurrencyBar only={['bananas', 'coins']} />}>
      <div className="stack">
        <Hint id="base" text="Открывай комнаты и улучшай их: каждая даёт особые возможности — от кухни до лаборатории." />
        <div className="card tint row between">
          <div><div className="bold">Уют базы: {totalComfort(g)}</div><div className="small muted">Декорации повышают сбор бананов в холле</div></div>
          <div className="pill"><Banana /> {basket.amount}/{basket.cap}</div>
        </div>
        <div className="grid g2">
          {ROOMS.map((r) => {
            const st = g.base.rooms[r.id];
            const ready = r.id === 'lab' ? labReady : r.id === 'hall' ? (basket.amount >= basket.cap * 0.5 ? 1 : 0) : r.id === 'bedroom' ? (rest.total >= 5 ? 1 : 0) : 0;
            const reqLevel = r.unlock.playerLevel;
            return (
              <button key={r.id} className={`tile ${st.unlocked ? '' : 'locked'}`} style={{ background: `linear-gradient(180deg, #fff, ${r.color}55)`, borderColor: r.color, padding: 12, minHeight: 138 }} onClick={() => nav.push('room', { id: r.id })} aria-label={r.name}>
                <span className="emoji l">{ROOM_EMOJI[r.id]}</span>
                <div className="bold" style={{ fontSize: 14 }}>{r.name}</div>
                {st.unlocked ? <><div className="tiny muted">Уровень {st.level} из {r.maxLevel}</div><div style={{ width: '80%' }}><Bar value={st.level} max={r.maxLevel} /></div></> : <div className="tiny muted">🔒 {g.player.level >= reqLevel ? 'Можно открыть' : `С ${reqLevel} уровня`}</div>}
                {ready > 0 && <span className="badge-dot">!</span>}
                {!st.unlocked && g.player.level >= reqLevel && <div className="row gap-s tiny">{(Object.entries(r.unlock.cost) as [Currency, number][]).map(([c, n]) => <span key={c} className="row" style={{ gap: 2 }}><CurIcon c={c} />{n}</span>)}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
