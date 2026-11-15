import { GameError } from '../types';
import type { GameState, LevelDef, MinigameId, Reward, RewardResult, TaskGoal } from '../types';
import { LEVELS, LEVEL_MAP, STAR_MILESTONES, WORLDS, levelsOfWorld } from '../data/worlds';
import { ARCADE_FULL_PLAYS_PER_DAY, LEVEL_REPLAY_FULL_PER_DAY, PARTNER_BONUS_CAP, arcadeReward } from '../data/economy';
import { roomFx } from '../data/rooms';
import { dateKey } from '../util';
import type { Ctx } from './context';
import { nowIso } from './context';
import { effectiveStat, grantReward, logHistory, mergeResults } from './rewards';
import { stateMetric } from './metrics';
import { CARDS } from '../data/decor';

export const MINIGAME_BEST_DIR: Record<string, 'high' | 'low'> = {
  'banana-catcher': 'high', memory: 'low', kitchen: 'low', 'lab-puzzle': 'low', 'treasure-hunt': 'high', sorting: 'low', reaction: 'low', 'outfit-challenge': 'high', gauntlet: 'high',
};
export const ALL_MINIGAMES: MinigameId[] = ['banana-catcher', 'memory', 'kitchen', 'lab-puzzle', 'treasure-hunt', 'sorting', 'reaction', 'outfit-challenge'];

function minigameRuleOk(d: GameState, g: MinigameId): boolean {
  const cleared = (id: string) => (d.levels[id]?.stars || 0) > 0;
  switch (g) {
    case 'banana-catcher': case 'memory': return true;
    case 'sorting': return cleared('w1l5');
    case 'reaction': return cleared('w1l6');
    case 'treasure-hunt': return cleared('w1l7');
    case 'kitchen': return d.base.rooms.kitchen.unlocked;
    case 'lab-puzzle': return d.base.rooms.lab.unlocked || cleared('w3l1');
    case 'outfit-challenge': return d.base.rooms.wardrobe.level >= 2 || cleared('w2l7');
  }
}
export function isMinigameUnlocked(d: GameState, g: MinigameId) { return d.minigames.unlocked.includes(g) || minigameRuleOk(d, g); }

/** Пересчитывает открытие миров, статусы уровней и доступных мини-игр. Вызывается после любых изменений прогресса. */
export function refreshProgress(d: GameState, ctx?: Ctx): void {
  const stars = stateMetric(d, 'stars');
  for (const w of WORLDS) {
    const st = (d.worlds[w.id] ||= { unlocked: false });
    if (st.unlocked) continue;
    const prevBossOk = w.num === 1 || (d.levels[`w${w.num - 1}l8`]?.stars || 0) >= 1;
    if (w.num === 1 || (prevBossOk && stars >= w.unlockStars)) {
      st.unlocked = true;
      if (ctx) {
        st.unlockedAt = nowIso(ctx);
        if (w.num > 1) { ctx.notify({ type: 'toast', text: `Открыт мир: ${w.subtitle}!`, tone: 'good' }); logHistory(d, ctx, 'world', `Открыт мир: ${w.subtitle}`); }
      }
    }
  }
  for (const l of LEVELS) {
    const st = (d.levels[l.id] ||= { status: 'locked', stars: 0, best: null, plays: 0, clears: 0 });
    if (st.stars > 0) st.status = 'cleared';
    else {
      const worldOpen = d.worlds[`w${l.world}`]?.unlocked;
      const prevOk = l.index === 1 || (d.levels[`w${l.world}l${l.index - 1}`]?.stars || 0) > 0;
      st.status = worldOpen && prevOk ? 'open' : 'locked';
    }
  }
  for (const g of ALL_MINIGAMES) if (!d.minigames.unlocked.includes(g) && minigameRuleOk(d, g)) d.minigames.unlocked.push(g);
}

export function computeStars(level: LevelDef, success: boolean, metric: number): number {
  if (!success) return 0;
  const r = level.stars;
  if (r.dir === 'high') return metric >= r.three ? 3 : metric >= r.two ? 2 : 1;
  return metric <= r.three ? 3 : metric <= r.two ? 2 : 1;
}
export function partnerBonus(d: GameState, level: LevelDef | null): number {
  const id = d.player.partnerId;
  const c = d.characters[id];
  if (!c?.unlocked || !level) return 0;
  return Math.min(PARTNER_BONUS_CAP, 0.03 * effectiveStat(d, id, level.statAffinity) + 0.004 * c.level);
}
function scaleBananas(r: Reward, k: number): Reward { return r.bananas ? { ...r, bananas: Math.round(r.bananas * (1 + k)) } : r; }

