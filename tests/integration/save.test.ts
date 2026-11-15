import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, memStorage, rid, clearLevels, giveFunds, DAY } from '../helpers';
import { MemoryAdapter } from '../../src/storage/adapters';
import { SaveService, wrap } from '../../src/storage/saveService';
import { buildSaveFile, serializeSave, parseSaveText, computeChecksum } from '../../src/storage/exportImport';
import { GameStore } from '../../src/game/engine/store';
import { createApi } from '../../src/game/api';
import { createNewState } from '../../src/game/engine/newGame';
import { canonicalize } from '../../src/storage/sha256';
import { SAVE_SECTIONS } from '../../src/game/types';

const snapshot = (s: any) => canonicalize(s);

test('автосохранение: после действий состояние записано и читается обратно целиком', async () => {
  const g = makeGame();
  g.api.buyItem('tee-sun'); g.api.equip('pip', 'tee-sun');
  await g.svc.flush();
  assert.equal(g.svc.status.phase, 'ok');
  const g2 = makeGame({ adapter: g.adapter, mirror: g.mirror });
  const loaded = await g2.svc.load();
  assert.equal(loaded.source, 'idb'); assert.equal(loaded.isNew, false);
  assert.equal(snapshot(loaded.state), snapshot(g.state()));
});
test('каждая значимая операция сохраняется (валюта, одежда, настройки, задания)', async () => {
  const g = makeGame();
  g.api.updateSettings({ musicOn: false, music: 0.3 });
  g.api.claimDaily();
  await g.svc.flush();
  const loaded = await makeGame({ adapter: g.adapter, mirror: g.mirror }).svc.load();
  assert.equal(loaded.state.settings.musicOn, false); assert.equal(loaded.state.settings.music, 0.3);
  assert.equal(loaded.state.dailyRewards.streak, 1);
  assert.equal(loaded.state.currencies.bananas, g.state().currencies.bananas);
});
test('ошибка записи видна пользователю и не теряет данные; повторяется автоматически', async () => {
  const g = makeGame();
  g.adapter.failWrites = true;
  g.api.buyItem('tee-sun');
  await g.svc.flush().catch(() => {});
  assert.equal(g.svc.status.phase, 'error');
  assert.ok(g.svc.status.error);
  // зеркало в localStorage всё равно сохранило прогресс
  assert.ok(g.mirror.getItem('stefania.save.mirror.v1'));
  g.adapter.failWrites = false;
  await new Promise((r) => setTimeout(r, 30));
  await g.svc.flush();
  assert.equal(g.svc.status.phase, 'ok');
  const loaded = await makeGame({ adapter: g.adapter, mirror: memStorage() }).svc.load();
  assert.ok(loaded.state.wardrobe.owned['tee-sun']);
});
test('повреждённая основная запись: восстановление из предыдущей, повреждённая уходит в карантин', async () => {
  const g = makeGame();
  g.api.buyItem('tee-sun'); await g.svc.flush();
  g.api.buyItem('tee-sky'); await g.svc.flush();
  const raw = await g.adapter.get('kv', 'save');
  raw.state.currencies.bananas = 999999; // порча без пересчёта контрольной суммы
  await g.adapter.put('kv', 'save', raw);
  const loaded = await makeGame({ adapter: g.adapter, mirror: memStorage() }).svc.load();
  assert.equal(loaded.source, 'prev'); assert.equal(loaded.recovered, true);
  assert.ok(loaded.state.wardrobe.owned['tee-sun']);
  assert.ok(loaded.warnings.length > 0);
  assert.equal((await g.adapter.list('quarantine')).length, 1, 'порченые данные не удалены');
});
test('если IndexedDB пуста, а зеркало есть — восстановление из зеркала', async () => {
  const g = makeGame();
  g.api.buyItem('tee-sun'); await g.svc.flush();
  const loaded = await makeGame({ adapter: new MemoryAdapter(), mirror: g.mirror }).svc.load();
  assert.equal(loaded.source, 'mirror');
  assert.ok(loaded.state.wardrobe.owned['tee-sun']);
});
test('полностью нечитаемое сохранение: начинается новая игра, но данные сохранены в карантине', async () => {
  const ad = new MemoryAdapter();
  await ad.put('kv', 'save', { garbage: true });
  const loaded = await makeGame({ adapter: ad, mirror: memStorage() }).svc.load();
  assert.equal(loaded.isNew, true);
  assert.equal((await ad.list('quarantine')).length, 1);
});
test('первый запуск: новая игра без предупреждений', async () => {
  const loaded = await makeGame({ adapter: new MemoryAdapter(), mirror: memStorage() }).svc.load();
  assert.equal(loaded.isNew, true); assert.equal(loaded.warnings.length, 0);
  assert.equal(loaded.state.currencies.bananas, 120);
});

