import type { WearFn } from './wearTypes';

const o = '#00000026';
/** Все шапки сидят на макушке: T — линия темени, hw — половина ширины головы. */
const t = (w: Parameters<WearFn>[0]) => ({ T: w.a.top + 8, hw: w.a.rx * 0.78, cx: w.a.cx });

export const HATS: Record<string, WearFn> = {
  cap: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw},${T + 16} Q${cx - hw},${T - 16} ${cx},${T - 16} Q${cx + hw},${T - 16} ${cx + hw},${T + 16} Z`} fill={w.c1} />
    <path d={`M${cx - hw + 2},${T + 14} Q${cx + hw * 0.6},${T + 6} ${cx + hw + 24},${T + 20} Q${cx + hw},${T + 26} ${cx - hw + 2},${T + 20} Z`} fill={w.c1} filter="brightness(.9)" />
    <circle cx={cx} cy={T - 15} r="4" fill={w.c2} /></g> }; },
  beanie: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw},${T + 12} Q${cx - hw},${T - 24} ${cx},${T - 24} Q${cx + hw},${T - 24} ${cx + hw},${T + 12} Z`} fill={w.c1} />
    <rect x={cx - hw - 3} y={T + 4} width={hw * 2 + 6} height="14" rx="7" fill={w.c2} />
    <circle cx={cx} cy={T - 28} r="9" fill={w.c2} /></g> }; },
  party: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw * 0.7},${T + 12} L${cx},${T - 44} L${cx + hw * 0.7},${T + 12} Z`} fill={w.c1} />
    {[[-8, -2], [6, -14], [-2, -26], [10, 2], [-14, 6]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={T + dy} r="3" fill={w.c2} stroke="none" />)}
    <circle cx={cx} cy={T - 46} r="6" fill={w.c2} /></g> }; },
  bunnyears: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    {[-1, 1].map((s) => <g key={s} transform={`rotate(${s * 10} ${cx + s * hw * 0.5} ${T + 6})`}><ellipse cx={cx + s * hw * 0.5} cy={T - 24} rx="10" ry="28" fill={w.c1} /><ellipse cx={cx + s * hw * 0.5} cy={T - 22} rx="5" ry="20" fill={w.c2} stroke="none" /></g>)}
    <path d={`M${cx - hw},${T + 8} Q${cx},${T - 8} ${cx + hw},${T + 8}`} fill="none" stroke={w.c2} strokeWidth="5" strokeLinecap="round" /></g> }; },
  chefhat: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o} fill={w.c1}>
    <rect x={cx - hw * 0.8} y={T - 8} width={hw * 1.6} height="22" rx="4" />
    {[-hw * 0.55, 0, hw * 0.55].map((dx, i) => <circle key={i} cx={cx + dx} cy={T - 18 - (i === 1 ? 8 : 0)} r="17" />)}
    <path d={`M${cx - hw * 0.8},${T + 8} H${cx + hw * 0.8}`} stroke={w.c2} strokeWidth="2" /></g> }; },
  beret: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <ellipse cx={cx - 4} cy={T} rx={hw + 6} ry="15" fill={w.c1} transform={`rotate(-8 ${cx} ${T})`} />
    <path d={`M${cx + 4},${T - 14} q6,-10 10,-4`} stroke={w.c2} strokeWidth="5" strokeLinecap="round" fill="none" /></g> }; },
  bowband: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw - 2},${T + 18} Q${cx},${T - 20} ${cx + hw + 2},${T + 18}`} fill="none" stroke={w.c1} strokeWidth="6" strokeLinecap="round" />
    <g transform={`translate(${cx + hw * 0.6} ${T - 4})`}><path d="M0,0 L-14,-9 L-14,9 Z M0,0 L14,-9 L14,9 Z" fill={w.c2} /><circle r="5" fill={w.c1} /></g></g> }; },
  sunhat: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <ellipse cx={cx} cy={T + 10} rx={hw * 1.75} ry="14" fill={w.c1} />
    <path d={`M${cx - hw * 0.75},${T + 10} Q${cx - hw * 0.75},${T - 26} ${cx},${T - 26} Q${cx + hw * 0.75},${T - 26} ${cx + hw * 0.75},${T + 10} Z`} fill={w.c1} />
    <rect x={cx - hw * 0.75} y={T - 2} width={hw * 1.5} height="9" fill={w.c2} stroke="none" /></g> }; },
  santahat: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw},${T + 12} Q${cx - hw * 0.4},${T - 40} ${cx + hw * 0.9},${T - 22} Q${cx + hw * 1.3},${T - 8} ${cx + hw * 1.1},${T + 4} L${cx + hw},${T + 12} Z`} fill={w.c1} />
    <rect x={cx - hw - 3} y={T + 4} width={hw * 2 + 6} height="14" rx="7" fill={w.c2} />
    <circle cx={cx + hw * 1.1} cy={T + 4} r="9" fill={w.c2} /></g> }; },
  headphones: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw - 2},${w.a.eyeY - 2} Q${cx - hw - 2},${T - 22} ${cx},${T - 22} Q${cx + hw + 2},${T - 22} ${cx + hw + 2},${w.a.eyeY - 2}`} fill="none" stroke={w.c1} strokeWidth="7" strokeLinecap="round" />
    <rect x={cx - hw - 10} y={w.a.eyeY - 12} width="16" height="26" rx="8" fill={w.c2} /><rect x={cx + hw - 6} y={w.a.eyeY - 12} width="16" height="26" rx="8" fill={w.c2} /></g> }; },
  cowboy: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw * 1.8},${T + 2} Q${cx - hw * 0.8},${T + 20} ${cx},${T + 14} Q${cx + hw * 0.8},${T + 20} ${cx + hw * 1.8},${T + 2} Q${cx + hw},${T + 6} ${cx},${T + 4} Q${cx - hw},${T + 6} ${cx - hw * 1.8},${T + 2} Z`} fill={w.c1} />
    <path d={`M${cx - hw * 0.7},${T + 8} Q${cx - hw * 0.8},${T - 22} ${cx - 8},${T - 16} Q${cx},${T - 10} ${cx + 8},${T - 16} Q${cx + hw * 0.8},${T - 22} ${cx + hw * 0.7},${T + 8} Z`} fill={w.c1} />
    <rect x={cx - hw * 0.7} y={T - 2} width={hw * 1.4} height="8" fill={w.c2} stroke="none" /></g> }; },
  tophat: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <ellipse cx={cx} cy={T + 10} rx={hw * 1.15} ry="8" fill={w.c1} />
    <rect x={cx - hw * 0.65} y={T - 36} width={hw * 1.3} height="46" rx="4" fill={w.c1} />
    <rect x={cx - hw * 0.65} y={T - 2} width={hw * 1.3} height="10" fill={w.c2} stroke="none" /></g> }; },
  flowers: (w) => { const { T, hw, cx } = t(w); const pts = [-1, -0.55, 0, 0.55, 1].map((k) => [cx + k * hw * 0.95, T + 6 - (1 - Math.abs(k)) * 10] as const); return { front: <g>
    <path d={`M${cx - hw},${T + 12} Q${cx},${T - 12} ${cx + hw},${T + 12}`} fill="none" stroke={w.c3} strokeWidth="5" strokeLinecap="round" />
    {pts.map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-6" rx="4.2" ry="6" fill={i % 2 ? w.c2 : w.c1} transform={`rotate(${r})`} />)}<circle r="3" fill={i % 2 ? w.c1 : w.c2} /></g>)}</g> }; },
  propeller: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw},${T + 14} Q${cx - hw},${T - 14} ${cx},${T - 14} Q${cx + hw},${T - 14} ${cx + hw},${T + 14} Z`} fill={w.c1} />
    <rect x={cx - 2.5} y={T - 24} width="5" height="11" fill="#555" />
    <g className="art-spin" style={{ transformOrigin: `${cx}px ${T - 26}px` }}><ellipse cx={cx - 17} cy={T - 26} rx="17" ry="4.5" fill={w.c2} /><ellipse cx={cx + 17} cy={T - 26} rx="17" ry="4.5" fill={w.c2} /></g></g> }; },
  piratehat: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw * 1.7},${T + 6} Q${cx - hw},${T - 40} ${cx},${T - 26} Q${cx + hw},${T - 40} ${cx + hw * 1.7},${T + 6} Q${cx},${T + 20} ${cx - hw * 1.7},${T + 6} Z`} fill={w.c1} />
    <circle cx={cx} cy={T - 6} r="7.5" fill={w.c2} stroke="none" /><rect x={cx - 4} y={T} width="8" height="5" fill={w.c2} stroke="none" /><circle cx={cx - 3} cy={T - 7} r="1.8" fill={w.c1} stroke="none" /><circle cx={cx + 3} cy={T - 7} r="1.8" fill={w.c1} stroke="none" /></g> }; },
  wizardhat: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke={o}>
    <path d={`M${cx - hw * 0.8},${T + 10} Q${cx - 4},${T - 30} ${cx + 18},${T - 70} Q${cx + hw * 0.5},${T - 24} ${cx + hw * 0.8},${T + 10} Z`} fill={w.c1} />
    <ellipse cx={cx} cy={T + 11} rx={hw * 1.5} ry="8" fill={w.c1} />
    {[[-4, -2], [8, -22], [-2, -36], [12, 0]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={T + dy} r="3" fill={w.c2} stroke="none" />)}</g> }; },
  knighthelm: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke="#8A94A3" strokeWidth="1.5">
    <path d={`M${cx - hw},${w.a.eyeY + 10} L${cx - hw},${T + 4} Q${cx - hw},${T - 22} ${cx},${T - 22} Q${cx + hw},${T - 22} ${cx + hw},${T + 4} L${cx + hw},${w.a.eyeY + 10} L${cx + hw * 0.55},${w.a.eyeY + 10} L${cx + hw * 0.55},${w.a.eyeY - 14} L${cx - hw * 0.55},${w.a.eyeY - 14} L${cx - hw * 0.55},${w.a.eyeY + 10} Z`} fill={w.c1} />
    <path d={`M${cx - 4},${T - 22} Q${cx + 20},${T - 54} ${cx + 38},${T - 30} Q${cx + 20},${T - 36} ${cx + 4},${T - 20} Z`} fill={w.c2} stroke="none" /></g> }; },
  helmet: (w) => ({ front: <g><ellipse cx={w.a.cx} cy={w.a.top + w.a.ry * 0.55} rx={w.a.rx * 0.98} ry={w.a.ry * 0.62} fill={w.c2} opacity=".22" stroke={w.c1} strokeWidth="5" />
    <path d={`M${w.a.cx - w.a.rx * 0.6},${w.a.top + 20} q10,-12 28,-14`} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" /></g> }),
  crown: (w) => { const { T, hw, cx } = t(w); return { front: <g stroke="#B58B0044">
    <path d={`M${cx - hw * 0.8},${T + 10} L${cx - hw * 0.9},${T - 22} L${cx - hw * 0.4},${T - 6} L${cx},${T - 28} L${cx + hw * 0.4},${T - 6} L${cx + hw * 0.9},${T - 22} L${cx + hw * 0.8},${T + 10} Z`} fill={w.c1} />
    <circle cx={cx} cy={T - 4} r="4.5" fill={w.c2} stroke="none" /><circle cx={cx - hw * 0.5} cy={T + 3} r="3.2" fill={w.c2} stroke="none" /><circle cx={cx + hw * 0.5} cy={T + 3} r="3.2" fill={w.c2} stroke="none" /></g> }; },
};
