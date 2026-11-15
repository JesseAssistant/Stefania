import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { useLoop, useTimeouts } from './hooks';
import type { GameProps } from './types';

interface Bin { id: string; label: string; color: string }
interface Thing { bin: string; render: () => ReactNode; name: string }
const BANANA = (filter: string, size = 56, name = 'Банан') => ({ name, render: () => <span style={{ fontSize: size, filter, display: 'inline-block' }}>🍌</span> });
const SETS: Record<string, { bins: Bin[]; make: (bin: string, rnd: () => number) => Thing }> = {
  ripeness: {
    bins: [{ id: 'green', label: 'Зелёные', color: '#B8E986' }, { id: 'ripe', label: 'Спелые', color: '#FFE066' }, { id: 'over', label: 'Перезрелые', color: '#C9A27A' }],
    make: (b) => ({ bin: b, ...(b === 'green' ? BANANA('hue-rotate(60deg) saturate(1.4)', 56, 'Зелёный банан') : b === 'ripe' ? BANANA('none', 56, 'Спелый банан') : BANANA('sepia(1) brightness(.55) saturate(1.5)', 56, 'Перезрелый банан')) }),
  },
  size: {
    bins: [{ id: 's', label: 'Маленькие', color: '#BFE9FF' }, { id: 'm', label: 'Средние', color: '#FFE066' }, { id: 'l', label: 'Большие', color: '#FFB3C8' }],
    make: (b) => ({ bin: b, ...BANANA('none', b === 's' ? 30 : b === 'm' ? 54 : 84, b === 's' ? 'Маленький банан' : b === 'm' ? 'Средний банан' : 'Большой банан') }),
  },
  category: {
    bins: [{ id: 'food', label: 'Еда', color: '#FFD0A8' }, { id: 'tool', label: 'Инструменты', color: '#C9CCFF' }, { id: 'wear', label: 'Одежда', color: '#FFB3C8' }],
    make: (b, r) => { const L: Record<string, string[]> = { food: ['🍎', '🥕', '🍞', '🧀', '🍓'], tool: ['🔧', '🔨', '⚙️', '🪛', '🔩'], wear: ['👕', '🧦', '🧢', '🧣', '👗'] }; const e = L[b][Math.floor(r() * L[b].length)]; return { bin: b, name: e, render: () => <span style={{ fontSize: 56 }}>{e}</span> }; },
  },
  color: {
    bins: [{ id: 'red', label: 'Красные', color: '#FF6B6B' }, { id: 'blue', label: 'Синие', color: '#6FA8FF' }, { id: 'yellow', label: 'Жёлтые', color: '#FFD93D' }, { id: 'green', label: 'Зелёные', color: '#7ED957' }],
    make: (b) => { const names: Record<string, string> = { red: 'красный', blue: 'синий', yellow: 'жёлтый', green: 'зелёный' }; const col: Record<string, string> = { red: '#FF6B6B', blue: '#6FA8FF', yellow: '#FFD93D', green: '#7ED957' }; return { bin: b, name: `Подарок ${names[b]}`, render: () => <span style={{ display: 'inline-block', width: 60, height: 60, borderRadius: 12, background: col[b], position: 'relative', boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.15)' }}><span style={{ position: 'absolute', left: 26, top: 0, width: 8, height: 60, background: 'rgba(255,255,255,.8)' }} /><span style={{ position: 'absolute', top: -12, left: 14, fontSize: 30 }}>🎀</span></span> }; },
  },
};

export function Sorting({ cfg, seed, onDone }: GameProps<'sorting'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const set = SETS[cfg.rule];
  const queue = useMemo(() => { const r = mulberry32(seed); return Array.from({ length: cfg.items }, (_, i) => set.make(set.bins[(i + Math.floor(r() * 3)) % set.bins.length].id, r)); }, [seed, cfg.items, set]);
  const [i, setI] = useState(0); const [mistakes, setMistakes] = useState(0); const [time, setTime] = useState(cfg.time);
  const [flash, setFlash] = useState<string | null>(null); const [started, setStarted] = useState(false);
  const done = useRef(false); const t = useRef(cfg.time);
  const end = (ok: boolean, m: number) => { done.current = true; audio.sfx(ok ? 'win' : 'lose'); later(() => onDone({ success: ok, metric: m }), 300); };
  useLoop((dt) => { if (done.current) return; t.current -= dt; const s = Math.ceil(t.current); if (s !== time) setTime(Math.max(0, s)); if (t.current <= 0) end(false, mistakes); }, started);
  const choose = (bin: string) => {
    if (done.current) return; if (!started) setStarted(true);
    const cur = queue[i];
    if (cur.bin === bin) { audio.sfx('pop'); if (i + 1 >= queue.length) { setI(i + 1); end(true, mistakes); } else setI(i + 1); }
    else { audio.sfx('bad'); const m = mistakes + 1; setMistakes(m); setFlash(bin); later(() => setFlash(null), 300); if (m > cfg.maxMistakes) end(false, m); }
  };
  const cur = queue[i];
  return (
    <>
      <div className="hud"><span className="pill">⏱️ {time}</span><span className="pill">📦 {Math.min(i, queue.length)}/{queue.length}</span><span className="pill">❌ {mistakes}/{cfg.maxMistakes}</span></div>
      <div className="game-area" style={{ display: 'flex', flexDirection: 'column', padding: 14, gap: 14 }}>
        <div className="card center" style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 140 }} aria-live="polite">
          {cur ? <div className="pop-in" key={i} role="img" aria-label={cur.name}>{cur.render()}</div> : <div className="bold">Готово!</div>}
          {!started && <div className="small muted">Коснись корзинки — и время пойдёт</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${set.bins.length > 3 ? 2 : set.bins.length}, 1fr)`, gap: 10 }}>
          {set.bins.map((b) => <button key={b.id} onClick={() => choose(b.id)} className={flash === b.id ? 'shake' : ''} style={{ minHeight: 78, borderRadius: 20, border: 0, background: b.color, fontWeight: 900, fontSize: 16, boxShadow: 'var(--shadow-s)', outline: flash === b.id ? '4px solid #E53935' : 'none' }}>🧺<br />{b.label}</button>)}
        </div>
      </div>
    </>
  );
}
