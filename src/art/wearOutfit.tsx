import type { WearCtx, WearFn } from './wearTypes';

const band = (w: WearCtx, y0: number, y1: number, fill: string, extra: Record<string, unknown> = {}) => (
  <rect x={w.a.cx - w.a.rx - 4} y={y0} width={w.a.rx * 2 + 8} height={Math.max(0, y1 - y0)} fill={fill} {...extra} />
);
const stroke = '#00000022';

export const OUTFITS: Record<string, WearFn> = {
  tee: (w) => ({ inner: <g>{band(w, w.a.shoulderY, w.a.waistY, w.c1)}{band(w, w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * 0.45, w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * 0.6, w.c2, { opacity: 0.9 })}
    <path d={`M${w.a.cx - 14},${w.a.shoulderY} Q${w.a.cx},${w.a.shoulderY + 14} ${w.a.cx + 14},${w.a.shoulderY}`} fill="none" stroke={w.c2} strokeWidth="3" strokeLinecap="round" /></g> }),
  vest: (w) => ({ inner: <g>{band(w, w.a.shoulderY, w.a.waistY, w.c1)}
    <path d={`M${w.a.cx - 16},${w.a.shoulderY} L${w.a.cx},${w.a.waistY - 6} L${w.a.cx + 16},${w.a.shoulderY} Z`} fill={w.look.belly} />
    <path d={`M${w.a.cx - 16},${w.a.shoulderY} L${w.a.cx},${w.a.waistY - 6} L${w.a.cx + 16},${w.a.shoulderY}`} fill="none" stroke={w.c2} strokeWidth="2.5" />
    <circle cx={w.a.cx - w.a.rx * 0.55} cy={w.a.shoulderY + 22} r="4" fill={w.c2} /><circle cx={w.a.cx + w.a.rx * 0.55} cy={w.a.shoulderY + 22} r="4" fill={w.c2} /></g> }),
  hoodie: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 4, w.a.waistY + 2, w.c1)}
    <path d={`M${w.a.cx - 22},${w.a.shoulderY - 4} Q${w.a.cx},${w.a.shoulderY + 20} ${w.a.cx + 22},${w.a.shoulderY - 4}`} fill="none" stroke={w.c2} strokeWidth="5" strokeLinecap="round" opacity=".85" />
    <rect x={w.a.cx - 22} y={w.a.waistY - 22} width="44" height="16" rx="7" fill={w.c2} opacity=".35" />
    <path d={`M${w.a.cx - 6},${w.a.shoulderY + 8} v14 M${w.a.cx + 6},${w.a.shoulderY + 8} v14`} stroke={w.c2} strokeWidth="2" strokeLinecap="round" /></g>,
  front: <g fill={w.c1} stroke={stroke}><ellipse cx={w.a.cx - w.a.rx - 2} cy={w.a.armY} rx="11" ry="15" /><ellipse cx={w.a.cx + w.a.rx + 2} cy={w.a.armY} rx="11" ry="15" /></g> }),
  sweater: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 4, w.a.waistY + 2, w.c1)}
    {[0.35, 0.55, 0.75].map((t, i) => <path key={i} d={`M${w.a.cx - w.a.rx},${w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * t} l12,-7 l12,7 l12,-7 l12,7 l12,-7 l12,7 l12,-7 l12,7 l12,-7`} fill="none" stroke={w.c2} strokeWidth="3" opacity=".9" />)}
    <rect x={w.a.cx - 18} y={w.a.shoulderY - 6} width="36" height="12" rx="6" fill={w.c2} /></g> }),
  jersey: (w) => ({ inner: <g>{band(w, w.a.shoulderY, w.a.waistY, w.c1)}{band(w, w.a.waistY - 8, w.a.waistY, w.c2)}
    <text x={w.a.cx} y={w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * 0.62} textAnchor="middle" fontSize="30" fontWeight="900" fill={w.c2} fontFamily="Nunito, system-ui, sans-serif">1</text>
    <path d={`M${w.a.cx - 14},${w.a.shoulderY} L${w.a.cx},${w.a.shoulderY + 12} L${w.a.cx + 14},${w.a.shoulderY}`} fill="none" stroke={w.c2} strokeWidth="3" /></g> }),
  dress: (w) => ({ inner: <g><path d={`M${w.a.cx - w.a.rx * 0.8},${w.a.shoulderY} L${w.a.cx + w.a.rx * 0.8},${w.a.shoulderY} L${w.a.cx + w.a.rx + 8},${w.a.cy + w.a.ry * 0.92} L${w.a.cx - w.a.rx - 8},${w.a.cy + w.a.ry * 0.92} Z`} fill={w.c1} />
    {[[-26, 0.35], [14, 0.5], [-8, 0.7], [30, 0.78], [-34, 0.82]].map(([dx, t], i) => <circle key={i} cx={w.a.cx + dx} cy={w.a.shoulderY + (w.a.cy + w.a.ry * 0.92 - w.a.shoulderY) * t} r="3.2" fill={w.c2} />)}
    <rect x={w.a.cx - w.a.rx} y={w.a.shoulderY + 20} width={w.a.rx * 2} height="6" fill={w.c2} opacity=".85" /></g> }),
};

