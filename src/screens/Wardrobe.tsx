import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { Btn, Chips, CurrencyBar, Empty, Screen, Sheet } from '../ui/kit';
import { Stage, PHOTO_BGS } from '../ui/Scene';
import { Nanabo } from '../art/Nanabo';
import { ItemIcon } from '../art/ItemIcon';
import { ITEMS, ITEM_MAP, SETS, LAYER_ORDER } from '../game/data/items';
import { CHARACTERS, CHARACTER_MAP } from '../game/data/characters';
import { ItemSheet, ItemTile } from './Shop';
import { outfitCapacity, photoCapacity } from '../game/engine/wardrobe';
import { LAYER_NAME, EMOTION_NAME } from '../ui/icons';
import type { Emotion, Layer } from '../game/types';
import { fireConfetti } from '../app/bus';

type Sec = Layer | 'outfits' | 'sets';
const EMOS: Emotion[] = ['happy', 'wink', 'surprised', 'love', 'sleepy', 'excited', 'sad'];

export function WardrobeTab() {
  const { api } = useApp(); const g = useGame(); const act = useAct(); const nav = useNav();
  const [charId, setCharId] = useState(g.player.selectedCharacterId);
  const [sec, setSec] = useState<Sec>('outfit');
  const [onlyMine, setOnlyMine] = useState(true);
  const [item, setItem] = useState<string | null>(null);
  const [saveSheet, setSaveSheet] = useState(false); const [photoSheet, setPhotoSheet] = useState(false);
  const [name, setName] = useState('');
  const def = CHARACTER_MAP[charId], ch = g.characters[charId];
  const unlocked = CHARACTERS.filter((c) => g.characters[c.id].unlocked);
  const cap = outfitCapacity(g);
  const worn = Object.keys(ch.equipped).length;
  const items = ITEMS.filter((i) => i.layer === sec && (!onlyMine || g.wardrobe.owned[i.id]));
  return (
    <Screen noBack tabs title="Гардероб" right={<CurrencyBar only={['bananas', 'coins']} />}>
      <div className="stack">
        <div className="chip-row" aria-label="Кого одеваем">{unlocked.map((c) => <button key={c.id} className={`tile ${c.id === charId ? 'sel' : ''}`} style={{ flex: 'none', width: 58, padding: 4 }} onClick={() => setCharId(c.id)} aria-label={c.name}><div style={{ width: 44 }}><Nanabo look={c.look} equipped={g.characters[c.id].equipped} animate={false} shadow={false} /></div></button>)}</div>
        <Stage height={250}>
          <div style={{ position: 'absolute', left: '27%', width: '46%', bottom: 12 }}><Nanabo look={def.look} equipped={ch.equipped} emotion={ch.emotion} title={def.name} /></div>
          <div className="pill" style={{ position: 'absolute', left: 8, top: 8, background: '#fff' }}>{ch.nickname || def.name} · {worn} вещ.</div>
          <div className="stack" style={{ position: 'absolute', right: 8, top: 8, gap: 6 }}>
            <button className="icon-btn" aria-label="Отменить" disabled={ch.history.length === 0} style={{ opacity: ch.history.length ? 1 : .4 }} onClick={() => act(() => api.undoLook(charId), { sfx: 'equip' })}>↩️</button>
            <button className="icon-btn" aria-label="Снять всё" disabled={!worn} style={{ opacity: worn ? 1 : .4 }} onClick={() => act(() => api.applyLook(charId, {}), { sfx: 'equip' })}>🧺</button>
            <button className="icon-btn" aria-label="Сохранить образ" onClick={() => { setName(''); setSaveSheet(true); }}>💾</button>
            <button className="icon-btn" aria-label="Сфотографировать" onClick={() => setPhotoSheet(true)}>📸</button>
          </div>
        </Stage>
        <Chips<Sec> value={sec} onChange={setSec} options={[...LAYER_ORDER.map((l) => ({ id: l as Sec, label: LAYER_NAME[l] })), { id: 'outfits', label: `💾 Образы ${g.outfits.saved.length}/${cap}` }, { id: 'sets', label: '🎀 Наборы' }]} />
        {sec !== 'outfits' && sec !== 'sets' && <>
          <div className="row between"><span className="small muted">{items.length} {onlyMine ? 'в гардеробе' : 'всего'}</span><button className="chip" onClick={() => setOnlyMine(!onlyMine)}>{onlyMine ? 'Показать все' : 'Только мои'}</button></div>
          {items.length === 0 ? <Empty icon="🛍️" text="В этой категории пока ничего нет." action={<Btn small onClick={() => { nav.setTab('shop'); }}>В магазин</Btn>} /> :
            <div className="grid g3">{items.map((it) => <ItemTile key={it.id} it={it} owned={!!g.wardrobe.owned[it.id]} tag={ch.equipped[it.layer] === it.id ? '✅' : g.player.favorites.items.includes(it.id) ? '⭐' : undefined} onClick={() => {
              if (!g.wardrobe.owned[it.id]) { setItem(it.id); return; }
              if (ch.equipped[it.layer] === it.id) act(() => api.unequip(charId, it.layer), { sfx: 'equip' }); else act(() => api.equip(charId, it.id), { sfx: 'equip' });
            }} />)}</div>}
          <div className="tiny faint center">Нажми на вещь, чтобы надеть или снять. Долгая история изменений сохраняется — кнопка ↩️ вернёт прежний образ.</div>
        </>}
        {sec === 'outfits' && (g.outfits.saved.length === 0 ? <Empty icon="💾" text="Образов пока нет. Оденься и нажми 💾!" /> : <div className="grid g2">{g.outfits.saved.map((o) => {
          const oc = CHARACTER_MAP[o.charId];
          return <div key={o.id} className="card stack" style={{ alignItems: 'center', padding: 10 }}>
            <div style={{ width: '70%' }}><Nanabo look={oc.look} equipped={o.items} animate={false} /></div>
            <div className="bold small center">{o.name}</div>
            <div className="row gap-s"><Btn small onClick={() => act(() => api.applyOutfit(o.id, charId), { sfx: 'equip', ok: 'Образ надет' })}>Надеть</Btn><button className="icon-btn" style={{ width: 38, height: 38 }} aria-label="Избранное" onClick={() => act(() => api.toggleFavorite('outfits', o.id), { sfx: 'pop' })}>{g.player.favorites.outfits.includes(o.id) ? '⭐' : '☆'}</button><button className="icon-btn" style={{ width: 38, height: 38 }} aria-label="Удалить образ" onClick={() => act(() => api.deleteOutfit(o.id), { sfx: 'tap' })}>🗑️</button></div>
          </div>;
        })}</div>)}
        {sec === 'sets' && <div className="stack">{SETS.map((s) => {
          const have = s.pieces.filter((p) => g.wardrobe.owned[p]).length;
          return <div key={s.id} className="card row"><div className="row" style={{ gap: 2 }}>{s.pieces.slice(0, 4).map((p) => <div key={p} style={{ width: 40, height: 40, opacity: g.wardrobe.owned[p] ? 1 : .35 }}><ItemIcon item={ITEM_MAP[p]} /></div>)}</div>
            <div className="grow"><div className="bold">{s.name}</div><div className="small muted">Собрано {have}/{s.pieces.length}</div></div>
            <Btn small disabled={have < s.pieces.length} onClick={() => act(() => api.equipSet(charId, s.id), { sfx: 'equip', ok: 'Набор надет!' })}>Надеть</Btn></div>;
        })}</div>}
      </div>
      {item && <ItemSheet itemId={item} charId={charId} onClose={() => setItem(null)} />}
      {saveSheet && <Sheet onClose={() => setSaveSheet(false)} title="Сохранить образ">
        <div className="stack"><input className="field" maxLength={20} value={name} placeholder="Название образа" onChange={(e: { target: { value: string } }) => setName(e.target.value)} aria-label="Название образа" />
          <div className="small muted">Слотов: {g.outfits.saved.length}/{cap}. Больше слотов даёт Гардеробная.</div>
          <Btn block onClick={() => { const r = act(() => api.saveOutfit(charId, name || `Образ ${g.outfits.saved.length + 1}`), { sfx: 'good', ok: 'Образ сохранён!' }); if (r.ok) setSaveSheet(false); }}>Сохранить</Btn></div>
      </Sheet>}
      {photoSheet && <PhotoSheet charId={charId} onClose={() => setPhotoSheet(false)} />}
    </Screen>
  );
}

