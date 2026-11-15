import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { Btn, Chips, Screen } from '../ui/kit';
import { RarTag } from '../ui/kit';
import { cardEmoji } from '../ui/icons';
import { RewardChips } from '../ui/RewardChips';
import { CARDS, SECRETS } from '../game/data/decor';
import { WORLDS } from '../game/data/worlds';
import { cardSetComplete } from '../game/engine/levels';
import { fireConfetti } from '../app/bus';

type Tab = 'cards' | 'secrets' | 'history';
export function AlbumScreen() {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const [tab, setTab] = useState<Tab>('cards');
  const found = Object.keys(g.collections.cards).length;
  return (
    <Screen title="📚 Коллекции">
      <Chips<Tab> value={tab} onChange={setTab} options={[{ id: 'cards', label: `Карточки ${found}/${CARDS.length}` }, { id: 'secrets', label: `Секреты ${Object.keys(g.collections.secrets).length}/${SECRETS.length}` }, { id: 'history', label: 'История' }]} />
      {tab === 'cards' && <div className="stack">
        {WORLDS.map((w) => { const cs = CARDS.filter((c) => c.world === w.num); const have = cs.filter((c) => g.collections.cards[c.id]).length; const complete = cardSetComplete(g, w.num); const claimed = g.collections.worldSetsClaimed[`cards-w${w.num}`]; return (
          <div key={w.id} className="card stack">
            <div className="row between"><div className="bold">{w.name}</div><span className="pill">{have}/{cs.length}</span></div>
            <div className="grid g3">{cs.map((c) => { const own = g.collections.cards[c.id]; return (
              <div key={c.id} className={`tile rar-${c.rarity}`} style={{ opacity: own ? 1 : .5 }} aria-label={own ? c.name : 'Неизвестная карточка'}>
                <span className="emoji l" style={{ filter: own ? undefined : 'grayscale(1) brightness(.6)' }}>{own ? cardEmoji(c.icon) : '❔'}</span>
                <div className="nm">{own ? c.name : '???'}</div>{own && <><RarTag r={c.rarity} />{own.count > 1 && <span className="tiny muted">×{own.count}</span>}</>}
              </div>); })}</div>
            {claimed ? <div className="small center" style={{ color: 'var(--green)' }}>✅ Награда за полный альбом получена</div>
              : <Btn small disabled={!complete} onClick={() => { const r = act(() => api.claimCardSet(w.num), { sfx: 'win' }); if (r.ok) fireConfetti(); }}>{complete ? 'Забрать награду за альбом' : 'Собери все карточки мира'}</Btn>}
          </div>); })}
        <div className="tiny muted center">Карточки находят на уровнях, в сундуках и в награде за задания.</div>
      </div>}
      {tab === 'secrets' && <div className="stack">
        <div className="small muted center">Ищи мерцающие ✨ на базе, картах и в комнате Stefania. Награда за каждый секрет: 🍌 60, 🪙 25. Найдёшь все — откроется особый друг!</div>
        {SECRETS.map((s) => { const at = g.collections.secrets[s.id]; return (
          <div key={s.id} className="card row" style={{ gap: 12, opacity: at ? 1 : .8 }}>
            <span className="emoji l">{at ? '✨' : '🔍'}</span>
            <div style={{ flex: 1 }}><div className="bold">{at ? s.name : '???'}</div><div className="small muted">{at ? `Найдено: ${s.where}` : s.hint}</div></div>
          </div>); })}
        <div className="center small">Награда за все 8: <RewardChips r={{ characters: ['stella'] }} /></div>
      </div>}
      {tab === 'history' && <div className="stack">
        {g.collections.history.length === 0 && <div className="muted center" style={{ padding: 24 }}>Пока ничего не произошло — всё впереди!</div>}
        {g.collections.history.slice().reverse().slice(0, 60).map((h, i) => <div key={i} className="row between small" style={{ gap: 8 }}><span>{h.text}</span><span className="tiny muted">{new Date(h.at).toLocaleDateString('ru-RU')}</span></div>)}
      </div>}
    </Screen>
  );
}
