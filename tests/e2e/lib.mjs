import { chromium } from 'playwright';

export const BASE_PATH = '/stefania-nanabo-world/';
export const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
export const url = () => process.env.E2E_URL;

export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
}
/** Контекст «как iPhone»: экран 390×844, касания, мобильный user-agent. */
export async function phone(browser, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: IPHONE_UA, acceptDownloads: true, ...extra });
  return ctx;
}
/** Страница, которая запоминает ошибки консоли и сбои сети. */
export async function open(ctx, path = BASE_PATH) {
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.problems.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) page.problems.push(`HTTP ${r.status()} ${r.url()}`); });
  await page.goto(new URL(path, url()).toString());
  await page.getByText('Welcome').or(page.locator('.tabbar')).first().waitFor();
  return page;
}
export async function skipWelcome(page) {
  const skip = page.getByText('Пропустить', { exact: true });
  await skip.or(page.locator('.tabbar')).first().waitFor();
  // экран приветствия может перемонтироваться сразу после загрузки — даём ему устояться
  await page.waitForTimeout(250);
  if (await skip.count()) await skip.click({ timeout: 5000 });
  await page.locator('.tabbar').waitFor();
  await dismissNotices(page);
}
/** Закрывает всплывающие награды и достижения, пока они есть. */
export async function dismissNotices(page) {
  for (let i = 0; i < 12; i++) {
    const btn = page.locator('.overlay.mid .btn').filter({ hasText: /Отлично|Ура|Продолжить|Привет/ }).first();
    if (!(await btn.count())) break;
    await btn.click(); await page.waitForTimeout(120);
  }
}
export const game = (page, fn, arg) => page.evaluate(fn, arg);
/** Снимок прогресса без служебных полей, которые меняются при каждом сохранении. */
export const progress = (page) => page.evaluate(() => {
  const s = JSON.parse(JSON.stringify(window.__game.store.getState()));
  delete s.metadata.revision; delete s.metadata.savedAt; delete s.metadata.lastVersion; delete s.statistics.sessions; delete s.statistics.lastPlayedAt; delete s.statistics.playSeconds;
  const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(s));
});
