import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, rid, clearLevels, giveFunds } from '../helpers';
import { LEVELS, LEVEL_MAP } from '../../src/game/data/worlds';
import { computeStars } from '../../src/game/engine/levels';
import { stateMetric } from '../../src/game/engine/metrics';

test('данные: 5 миров, 40 уровней, всё привязано', () => {
  assert.equal(LEVELS.length, 40);
  for (let w = 1; w <= 5; w++) assert.equal(LEVELS.filter((l) => l.world === w).length, 8);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, 40);
});

test('звёзды считаются по условиям (high/low)', () => {
  const l = LEVEL_MAP['w1l1']; // high: 12 / 16
  assert.equal(computeStars(l, false, 99), 0);
  assert.equal(computeStars(l, true, 8), 1);
  assert.equal(computeStars(l, true, 12), 2);
  assert.equal(computeStars(l, true, 16), 3);
  const m = LEVEL_MAP['w1l2']; // low: 7 / 4
  assert.equal(computeStars(m, true, 9), 1);
  assert.equal(computeStars(m, true, 7), 2);
  assert.equal(computeStars(m, true, 4), 3);
});

test('первый уровень открыт, остальные закрыты', () => {
  const g = makeGame();
  assert.equal(g.state().levels['w1l1'].status, 'open');
  assert.equal(g.state().levels['w1l2'].status, 'locked');
  assert.equal(g.state().worlds['w2'].unlocked, false);
  assert.throws(() => g.api.completeLevel({ levelId: 'w1l2', runId: rid(), success: true, metric: 3 }), (e: any) => e.code === 'locked');
});

test('прохождение: награда за первое прохождение один раз, звёзды только растут', () => {
  const g = makeGame();
  const run = rid();
  const out = g.api.completeLevel({ levelId: 'w1l1', runId: run, success: true, metric: 8 });
  assert.equal(out.stars, 1); assert.equal(out.first, true);
  assert.ok(g.state().wardrobe.owned['cap-red'], 'предмет за первое прохождение');
  assert.ok(g.state().collections.cards['card-w1-1']);
  const bananas1 = g.state().currencies.bananas;
  // повторная отправка той же попытки отклоняется и ничего не начисляет
  assert.throws(() => g.api.completeLevel({ levelId: 'w1l1', runId: run, success: true, metric: 8 }), (e: any) => e.code === 'dup_run');
  assert.equal(g.state().currencies.bananas, bananas1);
  // повтор с 3 звёздами: добавляет награды за 2 и 3 звезду, но не повторяет «первое»
  const out2 = g.api.completeLevel({ levelId: 'w1l1', runId: rid(), success: true, metric: 20 });
  assert.equal(out2.stars, 3); assert.equal(out2.first, false); assert.equal(out2.prevStars, 1);
  assert.equal(g.state().levels['w1l1'].stars, 3);
  // худший результат не снижает звёзды
  g.api.completeLevel({ levelId: 'w1l1', runId: rid(), success: true, metric: 8 });
  assert.equal(g.state().levels['w1l1'].stars, 3);
  assert.equal(stateMetric(g.state(), 'stars'), 3);
});

test('провал не даёт наград и не открывает следующий уровень', () => {
  const g = makeGame();
  const before = g.state().currencies.bananas;
  const out = g.api.completeLevel({ levelId: 'w1l1', runId: rid(), success: false, metric: 2 });
  assert.equal(out.stars, 0);
  assert.equal(g.state().currencies.bananas, before);
  assert.equal(g.state().levels['w1l2'].status, 'locked');
  assert.equal(g.state().levels['w1l1'].plays, 1);
});

test('успех открывает следующий уровень; босс + звёзды открывают следующий мир', () => {
  const g = makeGame();
  clearLevels(g, ['w1l1']);
  assert.equal(g.state().levels['w1l2'].status, 'open');
  // w1l3 — задание, нужно выполнить цели вручную
  clearLevels(g, ['w1l2']);
  giveFunds(g, 0, 0, 0);
  g.store.tx((d) => { d.player.level = 3; d.currencies.bananas = 999; });
  g.api.unlockRoom('bedroom');
  g.api.buyItem('tee-sun'); g.api.equip('pip', 'tee-sun');
  g.advance(3 * 3600000); g.api.collectBasket();
  const t = g.api.evaluateTask('w1l3', rid());
  assert.equal(t.stars, 3);
  clearLevels(g, ['w1l4', 'w1l5', 'w1l6', 'w1l7', 'w1l8']);
  assert.equal(g.state().levels['w1l8'].stars, 3);
  assert.ok(stateMetric(g.state(), 'stars') >= 22);
  assert.equal(g.state().worlds['w2'].unlocked, true, 'мир 2 открыт: босс пройден и ≥10 звёзд');
  assert.equal(g.state().levels['w2l1'].status, 'open');
  assert.ok(g.state().characters['tofu'].unlocked, 'награда боссу — персонаж');
  assert.ok(g.state().characters['zuzu'].unlocked);
});

test('мир не открывается без нужного числа звёзд, даже если босс пройден', () => {
  const g = makeGame();
  // искусственно: босс 1★, но всего звёзд меньше порога
  g.store.tx((d) => {
    for (let i = 1; i <= 7; i++) d.levels[`w1l${i}`].stars = 0;
    d.levels['w1l8'].stars = 1;
  });
  assert.equal(g.state().worlds['w2'].unlocked, false);
});

test('повторные прохождения: награда за повтор ограничена в день', () => {
  const g = makeGame();
  clearLevels(g, ['w1l1']);
  const gains: number[] = [];
  for (let i = 0; i < 7; i++) {
    const b = g.state().currencies.bananas;
    g.api.completeLevel({ levelId: 'w1l1', runId: rid(), success: true, metric: 20 });
    gains.push(g.state().currencies.bananas - b);
  }
  assert.ok(gains[0] > 2 && gains[3] > 2, 'первые повторы награждаются');
  assert.ok(gains[6] <= 3, 'после лимита награда символическая');
});

test('аркада: награда только за победу, лимит полных наград в день, защита от дубля', () => {
  const g = makeGame();
  const run = rid();
  const r = g.api.finishArcade({ game: 'memory', runId: run, success: true, difficulty: 2, metric: 8 });
  assert.ok(r && r.bananas > 0);
  assert.throws(() => g.api.finishArcade({ game: 'memory', runId: run, success: true, difficulty: 2 }), (e: any) => e.code === 'dup_run');
  assert.equal(g.api.finishArcade({ game: 'memory', runId: rid(), success: false, difficulty: 2 }), null);
  const full = r!.bananas;
  let last = full;
  for (let i = 0; i < 8; i++) last = g.api.finishArcade({ game: 'memory', runId: rid(), success: true, difficulty: 2 })!.bananas;
  assert.ok(last < full / 2, 'награда падает после дневного лимита');
  assert.equal(g.state().minigames.stats['memory'].plays, 10);
});

test('закрытая мини-игра недоступна в аркаде', () => {
  const g = makeGame();
  assert.throws(() => g.api.finishArcade({ game: 'lab-puzzle', runId: rid(), success: true, difficulty: 1 }), (e: any) => e.code === 'locked');
});
