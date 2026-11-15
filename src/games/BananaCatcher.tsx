import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { useLoop } from './hooks';
import type { GameProps, PE } from './types';

interface Item { id: number; x: number; y: number; bad: boolean; phase: number; rot: number }
const BASKET_W = 96;

export function BananaCatcher({ cfg, seed, onDone }: GameProps<'banana-catcher'>) {
  const { audio } = useApp();
  const area = useRef<HTMLDivElement>(null);
  const rnd = useRef(mulberry32(seed));
  const st = useRef({ items: [] as Item[], next: 0, spawn: 0.6, time: cfg.duration, score: 0, caught: 0, bx: 0.5, done: false, id: 1, flash: 0, t: 0 });
  const [, force] = useState(0);
  const [started, setStarted] = useState(false);
  const keys = useRef({ l: false, r: false });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') keys.current.l = true; if (e.key === 'ArrowRight') keys.current.r = true; };
    const ku = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') keys.current.l = false; if (e.key === 'ArrowRight') keys.current.r = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useLoop((dt) => {
    const s = st.current; if (s.done) return;
    const el = area.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    if (!W || !H) return;
    s.t += dt; s.time -= dt; s.flash = Math.max(0, s.flash - dt);
    if (keys.current.l) s.bx = Math.max(0.08, s.bx - dt * 1.1);
    if (keys.current.r) s.bx = Math.min(0.92, s.bx + dt * 1.1);
    s.spawn -= dt;
    if (s.spawn <= 0 && s.time > 1.2) {
      s.spawn = (0.85 / cfg.speed) * (0.8 + rnd.current() * 0.5);
      s.items.push({ id: s.id++, x: 0.08 + rnd.current() * 0.84, y: -40, bad: rnd.current() < cfg.bad, phase: rnd.current() * 6.28, rot: (rnd.current() - 0.5) * 40 });
    }
    const fall = (H / 3.6) * cfg.speed;
    const basketY = H - 70, bx = s.bx * W;
    const keep: Item[] = [];
    for (const it of s.items) {
      it.y += fall * dt;
      const x = (cfg.moving ? it.x * W + Math.sin(s.t * 2 + it.phase) * 36 : it.x * W);
      if (it.y > basketY - 10 && it.y < basketY + 38 && Math.abs(x - bx) < BASKET_W / 2 + 6) {
        if (it.bad) { s.score = Math.max(0, s.score - 2); s.flash = 0.35; audio.sfx('bad'); } else { s.score += 1; s.caught++; audio.sfx('pop'); }
        continue;
      }
      if (it.y < H + 40) keep.push(it);
    }
    s.items = keep;
    if (s.time <= 0) { s.done = true; audio.sfx(s.score >= cfg.target ? 'win' : 'lose'); onDone({ success: s.score >= cfg.target, metric: s.score }); }
    force((n) => (n + 1) % 1e6);
  }, started);

  const move = (e: PE) => { const r = e.currentTarget.getBoundingClientRect(); st.current.bx = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)); };
  const s = st.current;
  const W = area.current ? area.current.clientWidth : 360;
  return (
    <>
      <div className="hud">
        <span className="pill">⏱️ {Math.max(0, Math.ceil(s.time))}</span>
        <span className="pill" style={{ background: s.score >= cfg.target ? '#C8F7C5' : undefined }}>🍌 {s.score}/{cfg.target}</span>
        {cfg.bad > 0 && <span className="small muted">Гнилые минусуют 2 очка</span>}
      </div>
      <div className="game-area" ref={area} onPointerDown={(e: PE) => { setStarted(true); move(e); }} onPointerMove={(e: PE) => { if (started) move(e); }} style={{ background: 'linear-gradient(180deg,#BFE9FF,#FFF6CC 70%,#8ED081 70%)' }} role="application" aria-label="Ловец бананов: двигай корзину пальцем или стрелками">
        {!started && <div className="center" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, padding: 20, pointerEvents: 'none' }}>Коснись экрана и води пальцем, чтобы ловить бананы!</div>}
        {s.items.map((it) => {
          const x = cfg.moving ? it.x * W + Math.sin(s.t * 2 + it.phase) * 36 : it.x * W;
          return <div key={it.id} style={{ position: 'absolute', left: x - 22, top: it.y, width: 44, height: 44, fontSize: 38, transform: `rotate(${it.rot}deg)`, filter: it.bad ? 'sepia(1) saturate(2) hue-rotate(60deg) brightness(.55)' : undefined, pointerEvents: 'none' }}>🍌{it.bad && <span style={{ position: 'absolute', right: -4, top: -4, fontSize: 18, filter: 'none' }}>☠️</span>}</div>;
        })}
        <div style={{ position: 'absolute', left: s.bx * W - BASKET_W / 2, bottom: 18, width: BASKET_W, height: 62, fontSize: 64, textAlign: 'center', lineHeight: '62px', transition: 'filter .1s', filter: s.flash > 0 ? 'hue-rotate(300deg) brightness(.8)' : undefined, pointerEvents: 'none' }}>🧺</div>
      </div>
    </>
  );
}
