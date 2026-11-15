import type { CharacterState, GameState, Reward, RewardResult, StatId } from '../types';
import { MATERIALS } from '../types';
import { CHARACTER_MAP } from '../data/characters';
import { ITEM_MAP } from '../data/items';
import { DECOR_MAP, CARD_MAP } from '../data/decor';
import { CHAR_LEVEL_PERKS, CHARACTER_DUP_XP, DUP_BASE, MAX_CHAR_LEVEL, MAX_PLAYER_LEVEL, charLevelReward, charXpToNext, duplicateCompensation, playerLevelReward, xpToNext } from '../data/economy';
import { MAX_PROCESSED_EVENTS } from '../../config';
import { earn } from './economy';
import { nowIso } from './context';
import type { Ctx } from './context';

void CHAR_LEVEL_PERKS;

export function emptyResult(eventId: string, source: string): RewardResult {
  return { eventId, source, applied: true, bananas: 0, coins: 0, crystals: 0, xp: 0, items: [], decor: [], characters: [], cards: [], chests: {}, materials: {}, food: {}, compensation: [], levelUps: [] };
}
export const isProcessed = (d: GameState, id: string) => d.metadata.processedEvents.includes(id);
export function markProcessed(d: GameState, id: string) {
  const list = d.metadata.processedEvents;
  list.push(id);
  if (list.length > MAX_PROCESSED_EVENTS) list.splice(0, list.length - MAX_PROCESSED_EVENTS);
}
export function logHistory(d: GameState, ctx: Ctx, type: string, text: string) {
  d.collections.history.push({ at: nowIso(ctx), type, text });
  if (d.collections.history.length > 300) d.collections.history.splice(0, d.collections.history.length - 300);
}
export const hasItem = (d: GameState, id: string) => !!d.wardrobe.owned[id];

/** Выдаёт предмет одежды. Возвращает false, если это дубликат (вместо этого — компенсация монетами). */
export function acquireItem(d: GameState, ctx: Ctx, id: string, source: string, res?: RewardResult): boolean {
  const def = ITEM_MAP[id];
  if (!def) throw new Error(`Неизвестный предмет ${id}`);
  if (d.wardrobe.owned[id]) {
    const coins = duplicateCompensation(def.cost, DUP_BASE[def.rarity]);
    earn(d, ctx, 'coins', coins, `dup:${id}`);
    if (res) { res.coins += coins; res.compensation.push({ what: def.name, coins }); }
    return false;
  }
  d.wardrobe.owned[id] = { at: nowIso(ctx), source };
  ctx.emit({ type: 'item_acquired', itemId: id });
  logHistory(d, ctx, 'item', `Новый предмет: ${def.name}`);
  res?.items.push(id);
  return true;
}
export function acquireCard(d: GameState, ctx: Ctx, id: string, res?: RewardResult): boolean {
  const def = CARD_MAP[id];
  if (!def) throw new Error(`Неизвестная карточка ${id}`);
  const cur = d.collections.cards[id];
  if (cur) {
    cur.count++;
    const coins = DUP_BASE[def.rarity];
    earn(d, ctx, 'coins', coins, `dupcard:${id}`);
    if (res) { res.coins += coins; res.compensation.push({ what: def.name, coins }); }
    return false;
  }
  d.collections.cards[id] = { at: nowIso(ctx), count: 1 };
  ctx.emit({ type: 'card_found', id });
  logHistory(d, ctx, 'card', `Новая карточка: ${def.name}`);
  res?.cards.push(id);
  return true;
}
export function unlockCharacter(d: GameState, ctx: Ctx, id: string, source: string, res?: RewardResult): boolean {
  const def = CHARACTER_MAP[id];
  const st = d.characters[id];
  if (!def || !st) throw new Error(`Неизвестный персонаж ${id}`);
  if (st.unlocked) {
    const coins = DUP_BASE[def.rarity] * 2;
    earn(d, ctx, 'coins', coins, `dupchar:${id}`);
    addCharXp(d, ctx, id, CHARACTER_DUP_XP);
    if (res) { res.coins += coins; res.compensation.push({ what: def.name, coins }); }
    return false;
  }
  st.unlocked = true; st.unlockedAt = nowIso(ctx); st.source = source;
  ctx.emit({ type: 'character_unlocked', id });
  ctx.notify({ type: 'character', id });
  logHistory(d, ctx, 'character', `Новый друг: ${def.name}`);
  res?.characters.push(id);
  return true;
}

export const effectiveStat = (d: GameState, id: string, stat: StatId): number => {
  const st = d.characters[id], def = CHARACTER_MAP[id];
  return def.stats[stat] + (st.trained[stat] || 0) + Math.floor(st.level / 4);
};

