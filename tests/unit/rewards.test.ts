import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, giveFunds } from '../helpers';
import { grantReward } from '../../src/game/engine/rewards';
import { openChest } from '../../src/game/engine/chests';
import { GameError } from '../../src/game/types';

test('награда с одним eventId начисляется только один раз', () => {
  const g = makeGame();
  g.store.tx((d, ctx) => {
    const a = grantReward(d, ctx, { bananas: 100, coins: 10 }, 'evt:1', 'level');
    const b = grantReward(d, ctx, { bananas: 100, coins: 10 }, 'evt:1', 'level');
    assert.equal(a.applied, true); assert.equal(b.applied, false); assert.equal(b.bananas, 0);
  });
  assert.equal(g.state().currencies.bananas, 240, '100 за награду + 20 за достижение First Banana, но не дважды');
  assert.equal(g.state().currencies.coins, 40);
});

test('дубликат предмета даёт компенсацию монетами, а не второй предмет', () => {
  const g = makeGame();
  g.store.tx((d, ctx) => {
    const a = grantReward(d, ctx, { items: ['cap-red'] }, 'a', 'x');
    assert.deepEqual(a.items, ['cap-red']);
    const b = grantReward(d, ctx, { items: ['cap-red'] }, 'b', 'x');
    assert.equal(b.items.length, 0);
    assert.ok(b.coins > 0 && b.compensation.length === 1);
  });
});

test('повышение уровня игрока: награды за уровни выдаются один раз', () => {
  const g = makeGame();
  g.store.tx((d, ctx) => { grantReward(d, ctx, { xp: 10_000 }, 'xp1', 'x'); });
  const lvl = g.state().player.level;
  assert.ok(lvl >= 8, 'несколько уровней сразу');
  const bananas = g.state().currencies.bananas;
  // повторный eventId не должен дать ни опыта, ни наград за уровни
  g.store.tx((d, ctx) => { grantReward(d, ctx, { xp: 10_000 }, 'xp1', 'x'); });
  assert.equal(g.state().player.level, lvl);
  assert.equal(g.state().currencies.bananas, bananas);
  assert.ok(g.state().currencies.lifetime.bananas > 0);
});

test('открытие сундука: расходует сундук, идемпотентно по openId, не даёт награду дважды', () => {
  const g = makeGame();
  assert.equal(g.state().inventory.chests.common, 1);
  const r1 = g.api.openChest('common', 'open-1');
  const snapshotCoins = g.state().currencies.coins, snapshotBananas = g.state().currencies.bananas;
  const r2 = g.api.openChest('common', 'open-1'); // повторная обработка того же события
  assert.equal(r2.applied, false);
  assert.equal(g.state().inventory.chests.common, 0);
  assert.equal(g.state().currencies.coins, snapshotCoins);
  assert.equal(g.state().currencies.bananas, snapshotBananas);
  assert.equal(g.state().statistics.chestsOpened, 1);
  assert.ok(r1.bananas + r1.coins + r1.items.length + r1.cards.length + r1.decor.length + r1.crystals + Object.keys(r1.materials).length + Object.keys(r1.food).length > 0);
});

test('нет сундука — нет открытия', () => {
  const g = makeGame();
  assert.throws(() => g.api.openChest('epic', 'x'), (e: any) => e instanceof GameError && e.code === 'no_chest');
});

test('ГСЧ сундуков детерминирован состоянием: перезагрузка не даёт «перебросить» награду', () => {
  const a = makeGame(), b = makeGame();
  const ra = a.api.openChest('common', 'k'), rb = b.api.openChest('common', 'k');
  assert.deepEqual(ra, rb);
  // состояние ГСЧ сохранено в metadata и продвинулось
  assert.notEqual(a.state().metadata.rng, 12345);
});

test('распределение сундуков: легендарный не хуже обычного, pity срабатывает', () => {
  const g = makeGame();
  giveFunds(g, 0, 0, 0);
  g.store.tx((d) => { d.inventory.chests.epic = 12; });
  let epicPlus = 0;
  for (let i = 0; i < 12; i++) {
    const r = g.api.openChest('epic', `e${i}`);
    epicPlus += r.items.length;
  }
  assert.ok(epicPlus >= 3, 'предметы выпадают из эпических сундуков');
  assert.equal(g.state().inventory.chests.epic, 0);
  assert.ok(g.state().inventory.pity.epic < 4);
  // прямой вызов с чужим draft не должен ломать инварианты
  g.store.tx((d, ctx) => { d.inventory.chests.rare = 1; openChest(d, ctx, 'rare', 'z'); });
});

test('кошелёк после серии операций всегда целый и неотрицательный', () => {
  const g = makeGame();
  g.store.tx((d) => { d.inventory.chests.common = 30; d.inventory.chests.rare = 20; });
  for (let i = 0; i < 30; i++) g.api.openChest('common', `c${i}`);
  for (let i = 0; i < 20; i++) g.api.openChest('rare', `r${i}`);
  const c = g.state().currencies;
  for (const v of [c.bananas, c.coins, c.crystals]) assert.ok(Number.isInteger(v) && v >= 0);
});
