import type { RewardResult } from '../game/types';
import { CurIcon, cardEmoji, CHEST_ICON, CHEST_NAME, MAT_ICON, MAT_NAME } from './icons';
import { ITEM_MAP } from '../game/data/items';
import { DECOR_MAP, CARD_MAP, FOODS } from '../game/data/decor';
import { CHARACTER_MAP } from '../game/data/characters';
import { ItemIcon } from '../art/ItemIcon';
import { Nanabo } from '../art/Nanabo';
import { fmt } from '../game/util';
import type { Currency } from '../game/types';

/** Всё, что игрок получил: валюта, опыт, предметы, Нанабо, карточки, сундуки. */
export function RewardView({ r, compact }: { r: RewardResult; compact?: boolean }) {
  const cur = (['bananas', 'coins', 'crystals'] as Currency[]).filter((c) => r[c] > 0);
  return (
    <div className="stack center" style={{ alignItems: 'center' }}>
      {r.characters.map((id) => <div key={id} className="pop-in stack" style={{ alignItems: 'center', gap: 2 }}><div style={{ width: compact ? 100 : 150 }}><Nanabo look={CHARACTER_MAP[id].look} emotion="excited" /></div><div className="bold">Новый Нанабо: {CHARACTER_MAP[id].name}!</div></div>)}
      {(cur.length > 0 || r.xp > 0) && <div className="row wrap" style={{ justifyContent: 'center' }}>
        {cur.map((c) => <span key={c} className="cur" style={{ fontSize: 18 }}><CurIcon c={c} />+{fmt(r[c])}</span>)}
        {r.xp > 0 && <span className="cur" style={{ fontSize: 16 }}>✨ +{r.xp} опыта</span>}
      </div>}
      {r.items.length > 0 && <div className="row wrap" style={{ justifyContent: 'center' }}>{r.items.map((id) => ITEM_MAP[id] && <div key={id} className="tile" style={{ width: 92 }}><div style={{ width: 64, height: 64 }}><ItemIcon item={ITEM_MAP[id]} /></div><div className="nm">{ITEM_MAP[id].name}</div></div>)}</div>}
      {r.decor.length > 0 && <div className="row wrap" style={{ justifyContent: 'center' }}>{r.decor.map((id) => <span key={id} className="pill">🪴 {DECOR_MAP[id]?.name}</span>)}</div>}
      {r.cards.length > 0 && <div className="row wrap" style={{ justifyContent: 'center' }}>{r.cards.map((id) => <span key={id} className="pill">{cardEmoji(CARD_MAP[id]?.icon)} {CARD_MAP[id]?.name}</span>)}</div>}
      {Object.entries(r.chests).filter(([, n]) => n).map(([t, n]) => <span key={t} className="pill">{CHEST_ICON[t]} {CHEST_NAME[t]} ×{n}</span>)}
      {Object.entries(r.materials).filter(([, n]) => n).map(([m, n]) => <span key={m} className="pill">{MAT_ICON[m]} {MAT_NAME[m]} ×{n}</span>)}
      {Object.entries(r.food).filter(([, n]) => n).map(([f, n]) => <span key={f} className="pill">🍽️ {FOODS[f]?.name} ×{n}</span>)}
      {r.compensation.length > 0 && <div className="small muted">Дубликаты превращены в монеты: {r.compensation.map((c) => `${c.what} (+${c.coins})`).join(', ')}</div>}
      {r.levelUps.length > 0 && <div className="bold" style={{ color: 'var(--pink-d)' }}>🎉 Новый уровень: {r.levelUps.join(', ')}</div>}
    </div>
  );
}
