import type { WearCtx, WearFn } from './wearTypes';

const heart = (x: number, y: number, s: number) => `M${x},${y + s * 0.9} C${x - s * 1.6},${y - s * 0.2} ${x - s * 0.7},${y - s * 1.2} ${x},${y - s * 0.4} C${x + s * 0.7},${y - s * 1.2} ${x + s * 1.6},${y - s * 0.2} ${x},${y + s * 0.9} Z`;
const spark = (x: number, y: number, r: number) => `M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r} Z`;
/** Детерминированный «шум»: эффекты выглядят одинаково при каждом показе. */
const nz = (i: number, k: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const spread = (w: WearCtx, n: number, k = 1) => [...Array(n)].map((_, i) => ({ x: w.a.cx - 90 + nz(i, k) * 180, y: 20 + nz(i, k + 5) * 200, d: nz(i, k + 9) * 3, s: 0.6 + nz(i, k + 2) * 0.8 }));

export const EFFECTS: Record<string, WearFn> = {
  bubbles: (w) => ({ front: <g fill="#ffffff22" stroke={w.c1} strokeWidth="1.6">{spread(w, 9, 1).map((p, i) => <g key={i} className="art-float" style={{ animationDelay: `${-p.d}s` }}><circle cx={p.x} cy={p.y} r={4 + p.s * 6} /><path d={`M${p.x - 2},${p.y - 3} h3`} stroke="#fff" strokeLinecap="round" /></g>)}</g> }),
  confetti: (w) => ({ front: <g>{spread(w, 20, 2).map((p, i) => <rect key={i} className="art-fall" style={{ animationDelay: `${-p.d * 1.4}s` }} x={p.x} y={p.y - 80} width="5" height="9" rx="1.5" fill={[w.c1, w.c2, w.c3][i % 3]} transform={`rotate(${i * 37} ${p.x} ${p.y})`} />)}</g> }),
  hearts: (w) => ({ front: <g>{spread(w, 8, 3).map((p, i) => <path key={i} className="art-rise" style={{ animationDelay: `${-p.d * 1.3}s` }} d={heart(p.x, p.y, 4 + p.s * 5)} fill={i % 2 ? w.c1 : w.c2} />)}</g> }),
  sparkles: (w) => ({ front: <g>{spread(w, 12, 4).map((p, i) => <path key={i} className="art-twinkle" style={{ animationDelay: `${-p.d}s` }} d={spark(p.x, p.y, 5 + p.s * 6)} fill={i % 2 ? w.c1 : w.c2} />)}</g> }),
  fireflies: (w) => ({ front: <g>{spread(w, 11, 5).map((p, i) => <g key={i} className="art-twinkle" style={{ animationDelay: `${-p.d}s` }}><circle cx={p.x} cy={p.y} r="7" fill={w.c1} opacity=".25" /><circle cx={p.x} cy={p.y} r="2.6" fill={w.c1} /></g>)}</g> }),
  snow: (w) => ({ front: <g>{spread(w, 18, 6).map((p, i) => <circle key={i} className="art-fall" style={{ animationDelay: `${-p.d * 1.6}s` }} cx={p.x} cy={p.y - 70} r={1.8 + p.s * 2.2} fill={i % 3 ? w.c1 : w.c2} stroke="#BFE9FF" strokeWidth=".6" />)}</g> }),
  petals: (w) => ({ front: <g>{spread(w, 14, 7).map((p, i) => <ellipse key={i} className="art-fall" style={{ animationDelay: `${-p.d * 1.5}s` }} cx={p.x} cy={p.y - 70} rx="4.5" ry="2.6" fill={i % 2 ? w.c1 : w.c2} transform={`rotate(${i * 41} ${p.x} ${p.y})`} />)}</g> }),
  halo: (w) => ({ front: <g className="art-bob"><ellipse cx={w.a.cx} cy={w.a.top - 14} rx="26" ry="7" fill="none" stroke={w.c1} strokeWidth="6" /><ellipse cx={w.a.cx} cy={w.a.top - 14} rx="26" ry="7" fill="none" stroke={w.c2} strokeWidth="1.6" opacity=".8" /></g> }),
  rainbow: (w) => ({ back: <g fill="none" strokeWidth="7" strokeLinecap="round" opacity=".9">{[w.c1, w.c2, w.c3].map((c, i) => <path key={i} d={`M${w.a.cx - 78 + i * 7},${w.a.bot} Q${w.a.cx - 78 + i * 7},${w.a.top - 52 + i * 7} ${w.a.cx},${w.a.top - 52 + i * 7} Q${w.a.cx + 78 - i * 7},${w.a.top - 52 + i * 7} ${w.a.cx + 78 - i * 7},${w.a.bot}`} stroke={c} />)}</g> }),
  glow: (w) => ({ back: <g className="art-pulse"><defs><radialGradient id={`glow-${w.uid}`}><stop offset="0" stopColor={w.c2} stopOpacity=".95" /><stop offset=".55" stopColor={w.c1} stopOpacity=".45" /><stop offset="1" stopColor={w.c1} stopOpacity="0" /></radialGradient></defs><ellipse cx={w.a.cx} cy={w.a.cy} rx={w.a.rx + 54} ry={w.a.ry + 50} fill={`url(#glow-${w.uid})`} /></g> }),
};
