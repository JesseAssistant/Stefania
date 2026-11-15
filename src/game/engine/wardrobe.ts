import { GameError } from '../types';
import type { Emotion, GameState, Layer, PhotoEntry, SavedOutfit } from '../types';
import { ITEM_MAP, SET_MAP } from '../data/items';
import { roomFx } from '../data/rooms';
import { uid } from '../util';
import type { Ctx } from './context';
import { nowIso } from './context';

const HIST_MAX = 15;
function char(d: GameState, id: string) {
  const c = d.characters[id];
  if (!c || !c.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  return c;
}
const snapshot = (eq: Partial<Record<Layer, string>>): Partial<Record<Layer, string | null>> => ({ ...eq });
function pushHistory(c: ReturnType<typeof char>) {
  c.history.push(snapshot(c.equipped));
  if (c.history.length > HIST_MAX) c.history.splice(0, c.history.length - HIST_MAX);
}
export const looksEqual = (a: Partial<Record<Layer, string>>, b: Partial<Record<Layer, string>>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if ((a as Record<string, string>)[k] !== (b as Record<string, string>)[k]) return false;
  return true;
};

export function equip(d: GameState, ctx: Ctx, charId: string, itemId: string): void {
  const c = char(d, charId);
  const def = ITEM_MAP[itemId];
  if (!def) throw new GameError('no_item', 'Такого предмета нет');
  if (!d.wardrobe.owned[itemId]) throw new GameError('not_owned', 'Предмет ещё не куплен');
  if (c.equipped[def.layer] === itemId) return;
  pushHistory(c);
  c.equipped[def.layer] = itemId;
  d.statistics.outfitChanges++;
  ctx.emit({ type: 'outfit_changed', charId });
}
export function unequip(d: GameState, ctx: Ctx, charId: string, layer: Layer): void {
  const c = char(d, charId);
  if (!c.equipped[layer]) return;
  pushHistory(c);
  delete c.equipped[layer];
  d.statistics.outfitChanges++;
  ctx.emit({ type: 'outfit_changed', charId });
}
export function undoLook(d: GameState, charId: string): boolean {
  const c = char(d, charId);
  const prev = c.history.pop();
  if (!prev) return false;
  const eq: Partial<Record<Layer, string>> = {};
  for (const [k, v] of Object.entries(prev)) if (v && d.wardrobe.owned[v]) eq[k as Layer] = v;
  c.equipped = eq;
  return true;
}
export function applyLook(d: GameState, ctx: Ctx, charId: string, items: Partial<Record<Layer, string>>): void {
  const c = char(d, charId);
  const next: Partial<Record<Layer, string>> = {};
  for (const [layer, id] of Object.entries(items)) {
    const def = ITEM_MAP[id as string];
    if (def && def.layer === layer && d.wardrobe.owned[id as string]) next[layer as Layer] = id as string;
  }
  if (looksEqual(c.equipped, next)) return;
  pushHistory(c);
  c.equipped = next;
  d.statistics.outfitChanges++;
  ctx.emit({ type: 'outfit_changed', charId });
}
export function equipSet(d: GameState, ctx: Ctx, charId: string, setId: string): void {
  const set = SET_MAP[setId];
  if (!set) throw new GameError('no_set', 'Такого комплекта нет');
  const c = char(d, charId);
  const have = set.pieces.filter((p) => d.wardrobe.owned[p]);
  if (!have.length) throw new GameError('not_owned', 'В комплекте нет купленных вещей');
  pushHistory(c);
  for (const p of have) c.equipped[ITEM_MAP[p].layer] = p;
  d.statistics.outfitChanges++;
  ctx.emit({ type: 'outfit_changed', charId });
}
export function outfitCapacity(d: GameState): number { return roomFx.outfitSlots(d.base.rooms.wardrobe.level); }
export function saveOutfit(d: GameState, ctx: Ctx, charId: string, name: string): SavedOutfit {
  const c = char(d, charId);
  if (!Object.keys(c.equipped).length) throw new GameError('empty', 'Сначала надень хоть что-нибудь');
  if (d.outfits.saved.length >= outfitCapacity(d)) throw new GameError('full', 'Нет свободных слотов. Улучши Гардеробную или удали образ');
  const clean = (name || '').trim().slice(0, 24) || `Образ ${d.outfits.saved.length + 1}`;
  const o: SavedOutfit = { id: uid('o', ctx.rng), name: clean, charId, items: { ...c.equipped }, favorite: false, createdAt: nowIso(ctx) };
  d.outfits.saved.push(o);
  d.statistics.outfitsSaved++;
  ctx.emit({ type: 'outfit_saved' });
  return o;
}
export function applyOutfit(d: GameState, ctx: Ctx, outfitId: string, charId: string): void {
  const o = d.outfits.saved.find((x) => x.id === outfitId);
  if (!o) throw new GameError('no_outfit', 'Образ не найден');
  applyLook(d, ctx, charId, o.items);
}
export function deleteOutfit(d: GameState, outfitId: string): void {
  d.outfits.saved = d.outfits.saved.filter((x) => x.id !== outfitId);
  d.player.favorites.outfits = d.player.favorites.outfits.filter((x) => x !== outfitId);
}
export function renameOutfit(d: GameState, outfitId: string, name: string): void {
  const o = d.outfits.saved.find((x) => x.id === outfitId);
  if (o) o.name = name.trim().slice(0, 24) || o.name;
}
export function toggleFavorite(d: GameState, kind: 'characters' | 'items' | 'outfits', id: string): boolean {
  const list = d.player.favorites[kind];
  const i = list.indexOf(id);
  if (i >= 0) { list.splice(i, 1); return false; }
  list.push(id);
  if (kind === 'outfits') { const o = d.outfits.saved.find((x) => x.id === id); if (o) o.favorite = true; }
  return true;
}
export const photoCapacity = (d: GameState) => (d.base.rooms.lounge.unlocked ? roomFx.photoSlots(d.base.rooms.lounge.level) : 6);
export function takePhoto(d: GameState, ctx: Ctx, charId: string, background: string, caption: string, emotion: Emotion): PhotoEntry {
  const c = char(d, charId);
  if (d.outfits.photos.length >= photoCapacity(d)) throw new GameError('full', 'Фотоальбом заполнен. Удали старое фото или улучши Комнату отдыха');
  const p: PhotoEntry = { id: uid('p', ctx.rng), charId, items: { ...c.equipped }, emotion, background, caption: caption.trim().slice(0, 40), createdAt: nowIso(ctx) };
  d.outfits.photos.push(p);
  d.statistics.photosTaken++;
  ctx.emit({ type: 'photo_taken' });
  return p;
}
export function deletePhoto(d: GameState, id: string) { d.outfits.photos = d.outfits.photos.filter((p) => p.id !== id); }
