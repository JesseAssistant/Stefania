import { useMemo, useState } from 'react';
import { useApp } from '../app/ctx';
import { mulberry32 } from '../game/rng';
import { INGREDIENTS, RECIPE_MAP } from '../game/data/decor';
import { shuffle, useTimeouts } from './hooks';
import type { GameProps } from './types';

export function IngredientIcon({ id, size = 46 }: { id: string; size?: number }) {
  const ing = INGREDIENTS[id]; const c = ing.color;
  const stroke = 'rgba(43,45,66,.35)';
  let shape;
  switch (ing.shape) {
    case 'banana': shape = <path d="M10 34 C14 14 34 8 42 12 C40 16 30 18 24 26 C20 32 18 38 10 34Z" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'cube': shape = <rect x="12" y="12" width="26" height="26" rx="5" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'drop': shape = <path d="M25 8 C34 20 38 26 38 31 A13 13 0 0 1 12 31 C12 26 16 20 25 8Z" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'bag': shape = <path d="M14 14 H36 L40 40 H10Z" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'egg': shape = <ellipse cx="25" cy="27" rx="12" ry="15" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'swirl': shape = <g fill={c} stroke={stroke} strokeWidth="2"><ellipse cx="25" cy="36" rx="14" ry="6" /><ellipse cx="25" cy="27" rx="10" ry="5" /><ellipse cx="25" cy="19" rx="6" ry="4" /></g>; break;
    case 'berry': shape = <g><circle cx="25" cy="28" r="13" fill={c} stroke={stroke} strokeWidth="2" /><path d="M25 15 l-5 -6 M25 15 l6 -6" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" /></g>; break;
    case 'sparkle': shape = <path d="M25 6 L29 21 L44 25 L29 29 L25 44 L21 29 L6 25 L21 21Z" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'nut': shape = <path d="M25 8 C38 10 42 28 34 38 C28 44 18 44 14 36 C8 26 14 10 25 8Z" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'bar': shape = <rect x="8" y="17" width="34" height="18" rx="4" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'cheese': case 'wedge': shape = <path d="M8 36 L42 36 L36 14Z" fill={c} stroke={stroke} strokeWidth="2" />; break;
    case 'bottle': case 'carton': shape = <path d="M15 8 H35 V40 H15Z M15 8 L25 3 L35 8" fill={c} stroke={stroke} strokeWidth="2" />; break;
    default: shape = <circle cx="25" cy="25" r="14" fill={c} stroke={stroke} strokeWidth="2" />;
  }
  return <svg viewBox="0 0 50 50" width={size} height={size} aria-hidden="true">{shape}</svg>;
}

export function Kitchen({ cfg, seed, onDone }: GameProps<'kitchen'>) {
  const { audio } = useApp();
  const later = useTimeouts();
  const recipe = RECIPE_MAP[cfg.recipeId];
  const [order, setOrder] = useState(0);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const maxMistakes = 5;
  const shelf = useMemo(() => shuffle([...recipe.steps, ...recipe.extras], mulberry32(seed + order * 977)), [seed, order, recipe]);

  const tap = (id: string) => {
    if (finished) return;
    if (id === recipe.steps[step]) {
      audio.sfx('pop');
      if (step + 1 >= recipe.steps.length) {
        audio.sfx('good');
        if (order + 1 >= cfg.orders) { setFinished(true); audio.sfx('win'); later(() => onDone({ success: true, metric: mistakes }), 400); }
        else { setOrder(order + 1); setStep(0); }
      } else setStep(step + 1);
    } else {
      audio.sfx('bad'); setShake(id); later(() => setShake(null), 350);
      const m = mistakes + 1; setMistakes(m);
      if (m > maxMistakes) { setFinished(true); audio.sfx('lose'); later(() => onDone({ success: false, metric: m }), 500); }
    }
  };
  return (
    <>
      <div className="hud"><span className="pill">🧾 Заказ {order + 1}/{cfg.orders}</span><span className="pill">❌ {mistakes}/{maxMistakes}</span></div>
      <div className="game-area" style={{ padding: 14, background: 'linear-gradient(180deg,#FFF3DC,#FFE2B8)' }}>
        <div className="card stack" style={{ marginBottom: 14 }}>
          <div className="bold center">{recipe.name}</div>
          <div className="row wrap" style={{ justifyContent: 'center', gap: 6 }}>
            {recipe.steps.map((s, i) => <div key={i} className="center" style={{ width: 62, opacity: i < step ? .35 : 1, outline: i === step ? '3px solid var(--banana)' : 'none', borderRadius: 14, padding: 4, background: '#fff' }}><IngredientIcon id={s} size={38} /><div className="tiny">{i + 1}. {INGREDIENTS[s].name}</div></div>)}
          </div>
          <div className="small muted center">Клади продукты по порядку — выбирай с полки внизу</div>
        </div>
        <div className="grid g3">
          {shelf.map((id) => <button key={id} className="tile" aria-label={INGREDIENTS[id].name} onClick={() => tap(id)} style={{ animation: shake === id ? 'shake .3s' : undefined, background: shake === id ? '#FFD5D5' : '#fff' }}><IngredientIcon id={id} /><div className="nm">{INGREDIENTS[id].name}</div></button>)}
        </div>
      </div>
    </>
  );
}
