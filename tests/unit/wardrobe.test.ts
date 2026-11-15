import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGame, giveFunds } from '../helpers';

test('одеть можно только купленное; слои заменяют друг друга', () => {
  const g = makeGame();
  assert.throws(() => g.api.equip('pip', 'cap-red'), (e: any) => e.code === 'not_owned');
  g.api.buyItem('cap-red'); g.api.buyItem('cap-blue');
  g.api.equip('pip', 'cap-red');
  assert.equal(g.state().characters['pip'].equipped.hat, 'cap-red');
  g.api.equip('pip', 'cap-blue');
  assert.equal(g.state().characters['pip'].equipped.hat, 'cap-blue');
});
test('снять предмет и вернуть предыдущую одежду', () => {
  const g = makeGame();
  g.api.buyItem('cap-red'); g.api.buyItem('tee-sun');
  g.api.equip('pip', 'cap-red'); g.api.equip('pip', 'tee-sun');
  g.api.unequip('pip', 'hat');
  assert.equal(g.state().characters['pip'].equipped.hat, undefined);
  g.api.undoLook('pip'); // вернули шапку
  assert.equal(g.state().characters['pip'].equipped.hat, 'cap-red');
  g.api.undoLook('pip');
  assert.equal(g.state().characters['pip'].equipped.outfit, undefined);
});
test('нельзя одеть не открытого персонажа', () => {
  const g = makeGame();
  g.api.buyItem('cap-red');
  assert.throws(() => g.api.equip('jinx', 'cap-red'), (e: any) => e.code === 'no_char');
});
test('образы: сохранить, применить к другому, избранное, лимит слотов гардеробной', () => {
  const g = makeGame();
  giveFunds(g, 5000);
  assert.throws(() => g.api.saveOutfit('pip', 'пусто'), (e: any) => e.code === 'empty');
  g.api.buyItem('cap-red'); g.api.buyItem('tee-sun');
  g.api.equip('pip', 'cap-red'); g.api.equip('pip', 'tee-sun');
  const o = g.api.saveOutfit('pip', 'Мой образ');
  assert.equal(g.state().outfits.saved.length, 1);
  g.api.applyOutfit(o.id, 'mochi');
  assert.equal(g.state().characters['mochi'].equipped.hat, 'cap-red');
  g.api.toggleFavorite('outfits', o.id);
  assert.ok(g.state().player.favorites.outfits.includes(o.id));
  for (let i = 0; i < 3; i++) g.api.saveOutfit('pip', `Образ ${i}`);
  assert.equal(g.state().outfits.saved.length, 4);
  assert.throws(() => g.api.saveOutfit('pip', 'лишний'), (e: any) => e.code === 'full');
  g.api.upgradeRoom('wardrobe');
  g.api.saveOutfit('pip', 'теперь влезет');
  assert.equal(g.state().outfits.saved.length, 5);
  g.api.deleteOutfit(o.id);
  assert.ok(!g.state().player.favorites.outfits.includes(o.id));
});
test('комплекты: цена со скидкой считается по ещё не купленным частям; можно надеть весь набор', () => {
  const g = makeGame();
  giveFunds(g, 9999, 9999, 100);
  g.store.tx((d) => { d.player.level = 10; });
  g.api.buySet('set-sport');
  for (const p of ['jersey-champ', 'cap-red', 'sneakers-white', 'medal-gold']) assert.ok(g.state().wardrobe.owned[p], p);
  assert.throws(() => g.api.buySet('set-sport'), (e: any) => e.code === 'cannot');
  g.api.equipSet('pip', 'set-sport');
  assert.equal(g.state().characters['pip'].equipped.jewelry, 'medal-gold');
});
test('фотоальбом ограничен вместимостью', () => {
  const g = makeGame();
  for (let i = 0; i < 6; i++) g.api.takePhoto('pip', 'sunny', `фото ${i}`, 'happy');
  assert.throws(() => g.api.takePhoto('pip', 'sunny', 'ещё', 'happy'), (e: any) => e.code === 'full');
});
test('свободная игра не меняет основной прогресс и не сохраняется', async () => {
  const g = makeGame();
  g.api.buyItem('tee-sun');
  await g.svc.flush();
  const main = g.state();
  const savedRev = (await g.adapter.get('kv', 'save')).revision;
  g.store.enterSandbox();
  assert.equal(g.store.mode, 'sandbox');
  assert.equal(g.state().currencies.bananas, 99999);
  g.api.equip('pip', 'hoodie-night'); // в песочнице все предметы открыты
  await g.svc.flush();
  assert.equal((await g.adapter.get('kv', 'save')).revision, savedRev, 'в хранилище ничего не записано');
  g.store.exitSandbox();
  assert.equal(g.state(), main, 'основное состояние то же самое');
  assert.equal(g.state().wardrobe.owned['hoodie-night'], undefined);
  assert.equal(g.state().currencies.bananas, 60);
});