// ---------------- экспорт / импорт ----------------
test('экспорт содержит все разделы и корректную контрольную сумму', () => {
  const g = makeGame();
  g.api.claimDaily();
  const file = buildSaveFile(g.state(), g.clock.t);
  assert.equal(file.format, 'STEFANIA_WORLD_SAVE'); assert.equal(file.schemaVersion, 1);
  for (const s of SAVE_SECTIONS) assert.ok((file as any)[s] !== undefined, s);
  assert.equal(computeChecksum(file as any), file.integrity.checksum);
  const text = serializeSave(file);
  assert.ok(text.includes('\n  "player"'), 'читаемый JSON');
});
test('экспорт → импорт возвращает ровно то же состояние', () => {
  const g = makeGame();
  giveFunds(g, 2000, 500, 10);
  g.api.buyItem('cap-red'); g.api.equip('pip', 'cap-red'); g.api.saveOutfit('pip', 'Тест');
  g.api.claimDaily();
  const text = serializeSave(buildSaveFile(g.state(), g.clock.t));
  const res = parseSaveText(text, g.clock.t);
  assert.ok(res.ok);
  if (res.ok) {
    assert.equal(res.integrity, 'ok'); assert.equal(res.migrated, false);
    assert.equal(snapshot(res.state), snapshot(g.state()));
    assert.equal(res.summary.bananas, g.state().currencies.bananas);
  }
});
test('импорт: битый JSON, чужой формат, подмена данных, будущая схема — всё отклоняется', () => {
  const g = makeGame();
  const good = buildSaveFile(g.state(), g.clock.t);
  assert.equal((parseSaveText('{ not json', g.clock.t) as any).stage, 'parse');
  assert.equal((parseSaveText(JSON.stringify({ hello: 1 }), g.clock.t) as any).stage, 'format');
  const tampered = JSON.parse(JSON.stringify(good)); tampered.currencies.bananas += 1;
  const r1 = parseSaveText(JSON.stringify(tampered), g.clock.t);
  assert.equal(r1.ok, false); assert.equal((r1 as any).stage, 'integrity');
  const future = JSON.parse(JSON.stringify(good)); future.schemaVersion = 99; future.integrity.checksum = computeChecksum(future);
  const r2 = parseSaveText(JSON.stringify(future), g.clock.t);
  assert.equal(r2.ok, false); assert.equal((r2 as any).stage, 'compat');
  const broken = JSON.parse(JSON.stringify(good)); delete broken.currencies; broken.integrity.checksum = computeChecksum(broken);
  // отсутствующий раздел достраивается значениями по умолчанию, но отрицательный баланс — ошибка
  const neg = JSON.parse(JSON.stringify(good)); neg.currencies.coins = -5; neg.integrity.checksum = computeChecksum(neg);
  const r3 = parseSaveText(JSON.stringify(neg), g.clock.t);
  assert.equal(r3.ok, false); assert.equal((r3 as any).stage, 'validate');
  const r4 = parseSaveText(JSON.stringify(broken), g.clock.t);
  assert.equal(r4.ok, true, 'пропущенный раздел восстанавливается значениями по умолчанию');
});
test('применение импорта: резервная копия текущего, замена, запись и проверка чтением; некорректный файл ничего не трогает', async () => {
  const src = makeGame();
  giveFunds(src, 1000);
  src.api.buyItem('cap-red'); src.api.buyItem('tee-sun');
  const text = serializeSave(buildSaveFile(src.state(), src.clock.t));
  const dst = makeGame();
  dst.api.buyItem('tee-sky');
  const res = parseSaveText(text, dst.clock.t);
  assert.ok(res.ok);
  const before = dst.state();
  const bad = parseSaveText('{"format":"X"}', dst.clock.t);
  assert.equal(bad.ok, false);
  assert.equal(dst.state(), before, 'ошибка проверки не меняет прогресс');
  if (res.ok) {
    const out = await dst.svc.applyImport(dst.store, res);
    assert.equal(out.verified, true);
    assert.ok(dst.state().wardrobe.owned['cap-red']); assert.equal(dst.state().wardrobe.owned['tee-sky'], undefined);
    const backups = await dst.svc.listBackups();
    assert.ok(backups.some((b) => b.reason === 'import'));
    const old = await dst.svc.readBackup(backups.find((b) => b.reason === 'import')!.id);
    assert.ok(old && old.state.wardrobe.owned['tee-sky'], 'прежний прогресс можно вернуть из копии');
  }
});
test('резервные копии «import/reset/migration» не удаляются при ротации авто-копий', async () => {
  const g = makeGame();
  await g.svc.createBackup(g.state(), 'import');
  for (let i = 0; i < 12; i++) { g.advance(1000); await g.svc.createBackup(g.state(), 'auto'); }
  const metas = await g.svc.listBackups();
  assert.equal(metas.filter((m) => m.reason === 'auto').length, 7);
  assert.equal(metas.filter((m) => m.reason === 'import').length, 1);
});
test('сброс прогресса: создаётся копия, новая игра, всё сохранено', async () => {
  const g = makeGame();
  g.api.buyItem('tee-sun');
  const backup = await g.svc.resetProgress(g.store);
  assert.equal(backup.reason, 'reset');
  assert.equal(g.state().wardrobe.owned['tee-sun'], undefined);
  assert.equal(g.state().currencies.bananas, 120);
  assert.ok(g.state().metadata.revision > backup.revision);
});

