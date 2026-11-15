import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, phone, open, skipWelcome, dismissNotices, progress } from './lib.mjs';

let browser;
test.before(async () => { browser = await launch(); });
test.after(async () => { await browser.close(); });
const swap = (to) => fetch(`${process.env.E2E_CONTROL}/?to=${to}`);
async function gotoSave(page) {
  await page.evaluate(() => { window.__game.nav.reset('tabs'); window.__game.nav.push('save'); });
  await page.getByRole('button', { name: 'Скачать файл' }).waitFor(); await page.waitForTimeout(400);
}
const tmp = mkdtempSync(join(tmpdir(), 'nanabo-save-'));

async function exportViaUi(page) {
  await gotoSave(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать файл' }).click()]);
  assert.equal(dl.suggestedFilename(), 'STEFANIA_SAVE.json');
  const path = join(tmp, 'save-' + Date.now() + '.json'); await dl.saveAs(path); return path;
}
async function importViaUi(page, path) {
  await gotoSave(page);
  await page.locator('input[type=file]').setInputFiles(path);
  const btn = page.getByRole('button', { name: 'Заменить прогресс' }); await btn.waitFor();
  await btn.click();
  await page.getByText('Прогресс загружен и проверен').waitFor({ timeout: 10000 });
}

test('главный сценарий: 500 бананов → костюм → открыть и улучшить лабораторию → экспорт → обновление → импорт старого файла → тот же прогресс', async () => {
  await swap('a');
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  // 1) заработать 500 бананов (через настоящие начисления экономики) и купить костюм
  await page.evaluate(() => { const g = window.__game; g.store.tx((d, c) => { d.currencies.bananas += 500; d.currencies.lifetime.bananas += 500; d.player.level = Math.max(d.player.level, 6); }); });
  await page.evaluate(() => { const g = window.__game; g.api.buyItem('tee-sun'); g.api.equip('pip', 'tee-sun'); });
  assert.equal(await page.evaluate(() => window.__game.store.getState().characters.pip.equipped.outfit), 'tee-sun');
  // 2) открыть лабораторию и улучшить её
  await page.evaluate(() => { window.__game.store.tx((d) => { d.currencies.bananas += 5000; d.currencies.coins += 500; d.currencies.crystals += 50; }); });
  await page.evaluate(() => { const a = window.__game.api; a.unlockRoom('lab'); a.upgradeRoom('lab'); a.startResearch('r-gear'); });
  const jobId = await page.evaluate(() => window.__game.store.getState().base.lab.queue[0].id);
  await page.evaluate((id) => { const a = window.__game.api; a.skipResearch(id); a.collectResearch(id); }, jobId);
  const lab = await page.evaluate(() => window.__game.store.getState().base.rooms.lab);
  assert.equal(lab.unlocked, true); assert.equal(lab.level, 2);
  await dismissNotices(page);
  // 3) экспорт файла через интерфейс
  await page.evaluate(() => window.__game.svc.flush());
  const oldFile = await exportViaUi(page);
  const oldProgress = await progress(page);
  const text = JSON.parse(readFileSync(oldFile, 'utf8'));
  assert.equal(text.format, 'STEFANIA_WORLD_SAVE'); assert.ok(text.checksum || text.integrity);
  // 4) прогресс уходит дальше (новые покупки), потом выходит «обновление»
  await page.evaluate(() => { const g = window.__game; g.store.tx((d) => { d.currencies.bananas += 300; }); g.api.buyItem('tee-sky'); });
  assert.notEqual(await progress(page), oldProgress);
  await swap('b');
  await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r?.update(); });
  await page.waitForFunction(() => true);
  // 5) импорт старого файла в «обновлённую» игру → идентичный прогресс
  await page.reload(); await page.locator('.tabbar').waitFor();
  await importViaUi(page, oldFile);
  assert.equal(await progress(page), oldProgress, 'после импорта старого файла прогресс должен совпасть с экспортированным');
  // копия перед импортом создана
  const backups = await page.evaluate(async () => (await window.__game.svc.listBackups()).map((b) => b.reason));
  assert.ok(backups.includes('import'), 'перед импортом должна быть создана резервная копия: ' + backups);
  // 6) и после перезагрузки всё на месте
  await page.evaluate(() => window.__game.svc.flush()); await page.reload(); await page.locator('.tabbar').waitFor();
  assert.equal(await progress(page), oldProgress);
  await swap('a'); await ctx.close();
});

test('битые файлы отклоняются понятным сообщением и не меняют прогресс', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  const before = await progress(page);
  const good = await exportViaUi(page);
  const j = JSON.parse(readFileSync(good, 'utf8'));
  const cases = {
    'not-json.json': 'это не сохранение {{{',
    'alien-format.json': JSON.stringify({ hello: 'world' }),
    'forged.json': JSON.stringify((() => { const c = JSON.parse(JSON.stringify(j)); const s = c.state || c.data || c.save; if (s) s.currencies.bananas = 9999999; else c.currencies = { bananas: 9999999 }; return c; })()),
    'empty.json': '',
  };
  for (const [name, body] of Object.entries(cases)) {
    const p = join(tmp, name); writeFileSync(p, body);
    await gotoSave(page);
    await page.locator('input[type=file]').setInputFiles(p);
    await page.getByRole('button', { name: 'Понятно' }).waitFor({ timeout: 8000 }).catch(async (e) => { throw new Error(`${name}: не появилось сообщение об ошибке; на экране: ` + (await page.evaluate(() => document.body.innerText.slice(0, 400))).replace(/\n/g, ' | ')); });
    assert.equal(await page.getByRole('button', { name: 'Заменить прогресс' }).count(), 0, name + ': кнопка замены не должна появиться');
    await page.getByRole('button', { name: 'Понятно' }).click();
  }
  assert.equal(await progress(page), before);
  await ctx.close();
});

test('резервная копия: создать вручную и восстановить из неё', async () => {
  const ctx = await phone(browser); const page = await open(ctx); await skipWelcome(page);
  await page.evaluate(() => { window.__game.store.tx((d) => { d.currencies.bananas += 111; }); });
  const snap = await progress(page);
  await gotoSave(page);
  await page.getByRole('button', { name: 'Создать сейчас' }).click(); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__game.store.tx((d) => { d.currencies.bananas += 999; }); });
  assert.notEqual(await progress(page), snap);
  await page.locator('.card.tint').filter({ hasText: 'Ручная копия' }).getByRole('button', { name: 'Восстановить из этой копии' }).click();
  await page.getByRole('button', { name: 'Восстановить', exact: true }).click();
  await page.getByText('Прогресс восстановлен').waitFor({ timeout: 8000 });
  assert.equal(await progress(page), snap);
  await ctx.close();
});
