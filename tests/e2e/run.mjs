// Оркестратор e2e: собирает тестовую сборку, поднимает сервер в подкаталоге /stefania-nanabo-world/ и запускает тесты.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from '../../scripts/serve.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'nanabo-e2e-'));
const build = (out, mark) => { const r = spawnSync('node', ['scripts/build.mjs', '--e2e', '--out', out, '--mark', mark], { cwd: root, stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status ?? 1); };
build('dist-e2e-a', 'build-A'); build('dist-e2e-b', 'build-B');
let current = join(root, 'dist-e2e-a');
const server = createStaticServer({ dir: () => current, base: '/stefania-nanabo-world/' });
await new Promise((res) => server.listen(0, res));
const port = server.address().port;
// Тесты могут «выкатить обновление»: переключить сервер на сборку B
// управляющий порт: тест просит переключить сборку по HTTP
import { createServer } from 'node:http';
const control = createServer((req, res) => { const to = new URL(req.url, 'http://x').searchParams.get('to'); current = join(root, to === 'b' ? 'dist-e2e-b' : 'dist-e2e-a'); res.end('ok'); });
await new Promise((res) => control.listen(0, res));
const env = { ...process.env, E2E_URL: `http://localhost:${port}`, E2E_CONTROL: `http://localhost:${control.address().port}` };
const files = process.argv.slice(2).length ? process.argv.slice(2) : ['tests/e2e/smoke.e2e.mjs', 'tests/e2e/offline.e2e.mjs', 'tests/e2e/play.e2e.mjs', 'tests/e2e/save.e2e.mjs'];
// ВАЖНО: асинхронный запуск, иначе spawnSync блокирует цикл событий и встроенный сервер не отвечает.
const code = await new Promise((res) => spawn('node', ['--test', '--test-concurrency=1', ...files], { cwd: root, stdio: 'inherit', env }).on('exit', (c) => res(c ?? 1)));
server.close(); control.close();
for (const d of ['dist-e2e-a', 'dist-e2e-b']) rmSync(join(root, d), { recursive: true, force: true });
rmSync(work, { recursive: true, force: true });
process.exit(code);
