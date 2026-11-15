/** Лёгкие цветовые утилиты для SVG-рисунков. */
export function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', ''); const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${f(r1, r2)}${f(g1, g2)}${f(b1, b2)}`;
}
export const darken = (c: string, t: number) => mix(c, '#2B1B3D', t);
export const lighten = (c: string, t: number) => mix(c, '#FFFFFF', t);
