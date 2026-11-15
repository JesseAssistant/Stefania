import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../../src/game/data/worlds';
import { ITEMS } from '../../src/game/data/items';
import { OUTFIT_THEMES, themeScore } from '../../src/games/OutfitChallenge';
import { computeStars } from '../../src/game/engine/levels';
import { RECIPES } from '../../src/game/data/decor';
import { INGREDIENTS } from '../../src/game/data/decor';

const bestScore = (theme: string, slots: number) => {
  const perLayer = new Map<string, number>();
  for (const i of ITEMS) perLayer.set(i.layer, Math.max(perLayer.get(i.layer) || 0, themeScore(theme, i)));
  return [...perLayer.values()].sort((a, b) => b - a).slice(0, slots).reduce((a, x) => a + x, 0);
};

test('модный вызов: у каждой темы хватает вещей, чтобы набрать максимум на 3 звезды', () => {
  for (const l of LEVELS) {
    const stages = l.game.kind === 'gauntlet' ? l.game.stages : [l.game];
    for (const g of stages) {
      if (g.kind !== 'outfit-challenge') continue;
      assert.ok(OUTFIT_THEMES[g.themeId], `${l.id}: тема ${g.themeId}`);
      const best = bestScore(g.themeId, g.slots);
      assert.ok(best >= g.slots * 5, `${l.id}: невозможно пройти (${best})`);
      if (l.game.kind === 'outfit-challenge') assert.equal(computeStars(l, true, best), 3, `${l.id}: максимум ${best} не даёт 3 звезды`);
    }
  }
});

test('звёзды: пороги уровней упорядочены логично, а проигрыш не даёт звёзд', () => {
  for (const l of LEVELS) {
    const r = l.stars;
    if (l.game.kind === 'task') continue;
    assert.ok(r.dir === 'high' ? r.three >= r.two : r.three <= r.two, `${l.id}: 3 звезды должны быть труднее 2`);
    assert.equal(computeStars(l, false, r.dir === 'high' ? 999 : 0), 0, l.id);
    assert.equal(computeStars(l, true, r.dir === 'high' ? r.two : r.two), 2, l.id);
    assert.equal(computeStars(l, true, r.dir === 'high' ? 0 : 9999), 1, l.id);
  }
});

test('кухня: в каждом рецепте есть все продукты на полке и отвлекающие продукты не совпадают с нужными', () => {
  for (const r of RECIPES) {
    for (const id of [...r.steps, ...r.extras]) assert.ok(INGREDIENTS[id], `${r.id}: нет продукта ${id}`);
    assert.equal(r.extras.filter((e) => r.steps.includes(e)).length, 0, `${r.id}: лишний продукт совпадает с нужным`);
  }
});

test('охота за предметами и сортировка: настройки уровней выполнимы', () => {
  for (const l of LEVELS) {
    const gs = l.game.kind === 'gauntlet' ? l.game.stages : [l.game];
    for (const g of gs) {
      if (g.kind === 'treasure-hunt') { assert.ok(g.hidden <= 8 && g.time >= 30 * 0 + 40, l.id); }
      if (g.kind === 'sorting') assert.ok(g.time / g.items >= 2, `${l.id}: слишком мало времени на предмет`);
      if (g.kind === 'memory') assert.ok(g.maxMoves >= g.pairs, `${l.id}: ходов меньше, чем пар`);
    }
  }
});
