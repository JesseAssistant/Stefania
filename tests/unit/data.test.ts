import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, CHARACTER_MAP } from '../../src/game/data/characters';
import { ITEMS, ITEM_MAP, SETS } from '../../src/game/data/items';
import { DECOR_MAP, CARD_MAP, CARDS, DECOR, RECIPES, INGREDIENTS, FOODS, SECRETS } from '../../src/game/data/decor';
import { LEVELS, WORLDS } from '../../src/game/data/worlds';
import { ALL_QUESTS, ACHIEVEMENTS } from '../../src/game/data/quests';
import { ROOMS } from '../../src/game/data/rooms';
import type { Reward } from '../../src/game/types';

function checkReward(r: Reward, where: string) {
  for (const i of r.items || []) assert.ok(ITEM_MAP[i], `${where}: нет предмета ${i}`);
  for (const i of r.decor || []) assert.ok(DECOR_MAP[i], `${where}: нет декорации ${i}`);
  for (const i of r.cards || []) assert.ok(CARD_MAP[i], `${where}: нет карточки ${i}`);
  for (const i of r.characters || []) assert.ok(CHARACTER_MAP[i], `${where}: нет персонажа ${i}`);
  for (const f of Object.keys(r.food || {})) assert.ok(FOODS[f], `${where}: нет блюда ${f}`);
  for (const k of ['bananas', 'coins', 'crystals', 'xp'] as const) if (r[k] !== undefined) assert.ok(Number.isInteger(r[k]) && (r[k] as number) >= 0, `${where}: ${k}`);
}

test('контент: количество и уникальность id', () => {
  assert.ok(CHARACTERS.length >= 14);
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, CHARACTERS.length);
  assert.ok(ITEMS.length >= 80);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  assert.equal(ROOMS.length, 10); assert.equal(WORLDS.length, 5); assert.equal(LEVELS.length, 40);
  assert.equal(CARDS.length, 30); assert.equal(SECRETS.length, 8);
  assert.equal(new Set(ALL_QUESTS.map((q) => q.id)).size, ALL_QUESTS.length);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});
test('все категории и редкости представлены', () => {
  for (const cat of ['outfit', 'costume', 'hat', 'eyewear', 'shoes', 'jewelry', 'special']) assert.ok(ITEMS.some((i) => i.category === cat), cat);
  for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary']) { assert.ok(ITEMS.some((i) => i.rarity === r), r); assert.ok(CHARACTERS.some((c) => c.rarity === r), r); }
  assert.ok(SETS.some((s) => s.category === 'theme') && SETS.some((s) => s.category === 'season'));
});
test('ссылки внутри данных корректны', () => {
  for (const s of SETS) for (const p of s.pieces) { assert.ok(ITEM_MAP[p], `${s.id}: ${p}`); assert.notEqual(ITEM_MAP[p].unlock.type, 'reward', `${s.id}: ${p} не покупается`); }
  for (const l of LEVELS) { checkReward(l.first, l.id + ' first'); checkReward(l.star2, l.id + ' s2'); checkReward(l.star3, l.id + ' s3'); checkReward(l.replay, l.id + ' replay'); }
  for (const q of ALL_QUESTS) checkReward(q.reward, q.id);
  for (const a of ACHIEVEMENTS) checkReward(a.reward, a.id);
  for (const c of CHARACTERS) {
    const u = c.unlock;
    if (u.kind === 'level') assert.ok(LEVELS.some((l) => l.id === u.levelId), c.id);
    if (u.kind === 'room') assert.ok(ROOMS.some((r) => r.id === u.room), c.id);
    if (u.kind === 'quest') assert.ok(ALL_QUESTS.some((q) => q.id === u.id), c.id);
    if (u.kind === 'achievement') assert.ok(ACHIEVEMENTS.some((a) => a.id === u.id), c.id);
  }
  for (const r of RECIPES) for (const i of [...r.steps, ...r.extras]) assert.ok(INGREDIENTS[i], `${r.id}: ${i}`);
  assert.ok(DECOR.length >= 20);
});
test('каждый персонаж реально достижим (есть источник открытия)', () => {
  const grantedChars = new Set<string>();
  for (const l of LEVELS) (l.first.characters || []).forEach((c) => grantedChars.add(c));
  for (const q of ALL_QUESTS) (q.reward.characters || []).forEach((c) => grantedChars.add(c));
  for (const a of ACHIEVEMENTS) (a.reward.characters || []).forEach((c) => grantedChars.add(c));
  for (const c of CHARACTERS) {
    const u = c.unlock;
    const ok = u.kind === 'start' || u.kind === 'room' || u.kind === 'chest' || u.kind === 'secrets' || u.kind === 'daily' || grantedChars.has(c.id);
    assert.ok(ok, `${c.id} недостижим`);
  }
});
test('карточки: каждая достижима (награда уровня, мировой набор или сундук)', () => {
  const given = new Set<string>();
  for (const l of LEVELS) (l.first.cards || []).forEach((c) => given.add(c));
  for (let w = 1; w <= 5; w++) given.add(`card-w${w}-6`);
  for (const c of CARDS) assert.ok(given.has(c.id) || c.rarity !== 'legendary', c.id);
  assert.ok(given.size >= 25);
});