function todayCounter(d: GameState, ctx: Ctx, key: string): number {
  const k = dateKey(ctx.now);
  if (d.minigames.arcadeToday.key !== k) d.minigames.arcadeToday = { key: k, counts: {} };
  const n = d.minigames.arcadeToday.counts[key] || 0;
  d.minigames.arcadeToday.counts[key] = n + 1;
  return n;
}
function recordPlay(d: GameState, ctx: Ctx, game: string, won: boolean, metric?: number | null) {
  const st = (d.minigames.stats[game] ||= { plays: 0, wins: 0, best: null });
  st.plays++; if (won) st.wins++;
  st.lastAt = nowIso(ctx);
  if (won && typeof metric === 'number' && Number.isFinite(metric)) {
    const dir = MINIGAME_BEST_DIR[game] || 'high';
    if (st.best === null || (dir === 'high' ? metric > st.best : metric < st.best)) st.best = metric;
  }
  d.statistics.minigamesPlayed++;
  ctx.emit({ type: 'minigame_played', game, won });
}

export function taskGoalDone(d: GameState, g: TaskGoal): boolean {
  const n = g.n ?? 1;
  switch (g.check) {
    case 'room': return !!d.base.rooms[g.arg as keyof typeof d.base.rooms]?.unlocked;
    case 'equipped': return Object.values(d.characters).filter((c) => c.unlocked && Object.keys(c.equipped).length > 0).length >= n;
    case 'basket': return d.statistics.basketCollects >= n;
    case 'bought': return d.statistics.itemsBought >= n;
    case 'outfit_saved': return d.statistics.outfitsSaved >= n;
    case 'chest_opened': return d.statistics.chestsOpened >= n;
    default: return false;
  }
}
export const taskProgress = (d: GameState, level: LevelDef) => level.game.kind === 'task' ? level.game.goals.map((g) => taskGoalDone(d, g)) : [];

export interface LevelOutcome {
  levelId: string; success: boolean; stars: number; prevStars: number; first: boolean;
  newStars: number; metric: number; improvedBest: boolean; bonusPct: number; rewards: RewardResult;
}
export function levelPlayable(d: GameState, levelId: string): boolean {
  const st = d.levels[levelId];
  return !!st && st.status !== 'locked';
}
export function completeLevel(d: GameState, ctx: Ctx, input: { levelId: string; runId: string; success: boolean; metric: number; kinds?: string[] }): LevelOutcome {
  const level = LEVEL_MAP[input.levelId];
  if (!level) throw new GameError('no_level', 'Уровень не найден');
  if (!levelPlayable(d, level.id)) throw new GameError('locked', 'Этот уровень ещё закрыт');
  const runKey = `run:${input.runId}`;
  if (d.metadata.processedEvents.includes(runKey)) throw new GameError('dup_run', 'Эта попытка уже засчитана');
  d.metadata.processedEvents.push(runKey);
  const st = d.levels[level.id];
  const prev = st.stars;
  const isTask = level.game.kind === 'task';
  st.plays++; st.lastPlayedAt = nowIso(ctx);
  if (!isTask) {
    const kinds = input.kinds && input.kinds.length ? input.kinds : [level.game.kind];
    for (const k of kinds) recordPlay(d, ctx, k, input.success, level.game.kind === 'gauntlet' ? null : input.metric);
    if (level.game.kind === 'gauntlet') recordPlay(d, ctx, 'gauntlet', input.success, input.metric);
  }
  const stars = computeStars(level, input.success, input.metric);
  const bonus = input.success ? partnerBonus(d, level) : 0;
  const empty = mergeResults([]);
  let rewards = empty;
  let improvedBest = false;
  if (input.success) {
    const dir = level.stars.dir;
    if (st.best === null || (dir === 'high' ? input.metric > st.best : input.metric < st.best)) { st.best = input.metric; improvedBest = true; }
    st.clears++;
    const parts: RewardResult[] = [];
    const first = prev === 0;
    if (first) { st.firstClearAt = nowIso(ctx); parts.push(grantReward(d, ctx, scaleBananas(level.first, bonus), `lvl:${level.id}:first`, 'level')); }
    if (stars >= 2 && prev < 2) parts.push(grantReward(d, ctx, scaleBananas(level.star2, bonus), `lvl:${level.id}:s2`, 'level'));
    if (stars >= 3 && prev < 3) parts.push(grantReward(d, ctx, scaleBananas(level.star3, bonus), `lvl:${level.id}:s3`, 'level'));
    if (!first && !isTask) {
      const n = todayCounter(d, ctx, `lvl:${level.id}`);
      const rep = n < LEVEL_REPLAY_FULL_PER_DAY ? level.replay : { bananas: 1 };
      parts.push(grantReward(d, ctx, scaleBananas(rep, bonus), `lvl:${level.id}:r:${input.runId}`, 'level'));
    }
    if (stars > prev) {
      st.stars = stars;
      d.statistics.starsEarned += stars - prev;
      if (stars === 3) d.statistics.perfectLevels++;
      ctx.emit({ type: 'stars_earned', amount: stars - prev });
    }
    rewards = mergeResults(parts, `lvl:${level.id}:${input.runId}`, 'level');
    ctx.emit({ type: 'level_cleared', levelId: level.id, stars, first });
    d.statistics.levelsCleared = LEVELS.filter((l) => (d.levels[l.id]?.stars || 0) > 0).length;
    if (first) logHistory(d, ctx, 'level', `Пройден уровень: ${level.name} (${stars}★)`);
  }
  refreshProgress(d, ctx);
  return { levelId: level.id, success: input.success, stars, prevStars: prev, first: input.success && prev === 0, newStars: Math.max(0, stars - prev), metric: input.metric, improvedBest, bonusPct: Math.round(bonus * 100), rewards };
}
/** Проверка задания-уровня (вид "task"): звёзды = число выполненных целей. */
export function evaluateTaskLevel(d: GameState, ctx: Ctx, levelId: string, runId: string): LevelOutcome {
  const level = LEVEL_MAP[levelId];
  if (!level || level.game.kind !== 'task') throw new GameError('no_level', 'Это не задание');
  const done = taskProgress(d, level).filter(Boolean).length;
  return completeLevel(d, ctx, { levelId, runId, success: done >= 1, metric: done });
}

