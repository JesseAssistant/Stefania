import { useMemo, useRef, useState } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { shuffle, useTimeouts } from './hooks';
import type { GameProps } from './types';

export function LabPuzzle(p: GameProps<'lab-puzzle'>) {
  switch (p.cfg.variant) {
    case 'lights': return <Lights {...p} />;
    case 'sequence': return <Sequence {...p} />;
    case 'wires': return <Wires {...p} />;
    default: return <Slide {...p} />;
  }
}

/* ---------- Лампочки: нажатие переключает соседние ---------- */
function Lights({ cfg, seed, onDone }: GameProps<'lab-puzzle'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const n = cfg.size;
  const start = useMemo(() => {
    const r = mulberry32(seed); let g = Array(n * n).fill(false) as boolean[];
    const press = (g0: boolean[], i: number) => { const x = i % n, y = Math.floor(i / n); const g1 = g0.slice(); for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a >= 0 && a < n && b >= 0 && b < n) g1[b * n + a] = !g1[b * n + a]; } return g1; };
    let k = Math.max(3, Math.round(n * n * 0.4));
    while (k-- > 0) g = press(g, Math.floor(r() * n * n));
    if (g.every((v) => !v)) g = press(g, 0);
    return g;
  }, [seed, n]);
  const [grid, setGrid] = useState(start); const [moves, setMoves] = useState(0); const done = useRef(false);
  const tap = (i: number) => {
    if (done.current) return;
    const x = i % n, y = Math.floor(i / n); const g = grid.slice();
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a >= 0 && a < n && b >= 0 && b < n) g[b * n + a] = !g[b * n + a]; }
    setGrid(g); const m = moves + 1; setMoves(m); audio.sfx('pop');
    if (g.every((v) => !v)) { done.current = true; audio.sfx('win'); later(() => onDone({ success: m <= cfg.maxMoves, metric: m }), 350); }
    else if (m >= cfg.maxMoves) { done.current = true; audio.sfx('lose'); later(() => onDone({ success: false, metric: m }), 350); }
  };
  return (
    <>
      <div className="hud"><span className="pill">👣 Ходы {moves}/{cfg.maxMoves}</span><span className="small muted">Погаси все лампочки. Нажатие меняет и соседние.</span></div>
      <div className="game-area" style={{ display: 'grid', placeItems: 'center', padding: 14, background: '#2B2D52' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8, width: '100%', maxWidth: 380 }}>
          {grid.map((on, i) => <button key={i} aria-label={`Лампочка ${i + 1}: ${on ? 'горит' : 'погасла'}`} onClick={() => tap(i)} style={{ aspectRatio: '1', borderRadius: 18, border: 0, cursor: 'pointer', background: on ? 'radial-gradient(circle,#FFF59D,#FFC400)' : '#4A4E80', boxShadow: on ? '0 0 22px #FFD93D' : 'inset 0 3px 0 rgba(0,0,0,.25)', fontSize: 26 }}>{on ? '💡' : ''}</button>)}
        </div>
      </div>
    </>
  );
}

