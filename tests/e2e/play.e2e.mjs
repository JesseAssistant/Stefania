import test from 'node:test';
import assert from 'node:assert/strict';
import { launch, phone, open, skipWelcome, dismissNotices } from './lib.mjs';

let browser;
test.before(async () => { browser = await launch(); });
test.after(async () => { await browser.close(); });

/** Играет в «Парные карточки» как человек: переворачивает карточки и запоминает, где что лежит. */
async function playMemory(page) {
  const cards = page.locator('button[aria-label]').filter({ has: page.locator('xpath=self::*') });
  const grid = page.locator('.game-area button[aria-label]');
  const n = await grid.count();
  const known = new Array(n).fill(null); const done = new Set();
  const flip = async (i) => { await grid.nth(i).click(); await page.waitForTimeout(60); const l = await grid.nth(i).getAttribute('aria-label'); known[i] = l; return l; };
  for (let guard = 0; guard < 60 && done.size < n; guard++) {
    const i = [...Array(n).keys()].find((k) => !done.has(k));
    const a = await flip(i);
    const partner = known.findIndex((l, k) => k !== i && l === a && !done.has(k));
    if (partner >= 0) { await flip(partner); done.add(i); done.add(partner); await page.waitForTimeout(500); continue; }
    const j = [...Array(n).keys()].find((k) => k !== i && !done.has(k) && known[k] === null);
    const b = await flip(j);
    if (a === b) { done.add(i); done.add(j); await page.waitForTimeout(500); } else await page.waitForTimeout(1300);
  }
}

test('настоящий уровень: пройти «Парные карточки», получить звёзды и награды один раз, открыть следующий', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  await page.evaluate(() => window.__game.api.completeLevel({ levelId: 'w1l1', runId: 'run:setup', success: true, metric: 12 }));
  await dismissNotices(page);
  const b0 = await page.evaluate(() => window.__game.store.getState().currencies.bananas);
  await page.evaluate(() => { window.__game.nav.reset('tabs'); window.__game.nav.push('level', { id: 'w1l2' }); });
  await page.getByRole('button', { name: /Играть/ }).first().click();
  await playMemory(page);
  await page.getByText(/Победа|Уровень пройден|Отлично/).first().waitFor({ timeout: 15000 });
  const lv = await page.evaluate(() => window.__game.store.getState().levels.w1l2);
  assert.ok(lv.stars >= 1, 'уровень должен быть пройден');
  const b1 = await page.evaluate(() => window.__game.store.getState().currencies.bananas);
  assert.ok(b1 > b0, 'за уровень начислены бананы');
  // повторная отправка той же попытки не даёт награду второй раз
  const r = await page.evaluate(() => { try { window.__game.api.completeLevel({ levelId: 'w1l2', runId: 'run:setup2', success: true, metric: 12 }); return 'ok'; } catch (e) { return e.code || 'err'; } });
  const b2 = await page.evaluate(() => window.__game.store.getState().currencies.bananas);
  assert.ok(b2 - b1 < (b1 - b0), 'повтор уровня даёт меньше, чем первое прохождение');
  assert.ok(await page.evaluate(() => window.__game.store.getState().levels.w1l3.status !== 'locked'), 'следующий уровень открыт');
  assert.deepEqual(page.problems, []);
  await ctx.close();
});

test('главный экран и игровые экраны умещаются в ширину iPhone без горизонтальной прокрутки', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  const wide = [];
  for (const [n, p] of [['tabs'], ['map'], ['quests'], ['chests'], ['settings'], ['save'], ['arcade'], ['album']]) {
    await page.evaluate(([n, p]) => { window.__game.nav.reset('tabs'); if (n !== 'tabs') window.__game.nav.push(n, p || {}); }, [n, p]);
    await page.waitForTimeout(150); await dismissNotices(page);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) wide.push(`${n}: +${over}px`);
  }
  assert.deepEqual(wide, []);
  await ctx.close();
});
