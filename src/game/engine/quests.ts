import { GameError } from '../types';
import type { GameEvent, GameState, QuestDef, QuestProgress, RewardResult } from '../types';
import { ALL_QUESTS, CHALLENGES, DAILY_COUNT, DAILY_QUESTS, QUEST_MAP, SECRET_QUESTS, STORY_QUESTS, WEEKLY_COUNT, WEEKLY_QUESTS } from '../data/quests';
import { dateKey, weekKey } from '../util';
import { seededFromString, mulberry32 } from '../rng';
import { shuffle } from '../util';
import type { Ctx } from './context';
import { grantReward } from './rewards';
import { stateMetric } from './metrics';
import { ROOMS } from '../data/rooms';

const GAMEPLAY_SOURCES = ['level', 'arcade', 'basket', 'rest', 'cook', 'tutorial'];

export function requiresMet(d: GameState, req?: string): boolean {
  if (!req) return true;
  const [k, v] = req.split(':');
  if (k === 'chars') return stateMetric(d, 'chars') >= Number(v);
  if (k === 'room') return !!d.base.rooms[v as keyof typeof d.base.rooms]?.unlocked;
  if (k === 'decor') return Object.values(d.inventory.decor).some((n) => n > 0);
  if (k === 'stars') return stateMetric(d, 'stars') >= Number(v) || true;
  return true;
}
const fresh = (): QuestProgress => ({ value: 0, claimed: false, done: false });

function pickIds(pool: QuestDef[], count: number, key: string, d: GameState): string[] {
  const rnd = mulberry32(seededFromString(key + d.metadata.installId)() * 4294967296);
  const ok = pool.filter((q) => requiresMet(d, q.requires));
  return shuffle(ok, rnd).slice(0, count).map((q) => q.id);
}

/** Смена дня/недели. Если часы устройства ушли назад — ничего не сбрасываем. */
export function rolloverQuests(d: GameState, ctx: Ctx): void {
  const dk = dateKey(ctx.now), wk = weekKey(ctx.now);
  const q = d.quests;
  if (q.daily.key < dk || !q.daily.ids.length) {
    if (q.daily.key <= dk) q.daily = { key: dk, ids: pickIds(DAILY_QUESTS, DAILY_COUNT, 'daily' + dk, d), progress: {} };
  }
  if (q.weekly.key < wk || !q.weekly.ids.length) {
    if (q.weekly.key <= wk) q.weekly = { key: wk, ids: pickIds(WEEKLY_QUESTS, WEEKLY_COUNT, 'weekly' + wk, d), progress: {} };
  }
  if (q.claimedToday.key < dk) q.claimedToday = { key: dk, n: 0 };
}