/* ---------- Последовательность вспышек (maxMoves = допустимо ошибок) ---------- */
const PADS = [{ c: '#FF5E8A', n: 'Розовая' }, { c: '#FFD93D', n: 'Жёлтая' }, { c: '#5EDDD0', n: 'Бирюзовая' }, { c: '#6FA8FF', n: 'Синяя' }];
function Sequence({ cfg, seed, onDone }: GameProps<'lab-puzzle'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const seq = useMemo(() => { const r = mulberry32(seed); return Array.from({ length: cfg.size }, () => Math.floor(r() * 4)); }, [seed, cfg.size]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<'ready' | 'show' | 'input'>('ready');
  const [pos, setPos] = useState(0); const [mistakes, setMistakes] = useState(0); const done = useRef(false);
  const play = () => {
    setPhase('show'); setPos(0);
    seq.forEach((v, i) => { later(() => { setLit(v); audio.sfx('pop'); }, 500 + i * 750); later(() => setLit(null), 500 + i * 750 + 450); });
    later(() => setPhase('input'), 500 + seq.length * 750);
  };
  const tap = (i: number) => {
    if (phase !== 'input' || done.current) return;
    setLit(i); later(() => setLit(null), 200);
    if (i === seq[pos]) {
      audio.sfx('pop');
      if (pos + 1 >= seq.length) { done.current = true; audio.sfx('win'); later(() => onDone({ success: true, metric: mistakes }), 400); } else setPos(pos + 1);
    } else {
      audio.sfx('bad'); const m = mistakes + 1; setMistakes(m);
      if (m > cfg.maxMoves) { done.current = true; audio.sfx('lose'); later(() => onDone({ success: false, metric: m }), 400); } else later(play, 700);
    }
  };
  return (
    <>
      <div className="hud"><span className="pill">🔢 {phase === 'input' ? pos : 0}/{seq.length}</span><span className="pill">❌ {mistakes}/{cfg.maxMoves}</span><span className="small bold">{phase === 'show' ? 'Смотри…' : phase === 'input' ? 'Повторяй!' : ''}</span></div>
      <div className="game-area" style={{ display: 'grid', placeItems: 'center', padding: 14, background: '#2B2D52' }}>
        {phase === 'ready' ? <button className="btn xl" onClick={play}>▶ Показать вспышки</button> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 340 }}>
            {PADS.map((pd, i) => <button key={i} aria-label={pd.n} onClick={() => tap(i)} style={{ aspectRatio: '1', borderRadius: 26, border: 0, background: pd.c, opacity: lit === i ? 1 : .45, transform: lit === i ? 'scale(1.06)' : 'none', boxShadow: lit === i ? `0 0 30px ${pd.c}` : 'none', transition: 'all .12s' }} />)}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Провода: поменяй концы так, чтобы цвета совпали ---------- */
const WIRE_COLORS = ['#FF5E8A', '#FFD93D', '#5EDDD0', '#6FA8FF', '#7ED957', '#B28DFF', '#FF9F1C'];
function Wires({ cfg, seed, onDone }: GameProps<'lab-puzzle'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const n = cfg.size;
  const start = useMemo(() => { const r = mulberry32(seed); let p = shuffle(Array.from({ length: n }, (_, i) => i), r); while (p.every((v, i) => v === i)) p = shuffle(p, r); return p; }, [seed, n]);
  const [right, setRight] = useState(start); // right[pos] = индекс цвета
  const [sel, setSel] = useState<number | null>(null); const [moves, setMoves] = useState(0); const done = useRef(false);
  const tap = (pos: number) => {
    if (done.current) return;
    if (sel === null) { setSel(pos); audio.sfx('tap'); return; }
    if (sel === pos) { setSel(null); return; }
    const r = right.slice(); [r[sel], r[pos]] = [r[pos], r[sel]]; setRight(r); setSel(null);
    const m = moves + 1; setMoves(m); audio.sfx('pop');
    if (r.every((v, i) => v === i)) { done.current = true; audio.sfx('win'); later(() => onDone({ success: m <= cfg.maxMoves, metric: m }), 400); }
    else if (m >= cfg.maxMoves) { done.current = true; audio.sfx('lose'); later(() => onDone({ success: false, metric: m }), 400); }
  };
  const H = 70 * n;
  const y = (i: number) => 35 + i * 70;
  return (
    <>
      <div className="hud"><span className="pill">👣 Обмены {moves}/{cfg.maxMoves}</span><span className="small muted">Выбери два правых конца — они поменяются местами.</span></div>
      <div className="game-area" style={{ display: 'grid', placeItems: 'center', padding: 14, background: '#2B2D52' }}>
        <svg viewBox={`0 0 300 ${H}`} style={{ width: '100%', maxWidth: 360, maxHeight: '100%' }}>
          {right.map((ci, pos) => <line key={pos} x1="50" y1={y(ci)} x2="250" y2={y(pos)} stroke={WIRE_COLORS[ci]} strokeWidth="8" strokeLinecap="round" />)}
          {Array.from({ length: n }, (_, i) => <circle key={`l${i}`} cx="40" cy={y(i)} r="22" fill={WIRE_COLORS[i]} stroke="#fff" strokeWidth="4" />)}
          {right.map((ci, pos) => <g key={`r${pos}`} onClick={() => tap(pos)} style={{ cursor: 'pointer' }} role="button" aria-label={`Правый конец ${pos + 1}`}><circle cx="260" cy={y(pos)} r="25" fill={WIRE_COLORS[ci]} stroke={sel === pos ? '#fff' : '#2B2D52'} strokeWidth={sel === pos ? 7 : 4} />{right[pos] === pos && <text x="260" y={y(pos) + 7} textAnchor="middle" fontSize="20">✓</text>}</g>)}
        </svg>
      </div>
    </>
  );
}

/* ---------- Пятнашки 3×3 ---------- */
function Slide({ cfg, seed, onDone }: GameProps<'lab-puzzle'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const n = Math.max(3, cfg.size);
  const start = useMemo(() => {
    const r = mulberry32(seed); const t = Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n)); let e = n * n - 1; let prev = -1;
    for (let k = 0; k < 60; k++) { const x = e % n, y = Math.floor(e / n); const opts: number[] = []; if (x > 0) opts.push(e - 1); if (x < n - 1) opts.push(e + 1); if (y > 0) opts.push(e - n); if (y < n - 1) opts.push(e + n); const c = opts.filter((o) => o !== prev); const m = c[Math.floor(r() * c.length)]; [t[e], t[m]] = [t[m], t[e]]; prev = e; e = m; }
    return t;
  }, [seed, n]);
  const [t, setT] = useState(start); const [moves, setMoves] = useState(0); const done = useRef(false);
  const solved = (a: number[]) => a.every((v, i) => v === (i + 1) % (n * n));
  const tap = (i: number) => {
    if (done.current) return;
    const e = t.indexOf(0), x = i % n, y = Math.floor(i / n), ex = e % n, ey = Math.floor(e / n);
    if (Math.abs(x - ex) + Math.abs(y - ey) !== 1) { audio.sfx('error'); return; }
    const a = t.slice(); [a[i], a[e]] = [a[e], a[i]]; setT(a); const m = moves + 1; setMoves(m); audio.sfx('pop');
    if (solved(a)) { done.current = true; audio.sfx('win'); later(() => onDone({ success: m <= cfg.maxMoves, metric: m }), 400); }
    else if (m >= cfg.maxMoves) { done.current = true; audio.sfx('lose'); later(() => onDone({ success: false, metric: m }), 400); }
  };
  return (
    <>
      <div className="hud"><span className="pill">👣 Ходы {moves}/{cfg.maxMoves}</span><span className="small muted">Расставь числа по порядку.</span></div>
      <div className="game-area" style={{ display: 'grid', placeItems: 'center', padding: 14, background: '#2B2D52' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8, width: '100%', maxWidth: 340 }}>
          {t.map((v, i) => <button key={i} onClick={() => tap(i)} aria-label={v ? `Плитка ${v}` : 'Пусто'} style={{ aspectRatio: '1', borderRadius: 16, border: 0, fontSize: 30, fontWeight: 900, background: v ? 'linear-gradient(135deg,#FFE066,#FF9EC4)' : 'transparent', visibility: v ? 'visible' : 'hidden' }}>{v}</button>)}
        </div>
      </div>
    </>
  );
}
