import type { LevelGame, MinigameId } from '../game/types';
import { mulberry32 } from '../game/rng';

export const DIFFICULTIES = [{ id: 1, name: 'Легко' }, { id: 2, name: 'Средне' }, { id: 3, name: 'Сложно' }] as const;
type Single = Exclude<LevelGame, { kind: 'task' } | { kind: 'gauntlet' }>;

/** Настройки мини-игры для аркады по сложности (1–3). Вариант (сцена, правило, тема) выбирается по seed. */
export function arcadeConfig(game: MinigameId, d: number, seed: number): Single {
  const r = mulberry32(seed ^ 0x9e3779b9); const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  switch (game) {
    case 'banana-catcher': return { kind: 'banana-catcher', target: [10, 16, 22][d - 1], duration: 28, speed: [1, 1.3, 1.6][d - 1], bad: [0, 0.15, 0.25][d - 1], moving: d >= 2 };
    case 'memory': { const pairs = [4, 6, 8][d - 1]; return { kind: 'memory', pairs, maxMoves: pairs * 3 + 2, peek: d === 1 }; }
    case 'kitchen': return { kind: 'kitchen', recipeId: [pick(['smoothie', 'pancakes']), pick(['split', 'bread']), pick(['choco', 'pizza'])][d - 1], orders: d === 1 ? 1 : 2 };
    case 'lab-puzzle': {
      const v = pick(['lights', 'sequence', 'wires', 'slide'] as const);
      if (v === 'lights') { const n = 2 + d; return { kind: 'lab-puzzle', variant: v, size: n, maxMoves: n * n * 3 }; }
      if (v === 'sequence') return { kind: 'lab-puzzle', variant: v, size: 3 + 2 * d, maxMoves: 4 };
      if (v === 'wires') return { kind: 'lab-puzzle', variant: v, size: 3 + d, maxMoves: 24 };
      return { kind: 'lab-puzzle', variant: v, size: 3, maxMoves: 120 };
    }
    case 'treasure-hunt': return { kind: 'treasure-hunt', scene: pick(['home', 'beach', 'lab', 'city', 'mystery']), hidden: 3 + d, time: 60, maxMistakes: 5 };
    case 'sorting': return { kind: 'sorting', rule: pick(['ripeness', 'size', 'category', 'color'] as const), items: 10 + 2 * d, time: 45, maxMistakes: 4 };
    case 'reaction': return { kind: 'reaction', rounds: 5 + 2 * d, decoys: d >= 2, window: 1600 - 200 * d };
    case 'outfit-challenge': return { kind: 'outfit-challenge', themeId: pick(['pirate', 'party', 'space', 'magic']), slots: 3 + d };
  }
}
