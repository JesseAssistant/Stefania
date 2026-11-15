import test from 'node:test';
import assert from 'node:assert/strict';
import { launch, phone, open, skipWelcome, dismissNotices, BASE_PATH } from './lib.mjs';

let browser;
test.before(async () => { browser = await launch(); });
test.after(async () => { await browser.close(); });

test('первый запуск из подкаталога: «Welcome, Stefania!», обучение до конца, главный экран, стартовый кошелёк', async () => {
  const ctx = await phone(browser); const page = await open(ctx);
  assert.match(new URL(page.url()).pathname, new RegExp('^' + BASE_PATH));
  await page.getByText('Welcome,').waitFor();
  assert.ok(await page.getByText('Stefania!').isVisible());
  await page.getByRole('button', { name: 'Начать' }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.getByRole('button', { name: 'Погладить Pip' }).click();
  await page.getByRole('button', { name: 'В путь!' }).click();
  await page.locator('.tabbar').waitFor();
  await dismissNotices(page);
  const w = await page.evaluate(() => { const c = window.__game.store.getState().currencies; return [c.bananas, c.coins, c.crystals]; });
  assert.deepEqual(w.map((x, i) => x >= [120, 30, 2][i]), [true, true, true]);
  assert.ok(await page.evaluate(() => window.__game.store.getState().player.tutorial.done));
  assert.deepEqual(page.problems, []);
  await ctx.close();
});

test('все вкладки и все экраны открываются без ошибок и без заглушек «ещё не готов»', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  for (const label of ['База', 'Нанабо', 'Гардероб', 'Магазин', 'Главная']) {
    await page.locator('.tabbar .tab').filter({ hasText: label }).click(); await page.waitForTimeout(150);
    await dismissNotices(page);
    assert.equal(await page.getByText('ещё не готов').count(), 0, label);
  }
  const routes = await page.evaluate(() => Object.keys({ map: 1, quests: 1, arcade: 1, album: 1, photos: 1, chests: 1, personal: 1, sandbox: 1, settings: 1, install: 1, save: 1 }));
  const withParams = { room: [{ id: 'hall' }, { id: 'bedroom' }, { id: 'playroom' }, { id: 'kitchen' }, { id: 'lab' }, { id: 'gym' }, { id: 'workshop' }, { id: 'lounge' }, { id: 'secret' }, { id: 'wardrobe' }], level: [{ id: 'w1l1' }, { id: 'w1l3' }, { id: 'w1l8' }], character: [{ id: 'pip' }], cook: [{ id: 'smoothie' }] };
  const visit = async (name, params) => {
    await page.evaluate(([n, p]) => { window.__game.nav.reset('tabs'); window.__game.nav.push(n, p); }, [name, params || {}]);
    await page.waitForTimeout(120); await dismissNotices(page);
    assert.equal(await page.getByText('ещё не готов').count(), 0, `${name} ${JSON.stringify(params)}`);
    assert.ok(await page.locator('.topbar h1').count() > 0 || name === 'character', `${name}: нет заголовка`);
  };
  for (const r of routes) await visit(r);
  for (const [n, list] of Object.entries(withParams)) for (const p of list) await visit(n, p);
  assert.deepEqual(page.problems, []);
  await ctx.close();
});

test('прогресс переживает перезагрузку страницы (IndexedDB), награды не начисляются повторно', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  await page.evaluate(() => { const g = window.__game; g.store.tx((d) => { d.currencies.bananas += 400; }); g.api.buyItem('tee-sun'); g.api.equip('pip', 'tee-sun'); });
  const before = await page.evaluate(() => { const s = window.__game.store.getState(); return { b: s.currencies.bananas, own: !!s.wardrobe.owned['tee-sun'], eq: s.characters.pip.equipped.outfit, lifetime: s.currencies.lifetime.bananas, ach: Object.keys(s.achievements).length }; });
  await page.evaluate(() => window.__game.svc.flush());
  await page.reload(); await page.locator('.tabbar').waitFor();
  const after = await page.evaluate(() => { const s = window.__game.store.getState(); return { b: s.currencies.bananas, own: !!s.wardrobe.owned['tee-sun'], eq: s.characters.pip.equipped.outfit, lifetime: s.currencies.lifetime.bananas, ach: Object.keys(s.achievements).length }; });
  assert.deepEqual(after, before);
  assert.deepEqual(page.problems, []);
  await ctx.close();
});

test('свободная игра не меняет и не сохраняет настоящий прогресс', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  const snap = () => page.evaluate(() => { const s = window.__game.store.getState(); return s.currencies.bananas + '|' + s.characters.pip.name + '|' + Object.keys(s.wardrobe.owned).length; });
  const real = await snap();
  await page.evaluate(() => window.__game.nav.push('sandbox')); await page.getByText('Войти в свободную игру').click();
  await page.getByText('Свободная игра: прогресс не сохраняется').waitFor();
  await page.evaluate(() => { window.__game.api.renameCharacter('pip', 'Песочница'); window.__game.store.tx((d) => { d.currencies.bananas += 777; }); });
  assert.notEqual(await snap(), real);
  await page.evaluate(() => window.__game.svc.flush());
  await page.reload(); await page.locator('.tabbar').waitFor();
  assert.equal(await snap(), real, 'после перезагрузки должен быть настоящий прогресс');
  await ctx.close();
});
