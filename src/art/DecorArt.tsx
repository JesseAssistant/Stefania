import type { ReactNode } from 'react';
import type { DecorDef } from '../game/types';
import { darken } from './color';

/** Декорации базы: рисунки 60×60. Подбираются по `kind` из данных. */
const o = '#00000022';
function art(k: string, c1: string, c2: string): ReactNode {
  switch (k) {
    case 'lamp': return <g stroke={o}><rect x="28" y="30" width="4" height="22" fill="#8A6A4A" /><ellipse cx="30" cy="54" rx="12" ry="4" fill="#8A6A4A" /><path d="M16 32 L22 10 H38 L44 32 Z" fill={c1} /><ellipse cx="30" cy="22" rx="8" ry="10" fill={c2} opacity=".7" stroke="none" /></g>;
    case 'plant': return <g stroke={o}><path d="M16 36h28l-4 18H20z" fill={c2} /><path d="M30 36c-2-12-12-14-14-20 8 0 14 6 14 20zM30 36c2-14 10-18 16-20-2 8-8 14-16 20z" fill={c1} /></g>;
    case 'rug': return <g stroke={o}><ellipse cx="30" cy="44" rx="27" ry="11" fill={c1} /><ellipse cx="30" cy="44" rx="18" ry="7" fill={c2} /><ellipse cx="30" cy="44" rx="9" ry="3.5" fill={c1} /></g>;
    case 'poster': return <g stroke={o}><rect x="12" y="6" width="36" height="46" rx="3" fill={c1} /><path d="M30 14l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill={c2} /></g>;
    case 'beanbag': return <g stroke={o}><path d="M8 50c-2-18 8-32 22-32s24 14 22 32z" fill={c1} /><path d="M18 30c6-4 18-4 24 0" stroke={c2} strokeWidth="3" fill="none" /></g>;
    case 'clock': return <g stroke={o}><circle cx="30" cy="30" r="22" fill={c1} /><circle cx="30" cy="30" r="17" fill="#fff" /><path d="M30 30V18M30 30l8 5" stroke={c2} strokeWidth="3" strokeLinecap="round" /></g>;
    case 'frame': return <g stroke={o}><rect x="8" y="10" width="44" height="40" rx="4" fill={c1} /><rect x="14" y="16" width="32" height="28" fill={c2} /><circle cx="26" cy="27" r="5" fill="#FFD93D" /><path d="M14 44l10-10 8 6 6-6 8 10z" fill="#7ED957" /></g>;
    case 'shelf': return <g stroke={o}><rect x="8" y="8" width="44" height="46" fill={c1} /><rect x="12" y="12" width="36" height="16" fill={c2} /><rect x="12" y="32" width="36" height="16" fill={c2} /><rect x="15" y="14" width="5" height="14" fill="#E94F4F" /><rect x="22" y="16" width="5" height="12" fill="#3D7BFF" /><rect x="29" y="13" width="5" height="15" fill="#4CC26B" /><rect x="16" y="36" width="12" height="12" fill="#FFD93D" /></g>;
    case 'balloons': return <g stroke={o}><path d="M30 56C28 44 18 36 18 28M30 56c2-12 12-20 12-28" stroke="#777" fill="none" /><ellipse cx="18" cy="20" rx="10" ry="12" fill={c1} /><ellipse cx="42" cy="20" rx="10" ry="12" fill={c2} /><ellipse cx="30" cy="12" rx="9" ry="11" fill="#FFD93D" /></g>;
    case 'lights': return <g><path d="M2 14Q15 30 30 16T58 16" stroke="#555" fill="none" strokeWidth="1.5" />{[8, 18, 30, 42, 52].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 28 : 24} r="4.5" fill={i % 2 ? c2 : c1} stroke={o} />)}</g>;
    case 'aquarium': return <g stroke={o}><rect x="6" y="14" width="48" height="36" rx="5" fill="#BFE9FF" /><rect x="6" y="14" width="48" height="8" fill="#fff" opacity=".4" stroke="none" /><ellipse cx="22" cy="34" rx="7" ry="4" fill={c2} /><path d="M29 34l5-4v8z" fill={c2} /><ellipse cx="38" cy="26" rx="5" ry="3" fill="#FF7FA8" /><path d="M10 50c2-8 4-8 4-12M46 50c-2-6-2-8 0-12" stroke="#4CC26B" strokeWidth="3" fill="none" /></g>;
    case 'globe': return <g stroke={o}><path d="M18 54h24M30 46v8" stroke="#8A6A4A" strokeWidth="3" /><circle cx="30" cy="28" r="18" fill={c1} /><path d="M20 20c6-2 8 4 14 2s4 8-2 10-10-2-12-12z" fill={c2} stroke="none" /></g>;
    case 'telescope': return <g stroke={o}><path d="M30 34l-12 20M30 34l12 20" stroke="#8A6A4A" strokeWidth="3" /><rect x="8" y="14" width="32" height="12" rx="4" fill={c1} transform="rotate(-28 24 20)" /><rect x="32" y="22" width="12" height="9" rx="2" fill={c2} transform="rotate(-28 24 20)" /></g>;
    case 'teddy': return <g stroke={o}><circle cx="18" cy="14" r="6" fill={c1} /><circle cx="42" cy="14" r="6" fill={c1} /><circle cx="30" cy="22" r="13" fill={c1} /><ellipse cx="30" cy="42" rx="14" ry="13" fill={c1} /><ellipse cx="30" cy="44" rx="8" ry="8" fill={c2} /><ellipse cx="30" cy="25" rx="5" ry="4" fill={c2} /><circle cx="25" cy="20" r="1.8" fill="#2B2D42" /><circle cx="35" cy="20" r="1.8" fill="#2B2D42" /></g>;
    case 'arcade': return <g stroke={o}><rect x="10" y="4" width="40" height="52" rx="4" fill={c1} /><rect x="15" y="9" width="30" height="20" rx="2" fill="#1d1f33" /><path d="M20 24l5-9 5 6 5-8" stroke="#6BCB77" strokeWidth="2" fill="none" /><circle cx="22" cy="40" r="4" fill={c2} /><circle cx="36" cy="40" r="3" fill="#FFD93D" /><circle cx="43" cy="42" r="3" fill="#6BCB77" /></g>;
    case 'disco': return <g stroke={o}><path d="M30 2v10" stroke="#777" /><circle cx="30" cy="28" r="17" fill={c1} />{[[22, 20], [34, 18], [28, 30], [40, 28], [20, 36], [34, 40]].map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={i % 2 ? '#8FD3FF' : '#FFC8F0'} stroke="none" />)}</g>;
    case 'piano': return <g stroke={o}><path d="M6 24h48v24H6z" fill={c1} /><path d="M10 14h32l8 10H6z" fill={darken(c1, 0.1)} />{[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={9 + i * 6} y="28" width="5" height="16" fill={c2} />)}{[1, 2, 4, 5].map((i) => <rect key={i} x={7 + i * 6} y="28" width="3.5" height="9" fill={c1} stroke="none" />)}<path d="M10 48v8M50 48v8" stroke={c1} strokeWidth="4" /></g>;
    case 'trophy': return <g stroke={o}><path d="M18 8h24v14c0 8-6 14-12 14S18 30 18 22z" fill={c1} /><path d="M18 12H8c0 8 4 12 10 12M42 12h10c0 8-4 12-10 12" fill="none" stroke={c1} strokeWidth="3" /><rect x="26" y="36" width="8" height="10" fill={c1} /><rect x="18" y="46" width="24" height="8" rx="2" fill={c2} /></g>;
    case 'statue': return <g stroke="#B58B00"><rect x="14" y="48" width="32" height="8" rx="2" fill="#E8D28A" /><path d="M16 44c-6-18 4-34 20-38 -2 10 6 16 8 22 -6-2-8 2-10 8 -4 4-10 6-18 8z" fill={c1} /><path d="M22 36c2-10 8-18 14-24" stroke={c2} strokeWidth="3" fill="none" /></g>;
    default: return <circle cx="30" cy="30" r="18" fill={c1} stroke={o} />;
  }
}
export function DecorArt({ d, className }: { d: Pick<DecorDef, 'kind' | 'c1' | 'c2' | 'name'>; className?: string }) {
  return <svg viewBox="0 0 60 60" className={className} role="img" aria-label={d.name} style={{ overflow: 'visible' }}>{art(d.kind, d.c1, d.c2)}</svg>;
}