// ---------------- главный сценарий из ТЗ ----------------
test('СЦЕНАРИЙ: уровни → 500 бананов → костюм → новый Нанабо → лаборатория → достижения → экспорт → перезапуск → импорт = тот же прогресс', async () => {
  const g = makeGame();
  clearLevels(g, ['w1l1', 'w1l2']);
  giveFunds(g, 500, 400, 5);
  g.store.tx((d) => { d.player.level = Math.max(d.player.level, 8); });
  // костюм
  g.api.buyItem('chef-coat'); g.api.equip('pip', 'chef-coat');
  g.api.equip('pip', 'cap-red'); // cap-red получена за первый уровень
  // новый Миньон (награда за уровень 5 — через прохождение)
  g.store.tx((d) => { d.levels['w1l3'].stars = 1; d.levels['w1l4'].stars = 1; });
  clearLevels(g, ['w1l5']);
  assert.ok(g.state().characters['zuzu'].unlocked);
  // лаборатория
  giveFunds(g, 3000, 1500, 20);
  g.api.unlockRoom('lab'); g.api.upgradeRoom('lab');
  assert.ok(g.state().characters['sprocket'].unlocked);
  g.api.saveOutfit('pip', 'Повар');
  g.api.claimDaily();
  assert.ok(Object.keys(g.state().achievements).length >= 3);
  await g.svc.flush();
  const before = snapshot(g.state());
  // экспорт
  const text = serializeSave(buildSaveFile(g.state(), g.clock.t));
  // «закрыли игру» — новая сессия поверх тех же данных
  const reopened = makeGame({ adapter: g.adapter, mirror: g.mirror, start: g.clock.t + DAY });
  const loaded = await reopened.svc.load();
  assert.equal(snapshot(loaded.state), before, 'после перезапуска всё на месте');
  // «обновили приложение»: чистое хранилище новой версии, импорт старого файла
  const fresh = makeGame({ adapter: new MemoryAdapter(), mirror: memStorage(), start: g.clock.t + 2 * DAY });
  const res = parseSaveText(text, fresh.clock.t);
  assert.ok(res.ok);
  if (!res.ok) return;
  await fresh.svc.applyImport(fresh.store, res);
  const a = fresh.state(), b = JSON.parse(before) as any;
  for (const sec of SAVE_SECTIONS.filter((s) => s !== 'metadata')) assert.equal(canonicalize((a as any)[sec]), canonicalize(b[sec]), `раздел ${sec} совпадает`);
  assert.equal(a.currencies.bananas, b.currencies.bananas);
  assert.ok(a.wardrobe.owned['chef-coat'] && a.characters['zuzu'].unlocked && a.base.rooms.lab.level === 2);
  assert.deepEqual(a.characters['pip'].equipped, { costume: 'chef-coat', hat: 'cap-red' });
});

// защита: повторная загрузка после импорта не размножает награды
test('перезагрузка не начисляет награды повторно (журнал событий сохраняется)', async () => {
  const g = makeGame();
  g.api.claimDaily(); g.api.completeLevel({ levelId: 'w1l1', runId: 'fixed-run-1', success: true, metric: 99 });
  await g.svc.flush();
  const b1 = g.state().currencies.bananas;
  const g2 = makeGame({ adapter: g.adapter, mirror: g.mirror });
  const st = (await g2.svc.load()).state;
  const store2 = new GameStore(st, { clock: () => g.clock.t, persist: (s) => g2.svc.save(s) });
  const api2 = createApi(store2);
  assert.throws(() => api2.claimDaily());
  assert.throws(() => api2.completeLevel({ levelId: 'w1l1', runId: 'fixed-run-1', success: true, metric: 99 }), (e: any) => e.code === 'dup_run');
  assert.equal(store2.getState().currencies.bananas, b1);
});
void wrap; void createNewState; void rid;

test('восстановление из копии: создаётся копия текущего, прогресс возвращается к состоянию копии, запись проверена', async () => {
  const g = makeGame();
  giveFunds(g, 500); g.api.buyItem('tee-sun');
  await g.svc.flush();
  const early = await g.svc.createBackup(g.state(), 'manual');
  const earlyBananas = g.state().currencies.bananas;
  giveFunds(g, 700); g.api.buyItem('tee-sky');
  const laterSnapshot = snapshot(g.state());
  const r = await g.svc.restoreBackup(g.store, early.id);
  assert.ok(r && r.verified);
  assert.equal(g.state().currencies.bananas, earlyBananas);
  assert.ok(!g.state().wardrobe.owned['tee-sky']);
  // «позднее» состояние не потеряно: оно лежит в копии перед восстановлением
  const kept = await g.svc.readBackup(r!.backup.id);
  assert.equal(snapshot(kept!.state), laterSnapshot);
  assert.equal(r!.backup.reason, 'restore');
  assert.equal(await g.svc.restoreBackup(g.store, 'нет-такой-копии'), null);
});
