import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { Btn, Empty, Screen, Sheet } from '../ui/kit';
import { Nanabo } from '../art/Nanabo';
import { Stage, PHOTO_BGS } from '../ui/Scene';
import { CHARACTER_MAP } from '../game/data/characters';
import { ITEM_MAP } from '../game/data/items';
import { photoCapacity } from '../game/engine/wardrobe';
import { EMOTION_NAME } from '../ui/icons';
import type { PhotoEntry } from '../game/types';

export function PhotoView({ p, height = 220 }: { p: PhotoEntry; height?: number }) {
  const c = CHARACTER_MAP[p.charId]; const b = PHOTO_BGS[p.background] || PHOTO_BGS.sunny;
  if (!c) return null;
  return <Stage sky1={b.sky1} sky2={b.sky2} ground={b.ground} height={height}><div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'end center', paddingBottom: height * 0.08 }}><div style={{ width: height * 0.62 }}><Nanabo look={c.look} equipped={p.items} emotion={p.emotion} animate={false} /></div></div></Stage>;
}
export function PhotosScreen() {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const [sel, setSel] = useState<PhotoEntry | null>(null);
  const list = g.outfits.photos.slice().reverse();
  return (
    <Screen title="📸 Фотоальбом">
      <div className="stack">
        <div className="small muted center">Фото: {list.length}/{photoCapacity(g)}. Новые фото делаются в гардеробе кнопкой 📸.</div>
        {list.length === 0 ? <Empty icon="📷" text="Пока нет ни одной фотографии. Одень Нанабо и нажми 📸 в гардеробе!" /> :
          <div className="grid g2">{list.map((p) => <button key={p.id} className="tile" style={{ padding: 6 }} onClick={() => setSel(p)} aria-label={`Фото: ${p.caption || CHARACTER_MAP[p.charId]?.name}`}><PhotoView p={p} height={150} /><div className="nm">{p.caption || CHARACTER_MAP[p.charId]?.name}</div></button>)}</div>}
      </div>
      {sel && <Sheet onClose={() => setSel(null)} title={sel.caption || CHARACTER_MAP[sel.charId]?.name}>
        <div className="stack"><PhotoView p={sel} height={300} />
          <div className="small muted center">{CHARACTER_MAP[sel.charId]?.name} · {EMOTION_NAME[sel.emotion]} · {new Date(sel.createdAt).toLocaleDateString('ru-RU')}</div>
          <div className="row wrap" style={{ justifyContent: 'center' }}>{Object.values(sel.items).map((id) => <span key={id} className="pill">{ITEM_MAP[id as string]?.name}</span>)}</div>
          <Btn block color="red" onClick={() => { act(() => api.deletePhoto(sel.id), { sfx: 'whoosh' }); setSel(null); }}>Удалить фото</Btn><Btn block ghost onClick={() => setSel(null)}>Закрыть</Btn></div></Sheet>}
    </Screen>
  );
}
