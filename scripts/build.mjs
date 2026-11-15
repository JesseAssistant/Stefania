// Сборка: esbuild → dist/ (статические файлы, относительные пути — работает в любом подкаталоге GitHub Pages).
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const e2e = process.argv.includes('--e2e'); // тестовая сборка: открывает window.__game для Playwright (в боевую сборку не попадает)
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : undefined; };
const dist = join(root, arg('out') || (e2e ? 'dist-e2e' : 'dist'));
const mark = arg('mark') || '';
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dev = process.argv.includes('--dev');
const gameVersion = (readFileSync(join(root, 'src/config.ts'), 'utf8').match(/GAME_VERSION\s*=\s*'([^']+)'/) || [])[1] || pkg.version;

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });

const result = await build({
  entryPoints: { app: join(root, 'src/main.tsx') },
  bundle: true, outdir: join(dist, 'assets'), format: 'esm', target: ['es2020'],
  minify: !dev, sourcemap: dev ? 'inline' : false, jsx: 'automatic', metafile: true, legalComments: 'none',
  entryNames: '[name].[hash]', assetNames: '[name].[hash]', loader: { '.png': 'file', '.svg': 'file' },
  define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"', __E2E__: String(e2e) }, logLevel: 'warning',
});
const outs = Object.keys(result.metafile.outputs).map((p) => relative(dist, join(root, p)).replace(/\\/g, '/'));
const js = outs.find((o) => o.endsWith('.js')), css = outs.find((o) => o.endsWith('.css'));

if (existsSync(join(root, 'public'))) cpSync(join(root, 'public'), dist, { recursive: true });
let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html.replace('%CSS%', css ? `<link rel="stylesheet" href="./${css}">` : '').replace('%JS%', `<script type="module" src="./${js}"></script>`).replace(/%VERSION%/g, gameVersion).replace(/%MARK%/g, mark);
writeFileSync(join(dist, 'index.html'), html);

// Список файлов для предзагрузки Service Worker и версия сборки (хэш содержимого)
function walk(dir) { return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; }); }
const files = walk(dist).map((p) => relative(dist, p).replace(/\\/g, '/')).filter((f) => f !== 'sw.js' && !f.endsWith('.map')).sort();
const h = createHash('sha256');
for (const f of files) { h.update(f); h.update(readFileSync(join(dist, f))); }
const buildId = h.digest('hex').slice(0, 12);
const precache = ['./', ...files.filter((f) => f !== 'index.html').map((f) => `./${f}`), './index.html'];
let sw = readFileSync(join(root, 'src/pwa/sw.template.js'), 'utf8');
sw = sw.replace('__BUILD_ID__', buildId).replace('__GAME_VERSION__', gameVersion).replace('__PRECACHE__', JSON.stringify(precache));
writeFileSync(join(dist, 'sw.js'), sw);
writeFileSync(join(dist, 'version.json'), JSON.stringify({ gameVersion, buildId, builtAt: new Date().toISOString(), files: files.length }, null, 2));
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`✔ ${relative(root, dist)}/ готов: версия ${gameVersion}, сборка ${buildId}, файлов ${files.length}, JS ${kb(statSync(join(dist, js)).size)}${css ? ', CSS ' + kb(statSync(join(dist, css)).size) : ''}`);
