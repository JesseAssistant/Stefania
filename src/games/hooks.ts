import { useEffect, useRef } from 'react';

/** Игровой цикл на requestAnimationFrame. dt в секундах, ограничен 50 мс; на скрытой вкладке пауза. */
export function useLoop(cb: (dt: number) => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0; let last = 0; let stopped = false;
    const tick = (t: number) => {
      if (stopped) return;
      if (last && !document.hidden) ref.current(Math.min(0.05, (t - last) / 1000));
      last = document.hidden ? 0 : t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [active]);
}

/** Таймеры, которые гарантированно очищаются при закрытии экрана. */
export function useTimeouts() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => { ids.current.forEach((i) => clearTimeout(i)); ids.current = []; }, []);
  return (fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); ids.current.push(id); return id; };
}

export function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
