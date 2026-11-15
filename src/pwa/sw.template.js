/* Service Worker Stefania's Nanabo World.
 * Предзагружает все файлы игры при первой установке → полная работа без интернета.
 * Игровые данные (прогресс) лежат в IndexedDB и этим файлом не затрагиваются никогда.
 * Обновление: новая версия устанавливается «в тени» и применяется только когда игрок нажмёт «Обновить». */
const BUILD_ID = '__BUILD_ID__';
const GAME_VERSION = '__GAME_VERSION__';
const CACHE = `nanabo-${BUILD_ID}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll атомарен: если хоть один файл не скачался, установка отменяется и старая версия остаётся рабочей
    await cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })));
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('nanabo-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', (event) => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); if (event.data && event.data.type === 'GET_VERSION') event.source && event.source.postMessage({ type: 'VERSION', GAME_VERSION, BUILD_ID }); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const idx = await cache.match('./index.html'); if (idx) return idx; }
    try { return await fetch(req); } catch (e) {
      if (req.mode === 'navigate') { const idx = await cache.match('./'); if (idx) return idx; }
      return new Response('Нет сети, и этого файла нет в офлайн-кэше.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
  })());
});
