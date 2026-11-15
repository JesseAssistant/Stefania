import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, rid, DAY, HOUR, giveFunds, clearLevels } from '../helpers';
import { dailyStatus } from '../../src/game/engine/daily';
import { dateKey, weekKey } from '../../src/game/util';
import { QUEST_MAP } from '../../src/game/data/quests';
import { basketStatus, restStatus } from '../../src/game/engine/base';

test('ежедневная награда: раз в день, серия растёт, нельзя дважды', () => {
  const g = makeGame();
  const r1 = g.api.claimDaily();
  assert.equal(r1.bananas, 50); assert.equal(g.state().dailyRewards.streak, 1);
  assert.throws(() => g.api.claimDaily(), (e: any) => e.code === 'daily_claimed');
  assert.equal(dailyStatus(g.state(), g.clock.t).canClaim, false);
  g.advance(DAY);
  g.api.claimDaily();
  assert.equal(g.state().dailyRewards.streak, 2);
  assert.equal(g.state().dailyRewards.totalClaims, 2);
});
test('серия прощает один пропущенный день, но не два', () => {
  const g = makeGame();
  g.api.claimDaily(); g.advance(DAY); g.api.claimDaily();
  g.advance(2 * DAY); // пропущен один день
  g.api.claimDaily();
  assert.equal(g.state().dailyRewards.streak, 3);
  g.advance(4 * DAY); // пропущено три дня
  g.api.claimDaily();
  assert.equal(g.state().dailyRewards.streak, 1);
});
test('день 7: открывается персонаж Pudding один раз; дата назад не даёт повторную награду', () => {
  const g = makeGame();
  for (let i = 0; i < 7; i++) { g.api.claimDaily(); g.advance(DAY); }
  assert.ok(g.state().characters['pudding'].unlocked);
  assert.equal(g.state().dailyRewards.streak, 7);
  const bananas = g.state().currencies.bananas;
  g.advance(-3 * DAY); // часы переведены назад
  assert.throws(() => g.api.claimDaily());
  assert.equal(g.state().currencies.bananas, bananas);
});
test('сутки считаются по ЛОКАЛЬНОМУ времени, ключи недели стабильны', () => {
  const a = new Date(2026, 10, 15, 23, 59).getTime(), b = new Date(2026, 10, 16, 0, 1).getTime();
  assert.notEqual(dateKey(a), dateKey(b));
  assert.equal(weekKey(a), weekKey(new Date(2026, 10, 13, 10).getTime()));
});
test('ежедневные и еженедельные задания выдаются, обновляются по дням и считают прогресс', () => {
  const g = makeGame();
  g.api.setTutorialStep(0); // запускает транзакцию → rollover
  const q = g.state().quests;
  assert.equal(q.daily.ids.length, 4); assert.equal(q.weekly.ids.length, 3);
  const day1 = q.daily.ids.slice();
  g.advance(DAY + HOUR);
  g.api.setTutorialStep(0);
  assert.equal(g.state().quests.daily.key, dateKey(g.clock.t));
  assert.notEqual(g.state().quests.daily.key, q.daily.key);
  void day1;
});
test('задание «уровни»: прогресс по событиям, награда один раз', () => {
  const g = makeGame();
  g.store.tx((d) => { d.quests.daily.ids = ['d-levels', 'd-minigames', 'd-bananas-s', 'd-basket']; d.quests.daily.progress = {}; });
  clearLevels(g, ['w1l1', 'w1l2']);
  const p = g.state().quests.daily.progress['d-levels'];
  assert.equal(p.value, 2); assert.equal(p.done, true);
  const before = g.state().currencies.bananas;
  g.api.claimQuest('d-levels');
  assert.equal(g.state().currencies.bananas - before, QUEST_MAP['d-levels'].reward.bananas);
  assert.throws(() => g.api.claimQuest('d-levels'), (e: any) => e.code === 'claimed');
  assert.throws(() => g.api.claimQuest('d-minigames'), (e: any) => e.code === 'not_done' || e.code === 'claimed');
  assert.equal(g.state().quests.claimedCount, 1);
});
test('сюжетное задание считается из состояния и выдаёт персонажа', () => {
  const g = makeGame();
  assert.equal(g.state().quests.story['story-party'].done, false);
  g.store.tx((d) => { d.characters['zuzu'].unlocked = true; });
  assert.equal(g.state().quests.story['story-party'].done, true);
  g.api.claimQuest('story-party');
  assert.ok(g.state().characters['bumble'].unlocked);
});
test('достижения выдаются автоматически и только один раз', () => {
  const g = makeGame();
  clearLevels(g, ['w1l1']);
  const a = g.state().achievements;
  assert.ok(a['first-banana'] && a['first-star'] && a['boss-slayer'] === undefined);
  const stamp = a['first-banana'].at;
  clearLevels(g, ['w1l2']);
  assert.equal(g.state().achievements['first-banana'].at, stamp);
});
test('банановая корзина копится со временем, ограничена, собирается один раз', () => {
  const g = makeGame();
  assert.throws(() => g.api.collectBasket(), (e: any) => e.code === 'empty');
  g.advance(2 * HOUR);
  const st = basketStatus(g.state(), g.clock.t);
  assert.equal(st.amount, 48);
  const got = g.api.collectBasket();
  assert.equal(got, 48);
  assert.throws(() => g.api.collectBasket(), (e: any) => e.code === 'empty');
  g.advance(100 * HOUR);
  const st2 = basketStatus(g.state(), g.clock.t);
  assert.equal(st2.amount, st2.cap, 'ограничена вместимостью');
  g.advance(-500 * HOUR); // часы назад: не копим и не ломаемся
  assert.equal(basketStatus(g.state(), g.clock.t).amount, 0);
});
test('комнаты: открытие по уровню и цене, улучшение, лаборатория и исследования', () => {
  const g = makeGame();
  assert.throws(() => g.api.unlockRoom('lab'), (e: any) => e.code === 'level');
  g.store.tx((d) => { d.player.level = 6; d.currencies.bananas = 5000; d.currencies.coins = 1000; d.currencies.crystals = 20; });
  g.api.unlockRoom('lab');
  assert.ok(g.state().characters['sprocket'].unlocked, 'персонаж за открытие комнаты');
  g.api.upgradeRoom('lab');
  assert.equal(g.state().base.rooms.lab.level, 2);
  g.api.startResearch('r-gear');
  assert.throws(() => g.api.startResearch('r-fabric'), (e: any) => e.code === 'busy');
  const job = g.state().base.lab.queue[0];
  assert.throws(() => g.api.collectResearch(job.id), (e: any) => e.code === 'not_ready');
  g.advance(10 * 60 * 1000);
  g.api.collectResearch(job.id);
  assert.equal(g.state().inventory.materials.gear, 2);
  assert.throws(() => g.api.collectResearch(job.id), (e: any) => e.code === 'no_job');
});
test('спальня: Нанабо отдыхают и получают опыт, назначение не даёт накрутку задним числом', () => {
  const g = makeGame();
  g.store.tx((d) => { d.player.level = 2; d.currencies.bananas = 1000; });
  g.api.unlockRoom('bedroom');
  g.advance(10 * HOUR);
  g.api.assignBed(0, 'pip'); // до назначения никто не спал
  assert.equal(restStatus(g.state(), g.clock.t).total, 0);
  g.advance(3 * HOUR);
  const xpBefore = g.state().characters['pip'].xp + 0;
  g.api.collectRest();
  assert.ok(g.state().characters['pip'].xp > xpBefore || g.state().characters['pip'].level > 1);
});
test('кухня: приготовление, провал возвращает часть, повтор runId отклоняется, угощение даёт опыт', () => {
  const g = makeGame();
  g.store.tx((d) => { d.player.level = 4; d.currencies.bananas = 1000; d.currencies.coins = 300; });
  g.api.unlockRoom('kitchen');
  const run = rid('cook');
  g.api.startCook('smoothie');
  const res = g.api.finishCook('smoothie', run, 3);
  assert.ok(res);
  assert.equal(g.state().inventory.food['smoothie'], 2);
  assert.throws(() => g.api.finishCook('smoothie', run, 3), (e: any) => e.code === 'dup_run');
  const run2 = rid('cook');
  g.store.tx((d) => { d.achievements['first-banana'] = { at: 'x' }; }); // исключаем награду за достижение из расчёта
  const b = g.state().currencies.bananas;
  g.api.startCook('smoothie'); g.api.finishCook('smoothie', run2, 0);
  assert.ok(b - g.state().currencies.bananas >= 7 && b - g.state().currencies.bananas <= 8, 'провал: возвращается половина');
  const xp = g.api.feed('pip', 'smoothie');
  assert.ok(xp > 0); assert.equal(g.state().inventory.food['smoothie'], 1);
});
test('декорации: нельзя поставить больше, чем есть; комфорт считается', () => {
  const g = makeGame();
  giveFunds(g, 1000);
  g.api.buyDecor('lamp-sun');
  g.api.placeDecor('hall', 0, 'lamp-sun');
  assert.throws(() => g.api.placeDecor('hall', 1, 'lamp-sun'), (e: any) => e.code === 'none');
  g.api.removeDecor('hall', 0);
  g.api.placeDecor('hall', 1, 'lamp-sun');
  assert.equal(g.state().base.rooms.hall.decor[1], 'lamp-sun');
});
test('секреты: награда один раз; 8 секретов дарят Stella', () => {
  const g = makeGame();
  const ids = ['sec-hall', 'sec-kitchen', 'sec-lab', 'sec-lounge', 'sec-world1', 'sec-world2', 'sec-world4', 'sec-personal'];
  g.api.findSecret(ids[0]);
  const c = g.state().currencies.coins;
  assert.equal(g.api.findSecret(ids[0]), false);
  assert.equal(g.state().currencies.coins, c);
  for (const id of ids.slice(1)) g.api.findSecret(id);
  assert.ok(g.state().characters['stella'].unlocked);
  assert.ok(g.state().achievements['treasure-hunter'] && g.state().achievements['secret-keeper']);
  assert.ok(g.state().wardrobe.owned['golden-banana']);
});
test('тренировка: кулдаун, стоимость, предел уровня зала', () => {
  const g = makeGame();
  g.store.tx((d) => { d.player.level = 8; d.currencies.bananas = 5000; d.currencies.coins = 2000; });
  g.api.unlockRoom('gym');
  g.api.train('pip', 'speed');
  assert.throws(() => g.api.train('pip', 'speed'), (e: any) => e.code === 'cooldown');
  g.advance(HOUR);
  g.api.train('pip', 'speed');
  g.advance(HOUR);
  assert.throws(() => g.api.train('pip', 'speed'), (e: any) => e.code === 'max');
});
