import { useRef, useState } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { useTimeouts } from './hooks';
import type { GameProps } from './types';

type Phase = 'ready' | 'wait' | 'target' | 'decoy' | 'result';
/** Сигнал 🍌 — жми. Медуза 🪼 — не жми. Раунд засчитывается, когда появился банан. */
export function Reaction({ cfg, seed, onDone }: GameProps<'reaction'>) {
  const { audio } = useApp(); const later = useTimeouts();
  const rnd = useRef(mulberry32(seed));
  const S = useRef({ round: 0, times: [] as number[], bad: 0, shownAt: 0, timer: 0, done: false });
  const [phase, setPhase] = useState<Phase>('ready');
  const [view, setView] = useState({ round: 0, bad: 0, avg: 0 });
  const [msg, setMsg] = useState('');
  const allowed = Math.max(1, Math.floor(cfg.rounds / 3));
  const sync = () => { const s = S.current; setView({ round: s.round, bad: s.bad, avg: s.times.length ? Math.round(s.times.reduce((a, x) => a + x, 0) / s.times.length) : 0 }); };

  const finish = () => {
    const s = S.current; if (s.done) return; s.done = true;
    const avg = s.times.length ? Math.round(s.times.reduce((a, x) => a + x, 0) / s.times.length) : cfg.window;
    const ok = s.bad <= allowed && s.round >= cfg.rounds; audio.sfx(ok ? 'win' : 'lose');
    onDone({ success: ok, metric: avg, note: `Ошибок: ${s.bad}` });
  };
  const startRound = () => {
    const s = S.current;
    if (s.done) return;
    if (s.bad > allowed || s.round >= cfg.rounds) { finish(); return; }
    setPhase('wait'); setMsg('');
    const decoy = cfg.decoys && rnd.current() < 0.35;
    s.timer = window.setTimeout(() => {
      s.shownAt = performance.now(); setPhase(decoy ? 'decoy' : 'target');
      s.timer = window.setTimeout(() => {
        if (decoy) { startRound(); return; }
        audio.sfx('bad'); s.bad++; s.round++; s.times.push(cfg.window); sync(); setMsg('Слишком медленно!'); setPhase('result'); later(startRound, 650);
      }, decoy ? 900 : cfg.window);
    }, 700 + rnd.current() * 1300);
  };
  const press = () => {
    const s = S.current; if (s.done) return;
    if (phase === 'ready') { startRound(); return; }
    if (phase === 'result') return;
    clearTimeout(s.timer);
    if (phase === 'wait') { audio.sfx('bad'); s.bad++; sync(); setMsg('Рано! Жди сигнал.'); setPhase('result'); later(startRound, 650); return; }
    if (phase === 'target') { const ms = Math.round(performance.now() - s.shownAt); audio.sfx('good'); s.round++; s.times.push(ms); sync(); setMsg(`${ms} мс`); setPhase('result'); later(startRound, 600); return; }
    audio.sfx('bad'); s.bad++; sync(); setMsg('Это медуза! Её нельзя трогать.'); setPhase('result'); later(startRound, 700);
  };
  const bg = phase === 'target' ? '#7ED957' : phase === 'decoy' ? '#FF9EC4' : phase === 'wait' ? '#FFE066' : '#EAF4FF';
  return (
    <>
      <div className="hud"><span className="pill">🎯 {view.round}/{cfg.rounds}</span><span className="pill">❌ {view.bad}/{allowed}</span>{view.avg > 0 && <span className="pill">⚡ ≈{view.avg} мс</span>}</div>
      <div className="game-area" style={{ padding: 14, display: 'grid' }}>
        <button onPointerDown={press} aria-label="Игровое поле реакции" style={{ borderRadius: 28, border: 0, background: bg, transition: 'background .08s', fontSize: 20, fontWeight: 900, display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)' }}>
          <span style={{ pointerEvents: 'none', textAlign: 'center', padding: 20 }}>
            {phase === 'ready' && <><span style={{ fontSize: 60 }}>▶️</span><br />Жми на поле, чтобы начать.<br />Как только появится 🍌 — жми сразу!{cfg.decoys && <><br /><span className="small">А медуз 🪼 не трогай.</span></>}</>}
            {phase === 'wait' && <><span style={{ fontSize: 60 }}>👀</span><br />Жди сигнал…</>}
            {phase === 'target' && <><span style={{ fontSize: 96 }}>🍌</span><br />ЖМИ!</>}
            {phase === 'decoy' && <><span style={{ fontSize: 96 }}>🪼</span><br />Не трогай!</>}
            {phase === 'result' && <span style={{ fontSize: 28 }}>{msg}</span>}
          </span>
        </button>
      </div>
    </>
  );
}
