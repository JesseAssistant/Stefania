import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES } from '../../src/app/routes';
import { SECRETS } from '../../src/game/data/decor';
import { ROOMS } from '../../src/game/data/rooms';
import { ALL_MINIGAMES } from '../../src/game/engine/levels';
import { LEVELS } from '../../src/game/data/worlds';
import { GAME_INFO } from '../../src/ui/icons';
import { arcadeConfig } from '../../src/games/arcadeConfig';

const SRC = join(import.meta.dirname, '../../src');
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(p) ? [p] : []; });
const files = walk(SRC);

test('нет «мёртвых кнопок»: каждый переход nav.push/replace/reset/popTo ведёт на существующий экран', () => {
  const found = new Map<string, string>();
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/(?:push|replace|reset|popTo)\(\s*'([a-z-]+)'/g)) found.set(m[1], f);
  }
  assert.ok(found.size >= 14, `нашли только ${found.size} переходов`);
  const missing = [...found].filter(([name]) => !ROUTES[name]).map(([n, f]) => `${n} (${f.replace(SRC, 'src')})`);
  assert.deepEqual(missing, [], `Переходы на несуществующие экраны: ${missing.join(', ')}`);
});

test('каждый экран в таблице маршрутов — компонент', () => {
  for (const [name, c] of Object.entries(ROUTES)) assert.equal(typeof c, 'function', name);
});

test('все 8 секретов можно найти: для каждого есть место с мерцающим предметом', () => {
  const room = readFileSync(join(SRC, 'screens/Room.tsx'), 'utf8'), map = readFileSync(join(SRC, 'screens/Map.tsx'), 'utf8'), personal = readFileSync(join(SRC, 'screens/Personal.tsx'), 'utf8');
  for (const s of SECRETS) {
    if (s.screen.startsWith('room:')) { const id = s.screen.slice(5); assert.ok(s.id === `sec-${id}` && ROOMS.some((r) => r.id === id) && room.includes(`id === '${id}'`), s.id); }
    else if (s.screen.startsWith('world:')) { const n = s.screen.slice(6); assert.ok(s.id === `sec-world${n}` && new RegExp(`wn === ${n}\\b`).test(map), s.id); }
    else if (s.screen === 'personal') assert.ok(personal.includes(`SecretSpot id="${s.id}"`), s.id);
    else assert.fail(`неизвестное место секрета ${s.id}`);
  }
});

test('у каждой мини-игры есть описание, а аркада строит корректные настройки для всех сложностей', () => {
  for (const g of ALL_MINIGAMES) {
    assert.ok(GAME_INFO[g], g);
    for (let d = 1; d <= 3; d++) for (let seed = 1; seed <= 40; seed++) { const c = arcadeConfig(g, d, seed); assert.equal(c.kind, g); }
  }
});

test('каждый уровень использует известную мини-игру и описан полностью', () => {
  assert.ok(LEVELS.length >= 30 && LEVELS.length <= 50);
  for (const l of LEVELS) {
    const kinds = l.game.kind === 'gauntlet' ? l.game.stages.map((s) => s.kind) : [l.game.kind];
    for (const k of kinds) assert.ok(k === 'task' || GAME_INFO[k], `${l.id}: ${k}`);
    assert.ok(l.name && l.desc && l.goal, l.id);
  }
});