export const COSTUMES: Record<string, WearFn> = {
  sailor: (w) => { const h = w.a.waistY - w.a.shoulderY; return {
    inner: <g>{band(w, w.a.shoulderY, w.a.waistY, w.c1)}{[0.2, 0.42, 0.64, 0.86].map((t, i) => <g key={i}>{band(w, w.a.shoulderY + h * t, w.a.shoulderY + h * t + 5, w.c2)}</g>)}</g>,
    front: <g><path d={`M${w.a.cx - 24},${w.a.shoulderY - 2} L${w.a.cx},${w.a.shoulderY + 24} L${w.a.cx + 24},${w.a.shoulderY - 2} L${w.a.cx + 16},${w.a.shoulderY - 6} L${w.a.cx},${w.a.shoulderY + 6} L${w.a.cx - 16},${w.a.shoulderY - 6} Z`} fill={w.c2} /><path d={`M${w.a.cx - 5},${w.a.shoulderY + 14} h10 l-5 12 z`} fill="#E94F4F" /></g> }; },
  chef: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 2, w.a.waistY + 4, w.c1)}<path d={`M${w.a.cx},${w.a.shoulderY} V${w.a.waistY + 4}`} stroke={w.c2} strokeWidth="2.5" />
    {[0.25, 0.5, 0.75].map((t, i) => <g key={i}><circle cx={w.a.cx - 9} cy={w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * t} r="3" fill={w.c2} /><circle cx={w.a.cx + 9} cy={w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * t} r="3" fill={w.c2} /></g>)}
    <path d={`M${w.a.cx - 20},${w.a.shoulderY - 2} L${w.a.cx},${w.a.shoulderY + 16} L${w.a.cx + 20},${w.a.shoulderY - 2}`} fill="none" stroke={w.c2} strokeWidth="3" /></g> }),
  dino: (w) => ({ back: <path d={`M${w.a.cx + w.a.rx - 4},${w.a.bot - 26} q38,-6 34,22 q-14,-6 -34,0 z`} fill={w.c1} />,
    inner: <g>{band(w, w.a.cy - w.a.ry * 0.06, w.a.bot + 4, w.c1)}{[[-26, 18], [20, 30], [-6, 44], [34, 8]].map(([dx, dy], i) => <circle key={i} cx={w.a.cx + dx} cy={w.a.cy + dy} r="5" fill={w.c2} opacity=".8" />)}</g>,
    front: <g fill={w.c2}>{[-24, -8, 8, 24].map((dx, i) => <path key={i} d={`M${w.a.cx + dx - 7},${w.a.top + 8 - Math.abs(dx) * 0.2} l7,-16 l7,16 z`} />)}</g> }),
  bee: (w) => { const h = w.a.waistY - w.a.shoulderY; return {
    back: <g opacity=".85"><ellipse cx={w.a.cx - w.a.rx + 4} cy={w.a.shoulderY - 6} rx="18" ry="26" fill="#DFF3FF" stroke="#9DC9E6" transform={`rotate(-28 ${w.a.cx - w.a.rx + 4} ${w.a.shoulderY - 6})`} /><ellipse cx={w.a.cx + w.a.rx - 4} cy={w.a.shoulderY - 6} rx="18" ry="26" fill="#DFF3FF" stroke="#9DC9E6" transform={`rotate(28 ${w.a.cx + w.a.rx - 4} ${w.a.shoulderY - 6})`} /></g>,
    inner: <g>{band(w, w.a.shoulderY, w.a.waistY + 6, w.c1)}{[0.15, 0.5, 0.85].map((t, i) => <g key={i}>{band(w, w.a.shoulderY + h * t, w.a.shoulderY + h * t + 9, w.c2)}</g>)}</g>,
    front: <g stroke={w.c2} strokeWidth="2.5" fill="none" strokeLinecap="round"><path d={`M${w.a.cx - 10},${w.a.top + 4} q-6,-18 -14,-22`} /><path d={`M${w.a.cx + 10},${w.a.top + 4} q6,-18 14,-22`} /><circle cx={w.a.cx - 25} cy={w.a.top - 18} r="4" fill={w.c2} /><circle cx={w.a.cx + 25} cy={w.a.top - 18} r="4" fill={w.c2} /></g> }; },
  bunny: (w) => ({ back: <g><circle cx={w.a.cx + w.a.rx - 2} cy={w.a.bot - 18} r="13" fill={w.c1} stroke={stroke} /></g>,
    inner: <g>{band(w, w.a.shoulderY - 4, w.a.bot + 4, w.c1)}<ellipse cx={w.a.cx} cy={w.a.cy + w.a.ry * 0.38} rx={w.a.rx * 0.5} ry={w.a.ry * 0.38} fill={w.c2} opacity=".6" /></g>,
    front: <g>{[-1, 1].map((s) => <g key={s} transform={`rotate(${s * 8} ${w.a.cx + s * 22} ${w.a.top + 8})`}><ellipse cx={w.a.cx + s * 22} cy={w.a.top - 18} rx="11" ry="30" fill={w.c1} stroke={stroke} /><ellipse cx={w.a.cx + s * 22} cy={w.a.top - 16} rx="5.5" ry="22" fill={w.c2} /></g>)}</g> }),
  swim: (w) => ({ inner: <g>{band(w, w.a.shoulderY + 6, w.a.cy + w.a.ry * 0.5, w.c1)}{[[-22, 14], [10, 26], [28, 8], [-6, 34]].map(([dx, dy], i) => <circle key={i} cx={w.a.cx + dx} cy={w.a.shoulderY + dy + 8} r="3.5" fill={w.c2} />)}</g>,
    front: <g><ellipse cx={w.a.cx} cy={w.a.cy + w.a.ry * 0.46} rx={w.a.rx + 5} ry="12" fill="none" stroke={w.c2} strokeWidth="9" /><ellipse cx={w.a.cx} cy={w.a.cy + w.a.ry * 0.46} rx={w.a.rx + 5} ry="12" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 10" opacity=".7" />
      <circle cx={w.a.cx + w.a.rx - 4} cy={w.a.cy + w.a.ry * 0.46 - 6} r="9" fill={w.c2} stroke={stroke} /><path d={`M${w.a.cx + w.a.rx + 4},${w.a.cy + w.a.ry * 0.46 - 6} l8,2 l-8,3 z`} fill="#FF8A3D" /><circle cx={w.a.cx + w.a.rx - 6} cy={w.a.cy + w.a.ry * 0.46 - 9} r="1.6" fill="#2B2D42" /></g> }),
  pumpkin: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 4, w.a.bot + 4, w.c1)}{[-36, -18, 0, 18, 36].map((dx, i) => <path key={i} d={`M${w.a.cx + dx},${w.a.shoulderY} q${dx > 0 ? 6 : -6},${w.a.ry * 0.6} 0,${w.a.ry * 1.1}`} stroke="#C46A00" strokeWidth="2.2" fill="none" opacity=".55" />)}</g>,
    front: <g><path d={`M${w.a.cx - 4},${w.a.top + 4} q-2,-14 6,-18 q4,8 0,18 z`} fill="#7A4F25" /><path d={`M${w.a.cx + 4},${w.a.top} q16,-18 26,-4 q-14,10 -26,4 z`} fill={w.c2} /></g> }),
  santa: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 2, w.a.bot + 4, w.c1)}{band(w, w.a.cy + w.a.ry * 0.38, w.a.cy + w.a.ry * 0.38 + 10, '#2B2D42')}<rect x={w.a.cx - 8} y={w.a.cy + w.a.ry * 0.38 - 1} width="16" height="12" rx="2" fill="#FFC400" /><rect x={w.a.cx - 4} y={w.a.cy + w.a.ry * 0.38 + 3} width="8" height="4" fill="#2B2D42" />
    <path d={`M${w.a.cx - 22},${w.a.shoulderY - 2} Q${w.a.cx},${w.a.shoulderY + 18} ${w.a.cx + 22},${w.a.shoulderY - 2}`} fill="none" stroke={w.c2} strokeWidth="9" strokeLinecap="round" />{band(w, w.a.bot - 12, w.a.bot + 4, w.c2)}</g> }),
  pirate: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 2, w.a.waistY + 6, w.c1)}<path d={`M${w.a.cx - 14},${w.a.shoulderY - 2} L${w.a.cx},${w.a.waistY + 6} L${w.a.cx + 14},${w.a.shoulderY - 2}`} fill="#FFF7E6" />
    {[0.25, 0.5, 0.75].map((t, i) => <circle key={i} cx={w.a.cx + (i % 2 ? 22 : -22)} cy={w.a.shoulderY + (w.a.waistY - w.a.shoulderY) * t} r="3" fill={w.c2} />)}
    <path d={`M${w.a.cx - w.a.rx},${w.a.shoulderY + 4} L${w.a.cx + w.a.rx},${w.a.waistY - 6}`} stroke={w.c2} strokeWidth="6" opacity=".9" /></g> }),
  wizard: (w) => ({ inner: <g><path d={`M${w.a.cx - w.a.rx * 0.8},${w.a.shoulderY - 2} L${w.a.cx + w.a.rx * 0.8},${w.a.shoulderY - 2} L${w.a.cx + w.a.rx + 10},${w.a.bot + 6} L${w.a.cx - w.a.rx - 10},${w.a.bot + 6} Z`} fill={w.c1} />
    {[[-24, 0.2], [18, 0.34], [-8, 0.52], [30, 0.62], [-30, 0.72], [4, 0.82]].map(([dx, t], i) => <circle key={i} cx={w.a.cx + dx} cy={w.a.shoulderY + (w.a.bot - w.a.shoulderY) * t} r="3" fill={w.c2} />)}{band(w, w.a.waistY - 6, w.a.waistY + 2, w.c2)}</g> }),
  astro: (w) => ({ back: <rect x={w.a.cx - w.a.rx - 12} y={w.a.shoulderY - 8} width={w.a.rx * 2 + 24} height={w.a.waistY - w.a.shoulderY + 10} rx="12" fill="#B9C2D3" />,
    inner: <g>{band(w, w.a.cy - w.a.ry * 0.12, w.a.bot + 4, w.c1)}<rect x={w.a.cx - 20} y={w.a.shoulderY + 6} width="40" height="26" rx="6" fill="#CAD2E0" stroke="#9AA5B8" /><circle cx={w.a.cx - 10} cy={w.a.shoulderY + 19} r="4" fill={w.c2} /><circle cx={w.a.cx + 4} cy={w.a.shoulderY + 19} r="4" fill="#6BCB77" /><rect x={w.a.cx + 10} y={w.a.shoulderY + 15} width="6" height="8" fill="#3D7BFF" />{band(w, w.a.waistY - 4, w.a.waistY + 4, w.c2)}</g> }),
  hero: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 4, w.a.bot + 4, w.c1)}{band(w, w.a.waistY - 6, w.a.waistY + 4, w.c2)}
    <path d={`M${w.a.cx},${w.a.shoulderY + 6} l5,10 l11,2 l-8,8 l2,11 l-10,-5 l-10,5 l2,-11 l-8,-8 l11,-2 z`} fill={w.c2} stroke="#B58B00" strokeWidth="1" /></g> }),
  knight: (w) => ({ inner: <g>{band(w, w.a.shoulderY - 4, w.a.bot + 4, w.c1)}<path d={`M${w.a.cx},${w.a.shoulderY} V${w.a.bot}`} stroke="#8A94A3" strokeWidth="2" />{band(w, w.a.shoulderY - 4, w.a.shoulderY + 2, w.c2)}{band(w, w.a.waistY - 4, w.a.waistY + 4, w.c2)}
    <ellipse cx={w.a.cx - 14} cy={w.a.shoulderY + 18} rx="9" ry="14" fill="#FFFFFF" opacity=".35" /></g>,
    front: <g fill={w.c1} stroke="#8A94A3" strokeWidth="1.5"><circle cx={w.a.cx - w.a.rx + 2} cy={w.a.shoulderY + 4} r="13" /><circle cx={w.a.cx + w.a.rx - 2} cy={w.a.shoulderY + 4} r="13" /><circle cx={w.a.cx - w.a.rx + 2} cy={w.a.shoulderY + 4} r="5" fill={w.c2} stroke="none" /><circle cx={w.a.cx + w.a.rx - 2} cy={w.a.shoulderY + 4} r="5" fill={w.c2} stroke="none" /></g> }),
};