function PhotoSheet({ charId, onClose }: { charId: string; onClose: () => void }) {
  const { api } = useApp(); const g = useGame(); const act = useAct();
  const [bg, setBg] = useState('sunny'); const [emo, setEmo] = useState<Emotion>(g.characters[charId].emotion); const [cap, setCap] = useState('');
  const def = CHARACTER_MAP[charId], ch = g.characters[charId]; const b = PHOTO_BGS[bg];
  return (
    <Sheet onClose={onClose} title="Фотосессия">
      <div className="stack">
        <Stage height={230} sky1={b.sky1} sky2={b.sky2} ground={b.ground}><div style={{ position: 'absolute', left: '28%', width: '44%', bottom: 12 }}><Nanabo look={def.look} equipped={ch.equipped} emotion={emo} /></div></Stage>
        <Chips value={bg} onChange={setBg} options={Object.entries(PHOTO_BGS).map(([id, v]) => ({ id, label: v.name }))} />
        <Chips<Emotion> value={emo} onChange={setEmo} options={EMOS.map((e) => ({ id: e, label: EMOTION_NAME[e] }))} />
        <input className="field" maxLength={30} placeholder="Подпись (необязательно)" value={cap} onChange={(e: { target: { value: string } }) => setCap(e.target.value)} aria-label="Подпись" />
        <div className="small muted">Фото в альбоме: {g.outfits.photos.length}/{photoCapacity(g)}</div>
        <Btn block xl color="pink" onClick={() => { const r = act(() => api.takePhoto(charId, bg, cap, emo), { sfx: 'win', ok: 'Снимок сохранён в альбом!' }); if (r.ok) { fireConfetti(); onClose(); } }}>📸 Снять!</Btn>
      </div>
    </Sheet>
  );
}
