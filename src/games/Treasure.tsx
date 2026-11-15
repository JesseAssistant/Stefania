import { useMemo, useRef, useState } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { shuffle, useLoop, useTimeouts } from './hooks';
import type { GameProps, PE } from './types';

const SCENES: Record<string, { sky: string; ground: string; props: string[]; hide: string[]; name: string }> = {
  home: { name: 'Дом', sky: '#FFF1D6', ground: '#E8C27A', props: ['🪴', '🛋️', '🖼️', '🕯️', '📚', '🧸', '🪑', '🧺'], hide: ['🔑', '🧦', '⭐', '🍪', '🔔', '🎀', '🧩', '🪙'], },
  beach: { name: 'Пляж', sky: '#BFE9FF', ground: '#F2D388', props: ['🌴', '🐚', '🦀', '⛱️', '🌊', '🪸', '🐠', '🏖️'], hide: ['🗝️', '💎', '🧭', '📜', '🪙', '⭐', '🍹', '🎣'], },
  lab: { name: 'Лаборатория', sky: '#C9CCFF', ground: '#8F95E0', props: ['🧪', '🔬', '⚗️', '🧫', '💻', '🔭', '🧲', '🔋'], hide: ['⚙️', '🔩', '💡', '🔧', '🪛', '📡', '🧿', '🔌'], },
  city: { name: 'Город', sky: '#FFD0E8', ground: '#9A8CE8', props: ['🏢', '🚕', '🎪', '🚦', '🌆', '🎠', '🏪', '🚌'], hide: ['🎟️', '🎈', '🍿', '🎭', '🎫', '🎁', '🍭', '🎺'], },
  mystery: { name: 'Тайный мир', sky: '#4A3F9E', ground: '#2B2D6E', props: ['🌙', '🔮', '🕸️', '🦉', '🪄', '🌌', '🗿', '🕯️'], hide: ['📿', '🗝️', '🔱', '⚱️', '🧿', '💫', '🪬', '📖'], },
};
interface Spot { id: number; e: string; x: number; y: number }
export function Treasure({ cfg, seed, onDone }: GameProps<'treasure-hunt'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const sc = SCENES[cfg.scene] || SCENES.home;
  const { targets, decor } = useMemo(() => {
    const r = mulberry32(seed);
    const names = shuffle(sc.hide, r).slice(0, cfg.hidden);
    const spot = (id: number, e: string): Spot => ({ id, e, x: 0.07 + r() * 0.86, y: 0.07 + r() * 0.84 });
    const decor: Spot[] = Array.from({ length: 22 }, (_, i) => spot(100 + i, sc.props[i % sc.props.length]));
    return { targets: names.map((e, i) => spot(i, e)), decor };
  }, [seed, cfg.hidden, sc]);
  const [found, setFound] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(cfg.time);
  const [hint, setHint] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const done = useRef(false); const t = useRef(cfg.time);

  useLoop((dt) => {
    if (done.current) return;
    t.current -= dt; const s = Math.ceil(t.current);
    if (s !== time) setTime(Math.max(0, s));
    if (t.current <= 0) { done.current = true; audio.sfx('lose'); onDone({ success: false, metric: 0 }); }
  }, started);

  const finish = (ok: boolean, m: number) => { done.current = true; audio.sfx(ok ? 'win' : 'lose'); later(() => onDone({ success: ok, metric: ok ? Math.max(0, Math.floor(t.current)) : 0 }), 350); void m; };
  const tapTarget = (id: number) => {
    if (done.current || found.includes(id)) return;
    audio.sfx('star'); const f = [...found, id]; setFound(f); if (hint === id) setHint(null);
    if (f.length >= targets.length) finish(true, mistakes);
  };
  const miss = (e: PE) => {
    if (!started) { setStarted(true); return; }
    if (done.current) return;
    void e; audio.sfx('bad'); const m = mistakes + 1; setMistakes(m); t.current -= 2;
    if (m > cfg.maxMistakes) finish(false, m);
  };
  const useHint = () => { if (done.current) return; const left = targets.filter((x) => !found.includes(x.id)); if (!left.length) return; setHint(left[0].id); t.current -= 5; audio.sfx('whoosh'); };

  return (
    <>
      <div className="hud wrap" style={{ flexWrap: 'wrap' }}>
        <span className="pill">⏱️ {time}</span><span className="pill">❌ {mistakes}/{cfg.maxMistakes}</span>
        <button className="btn small ghost" onClick={useHint} style={{ marginLeft: 'auto' }} aria-label="Подсказка (−5 секунд)">💡 −5 с</button>
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 6, padding: '0 14px 6px' }}>{targets.map((x) => <span key={x.id} className="pill" style={{ fontSize: 22, opacity: found.includes(x.id) ? .35 : 1, textDecoration: found.includes(x.id) ? 'line-through' : 'none' }}>{x.e}</span>)}</div>
      <div className="game-area" onPointerDown={miss} style={{ background: `linear-gradient(180deg, ${sc.sky} 60%, ${sc.ground} 60%)` }} role="application" aria-label={`Поиск предметов: ${sc.name}`}>
        {!started && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 5, background: 'rgba(255,255,255,.55)', fontWeight: 800, fontSize: 20, textAlign: 'center', padding: 24 }}>Найди все предметы из списка сверху.<br />Коснись, чтобы начать!</div>}
        {decor.map((d) => <span key={d.id} style={{ position: 'absolute', left: `${d.x * 100}%`, top: `${d.y * 100}%`, fontSize: 30, opacity: .75, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}>{d.e}</span>)}
        {targets.map((x) => <button key={x.id} aria-label={`Найденный предмет ${x.e}`} onPointerDown={(e: { stopPropagation(): void }) => { e.stopPropagation(); if (started) tapTarget(x.id); else setStarted(true); }} style={{ position: 'absolute', left: `${x.x * 100}%`, top: `${x.y * 100}%`, transform: 'translate(-50%,-50%)', width: 44, height: 44, fontSize: found.includes(x.id) ? 34 : 24, background: 'transparent', border: found.includes(x.id) ? '3px solid #7ED957' : hint === x.id ? '4px dashed #FF5E8A' : 'none', borderRadius: 99, opacity: found.includes(x.id) ? 1 : .9, padding: 0, animation: hint === x.id ? 'pulse 1s infinite' : undefined }}>{x.e}</button>)}
      </div>
    </>
  );
}
