// Статический сервер для dist/. CLI: node scripts/serve.mjs --port 4173 --base /stefania-nanabo-world/ [--dir dist]
// Для тестов: import { createStaticServer } — каталог можно подменять на лету (проверка обновлений).
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

export function createStaticServer({ dir, base = '/' }) {
  let b = base.startsWith('/') ? base : '/' + base; if (!b.endsWith('/')) b += '/';
  const server = createServer((req, res) => {
    const root = typeof dir === 'function' ? dir() : dir;
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith(b)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('404 (вне базового пути ' + b + ')'); }
    const rel = decodeURIComponent(url.pathname.slice(b.length)) || 'index.html';
    let file = normalize(join(root, rel));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    createReadStream(file).pipe(res);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
  const port = Number(opt('port', 4173));
  const dir = join(fileURLToPath(new URL('..', import.meta.url)), opt('dir', 'dist'));
  const base = opt('base', '/');
  createStaticServer({ dir, base }).listen(port, () => console.log(`http://localhost:${port}${base}`));
}
