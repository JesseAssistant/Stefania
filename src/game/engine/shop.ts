import { GameError } from '../types';
import type { ChestTier, Cost, GameState, ItemDef, ItemUnlock, SetDef } from '../types';
import { CURRENCIES } from '../types';
import { ITEM_MAP, SET_MAP } from '../data/items';
import { DECOR_MAP } from '../data/decor';
import { CHESTS } from '../data/economy';
import { roomFx } from '../data/rooms';
import type { Ctx } from './context';
import { nowIso } from './context';
import { canAfford, scaleCost, spend } from './economy';
import { acquireItem } from './rewards';
import { stateMetric } from './metrics';

export function shopDiscount(d: GameState): number { return roomFx.shopDiscount(d.base.rooms.wardrobe.level); }
export const itemPrice = (d: GameState, def: { cost: Cost }): Cost => scaleCost(def.cost, 1 - shopDiscount(d));

export function unlockStatus(d: GameState, u: ItemUnlock): { ok: boolean; text: string } {
  switch (u.type) {
    case 'shop': return { ok: true, text: '' };
    case 'level': return { ok: d.player.level >= u.level, text: `Нужен ${u.level} уровень Stefania` };
    case 'world': return { ok: !!d.worlds[`w${u.world}`]?.unlocked, text: `Нужно открыть мир ${u.world}` };
    case 'stars': return { ok: stateMetric(d, 'stars') >= u.stars, text: `Нужно ${u.stars} звёзд` };
    case 'reward': return { ok: false, text: u.how };
  }
}
export function canBuyItem(d: GameState, id: string): { ok: boolean; reason?: string } {
  const def = ITEM_MAP[id];
  if (!def) return { ok: false, reason: 'Предмет не найден' };
  if (d.wardrobe.owned[id]) return { ok: false, reason: 'Уже куплено' };
  const u = unlockStatus(d, def.unlock);
  if (!u.ok) return { ok: false, reason: u.text };
  if (!canAfford(d, itemPrice(d, def))) return { ok: false, reason: 'Не хватает валюты' };
  return { ok: true };
}
export function buyItem(d: GameState, ctx: Ctx, id: string): void {
  const def = ITEM_MAP[id];
  if (!def) throw new GameError('no_item', 'Предмет не найден');
  if (d.wardrobe.owned[id]) throw new GameError('owned', 'Этот предмет уже есть');
  const u = unlockStatus(d, def.unlock);
  if (!u.ok) throw new GameError('locked', u.text);
  spend(d, ctx, itemPrice(d, def), `buy:${id}`);
  acquireItem(d, ctx, id, 'shop');
  d.statistics.itemsBought++;
  ctx.emit({ type: 'item_bought', itemId: id });
}

export function setPieces(d: GameState, set: SetDef): ItemDef[] { void d; return set.pieces.map((p) => ITEM_MAP[p]); }
export function setPrice(d: GameState, set: SetDef): Cost {
  const sum: Cost = {};
  for (const p of set.pieces) {
    if (d.wardrobe.owned[p]) continue;
    for (const c of CURRENCIES) if (ITEM_MAP[p].cost[c]) sum[c] = (sum[c] || 0) + (ITEM_MAP[p].cost[c] as number);
  }
  return scaleCost(sum, 0.8 * (1 - shopDiscount(d)));
}
export function canBuySet(d: GameState, setId: string): { ok: boolean; reason?: string } {
  const set = SET_MAP[setId];
  if (!set) return { ok: false, reason: 'Комплект не найден' };
  if (set.pieces.every((p) => d.wardrobe.owned[p])) return { ok: false, reason: 'Комплект уже собран' };
  const u = unlockStatus(d, set.unlock);
  if (!u.ok) return { ok: false, reason: u.text };
  if (!canAfford(d, setPrice(d, set))) return { ok: false, reason: 'Не хватает валюты' };
  return { ok: true };
}
export function buySet(d: GameState, ctx: Ctx, setId: string): void {
  const set = SET_MAP[setId];
  if (!set) throw new GameError('no_set', 'Комплект не найден');
  const chk = canBuySet(d, setId);
  if (!chk.ok) throw new GameError('cannot', chk.reason || 'Нельзя купить');
  const price = setPrice(d, set);
  spend(d, ctx, price, `buyset:${setId}`);
  for (const p of set.pieces) if (!d.wardrobe.owned[p]) { acquireItem(d, ctx, p, 'shop-set'); d.statistics.itemsBought++; }
  d.wardrobe.ownedSets[setId] = { at: nowIso(ctx) };
  ctx.emit({ type: 'item_bought', itemId: setId });
}
export function buyChest(d: GameState, ctx: Ctx, tier: ChestTier): void {
  const def = CHESTS[tier];
  spend(d, ctx, def.price, `chest:${tier}`);
  d.inventory.chests[tier]++;
}
export function buyDecor(d: GameState, ctx: Ctx, id: string): void {
  const def = DECOR_MAP[id];
  if (!def || !def.shopable) throw new GameError('no_decor', 'Эту декорацию нельзя купить');
  spend(d, ctx, scaleCost(def.cost, 1 - shopDiscount(d)), `decor:${id}`);
  d.inventory.decor[id] = (d.inventory.decor[id] || 0) + 1;
  ctx.emit({ type: 'item_bought', itemId: id });
}
