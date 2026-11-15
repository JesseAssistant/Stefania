import type { GameEvent, GameState, Notice } from '../types';
import { persistentRng } from '../rng';

/** Контекст одной транзакции над состоянием. Вся логика получает (draft, ctx). */
export interface Ctx {
  now: number;
  rng: () => number;
  events: GameEvent[];
  notices: Notice[];
  emit: (e: GameEvent) => void;
  notify: (n: Notice) => void;
}
export function makeCtx(draft: GameState, now: number): Ctx {
  const events: GameEvent[] = [];
  const notices: Notice[] = [];
  return {
    now, rng: persistentRng(draft.metadata), events, notices,
    emit: (e) => { events.push(e); },
    notify: (n) => { notices.push(n); },
  };
}
export const nowIso = (ctx: Ctx) => new Date(ctx.now).toISOString();