// ---------- Аркада ----------
export function arcadeStatus(d: GameState, game: string, now: number) {
  const k = dateKey(now);
  const used = d.minigames.arcadeToday.key === k ? d.minigames.arcadeToday.counts[`arcade:${game}`] || 0 : 0;
  return { used, fullLeft: Math.max(0, ARCADE_FULL_PLAYS_PER_DAY - used) };
}
export function finishArcade(d: GameState, ctx: Ctx, input: { game: MinigameId; runId: string; success: boolean; difficulty: number; metric?: number }): RewardResult | null {
  if (!isMinigameUnlocked(d, input.game)) throw new GameError('locked', 'Эта мини-игра ещё закрыта');
  const eid = `arcade:${input.runId}`;
  if (d.metadata.processedEvents.includes(eid)) throw new GameError('dup_run', 'Эта попытка уже засчитана');
  d.metadata.processedEvents.push(eid);
  recordPlay(d, ctx, input.game, input.success, input.metric);
  if (!input.success) return null;
  const n = todayCounter(d, ctx, `arcade:${input.game}`);
  const full = n < ARCADE_FULL_PLAYS_PER_DAY;
  const pl = d.base.rooms.playroom;
  const base = arcadeReward(d.player.level, input.difficulty);
  const k = (full ? 1 : 0.2) * (1 + (pl.unlocked ? roomFx.arcadeBonus(pl.level) : 0));
  const reward: Reward = { bananas: Math.max(1, Math.round((base.bananas || 0) * k)), xp: full ? base.xp : 1 };
  return grantReward(d, ctx, reward, `arcade:${input.runId}:r`, 'arcade');
}

// ---------- Звёзды и альбомы ----------
export function claimStarMilestone(d: GameState, ctx: Ctx, id: string): RewardResult {
  const m = STAR_MILESTONES.find((x) => x.id === id);
  if (!m) throw new GameError('no_ms', 'Награда не найдена');
  if (d.collections.starMilestonesClaimed[id]) throw new GameError('claimed', 'Награда уже получена');
  if (stateMetric(d, 'stars') < m.stars) throw new GameError('not_yet', `Нужно ${m.stars} звёзд`);
  d.collections.starMilestonesClaimed[id] = true;
  return grantReward(d, ctx, m.reward, `starms:${id}`, 'starms');
}
export const worldIsPerfect = (d: GameState, w: number) => levelsOfWorld(w).every((l) => (d.levels[l.id]?.stars || 0) >= 3);
export function claimWorldPerfect(d: GameState, ctx: Ctx, w: number): RewardResult {
  const ws = d.worlds[`w${w}`];
  if (!ws || ws.rewardClaimed) throw new GameError('claimed', 'Награда уже получена');
  if (!worldIsPerfect(d, w)) throw new GameError('not_yet', 'Нужны 3 звезды на всех уровнях мира');
  ws.rewardClaimed = true;
  return grantReward(d, ctx, { crystals: 10, chests: { rare: 1 }, cards: [`card-w${w}-6`] }, `worldperfect:${w}`, 'worldperfect');
}
export const cardSetComplete = (d: GameState, w: number) => CARDS.filter((c) => c.world === w).every((c) => d.collections.cards[c.id]);
export function claimCardSet(d: GameState, ctx: Ctx, w: number): RewardResult {
  const key = `cards-w${w}`;
  if (d.collections.worldSetsClaimed[key]) throw new GameError('claimed', 'Награда уже получена');
  if (!cardSetComplete(d, w)) throw new GameError('not_yet', 'Собери все 6 карточек мира');
  d.collections.worldSetsClaimed[key] = true;
  return grantReward(d, ctx, { coins: 100 + 30 * w, crystals: 4, decor: w === 5 ? ['banana-statue'] : undefined }, `cardset:${w}`, 'cardset');
}
