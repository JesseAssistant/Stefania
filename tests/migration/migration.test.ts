import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrateData, planMigrations, MIGRATIONS, type Migration } from '../../src/storage/migrations';
import { parseSaveText, buildSaveFile, serializeSave, computeChecksum } from '../../src/storage/exportImport';
import { hydrate } from '../../src/storage/hydrate';
import { validateState } from '../../src/storage/validators/schema';
import { makeGame } from '../helpers';

const v0 = () => readFileSync(new URL('./fixtures/v0_prototype.json', import.meta.url), 'utf8');

test('v0 → v1: валюта, персонажи, одежда, звёзды, комнаты, достижения и настройки сохраняются', () => {
  const res = parseSaveText(v0(), 1_000_000);
  assert.ok(res.ok, JSON.stringify(res));
  if (!res.ok) return;
  const s = res.state;
  assert.equal(res.migrated, true);
  assert.deepEqual([s.currencies.bananas, s.currencies.coins, s.currencies.crystals], [1250, 310, 12]);
  assert.equal(s.player.level, 7); assert.equal(s.player.xp, 340); assert.equal(s.player.name, 'Stefania');
  for (const id of ['pip', 'mochi', 'zuzu']) assert.ok(s.characters[id].unlocked, id);
  assert.equal(s.characters['pip'].level, 4); assert.equal(s.characters['pip'].xp, 55);
  assert.deepEqual(s.characters['pip'].equipped, { hat: 'cap-red', outfit: 'tee-sun' });
  for (const id of ['tee-sun', 'cap-red', 'chef-coat']) assert.ok(s.wardrobe.owned[id], id);
  assert.equal(s.levels['w1l1'].stars, 3); assert.equal(s.levels['w1l2'].stars, 2);
  assert.equal(s.base.rooms.hall.level, 2); assert.equal(s.base.rooms.kitchen.level, 1);
  assert.ok(s.achievements['first-banana']);
  assert.equal(s.settings.musicOn, false); assert.equal(s.settings.sfxOn, true);
  assert.equal(validateState(s).ok, true);
});
test('миграция не меняет исходные данные и повторный запуск даёт тот же результат', () => {
  const raw = JSON.parse(v0());
  const copy = JSON.stringify(raw);
  const a = migrateData(raw), b = migrateData(raw);
  assert.equal(JSON.stringify(raw), copy, 'вход не изменён');
  assert.deepEqual(a.data, b.data);
  assert.equal(a.applied.length, 1);
});
test('миграция уже актуального формата ничего не делает', () => {
  const g = makeGame();
  const r = migrateData(JSON.parse(serializeSave(buildSaveFile(g.state(), 1))));
  assert.ok(r.ok); assert.equal(r.applied.length, 0);
});
test('сохранение из будущей версии отклоняется понятным сообщением, а не портится', () => {
  const r = migrateData({ schemaVersion: 42 });
  assert.equal(r.ok, false); assert.match(r.error!, /новой версией/);
  assert.equal(migrateData({ schemaVersion: -1 }).ok, false);
  assert.equal(migrateData({ schemaVersion: 'x' }).ok, false);
});
test('цепочка миграций v1→v2→v3 (проверка механизма на тестовом реестре)', () => {
  const reg: Migration[] = [
    ...MIGRATIONS,
    { from: 1, to: 2, name: 'test-1-2', migrate: (d) => { d.currencies.bananas += 1; d.extra = { a: 1 }; return d; } },
    { from: 2, to: 3, name: 'test-2-3', migrate: (d) => { d.extra.b = 2; return d; } },
  ];
  assert.equal(planMigrations(0, 3, reg)!.length, 3);
  const r = migrateData(JSON.parse(v0()), reg, 3);
  assert.ok(r.ok); assert.equal(r.data.schemaVersion, 3);
  assert.equal(r.data.currencies.bananas, 1251); assert.deepEqual(r.data.extra, { a: 1, b: 2 });
  assert.deepEqual(r.applied.map((a) => a.name), ['prototype-v0 -> schema-1', 'test-1-2', 'test-2-3']);
  assert.equal(planMigrations(1, 5, reg), null, 'нет пути → null');
});
test('ошибка внутри миграции не повреждает данные и возвращает понятную ошибку', () => {
  const reg: Migration[] = [{ from: 1, to: 2, name: 'boom', migrate: () => { throw new Error('boom'); } }];
  const input = { schemaVersion: 1, a: 1 };
  const r = migrateData(input, reg, 2);
  assert.equal(r.ok, false); assert.match(r.error!, /boom/);
  assert.deepEqual(input, { schemaVersion: 1, a: 1 });
});
test('мигрированное сохранение можно экспортировать и снова импортировать без потерь', () => {
  const first = parseSaveText(v0(), 5);
  assert.ok(first.ok); if (!first.ok) return;
  const text = serializeSave(buildSaveFile(first.state, 6));
  const second = parseSaveText(text, 7);
  assert.ok(second.ok); if (!second.ok) return;
  assert.equal(second.migrated, false); assert.equal(second.integrity, 'ok');
  assert.equal(second.state.currencies.bananas, 1250);
  assert.ok(second.state.wardrobe.owned['chef-coat']);
});
test('hydrate достраивает новые разделы и новый контент, не трогая прогресс', () => {
  const g = makeGame(); g.api.buyItem('tee-sun');
  const file: any = JSON.parse(serializeSave(buildSaveFile(g.state(), 1)));
  delete file.integrity; delete file.photos; delete file.base.lab; // «старый» файл без новых полей
  const h = hydrate(file, 10).state;
  assert.ok(h.wardrobe.owned['tee-sun']);
  assert.ok(h.base.lab && Array.isArray(h.base.lab.queue));
  assert.equal(validateState(h).ok, true);
  void computeChecksum;
});
