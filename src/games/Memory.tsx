import { useMemo, useRef, useState } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { shuffle, useTimeouts } from './hooks';
import type { GameProps } from './types';

const FACES = ['🍌', '🍓', '🍒', '🍍', '🥥', '🍉', '🍇', '🍋', '🥝', '🍑', '🍐', '🫐'];
export function Memory({ cfg, seed, onDone }: GameProps<'memory'>) {
  const { audio } = useApp();
  const later = useTimeouts();
  const cards = useMemo(() => { const r = mulberry32(seed); const faces = shuffle(FACES, r).slice(0, cfg.pairs); return shuffle([...faces, ...faces], r); }, [seed, cfg.pairs]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<boolean[]>(() => cards.map(() => false));
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(!!cfg.peek);
  const busy = useRef(!!cfg.peek);
  const done = useRef(false);
  useMemo(() => { if (cfg.peek) later(() => { setPeek(false); busy.current = false; }, 2200); return 0; }, []);
  const cols = cards.length <= 6 ? 3 : cards.length <= 12 ? 4 : cards.length <= 16 ? 4 : 5;

  const flip = (i: number) => {
    if (busy.current || done.current || matched[i] || open.includes(i)) return;
    audio.sfx('tap');
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    busy.current = true;
    const m = moves + 1; setMoves(m);
    const [a, b] = next;
    const ok = cards[a] === cards[b];
    later(() => {
      let all = false;
      if (ok) { audio.sfx('good'); const nm = matched.slice(); nm[a] = nm[b] = true; setMatched(nm); all = nm.every(Boolean); }
      else audio.sfx('bad');
      setOpen([]); busy.current = false;
      if (all) { done.current = true; audio.sfx('win'); onDone({ success: m <= cfg.maxMoves, metric: m }); }
      else if (m >= cfg.maxMoves) { done.current = true; audio.sfx('lose'); onDone({ success: false, metric: m }); }
    }, ok ? 350 : 800);
  };
  return (
    <>
      <div className="hud"><span className="pill">👣 Ходы {moves}/{cfg.maxMoves}</span><span className="pill">✅ Пары {matched.filter(Boolean).length / 2}/{cfg.pairs}</span>{peek && <span className="small bold">Запоминай!</span>}</div>
      <div className="game-area" style={{ display: 'grid', placeItems: 'center', padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, width: '100%', maxWidth: 420 }}>
          {cards.map((f, i) => {
            const show = peek || matched[i] || open.includes(i);
            return <button key={i} aria-label={show ? f : 'Закрытая карточка'} onClick={() => flip(i)} style={{ aspectRatio: '1', borderRadius: 16, border: 0, fontSize: 34, cursor: 'pointer', background: matched[i] ? '#C8F7C5' : show ? '#fff' : 'linear-gradient(135deg,#FF9EC4,#FFD93D)', boxShadow: 'var(--shadow-s)', transition: 'transform .25s', transform: show ? 'rotateY(0)' : 'rotateY(180deg)' }}><span style={{ display: 'inline-block', transform: show ? 'none' : 'scaleX(-1)' }}>{show ? f : '❔'}</span></button>;
          })}
        </div>
      </div>
    </>
  );
}
