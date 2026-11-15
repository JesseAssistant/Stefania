import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../../src/game/data/items';
import { wearFn } from '../../src/art/registry';

test('у каждого предмета есть рисунок (art.kind) в своём слое', () => {
  const missing = ITEMS.filter((i) => !wearFn(i.layer, i.art.kind)).map((i) => `${i.id}:${i.layer}/${i.art.kind}`);
  assert.deepEqual(missing, []);
});
