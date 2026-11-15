import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, giveFunds } from '../helpers';
import { earn, spend, canAfford } from '../../src/game/engine/economy';
import { GameError } from '../../src/game/types';

test('новая игра: стартовый баланс и отсутствие отрицательных значений', () => {
  const g = makeGame();
  const c = g.state().currencies;
  assert.equal(c.bananas, 120); assert.equal(c.coins, 30); assert.equal(c.crystals, 2);
});

test('покупка предмета списывает валюту и выдаёт предмет ровно один раз', () => {
  const g = makeGame();
  g.api.buyItem('tee-sun'); // 60 бананов
  assert.equal(g.state().currencies.bananas, 60);
  assert.ok(g.state().wardrobe.owned['tee-sun']);
  assert.throws(() => g.api.buyItem('tee-sun'), (e: any) => e instanceof GameError && e.code === 'owned');
  assert.equal(g.state().currencies.bananas, 60, 'повторная покупка не списывает деньги');
});

test('нельзя купить предмет, на который не хватает средств — состояние не меняется', () => {
  const g = makeGame();
  g.api.buyItem('tee-sun'); g.api.buyItem('tee-sky'); // 60 + 60 = 120 → баланс 0
  assert.equal(g.state().currencies.bananas, 0);
  const snap = g.state();
  assert.throws(() => g.api.buyItem('tee-berry'), (e: any) => e.code === 'insufficient');
  assert.equal(g.state(), snap, 'ссылка на состояние не изменилась (атомарность)');
  assert.equal(g.state().currencies.bananas, 0);
});

test('предмет, закрытый по уровню, купить нельзя', () => {
  const g = makeGame();
  giveFunds(g, 5000, 5000, 100);
  assert.throws(() => g.api.buyItem('hoodie-night'), (e: any) => e.code === 'locked');
  assert.equal(g.state().wardrobe.owned['hoodie-night'], undefined);
});

test('earn/spend: отрицательные и дробные суммы отклоняются, баланс не уходит в минус', () => {
  const g = makeGame();
  g.store.tx((d, ctx) => {
    assert.throws(() => earn(d, ctx, 'bananas', -5, 't'), GameError);
    assert.throws(() => earn(d, ctx, 'bananas', 1.5, 't'), GameError);
    assert.throws(() => spend(d, ctx, { bananas: 1000 }, 't'), GameError);
    assert.throws(() => spend(d, ctx, { bananas: -1 }, 't'), GameError);
    assert.equal(canAfford(d, { bananas: 120 }), true);
    assert.equal(canAfford(d, { bananas: 121 }), false);
  });
  assert.equal(g.state().currencies.bananas, 120);
});

test('ошибка внутри транзакции откатывает ВСЕ изменения', () => {
  const g = makeGame();
  const snap = g.state();
  assert.throws(() => g.store.tx((d, ctx) => { earn(d, ctx, 'bananas', 500, 't'); throw new GameError('x', 'boom'); }));
  assert.equal(g.state(), snap);
  assert.equal(g.state().currencies.bananas, 120);
});

test('учёт: lifetime растёт только от начислений, а не от стартового баланса', () => {
  const g = makeGame();
  assert.equal(g.state().currencies.lifetime.bananas, 0);
  g.store.tx((d, ctx) => earn(d, ctx, 'bananas', 50, 'level:test'));
  assert.equal(g.state().currencies.lifetime.bananas, 70, '50 + 20 награда за достижение First Banana');
  g.api.buyItem('tee-sun');
  assert.equal(g.state().currencies.lifetime.spentBananas, 60);
});

test('скидка Гардеробной применяется к ценам магазина', () => {
  const g = makeGame();
  giveFunds(g, 5000, 1000, 10);
  g.api.upgradeRoom('wardrobe'); // lvl2 → скидка 3%
  const before = g.state().currencies.bananas;
  g.api.buyItem('hoodie-mint'); // 160 → 156 (ceil 155.2)
  assert.equal(before - g.state().currencies.bananas, 156);
});
