import { useId, type ReactNode } from 'react';
import type { CharacterLook, Emotion, Layer } from '../game/types';
import { anchors, VIEW_H, VIEW_W, type Anchors } from './anchors';
import { darken, lighten } from './color';
import { DRAW_ORDER, wearFn } from './registry';
import { ITEM_MAP } from '../game/data/items';
import type { WearParts } from './wearTypes';

export interface NanaboProps {
  look: CharacterLook;
  equipped?: Partial<Record<Layer, string | undefined>>;
  emotion?: Emotion;
  animate?: boolean;
  /** Рамка просмотра (для превью предметов): x, y, w, h в координатах рисунка. */
  view?: [number, number, number, number];
  title?: string;
  className?: string;
  shadow?: boolean;
  flip?: boolean;
}

const HIDE_WITH_HAT = new Set(['sprout', 'bunny', 'antenna', 'crest', 'tuft', 'halo']);
const ink = '#2B2D42';

function Feature({ look, a, hasHat }: { look: CharacterLook; a: Anchors; hasHat: boolean }): ReactNode {
  const f = look.feature, c = look.featureColor, { cx, top, rx } = a;
  if (f === 'none' || (hasHat && HIDE_WITH_HAT.has(f))) return null;
  const o = '#00000022';
  switch (f) {
    case 'sprout': return <g stroke={o}><path d={`M${cx},${top + 4} q-3,-14 2,-24`} stroke="#4C9F4C" strokeWidth="4" fill="none" strokeLinecap="round" /><path d={`M${cx + 2},${top - 18} q16,-14 28,-2 q-12,12 -28,2 z`} fill={c} /><path d={`M${cx + 1},${top - 12} q-14,-12 -24,-1 q10,11 24,1 z`} fill={c} opacity=".85" /></g>;
    case 'bunny': return <g stroke={o}>{[-1, 1].map((s) => <g key={s} transform={`rotate(${s * 9} ${cx + s * 22} ${top + 8})`}><ellipse cx={cx + s * 22} cy={top - 16} rx="11" ry="28" fill={look.body} /><ellipse cx={cx + s * 22} cy={top - 14} rx="5.5" ry="20" fill={c} /></g>)}</g>;
    case 'cat': return <g stroke={o}>{[-1, 1].map((s) => <g key={s}><path d={`M${cx + s * (rx - 6)},${top + 20} L${cx + s * (rx - 2)},${top - 12} L${cx + s * (rx - 30)},${top + 6} Z`} fill={look.body} /><path d={`M${cx + s * (rx - 10)},${top + 14} L${cx + s * (rx - 6)},${top - 2} L${cx + s * (rx - 24)},${top + 8} Z`} fill={c} stroke="none" /></g>)}</g>;
    case 'antenna': return <g><path d={`M${cx},${top + 4} q6,-18 -2,-30`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx={cx - 2} cy={top - 30} r="7.5" fill={c} stroke={o} /><circle cx={cx - 4} cy={top - 32} r="2" fill="#fff" opacity=".8" /></g>;
    case 'bear': return <g stroke={o}>{[-1, 1].map((s) => <g key={s}><circle cx={cx + s * (rx - 12)} cy={top + 10} r="15" fill={look.body} /><circle cx={cx + s * (rx - 12)} cy={top + 11} r="8" fill={c} stroke="none" /></g>)}</g>;
    case 'crest': return <g stroke={o} fill={c}>{[-18, 0, 18].map((dx, i) => <path key={i} d={`M${cx + dx - 9},${top + 8 - Math.abs(dx) * 0.2} q9,-${i === 1 ? 34 : 24} 18,0 z`} />)}</g>;
    case 'tuft': return <g stroke={c} strokeWidth="4" strokeLinecap="round" fill="none"><path d={`M${cx - 8},${top + 4} q-4,-14 4,-18`} /><path d={`M${cx},${top + 2} q2,-18 10,-20`} /><path d={`M${cx + 6},${top + 4} q10,-8 14,-14`} /></g>;
    case 'horns': return <g stroke={o} fill={c}>{[-1, 1].map((s) => <path key={s} d={`M${cx + s * 28},${top + 12} q${s * 14},-12 ${s * 6},-30 q${s * -4},12 ${s * -22},20 z`} />)}</g>;
    case 'halo': return <ellipse cx={cx} cy={top - 12} rx="22" ry="6" fill="none" stroke={c} strokeWidth="5" />;
    default: return null;
  }
}

function Eye({ x, y, r, kind, emotion, side }: { x: number; y: number; r: number; kind: CharacterLook['eyes']; emotion: Emotion; side: 1 | -1 }): ReactNode {
  const arc = (up: boolean) => <path d={up ? `M${x - r},${y + 2} Q${x},${y - r * 1.1} ${x + r},${y + 2}` : `M${x - r},${y - 2} Q${x},${y + r * 1.1} ${x + r},${y - 2}`} stroke={ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />;
  if (emotion === 'sleepy' || (kind === 'sleepy' && emotion === 'happy')) return arc(false);
  if (emotion === 'wink' && side === 1) return arc(true);
  if (emotion === 'love') return <path d={`M${x},${y + r * 0.8} C${x - r * 1.5},${y - r * 0.1} ${x - r * 0.7},${y - r * 1.1} ${x},${y - r * 0.4} C${x + r * 0.7},${y - r * 1.1} ${x + r * 1.5},${y - r * 0.1} ${x},${y + r * 0.8} Z`} fill="#FF4F81" />;
  const R = emotion === 'surprised' ? r * 1.12 : r;
  return (
    <g className="nb-blink" style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x} cy={y} r={R} fill="#fff" stroke="#00000026" strokeWidth="1.4" />
      <circle cx={x + (side === 1 ? 1.5 : -1.5)} cy={y + 1} r={R * (emotion === 'surprised' ? 0.42 : 0.58)} fill={ink} />
      <circle cx={x + (side === 1 ? 3.4 : -0.2)} cy={y - R * 0.22} r={R * 0.2} fill="#fff" />
      {(kind === 'sparkle' || emotion === 'excited') && <circle cx={x - 2.2} cy={y + R * 0.3} r={R * 0.12} fill="#fff" />}
      {emotion === 'sad' && <path d={`M${x - R - 2},${y - R - 3} L${x + R + 2},${y - R + 3}`} stroke={ink} strokeWidth="2.6" strokeLinecap="round" transform={side === 1 ? `scale(-1 1) translate(${-2 * x} 0)` : ''} />}
    </g>
  );
}

function Mouth({ a, emotion }: { a: Anchors; emotion: Emotion }): ReactNode {
  const x = a.cx, y = a.eyeY + a.eyeR + 11;
  switch (emotion) {
    case 'surprised': return <ellipse cx={x} cy={y + 2} rx="5" ry="6.5" fill="#7A2E3E" stroke={ink} strokeWidth="2" />;
    case 'excited': return <path d={`M${x - 12},${y - 2} Q${x},${y + 20} ${x + 12},${y - 2} Z`} fill="#7A2E3E" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />;
    case 'sad': return <path d={`M${x - 8},${y + 5} Q${x},${y - 3} ${x + 8},${y + 5}`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'sleepy': return <ellipse cx={x} cy={y + 2} rx="3.5" ry="2.6" fill="#7A2E3E" />;
    case 'love': case 'wink': return <path d={`M${x - 9},${y - 1} Q${x},${y + 12} ${x + 9},${y - 1}`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />;
    default: return <path d={`M${x - 8},${y} Q${x},${y + 9} ${x + 8},${y}`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
}

export function Nanabo({ look, equipped = {}, emotion = 'happy', animate = true, view, title, className, shadow = true, flip }: NanaboProps) {
  const uid = useId().replace(/:/g, '');
  const a = anchors(look.build);
  const shade = look.shade || darken(look.body, 0.22);
  const parts: Partial<Record<Layer, WearParts>> = {};
  let hasHat = false;
  for (const layer of DRAW_ORDER) {
    const id = equipped[layer]; if (!id) continue;
    const item = ITEM_MAP[id]; if (!item) continue;
    const fn = wearFn(layer, item.art.kind); if (!fn) continue;
    parts[layer] = fn({ a, look, c1: item.art.c1, c2: item.art.c2 || item.art.c1, c3: item.art.c3 || item.art.c2 || item.art.c1, uid });
    if (layer === 'hat') hasHat = true;
    if (layer === 'costume' && ['bunny', 'bee', 'dino', 'pumpkin'].includes(item.art.kind)) hasHat = true;
  }
  const sel = (k: keyof WearParts) => DRAW_ORDER.map((l) => parts[l]?.[k] ? <g key={l + k}>{parts[l]![k]}</g> : null);
  const vb = view || [0, 0, VIEW_W, VIEW_H];
  const { cx, cy, rx, ry } = a;
  const eyeL = cx - a.eyeDx, eyeR = cx + a.eyeDx;
  const cheekY = a.eyeY + a.eyeR + 6;
  return (
    <svg viewBox={vb.join(' ')} className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg" style={{ overflow: view ? 'hidden' : 'visible', transform: flip ? 'scaleX(-1)' : undefined }}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`bc-${uid}`}><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /></clipPath>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lighten(look.body, 0.18)} /><stop offset=".55" stopColor={look.body} /><stop offset="1" stopColor={shade} /></linearGradient>
      </defs>
      <g className={animate ? 'nb-idle' : undefined} style={{ transformOrigin: `${cx}px ${a.bot}px` }}>
        {shadow && <ellipse cx={cx} cy={a.bot + 10} rx={rx * 0.9} ry="7" fill="#00000026" />}
        {sel('back')}
        {look.feature === 'wings' && <g stroke="#00000022">{[-1, 1].map((s) => <ellipse key={s} cx={cx + s * (rx + 8)} cy={a.shoulderY + 4} rx="20" ry="30" fill={look.featureColor} opacity=".92" transform={`rotate(${s * 24} ${cx + s * (rx + 8)} ${a.shoulderY + 4})`} />)}</g>}
        {/* ноги */}
        <g fill={shade}>{[-1, 1].map((s) => <ellipse key={s} cx={cx + s * a.footDx} cy={a.footY + 3} rx="17" ry="9" />)}</g>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#bg-${uid})`} stroke="#00000022" strokeWidth="2" />
        <g clipPath={`url(#bc-${uid})`}>
          <ellipse cx={cx} cy={cy + ry * 0.3} rx={rx * 0.66} ry={ry * 0.58} fill={look.belly} opacity=".95" />
          {look.pattern === 'spots' && [[-30, -20, 8], [26, -34, 7], [-12, 20, 6], [34, 14, 9], [-38, 30, 7], [8, -4, 5]].map(([dx, dy, r], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={r} fill={look.patternColor || shade} opacity=".7" />)}
          {look.pattern === 'stripes' && [0.12, 0.32, 0.52, 0.72].map((t, i) => <rect key={i} x={cx - rx} y={a.top + ry * 2 * t + 10} width={rx * 2} height="9" fill={look.patternColor || shade} opacity=".85" />)}
          {sel('inner')}
        </g>
        {/* руки */}
        <g fill={look.body} stroke="#00000022" strokeWidth="1.6">{[-1, 1].map((s) => <ellipse key={s} cx={cx + s * (rx - 1)} cy={a.armY} rx="10" ry="15" transform={`rotate(${s * -14} ${cx + s * (rx - 1)} ${a.armY})`} />)}</g>
        <Feature look={look} a={a} hasHat={hasHat} />
        {/* лицо */}
        <g>
          <Eye x={eyeL} y={a.eyeY} r={a.eyeR} kind={look.eyes} emotion={emotion} side={-1} />
          <Eye x={eyeR} y={a.eyeY} r={a.eyeR} kind={look.eyes} emotion={emotion} side={1} />
          <ellipse cx={eyeL - 6} cy={cheekY} rx="7" ry="4.4" fill={look.cheek} opacity=".75" /><ellipse cx={eyeR + 6} cy={cheekY} rx="7" ry="4.4" fill={look.cheek} opacity=".75" />
          <Mouth a={a} emotion={emotion} />
        </g>
        {sel('front')}
      </g>
    </svg>
  );
}

/** Сколько кадра занимает слой — чтобы превью предмета показывало нужную часть манекена. */
export function layerView(layer: Layer, build: CharacterLook['build'] = 'round'): [number, number, number, number] {
  const a = anchors(build);
  switch (layer) {
    case 'hat': return [a.cx - 70, a.top - 72, 140, 140];
    case 'glasses': return [a.cx - 60, a.eyeY - 60, 120, 120];
    case 'jewelry': return [a.cx - 55, a.shoulderY - 40, 110, 110];
    case 'shoes': return [a.cx - 75, a.footY - 105, 150, 150];
    case 'outfit': case 'costume': return [a.cx - 82, a.shoulderY - 52, 164, 160];
    default: return [-10, 10, VIEW_W + 20, VIEW_W + 20];
  }
}
