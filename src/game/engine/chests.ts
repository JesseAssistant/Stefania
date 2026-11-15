import { GameError, MATERIALS } from '../types';
import type { ChestTier, GameState, Rarity, Reward, RewardResult } from '../types';
import { CHESTS, CHEST_CHARACTER_CHANCE } from '../data/economy';
import { ITEMS } from '../data/items';
import { CARDS, DECOR, FOODS } from '../data/decor';
import { CHARACTERS } from '../data/characters';
import { weightedPick } from '../rng';
import { RARITIES } from '../types';
import type { Ctx } from './context';
import { grantReward } from './rewards';

const ri = (a: [number, number], rnd: () => number) => a[0] + Math.floor(rnd() * (a[1] - a[0] + 1));
const rarIdx = (r: Rarity) => RARITIES.indexOf(r);

function pickItem(d: GameState, tier: ChestTier, rnd: () => number, minRarity?: Rarity): string | null {
  const def = CHESTS[tier];
  let want = weightedPick(def.itemRarity as [Rarity, number][], rnd);
  if (minRarity && rarIdx(want) < rarIdx(minRarity)) want = minRarity;
  const pool = ITEMS.filter((i) => i.unlock.type !== 'reward');
  // ищем нужную редкость, при отсутствии спускаемся вниз
  for (let r = rarIdx(want); r >= 0; r--) {
    if (minRarity && r < rarIdx(minRarity)) break;
    const cands = pool.filter((i) => rarIdx(i.rarity) === r);
    const fresh = cands.filter((i) => !d.wardrobe.owned[i.id]);
    const from = fresh.length ? fresh : cands;
    if (from.length) return from[Math.floor(rnd() * from.length)].id;
  }
  return null;
}
function pickDecor(d: GameState, tier: ChestTier, rnd: () => number): string {
  const want = weightedPick(CHESTS[tier].itemRarity as [Rarity, number][], rnd);
  const pool = DECOR.filter((x) => rarIdx(x.rarity) <= rarIdx(want) + 0 && x.shopable);
  const from = pool.length ? pool : DECOR.filter((x) => x.shopable);
  const fresh = from.filter((x) => !d.inventory.decor[x.id]);
  const list = fresh.length ? fresh : from;
  return list[Math.floor(rnd() * list.length)].id;
}
function pickCard(d: GameState, rnd: () => number): string {
  const fresh = CARDS.filter((c) => !d.collections.cards[c.id]);
  const list = fresh.length ? fresh : CARDS;
  return list[Math.floor(rnd() * list.length)].id;
}

/**
 * Открывает сундук. openId делает операцию идемпотентной: повторная обработка того же события
 * возвращает прежний результат и НИЧЕГО не начисляет. Содержимое определяется сохраняемым ГСЧ.
 */
export function openChest(d: GameState, ctx: Ctx, tier: ChestTier, openId: string): RewardResult {
  const last = d.inventory.lastChest;
  if (last && last.openId === openId) return { ...last.result, applied: false };
  if (!(d.inventory.chests[tier] > 0)) throw new GameError('no_chest', 'Сундуков этого типа нет');
  d.inventory.chests[tier]--;
  const def = CHESTS[tier];
  const rnd = ctx.rng;
  const reward: Reward = {};
  const addItem = (id: string) => { (reward.items ||= []).push(id); };
  let usedPity = false;
  if (def.pityAt > 0) {
    const k = tier as 'rare' | 'epic' | 'legendary';
    d.inventory.pity[k]++;
    if (d.inventory.pity[k] >= def.pityAt) {
      const id = pickItem(d, tier, rnd, def.pityMin);
      if (id) { addItem(id); usedPity = true; d.inventory.pity[k] = 0; }
    }
  }
  const rolls = def.rolls - (usedPity ? 1 : 0);
  for (let i = 0; i < rolls; i++) {
    const kind = weightedPick(def.kinds as [string, number][], rnd);
    if (kind === 'bananas') reward.bananas = (reward.bananas || 0) + ri(def.bananas, rnd);
    else if (kind === 'coins') reward.coins = (reward.coins || 0) + ri(def.coins, rnd);
    else if (kind === 'crystals') reward.crystals = (reward.crystals || 0) + ri(def.crystals, rnd);
    else if (kind === 'item') {
      const id = pickItem(d, tier, rnd);
      if (id) {
        addItem(id);
        if (def.pityAt > 0 && rarIdx(ITEMS.find((x) => x.id === id)!.rarity) >= rarIdx(def.pityMin)) d.inventory.pity[tier as 'rare' | 'epic' | 'legendary'] = 0;
      }
    } else if (kind === 'decor') (reward.decor ||= []).push(pickDecor(d, tier, rnd));
    else if (kind === 'card') (reward.cards ||= []).push(pickCard(d, rnd));
    else if (kind === 'material') { const m = MATERIALS[Math.floor(rnd() * MATERIALS.length)]; reward.materials = { ...(reward.materials || {}), [m]: (reward.materials?.[m] || 0) + 1 + Math.floor(rnd() * 2) }; }
    else if (kind === 'food') { const keys = Object.keys(FOODS); const f = keys[Math.floor(rnd() * keys.length)]; reward.food = { ...(reward.food || {}), [f]: (reward.food?.[f] || 0) + 1 }; }
  }
  // шанс получить нового персонажа (только из тех, кто доступен через сундук)
  if (rnd() < CHEST_CHARACTER_CHANCE[tier]) {
    const locked = CHARACTERS.filter((c) => c.unlock.kind === 'chest' && !d.characters[c.id]?.unlocked);
    if (locked.length) reward.characters = [locked[Math.floor(rnd() * locked.length)].id];
  }
  const res = grantReward(d, ctx, reward, `chest:${openId}`, 'chest');
  d.statistics.chestsOpened++;
  d.inventory.lastChest = { openId, tier, result: res };
  ctx.emit({ type: 'chest_opened', tier });
  return res;
}
