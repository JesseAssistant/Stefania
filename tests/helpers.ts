import { GameStore } from '../src/game/engine/store';
import { createNewState } from '../src/game/engine/newGame';
import { createApi } from '../src/game/api';
import { MemoryAdapter } from '../src/storage/adapters';
import { SaveService } from '../src/storage/saveService';
import type { GameState } from '../src/game/types';

export function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, map: m };
}
export function makeGame(opts: { start?: number; state?: GameState; adapter?: MemoryAdapter; mirror?: ReturnType<typeof memStorage> } = {}) {
  const clock = { t: opts.start ?? Date.UTC(2026, 10, 15, 12, 0, 0) };
  const adapter = opts.adapter ?? new MemoryAdapter();
  const mirror = opts.mirror ?? memStorage();
  const svc = new SaveService(adapter, { now: () => clock.t, mirror, retryMs: 5 });
  const state = opts.state ?? createNewState(clock.t, 'test-install', 12345);
  const store = new GameStore(state, { clock: () => clock.t, persist: (s) => svc.save(s) });
  const api = createApi(store);
  return { clock, adapter, mirror, svc, store, api, advance: (ms: number) => { clock.t += ms; }, state: () => store.getState() };
}
export const HOUR = 3600000, DAY = 86400000;
let n = 0;
export const rid = (p = 'run') => `${p}_${++n}`;
/** Даёт валюту «из воздуха» только для тестов (через единый сервис экономики). */
export function giveFunds(g: ReturnType<typeof makeGame>, b = 0, c = 0, k = 0) {
  g.store.tx((d, ctx) => {
    d.currencies.bananas += b; d.currencies.coins += c; d.currencies.crystals += k;
    void ctx;
  });
}
/** Проходит уровни по порядку с максимальным результатом. */
export function clearLevels(g: ReturnType<typeof makeGame>, ids: string[], success = true) {
  for (const id of ids) {
    const lvl = require_level(id);
    const metric = lvl.stars.dir === 'high' ? lvl.stars.three + 5 : Math.max(0, lvl.stars.three);
    g.api.completeLevel({ levelId: id, runId: rid(id), success, metric });
  }
}
import { LEVEL_MAP } from '../src/game/data/worlds';
function require_level(id: string) { return LEVEL_MAP[id]; }