function bump(list: { ids: string[]; progress: Record<string, QuestProgress> }, metric: string, amount: number, distinctId?: string) {
  for (const id of list.ids) {
    const def = QUEST_MAP[id];
    if (!def || def.metric !== metric) continue;
    const p = (list.progress[id] ||= fresh());
    if (p.claimed || p.done) continue;
    if (def.distinct) {
      p.seen ||= [];
      if (distinctId && !p.seen.includes(distinctId)) { p.seen.push(distinctId); p.value = p.seen.length; }
    } else p.value += amount;
    if (p.value >= def.target) { p.value = def.target; p.done = true; }
  }
}
function map(e: GameEvent): [string, number, string?][] {
  switch (e.type) {
    case 'currency_earned': return e.currency === 'bananas' && GAMEPLAY_SOURCES.some((s) => e.reason.startsWith(s)) ? [['bananas_earned', e.amount]] : [];
    case 'level_cleared': return [['levels_cleared', 1]];
    case 'stars_earned': return [['stars_earned', e.amount]];
    case 'minigame_played': return [['minigames_played', 1]];
    case 'outfit_changed': return [['chars_dressed', 1, e.charId]];
    case 'outfit_saved': return [['outfits_saved', 1]];
    case 'photo_taken': return [['photos_taken', 1]];
    case 'room_upgraded': return [['rooms_upgraded', 1]];
    case 'item_acquired': return [['items_acquired', 1]];
    case 'character_unlocked': return [['chars_unlocked', 1]];
    case 'chest_opened': return [['chests_opened', 1]];
    case 'quest_claimed': return [['quests_claimed', 1]];
    case 'research_done': return [['research', 1]];
    case 'dish_cooked': return [['dishes', 1]];
    case 'basket_collected': return [['basket', 1]];
    case 'trained': return [['trained', 1]];
    case 'fed': return [['fed', 1]];
    case 'decor_placed': return [['decor_placed', 1]];
    case 'secret_found': return [['secrets_found', 1]];
    case 'crafted': return [['crafted', 1]];
    default: return [];
  }
}
export function handleQuestEvents(d: GameState, events: GameEvent[]): void {
  for (const e of events) for (const [metric, amount, did] of map(e)) {
    bump(d.quests.daily, metric, amount, did);
    bump(d.quests.weekly, metric, amount, did);
  }
}
/** Задания «из состояния»: сюжетные, долгосрочные и секретные. */
export function refreshStateQuests(d: GameState): void {
  const upd = (store: Record<string, QuestProgress>, def: QuestDef) => {
    const p = (store[def.id] ||= fresh());
    if (p.claimed) return;
    const v = stateMetric(d, def.metric.replace('state:', ''));
    p.value = Math.min(def.target, v);
    p.done = v >= def.target;
  };
  for (const def of STORY_QUESTS) upd(d.quests.story, def);
  for (const def of CHALLENGES) upd(d.quests.challenges, def);
  for (const def of SECRET_QUESTS) {
    const s = (d.quests.secret[def.id] ||= { ...fresh(), revealed: false });
    if (!s.revealed && def.trigger) {
      const [k, v] = def.trigger.split(':');
      if (k === 'secrets' && stateMetric(d, 'secrets') >= Number(v)) s.revealed = true;
    }
    if (!s.claimed) {
      const val = stateMetric(d, def.metric.replace('state:', ''));
      s.value = Math.min(def.target, val); s.done = val >= def.target;
    }
  }
}
export function progressOf(d: GameState, def: QuestDef): QuestProgress & { target: number } {
  let p: QuestProgress | undefined;
  if (def.kind === 'daily') p = d.quests.daily.progress[def.id];
  else if (def.kind === 'weekly') p = d.quests.weekly.progress[def.id];
  else if (def.kind === 'story') p = d.quests.story[def.id];
  else if (def.kind === 'challenge') p = d.quests.challenges[def.id];
  else p = d.quests.secret[def.id];
  return { ...(p || fresh()), target: def.target };
}
export function claimQuest(d: GameState, ctx: Ctx, id: string): RewardResult {
  const def = QUEST_MAP[id];
  if (!def) throw new GameError('no_quest', 'Такого задания нет');
  let p: QuestProgress | undefined, periodKey = 'perm';
  if (def.kind === 'daily') { if (!d.quests.daily.ids.includes(id)) throw new GameError('no_quest', 'Это задание не на сегодня'); p = d.quests.daily.progress[id]; periodKey = d.quests.daily.key; }
  else if (def.kind === 'weekly') { if (!d.quests.weekly.ids.includes(id)) throw new GameError('no_quest', 'Это задание не на эту неделю'); p = d.quests.weekly.progress[id]; periodKey = d.quests.weekly.key; }
  else if (def.kind === 'story') p = d.quests.story[id];
  else if (def.kind === 'challenge') p = d.quests.challenges[id];
  else p = d.quests.secret[id];
  if (!p || !p.done) throw new GameError('not_done', 'Задание ещё не выполнено');
  if (p.claimed) throw new GameError('claimed', 'Награда уже получена');
  p.claimed = true;
  const res = grantReward(d, ctx, def.reward, `quest:${def.kind}:${periodKey}:${id}`, 'quest');
  d.quests.claimedCount++;
  d.quests.claimedToday.n++;
  d.quests.log.push({ id, at: new Date(ctx.now).toISOString() });
  if (d.quests.log.length > 200) d.quests.log.splice(0, d.quests.log.length - 200);
  ctx.emit({ type: 'quest_claimed', id });
  return res;
}
export const claimableCount = (d: GameState): number => {
  let n = 0;
  const chk = (def: QuestDef) => { const p = progressOf(d, def); if (p.done && !p.claimed) n++; };
  d.quests.daily.ids.forEach((i) => chk(QUEST_MAP[i]));
  d.quests.weekly.ids.forEach((i) => chk(QUEST_MAP[i]));
  [...STORY_QUESTS, ...CHALLENGES].forEach(chk);
  SECRET_QUESTS.forEach((s) => { if (d.quests.secret[s.id]?.revealed) chk(s); });
  return n;
};
void ALL_QUESTS; void ROOMS;
