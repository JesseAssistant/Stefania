export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const clone = <T>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

/** Ключ дня по ЛОКАЛЬНОМУ времени устройства: YYYY-MM-DD. */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** Ключ недели (ISO-неделя по локальному времени): YYYY-Www. */
export function weekKey(ms: number): string {
  const d = new Date(ms);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
/** Разница в днях между двумя ключами дней (b - a). */
export function dayDiff(a: string, b: string): number {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]), tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / 86400000);
}
export const iso = (ms: number) => new Date(ms).toISOString();
export const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && Math.floor(n) === n;
export function uid(prefix: string, rnd: () => number): string {
  return `${prefix}_${Math.floor(rnd() * 0xffffffff).toString(36)}${Math.floor(rnd() * 0xffffff).toString(36)}`;
}
export function pick<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length) % arr.length]; }
export function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 10000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(Math.round(n));
}
export function fmtDuration(sec: number): string {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s} с`;
  return `${s} с`;
}
