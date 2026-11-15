import type { GameState } from '../game/types';
import { createNewState, reconcile } from '../game/engine/newGame';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Дополняет загруженные данные значениями по умолчанию. Ничего не затирает: существующие значения сохраняются,
 * отсутствующие поля берутся из свежего состояния. Несовпадающий тип заменяется значением по умолчанию (с предупреждением).
 */
export function deepFill(raw: unknown, def: unknown, path: string, warnings: string[]): unknown {
  if (raw === undefined || raw === null) return def;
  if (isObj(def) && isObj(raw)) {
    const out: Record<string, unknown> = { ...raw };
    for (const k of Object.keys(def)) out[k] = deepFill(raw[k], def[k], `${path}.${k}`, warnings);
    return out;
  }
  if (Array.isArray(def)) {
    if (Array.isArray(raw)) return raw;
    warnings.push(`Поле ${path} имело неверный тип и было заменено`); return def;
  }
  if (def === null || def === undefined) return raw;
  if (typeof raw !== typeof def) { warnings.push(`Поле ${path} имело неверный тип и было заменено`); return def; }
  return raw;
}
/** Данные текущей схемы -> готовое игровое состояние. */
export function hydrate(raw: Record<string, unknown>, now: number): { state: GameState; warnings: string[] } {
  const warnings: string[] = [];
  const base = createNewState(now);
  const data = { ...raw };
  for (const k of ['format', 'schemaVersion', 'gameVersion', 'exportedAt', 'integrity']) delete data[k];
  // персонажи/уровни/миры — карты по id: дополняем только отсутствующие записи, существующие не трогаем
  const filled = deepFill(data, base, 'save', warnings) as unknown as GameState;
  reconcile(filled, now);
  return { state: filled, warnings };
}
