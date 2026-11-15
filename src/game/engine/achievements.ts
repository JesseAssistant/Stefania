import type { GameState } from '../types';
import { ACHIEVEMENTS } from '../data/quests';
import type { Ctx } from './context';
import { nowIso } from './context';
import { grantReward, logHistory } from './rewards';
import { stateMetric } from './metrics';

/** Автоматически выдаёт достижения, условия которых выполнены. Награда — один раз (eventId = ach:<id>). */
export function evaluateAchievements(d: GameState, ctx: Ctx): number {
  let n = 0;
  for (const def of ACHIEVEMENTS) {
    if (d.achievements[def.id]) continue;
    if (stateMetric(d, def.metric) >= def.target) {
      d.achievements[def.id] = { at: nowIso(ctx) };
      grantReward(d, ctx, def.reward, `ach:${def.id}`, 'ach');
      ctx.notify({ type: 'achievement', id: def.id });
      logHistory(d, ctx, 'achievement', `Достижение: ${def.name}`);
      n++;
    }
  }
  return n;
}
export const achievementProgress = (d: GameState, id: string) => {
  const def = ACHIEVEMENTS.find((a) => a.id === id)!;
  return { value: Math.min(def.target, stateMetric(d, def.metric)), target: def.target };
};
