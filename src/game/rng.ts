/** Детерминированный ГСЧ mulberry32. Состояние — одно число uint32 (хранится в сохранении). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** ГСЧ, который продвигает хранимое состояние (чтобы перезагрузка не «перебрасывала кубики»). */
export function persistentRng(holder: { rng: number }): () => number {
  return () => {
    holder.rng = (holder.rng + 0x6d2b79f5) >>> 0;
    let t = holder.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function seededFromString(s: string): () => number { return mulberry32(hashString(s)); }
export function weightedPick<T>(entries: [T, number][], rnd: () => number): T {
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rnd() * total;
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
}
