/** Уникальный идентификатор попытки/открытия: защищает награды от двойного начисления. */
export function newRunId(prefix = 'run'): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  const rnd = c && c.randomUUID ? c.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${rnd}`;
}
