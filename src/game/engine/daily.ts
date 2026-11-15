import { GameError } from '../types';
import type { GameState, RewardResult } from '../types';
import { DAILY_GRACE_DAYS, dailyReward } from '../data/economy';
import { dateKey, dayDiff } from '../util';
import type { Ctx } from './context';
import { grantReward } from './rewards';

export interface DailyStatus { canClaim: boolean; reason?: string; today: string; nextStreak: number; nextDay: number; cycle: number; streakAlive: boolean }

export function dailyStatus(d: GameState, now: number): DailyStatus {
  const today = dateKey(now), last = d.dailyRewards.lastClaimDate;
  if (!last) return { canClaim: true, today, nextStreak: 1, nextDay: 1, cycle: 0, streakAlive: false };
  const gap = dayDiff(last, today);
  if (gap === 0) return { canClaim: false, reason: 'Сегодняшняя награда уже получена', today, nextStreak: d.dailyRewards.streak + 1, nextDay: (d.dailyRewards.streak % 7) + 1, cycle: Math.floor(d.dailyRewards.streak / 7), streakAlive: true };
  if (gap < 0) return { canClaim: false, reason: 'Дата на устройстве раньше последнего получения', today, nextStreak: d.dailyRewards.streak + 1, nextDay: (d.dailyRewards.streak % 7) + 1, cycle: Math.floor(d.dailyRewards.streak / 7), streakAlive: true };
  const alive = gap <= 1 + DAILY_GRACE_DAYS;
  const streak = alive ? d.dailyRewards.streak + 1 : 1;
  return { canClaim: true, today, nextStreak: streak, nextDay: ((streak - 1) % 7) + 1, cycle: Math.floor((streak - 1) / 7), streakAlive: alive };
}

export function claimDaily(d: GameState, ctx: Ctx): RewardResult {
  const st = dailyStatus(d, ctx.now);
  if (!st.canClaim) throw new GameError('daily_claimed', st.reason || 'Награда недоступна');
  const reward = dailyReward(st.nextDay, st.cycle);
  if (st.nextStreak % 28 === 0) { reward.crystals = (reward.crystals || 0) + 10; reward.chests = { ...(reward.chests || {}), epic: (reward.chests?.epic || 0) + 1 }; }
  const res = grantReward(d, ctx, reward, `daily:${st.today}`, 'daily');
  d.dailyRewards.lastClaimDate = st.today;
  d.dailyRewards.streak = st.nextStreak;
  d.dailyRewards.cycle = st.cycle;
  d.dailyRewards.totalClaims++;
  d.dailyRewards.history.push({ date: st.today, day: st.nextDay, reward });
  if (d.dailyRewards.history.length > 120) d.dailyRewards.history.splice(0, d.dailyRewards.history.length - 120);
  d.statistics.maxStreak = Math.max(d.statistics.maxStreak, st.nextStreak);
  ctx.emit({ type: 'daily_claimed', streak: st.nextStreak });
  return res;
}
