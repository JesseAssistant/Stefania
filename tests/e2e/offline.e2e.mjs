import test from 'node:test';
import assert from 'node:assert/strict';
import { launch, phone, open, skipWelcome, dismissNotices, progress, BASE_PATH, url } from './lib.mjs';

let browser;
test.before(async () => { browser = await launch(); });
test.after(async () => { await browser.close(); });
const swap = (to) => fetch(`${process.env.E2E_CONTROL}/?to=${to}`);

async function swActive(page) {
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(async () => { await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 }); });
}

test('офлайн: после первой загрузки игра открывается и работает без сети, прогресс сохраняется', async () => {
  await swap('a');
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  await swActive(page);
  await ctx.setOffline(true);
  await page.reload(); await page.locator('.tabbar').waitFor();
  for (const label of ['База', 'Гардероб', 'Магазин']) { await page.locator('.tabbar .tab').filter({ hasText: label }).click(); await page.waitForTimeout(150); }
  // действия офлайн и их сохранение
  await page.evaluate(() => { const g = window.__game; g.store.tx((d) => { d.currencies.bananas += 100; }); g.api.buyItem('tee-sun'); });
  await page.evaluate(() => window.__game.svc.flush());
  await page.reload(); await page.locator('.tabbar').waitFor();
  assert.ok(await page.evaluate(() => !!window.__game.store.getState().wardrobe.owned['tee-sun']));
  // мини-игра работает офлайн
  await page.evaluate(() => { window.__game.api.completeLevel({ levelId: 'w1l1', runId: 'run:off1', success: true, metric: 12 }); window.__game.nav.push('level', { id: 'w1l2' }); });
  await dismissNotices(page);
  await page.getByRole('button', { name: /Играть/ }).first().click();
  await page.getByRole('button', { name: 'Закрытая карточка' }).first().waitFor();
  assert.deepEqual(page.problems.filter((p) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(p)), []);
  await ctx.setOffline(false); await ctx.close();
});

test('обновление: новая версия предлагается игроку, прогресс после обновления остаётся прежним', async () => {
  await swap('a');
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page); await swActive(page);
  await page.evaluate(() => { const g = window.__game; g.store.tx((d) => { d.currencies.bananas += 700; }); g.api.buyItem('tee-sky'); });
  await page.evaluate(() => window.__game.svc.flush());
  const before = await progress(page);
  assert.equal(await page.evaluate(() => document.querySelector('meta[name=x-build-mark]').content), 'build-A');
  await swap('b'); // «выкатили» новую версию
  await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
  await page.getByText('Доступна новая версия').waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Обновить' }).click();
  await page.waitForFunction(() => document.querySelector('meta[name=x-build-mark]')?.content === 'build-B', null, { timeout: 20000 });
  await page.locator('.tabbar').waitFor();
  assert.equal(await progress(page), before, 'прогресс после обновления должен совпасть');
  await swap('a'); await ctx.close();
});

test('манифест и иконки доступны по подкаталогу', async () => {
  await swap('a');
  const base = new URL(BASE_PATH, url()).toString();
  const m = await (await fetch(base + 'manifest.webmanifest')).json();
  assert.equal(m.display, 'standalone'); assert.equal(m.lang, 'ru'); assert.equal(m.start_url, './');
  for (const i of m.icons) assert.equal((await fetch(base + i.src)).status, 200, i.src);
  assert.equal((await fetch(base + 'icons/apple-touch-icon.png')).status, 200);
  const v = await (await fetch(base + 'version.json')).json();
  assert.ok(v.gameVersion && v.buildId);
});