export function addCharXp(d: GameState, ctx: Ctx, id: string, xp: number): void {
  const st: CharacterState | undefined = d.characters[id];
  if (!st || !st.unlocked || xp <= 0) return;
  if (st.level >= MAX_CHAR_LEVEL) return;
  st.xp += Math.floor(xp);
  while (st.level < MAX_CHAR_LEVEL && st.xp >= charXpToNext(st.level)) {
    st.xp -= charXpToNext(st.level);
    st.level++;
    ctx.notify({ type: 'charlevel', id, level: st.level });
    const rew = charLevelReward(st.level);
    if (rew) grantReward(d, ctx, rew, `clevel:${id}:${st.level}`, 'charlevel');
  }
  if (st.level >= MAX_CHAR_LEVEL) st.xp = 0;
}

export function addPlayerXp(d: GameState, ctx: Ctx, xp: number, res?: RewardResult): void {
  if (xp <= 0) return;
  const p = d.player;
  p.totalXp += Math.floor(xp);
  if (res) res.xp += Math.floor(xp);
  if (p.level >= MAX_PLAYER_LEVEL) { p.xp = 0; return; }
  p.xp += Math.floor(xp);
  while (p.level < MAX_PLAYER_LEVEL && p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    res?.levelUps.push(p.level);
    ctx.emit({ type: 'player_level', level: p.level });
    const lr = grantReward(d, ctx, playerLevelReward(p.level), `plevel:${p.level}`, 'levelup');
    ctx.notify({ type: 'levelup', level: p.level, reward: lr });
    logHistory(d, ctx, 'level', `Уровень Stefania: ${p.level}`);
  }
  if (p.level >= MAX_PLAYER_LEVEL) p.xp = 0;
}

/**
 * ЕДИНАЯ система наград. eventId делает выдачу идемпотентной: повторный вызов с тем же id ничего не начисляет.
 */
export function grantReward(d: GameState, ctx: Ctx, reward: Reward, eventId: string, source: string): RewardResult {
  if (eventId && isProcessed(d, eventId)) return { ...emptyResult(eventId, source), applied: false };
  if (eventId) markProcessed(d, eventId);
  const res = emptyResult(eventId, source);
  for (const cur of ['bananas', 'coins', 'crystals'] as const) {
    const v = reward[cur];
    if (v && v > 0) { earn(d, ctx, cur, Math.floor(v), `${source}:${eventId}`); res[cur] += Math.floor(v); }
  }
  for (const id of reward.items || []) acquireItem(d, ctx, id, source, res);
  for (const id of reward.decor || []) {
    if (!DECOR_MAP[id]) throw new Error(`Неизвестная декорация ${id}`);
    d.inventory.decor[id] = (d.inventory.decor[id] || 0) + 1; res.decor.push(id);
  }
  for (const id of reward.cards || []) acquireCard(d, ctx, id, res);
  for (const id of reward.characters || []) unlockCharacter(d, ctx, id, source, res);
  for (const [tier, n] of Object.entries(reward.chests || {}) as [keyof typeof d.inventory.chests, number][]) {
    if (n > 0) { d.inventory.chests[tier] += n; res.chests[tier] = (res.chests[tier] || 0) + n; }
  }
  for (const m of MATERIALS) {
    const n = reward.materials?.[m];
    if (n && n > 0) { d.inventory.materials[m] += n; res.materials[m] = (res.materials[m] || 0) + n; }
  }
  for (const [f, n] of Object.entries(reward.food || {})) {
    if (n > 0) { d.inventory.food[f] = (d.inventory.food[f] || 0) + n; res.food[f] = (res.food[f] || 0) + n; }
  }
  if (reward.charXp) addCharXp(d, ctx, reward.charXp.id, reward.charXp.xp);
  if (reward.xp) addPlayerXp(d, ctx, reward.xp, res);
  return res;
}

/** Слияние результатов наград для показа одним окном. */
export function mergeResults(list: RewardResult[], eventId = 'merged', source = 'merged'): RewardResult {
  const r = emptyResult(eventId, source);
  r.applied = list.some((x) => x.applied);
  for (const x of list) {
    r.bananas += x.bananas; r.coins += x.coins; r.crystals += x.crystals; r.xp += x.xp;
    r.items.push(...x.items); r.decor.push(...x.decor); r.characters.push(...x.characters); r.cards.push(...x.cards);
    r.compensation.push(...x.compensation); r.levelUps.push(...x.levelUps);
    for (const [k, v] of Object.entries(x.chests)) (r.chests as Record<string, number>)[k] = ((r.chests as Record<string, number>)[k] || 0) + (v as number);
    for (const [k, v] of Object.entries(x.materials)) (r.materials as Record<string, number>)[k] = ((r.materials as Record<string, number>)[k] || 0) + (v as number);
    for (const [k, v] of Object.entries(x.food)) r.food[k] = (r.food[k] || 0) + v;
  }
  return r;
}
export const rewardIsEmpty = (r: RewardResult) =>
  !r.bananas && !r.coins && !r.crystals && !r.xp && !r.items.length && !r.decor.length && !r.characters.length && !r.cards.length &&
  !Object.keys(r.chests).length && !Object.keys(r.materials).length && !Object.keys(r.food).length;
