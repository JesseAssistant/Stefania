/**
 * v0 -> v1: перенос данных раннего «прототипа» (плоская структура) в схему 1.
 *
 * Формат v0 (документирован в docs/migrations.md):
 * {
 *   format: "STEFANIA_WORLD_SAVE", schemaVersion: 0, version: "0.9",
 *   profile: { name, level, xp },
 *   wallet: { bananas, coins, crystals },
 *   heroes: ["pip", ...], heroLevels: { pip: { lvl, xp } },
 *   closet: ["tee-sun", ...], wearing: { pip: { hat: "cap-red" } },
 *   stars: { w1l1: 3 }, roomLevels: { hall: 2 },
 *   achievements: ["first-banana"], settings: { music: true, sfx: true }
 * }
 * Миграция возвращает только то, что знает; недостающее добавит hydrate().
 */
export function migrateV0toV1(v0: any): any {
  const out: any = {
    format: v0.format || 'STEFANIA_WORLD_SAVE',
    schemaVersion: 1,
    gameVersion: v0.version ? String(v0.version) : '0.9.0',
    exportedAt: v0.exportedAt || new Date(0).toISOString(),
  };
  const p = v0.profile || {};
  out.player = {};
  if (typeof p.name === 'string') out.player.name = p.name;
  if (Number.isInteger(p.level)) out.player.level = p.level;
  if (Number.isInteger(p.xp)) out.player.xp = p.xp;
  if (Number.isInteger(p.xp)) out.player.totalXp = p.xp;
  const w = v0.wallet || {};
  out.currencies = {};
  for (const k of ['bananas', 'coins', 'crystals']) if (Number.isInteger(w[k]) && w[k] >= 0) out.currencies[k] = w[k];
  if (Number.isInteger(w.bananas)) out.currencies.lifetime = { bananas: w.bananas };
  out.characters = {};
  for (const id of v0.heroes || []) out.characters[id] = { unlocked: true, source: 'migrated-v0' };
  for (const [id, lv] of Object.entries(v0.heroLevels || {}) as [string, any][]) {
    out.characters[id] = { ...(out.characters[id] || { unlocked: true, source: 'migrated-v0' }), level: Math.max(1, lv.lvl | 0), xp: Math.max(0, lv.xp | 0) };
  }
  for (const [id, eq] of Object.entries(v0.wearing || {}) as [string, any][]) {
    out.characters[id] = { ...(out.characters[id] || { unlocked: true, source: 'migrated-v0' }), equipped: { ...eq } };
  }
  out.wardrobe = { owned: {} };
  for (const id of v0.closet || []) out.wardrobe.owned[id] = { at: new Date(0).toISOString(), source: 'migrated-v0' };
  out.levels = {};
  for (const [id, stars] of Object.entries(v0.stars || {}) as [string, any][]) {
    const s = Math.max(0, Math.min(3, stars | 0));
    out.levels[id] = { status: s > 0 ? 'cleared' : 'open', stars: s, best: null, plays: s > 0 ? 1 : 0, clears: s > 0 ? 1 : 0 };
  }
  out.base = { rooms: {} };
  for (const [id, lvl] of Object.entries(v0.roomLevels || {}) as [string, any][]) {
    out.base.rooms[id] = { unlocked: true, level: Math.max(1, lvl | 0), decor: [], occupants: [] };
  }
  out.achievements = {};
  for (const id of v0.achievements || []) out.achievements[id] = { at: new Date(0).toISOString() };
  out.settings = {};
  if (v0.settings) {
    if (typeof v0.settings.music === 'boolean') out.settings.musicOn = v0.settings.music;
    if (typeof v0.settings.sfx === 'boolean') out.settings.sfxOn = v0.settings.sfx;
  }
  out.metadata = { migrations: [] };
  return out;
}
