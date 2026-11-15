/** Регистрация Service Worker и поток обновлений: новая версия не применяется молча — игрок решает сам. */
type Listener = (waiting: boolean) => void;
let registration: ServiceWorkerRegistration | null = null;
let waiting = false;
const subs = new Set<Listener>();
const emit = () => subs.forEach((f) => f(waiting));
export const onUpdateAvailable = (f: Listener) => { subs.add(f); f(waiting); return () => { subs.delete(f); }; };

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
      registration = reg;
      const check = (w: ServiceWorker | null) => { if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { waiting = true; emit(); } }); };
      if (reg.waiting && navigator.serviceWorker.controller) { waiting = true; emit(); }
      reg.addEventListener('updatefound', () => check(reg.installing));
      // проверяем обновления при возвращении в игру
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => { /* офлайн-режим недоступен, игра всё равно работает */ });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  });
}
/** Применить обновление: прогресс уже сохранён в IndexedDB и не затрагивается. */
export function applyUpdate() { registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }); }
