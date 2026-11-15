import { useMemo, useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { Btn, Chips, CostView, CurrencyBar, RarTag, Screen, Sheet } from '../ui/kit';
import { ITEMS, ITEM_MAP, SETS, SET_MAP, CATEGORY_LABEL } from '../game/data/items';
import { DECOR } from '../game/data/decor';
import { CHESTS } from '../game/data/economy';
import { ItemIcon } from '../art/ItemIcon';
import { Nanabo } from '../art/Nanabo';
import { DecorArt } from '../art/DecorArt';
import { CHARACTER_MAP } from '../game/data/characters';
import { itemPrice, unlockStatus, setPrice, canBuySet, shopDiscount } from '../game/engine/shop';
import { CHEST_ICON, CHEST_NAME, LAYER_NAME } from '../ui/icons';
import { scaleCost } from '../game/engine/economy';
import { fireConfetti } from '../app/bus';
import type { ChestTier, ItemDef, Layer } from '../game/types';

/** Карточка предмета: примерка на выбранном Нанабо, покупка, надевание. */
export function ItemSheet({ itemId, charId, onClose }: { itemId: string; charId: string; onClose: () => void }) {
  const { api } = useApp(); const g = useGame(); const act = useAct(); const nav = useNav();
  const it = ITEM_MAP[itemId]; const ch = g.characters[charId]; const def = CHARACTER_MAP[charId];
  const owned = !!g.wardrobe.owned[itemId];
  const us = unlockStatus(g, it.unlock);
  const price = itemPrice(g, it);
  const worn = ch.equipped[it.layer] === itemId;
  return (
    <Sheet onClose={onClose}>
      <div className="stack" style={{ alignItems: 'center' }}>
        <div className="stage" style={{ width: '100%', height: 230, ['--sky1' as string]: '#E6F4FF', ['--sky2' as string]: '#FFF8E7' } as never}>
          <div className="ground" style={{ background: '#CFE8C0' }} />
          <div style={{ position: 'absolute', left: '28%', width: '44%', bottom: 12 }}><Nanabo look={def.look} equipped={{ ...ch.equipped, [it.layer]: itemId }} emotion={ch.emotion} /></div>
          <div className="pill" style={{ position: 'absolute', left: 8, top: 8, background: '#fff' }}>Примерка: {ch.nickname || def.name}</div>
        </div>
        <div className="row"><h2 style={{ margin: 0 }}>{it.name}</h2><RarTag r={it.rarity} /></div>
        <div className="muted center">{it.desc}</div>
        <div className="row wrap gap-s" style={{ justifyContent: 'center' }}><span className="pill">{LAYER_NAME[it.layer]}</span>{it.season && <span className="pill">сезон</span>}{it.tags.slice(0, 3).map((t) => <span key={t} className="pill">#{t}</span>)}</div>
        {!owned && !us.ok && <div className="banner warn">🔒 {us.text}</div>}
        {owned ? <div className="grid g2" style={{ width: '100%' }}>
          <Btn onClick={() => { const r = worn ? act(() => api.unequip(charId, it.layer), { sfx: 'equip' }) : act(() => api.equip(charId, itemId), { sfx: 'equip' }); void r; }}>{worn ? 'Снять' : 'Надеть'}</Btn>
          <Btn ghost onClick={() => { nav.setTab('wardrobe'); nav.reset('tabs'); }}>В гардероб</Btn>
        </div> : it.unlock.type === 'reward' ? <div className="card flat center small">Это особая награда — купить нельзя.</div> :
          <Btn block xl disabled={!us.ok} onClick={() => { const r = act(() => api.buyItem(itemId), { sfx: 'buy', ok: 'Куплено!' }); if (r.ok) fireConfetti(); }}><span>Купить</span> <CostView cost={price} discount={shopDiscount(g) > 0} /></Btn>}
        {owned && <div className="small" style={{ color: 'var(--green)' }}>✓ Уже в твоём гардеробе</div>}
      </div>
    </Sheet>
  );
}

function SetSheet({ setId, charId, onClose }: { setId: string; charId: string; onClose: () => void }) {
  const { api } = useApp(); const g = useGame(); const act = useAct();
  const set = SET_MAP[setId]; const def = CHARACTER_MAP[charId]; const ch = g.characters[charId];
  const look: Partial<Record<Layer, string>> = {}; for (const p of set.pieces) look[ITEM_MAP[p].layer] = p;
  const all = set.pieces.every((p) => g.wardrobe.owned[p]);
  const chk = canBuySet(g, setId); const price = setPrice(g, set);
  return (
    <Sheet onClose={onClose} title={set.name}>
      <div className="stack" style={{ alignItems: 'center' }}>
        <div className="stage" style={{ width: '100%', height: 230 }}><div className="ground" /><div style={{ position: 'absolute', left: '28%', width: '44%', bottom: 12 }}><Nanabo look={def.look} equipped={{ ...look }} emotion={ch.emotion} /></div></div>
        <div className="muted center">{set.desc}</div>
        <div className="row wrap" style={{ justifyContent: 'center' }}>{set.pieces.map((p) => <div key={p} className="tile" style={{ width: 70, opacity: g.wardrobe.owned[p] ? 1 : .7 }}><div style={{ width: 52, height: 52 }}><ItemIcon item={ITEM_MAP[p]} /></div><div className="tiny">{g.wardrobe.owned[p] ? '✓' : ' '}</div></div>)}</div>
        {all ? <Btn block onClick={() => act(() => api.equipSet(charId, setId), { sfx: 'equip', ok: 'Образ надет!' })}>Надеть набор</Btn> :
          <>{!chk.ok && chk.reason && <div className="banner warn">{chk.reason}</div>}<Btn block xl disabled={!chk.ok} onClick={() => { const r = act(() => api.buySet(setId), { sfx: 'buy', ok: 'Набор куплен!' }); if (r.ok) fireConfetti(); }}>Купить набор <CostView cost={price} /></Btn><div className="tiny faint">Скидка 20% за комплект. Уже купленные вещи не оплачиваются.</div></>}
      </div>
    </Sheet>
  );
}

export function ItemTile({ it, owned, onClick, tag }: { it: ItemDef; owned: boolean; onClick: () => void; tag?: string }) {
  const g = useGame(); const us = unlockStatus(g, it.unlock);
  return <button className={`tile rar-${it.rarity} ${owned || us.ok ? '' : 'locked'}`} onClick={onClick} aria-label={it.name}>
    <div style={{ width: '90%', aspectRatio: '1' }}><ItemIcon item={it} /></div>
    <div className="nm">{it.name}</div>
    {owned ? <span className="tiny" style={{ color: 'var(--green)' }}>✓ есть</span> : it.unlock.type === 'reward' ? <span className="tiny">🎖️ награда</span> : !us.ok ? <span className="tiny">🔒 {us.text.replace('Нужен ', '').replace(' уровень Stefania', ' ур.')}</span> : <CostView cost={itemPrice(g, it)} />}
    {tag && <span className="corner">{tag}</span>}
  </button>;
}

type Sec = 'items' | 'sets' | 'chests' | 'decor';
const CATS = ['outfit', 'costume', 'hat', 'eyewear', 'shoes', 'jewelry', 'special'] as const;
export function ShopTab() {
  const { api } = useApp(); const g = useGame(); const act = useAct(); const nav = useNav();
  const [sec, setSec] = useState<Sec>('items'); const [cat, setCat] = useState<string>('outfit');
  const [item, setItem] = useState<string | null>(null); const [set, setSet] = useState<string | null>(null);
  const charId = g.player.selectedCharacterId;
  const list = useMemo(() => ITEMS.filter((i) => i.category === cat), [cat]);
  const disc = shopDiscount(g);
  return (
    <Screen noBack tabs title="Магазин" right={<CurrencyBar />}>
      <Chips<Sec> value={sec} onChange={setSec} options={[{ id: 'items', label: '👕 Вещи' }, { id: 'sets', label: '🎀 Наборы' }, { id: 'chests', label: '🎁 Сундуки' }, { id: 'decor', label: '🪴 Декор' }]} />
      {disc > 0 && <div className="banner" style={{ marginBottom: 10 }}>🏷️ Скидка Гардеробной: {Math.round(disc * 100)}%</div>}
      {sec === 'items' && <div className="stack">
        <Chips value={cat} onChange={setCat} options={CATS.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))} />
        <div className="grid g3">{list.map((it) => <ItemTile key={it.id} it={it} owned={!!g.wardrobe.owned[it.id]} onClick={() => setItem(it.id)} />)}</div>
      </div>}
      {sec === 'sets' && <div className="stack">{SETS.map((s) => {
        const have = s.pieces.filter((p) => g.wardrobe.owned[p]).length;
        return <button key={s.id} className={`card rar-${s.rarity}`} style={{ border: '3px solid var(--rc)', textAlign: 'left', cursor: 'pointer' }} onClick={() => setSet(s.id)}>
          <div className="row between"><span className="bold">{s.name}</span><RarTag r={s.rarity} /></div>
          <div className="row" style={{ margin: '6px 0' }}>{s.pieces.map((p) => <div key={p} style={{ width: 52, height: 52, opacity: g.wardrobe.owned[p] ? 1 : .55 }}><ItemIcon item={ITEM_MAP[p]} /></div>)}</div>
          <div className="row between small"><span className="muted">{have === s.pieces.length ? '✓ Собран' : `Собрано ${have}/${s.pieces.length}`}</span>{have < s.pieces.length && <CostView cost={setPrice(g, s)} />}</div>
        </button>;
      })}</div>}
      {sec === 'chests' && <div className="stack">{(Object.keys(CHESTS) as ChestTier[]).map((t) => {
        const c = CHESTS[t];
        return <div key={t} className="card row" style={{ borderLeft: `8px solid ${c.color}` }}>
          <span className="emoji l">{CHEST_ICON[t]}</span>
          <div className="grow"><div className="bold">{CHEST_NAME[t]}</div><div className="small muted">{c.rolls} награды{c.pityAt ? ` · гарантия редкости раз в ${c.pityAt}` : ''}</div><div className="small">В запасе: <b>{g.inventory.chests[t]}</b></div></div>
          <div className="stack" style={{ gap: 6, alignItems: 'stretch' }}><Btn small onClick={() => act(() => api.buyChest(t), { sfx: 'buy' })}><CostView cost={c.price} /></Btn>{g.inventory.chests[t] > 0 && <Btn small color="pink" onClick={() => nav.push('chests', { tier: t })}>Открыть</Btn>}</div>
        </div>;
      })}</div>}
      {sec === 'decor' && <div className="grid g3">{DECOR.filter((d) => d.shopable).map((d) => <div key={d.id} className={`tile rar-${d.rarity}`}>
        <div style={{ width: 70, height: 70 }}><DecorArt d={d} /></div><div className="nm">{d.name}</div><div className="tiny muted">Уют +{d.comfort}{g.inventory.decor[d.id] ? ` · есть ${g.inventory.decor[d.id]}` : ''}</div>
        <Btn small onClick={() => act(() => api.buyDecor(d.id), { sfx: 'buy', ok: 'Куплено! Поставь её в комнате.' })}><CostView cost={scaleCost(d.cost, 1 - disc)} /></Btn>
      </div>)}</div>}
      {item && <ItemSheet itemId={item} charId={charId} onClose={() => setItem(null)} />}
      {set && <SetSheet setId={set} charId={charId} onClose={() => setSet(null)} />}
    </Screen>
  );
}
