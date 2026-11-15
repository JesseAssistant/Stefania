import type { CharacterLook } from '../game/types';

/** Опорные точки тела: все предметы одежды рисуются относительно них, поэтому подходят любому телосложению. */
export interface Anchors {
  cx: number; rx: number; ry: number; cy: number;
  top: number; bot: number; eyeY: number; eyeDx: number; eyeR: number;
  shoulderY: number; waistY: number; footY: number; footDx: number; armY: number;
}
const B: Record<CharacterLook['build'], [number, number, number]> = {
  round: [52, 58, 150], tall: [44, 70, 142], chubby: [60, 54, 154], small: [44, 48, 164],
};
export function anchors(build: CharacterLook['build']): Anchors {
  const [rx, ry, cy] = B[build];
  const top = cy - ry, bot = cy + ry;
  return {
    cx: 100, rx, ry, cy, top, bot,
    eyeY: top + ry * 0.42, eyeDx: rx * 0.38, eyeR: Math.min(12, rx * 0.24),
    shoulderY: cy - ry * 0.02, waistY: cy + ry * 0.68, footY: bot - 4, footDx: rx * 0.42, armY: cy + ry * 0.2,
  };
}
export const VIEW_W = 200, VIEW_H = 240;
