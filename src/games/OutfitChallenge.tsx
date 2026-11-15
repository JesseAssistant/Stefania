import { useMemo, useState } from 'react';
import { useApp, useGame } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { ITEMS, ITEM_MAP } from '../game/data/items';
import { CHARACTER_MAP } from '../game/data/characters';
import { Nanabo } from '../art/Nanabo';
import { ItemIcon } from '../art/ItemIcon';
import { Btn } from '../ui/kit';
import { LAYER_NAME } from '../ui/icons';
import { shuffle } from './hooks';
import type { Layer, ItemDef } from '../game/types';
import type { GameProps } from './types';

export const OUTFIT_THEMES: Record<string, { name: string; emoji: string; hint: string; primary: string[]; secondary: string[] }> = {
  pirate: { name: 'Пират', emoji: '🏴‍☠️', hint: 'Ищи морские и пиратские вещи, приключенческие — тоже подойдут.', primary: ['pirate', 'sea'], secondary: ['adventure', 'beach', 'summer'] },
  party: { name: 'Вечеринка', emoji: '🎉', hint: 'Яркие праздничные вещи: колпаки, блёстки, шарики.', primary: ['party'], secondary: ['fancy', 'cute', 'fun'] },
  space: { name: 'Космос', emoji: '🚀', hint: 'Звёзды, ночное небо и наука.', primary: ['space', 'night', 'science'], secondary: ['legend', 'smart', 'fashion'] },
  magic: { name: 'Маг', emoji: '🪄', hint: 'Магия, сияние и нарядные украшения.', primary: ['magic', 'fancy'], secondary: ['cute', 'legend', 'royal'] },
};
export const themeScore = (themeId: string, item: ItemDef): number => {
  const t = OUTFIT_THEMES[themeId]; if (!t) return 0;
  if (item.tags.some((x) => t.primary.includes(x))) return 10;
  if (item.tags.some((x) => t.secondary.includes(x))) return 5;
  return 1;
};
const LAYERS: Layer[] = ['hat', 'glasses', 'outfit', 'costume', 'jewelry', 'accessory', 'shoes', 'effect'];

/** Все предметы берутся «из реквизита» — не нужно покупать вещи, чтобы пройти вызов. */
export function OutfitChallenge({ cfg, seed, onDone }: GameProps<'outfit-challenge'>) {
  const { audio } = useApp(); const g = useGame();
  const theme = OUTFIT_THEMES[cfg.themeId] || OUTFIT_THEMES.party;
  const who = CHARACTER_MAP[g.player.selectedCharacterId] || CHARACTER_MAP.pip;
  const pool = useMemo(() => {
    const r = mulberry32(seed);
    const match = ITEMS.filter((i) => themeScore(cfg.themeId, i) >= 5);
    const decoys = shuffle(ITEMS.filter((i) => themeScore(cfg.themeId, i) < 5), r).slice(0, 10);
    return shuffle([...match, ...decoys], r);
  }, [seed, cfg.themeId]);
  const [pick, setPick] = useState<Partial<Record<Layer, string>>>({});
  const [layer, setLayer] = useState<Layer>('hat');
  const count = Object.keys(pick).length;
  const layersIn = LAYERS.filter((l) => pool.some((i) => i.layer === l));
  const toggle = (it: ItemDef) => {
    const cur = pick[it.layer];
    if (cur === it.id) { const p = { ...pick }; delete p[it.layer]; setPick(p); audio.sfx('whoosh'); return; }
    if (!cur && count >= cfg.slots) { audio.sfx('error'); return; }
    setPick({ ...pick, [it.layer]: it.id }); audio.sfx('equip');
  };
  const total = Object.values(pick).reduce((a, id) => a + themeScore(cfg.themeId, ITEM_MAP[id as string]), 0);
  const submit = () => { audio.sfx(total >= cfg.slots * 5 ? 'win' : 'lose'); onDone({ success: total >= cfg.slots * 5, metric: total }); };
  return (
    <>
      <div className="hud"><span className="pill">{theme.emoji} {theme.name}</span><span className="pill">👗 {count}/{cfg.slots}</span><span className="small muted">Нужно очков: {cfg.slots * 5}+</span></div>
      <div className="game-area" style={{ display: 'flex', flexDirection: 'column', padding: '0 14px 14px', gap: 8, touchAction: 'auto', overflowY: 'auto' }}>
        <div className="small muted center">{theme.hint}</div>
        <div className="stage" style={{ height: 190, flex: 'none' }}><div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: 150 }}><Nanabo look={who.look} equipped={pick} emotion={total >= cfg.slots * 8 ? 'love' : 'happy'} animate={false} /></div></div></div>
        <div className="chip-row">{layersIn.map((l) => <button key={l} className={`chip ${l === layer ? 'on' : ''}`} onClick={() => setLayer(l)}>{LAYER_NAME[l]}{pick[l] ? ' ✓' : ''}</button>)}</div>
        <div className="grid g3">{pool.filter((i) => i.layer === layer).map((i) => <button key={i.id} className={`tile ${pick[i.layer] === i.id ? 'sel' : ''}`} onClick={() => toggle(i)} aria-label={i.name}><div style={{ width: 60, height: 60 }}><ItemIcon item={i} /></div><div className="nm">{i.name}</div></button>)}</div>
        <Btn block disabled={count === 0} onClick={submit}>Готово — показать образ</Btn>
      </div>
    </>
  );
}
