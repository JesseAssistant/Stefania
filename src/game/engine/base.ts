import { GameError } from '../types';
import type { Cost, GameState, MaterialId, RoomId, StatId } from '../types';
import { MATERIALS } from '../types';
import { ROOMS, ROOM_MAP, roomFx } from '../data/rooms';
import { DECOR_MAP, CRAFT_MAP, FOODS, RECIPE_MAP, RESEARCH_MAP } from '../data/decor';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { SECRETS, SECRET_MAP } from '../data/decor';
import { TRAIN_COOLDOWN_SEC, TRAIN_COST } from '../data/economy';
import { dateKey, uid } from '../util';
import type { Ctx } from './context';
import { nowIso } from './context';
import { earn, scaleCost, spend } from './economy';
import { addCharXp, grantReward, logHistory, unlockCharacter } from './rewards';

const HOUR = 3600000;

// ---------- Комнаты ----------
export function decorSlotCount(d: GameState, room: RoomId): number {
  return roomFx.decorSlots(room, d.base.rooms[room].level, d.base.rooms.playroom.unlocked ? d.base.rooms.playroom.level : 0);
}
export function bedCount(d: GameState): number { return roomFx.beds(d.base.rooms.bedroom.level); }
/** Приводит массивы слотов комнат к актуальной длине (после улучшений и обновлений контента). */
export function normalizeRooms(d: GameState): void {
  for (const r of ROOMS) {
    const st = d.base.rooms[r.id];
    const n = decorSlotCount(d, r.id);
    while (st.decor.length < n) st.decor.push(null);
    if (r.id === 'bedroom') { const b = bedCount(d); while (st.occupants.length < b) st.occupants.push(null); }
  }
  const pn = roomFx.personalDecorSlots(d.base.personalRoom.level);
  while (d.base.personalRoom.decor.length < pn) d.base.personalRoom.decor.push(null);
}
export function unlockRoom(d: GameState, ctx: Ctx, id: RoomId): void {
  const def = ROOM_MAP[id], st = d.base.rooms[id];
  if (st.unlocked) throw new GameError('already', 'Комната уже открыта');
  if (d.player.level < def.unlock.playerLevel) throw new GameError('level', `Нужен ${def.unlock.playerLevel} уровень Stefania`);
  if (def.unlock.secrets && Object.keys(d.collections.secrets).length < def.unlock.secrets) throw new GameError('secrets', `Найди ${def.unlock.secrets} секретных предмета`);
  spend(d, ctx, def.unlock.cost, `room:${id}`);
  st.unlocked = true; st.level = 1; st.unlockedAt = nowIso(ctx);
  if (id === 'bedroom') d.base.bedroom.lastCollectAt = nowIso(ctx);
  normalizeRooms(d);
  ctx.emit({ type: 'room_unlocked', room: id });
  logHistory(d, ctx, 'room', `Открыта комната: ${def.name}`);
  for (const c of CHARACTERS) if (c.unlock.kind === 'room' && c.unlock.room === id) unlockCharacter(d, ctx, c.id, `room:${id}`);
  ctx.notify({ type: 'toast', text: `Открыто: ${def.name}!`, tone: 'good' });
}
export function upgradeCost(d: GameState, id: RoomId): Cost | null {
  const def = ROOM_MAP[id], st = d.base.rooms[id];
  if (!st.unlocked || st.level >= def.maxLevel) return null;
  return def.upgrades[st.level - 1];
}
export function upgradeRoom(d: GameState, ctx: Ctx, id: RoomId): void {
  const st = d.base.rooms[id];
  if (!st.unlocked) throw new GameError('locked', 'Комната ещё закрыта');
  const cost = upgradeCost(d, id);
  if (!cost) throw new GameError('max', 'Максимальный уровень комнаты');
  if (id === 'bedroom') collectRest(d, ctx, true);
  spend(d, ctx, cost, `upgrade:${id}`);
  st.level++;
  d.statistics.roomsUpgraded++;
  normalizeRooms(d);
  ctx.emit({ type: 'room_upgraded', room: id, level: st.level });
  logHistory(d, ctx, 'room', `${ROOM_MAP[id].name}: уровень ${st.level}`);
}

// ---------- Декорации ----------
export function placedCount(d: GameState, decorId: string): number {
  let n = 0;
  for (const r of ROOMS) n += d.base.rooms[r.id].decor.filter((x) => x === decorId).length;
  n += d.base.personalRoom.decor.filter((x) => x === decorId).length;
  return n;
}
export const availableDecor = (d: GameState, id: string) => (d.inventory.decor[id] || 0) - placedCount(d, id);
export function roomComfort(d: GameState, room: RoomId): number {
  return d.base.rooms[room].decor.reduce((a, x) => a + (x ? DECOR_MAP[x]?.comfort || 0 : 0), 0);
}
export const totalComfort = (d: GameState) => ROOMS.reduce((a, r) => a + roomComfort(d, r.id), 0) + d.base.personalRoom.decor.reduce((a, x) => a + (x ? DECOR_MAP[x]?.comfort || 0 : 0), 0);
function slotsOf(d: GameState, room: RoomId | 'personal'): (string | null)[] { return room === 'personal' ? d.base.personalRoom.decor : d.base.rooms[room].decor; }
export function placeDecor(d: GameState, ctx: Ctx, room: RoomId | 'personal', slot: number, decorId: string): void {
  if (room !== 'personal' && !d.base.rooms[room].unlocked) throw new GameError('locked', 'Комната закрыта');
  const slots = slotsOf(d, room);
  if (slot < 0 || slot >= slots.length) throw new GameError('slot', 'Нет такого места');
  if (!DECOR_MAP[decorId]) throw new GameError('no_decor', 'Такой декорации нет');
  const prev = slots[slot];
  slots[slot] = null;
  if (availableDecor(d, decorId) <= 0) { slots[slot] = prev; throw new GameError('none', 'Нет свободных экземпляров этой декорации'); }
  slots[slot] = decorId;
  d.statistics.decorPlaced++;
  ctx.emit({ type: 'decor_placed' });
}
export function removeDecor(d: GameState, room: RoomId | 'personal', slot: number): void { const s = slotsOf(d, room); if (slot >= 0 && slot < s.length) s[slot] = null; }

// ---------- Банановая корзина (холл) ----------
export function basketStatus(d: GameState, now: number) {
  const hall = d.base.rooms.hall;
  const rate = roomFx.hallRate(hall.level, roomComfort(d, 'hall') + d.base.rooms.hall.decor.length * 0, d.base.rooms.lounge.unlocked ? d.base.rooms.lounge.level : 1);
  const cap = rate * roomFx.hallCapHours(hall.level);
  const last = Date.parse(d.base.hall.lastCollectAt);
  const hours = Number.isFinite(last) ? Math.max(0, (now - last) / HOUR) : 0;
  const amount = Math.floor(Math.min(cap, rate * hours));
  return { rate, cap, amount, full: amount >= cap, secondsToFull: amount >= cap ? 0 : Math.ceil((cap - rate * hours) / rate * 3600) };
}
export function collectBasket(d: GameState, ctx: Ctx): number {
  const st = basketStatus(d, ctx.now);
  if (st.amount < 1) throw new GameError('empty', 'Корзина пока пуста');
  earn(d, ctx, 'bananas', st.amount, 'basket:collect');
  d.base.hall.lastCollectAt = nowIso(ctx);
  d.statistics.basketCollects++;
  ctx.emit({ type: 'basket_collected' });
  return st.amount;
}

// ---------- Спальня ----------
export function restStatus(d: GameState, now: number) {
  const lvl = d.base.rooms.bedroom.level;
  const last = Date.parse(d.base.bedroom.lastCollectAt);
  const hours = Number.isFinite(last) ? Math.min(roomFx.restCapHours(), Math.max(0, (now - last) / HOUR)) : 0;
  const per = roomFx.restXpPerHour(lvl);
  const list = d.base.rooms.bedroom.occupants.filter((x): x is string => !!x).map((id) => ({ id, xp: Math.floor(hours * per) }));
  return { hours, perHour: per, list, total: list.reduce((a, x) => a + x.xp, 0) };
}
export function collectRest(d: GameState, ctx: Ctx, silent = false): number {
  if (!d.base.rooms.bedroom.unlocked) return 0;
  const st = restStatus(d, ctx.now);
  if (!silent && st.total < 1) throw new GameError('empty', 'Нанабо ещё не успели отдохнуть');
  for (const x of st.list) if (x.xp > 0) addCharXp(d, ctx, x.id, x.xp);
  d.base.bedroom.lastCollectAt = nowIso(ctx);
  return st.total;
}
export function assignBed(d: GameState, ctx: Ctx, bed: number, charId: string | null): void {
  const occ = d.base.rooms.bedroom.occupants;
  if (!d.base.rooms.bedroom.unlocked) throw new GameError('locked', 'Спальня закрыта');
  if (bed < 0 || bed >= bedCount(d)) throw new GameError('bed', 'Нет такой кровати');
  if (charId && !d.characters[charId]?.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  collectRest(d, ctx, true);
  if (charId) for (let i = 0; i < occ.length; i++) if (occ[i] === charId) occ[i] = null;
  occ[bed] = charId;
}

// ---------- Лаборатория ----------
export const labSlots = (d: GameState) => roomFx.labQueue(d.base.rooms.lab.level);
export function startResearch(d: GameState, ctx: Ctx, researchId: string): void {
  const def = RESEARCH_MAP[researchId];
  const lab = d.base.rooms.lab;
  if (!def) throw new GameError('no_research', 'Такого исследования нет');
  if (!lab.unlocked) throw new GameError('locked', 'Лаборатория закрыта');
  if (def.level > roomFx.researchLevel(lab.level)) throw new GameError('level', `Нужна Лаборатория ${def.level} уровня`);
  if (d.base.lab.queue.length >= labSlots(d)) throw new GameError('busy', 'Все места в лаборатории заняты');
  spend(d, ctx, def.cost, `research:${researchId}`);
  const secs = Math.round(def.seconds * roomFx.labSpeed(lab.level));
  d.base.lab.queue.push({ id: uid('job', ctx.rng), researchId, startedAt: nowIso(ctx), finishAt: new Date(ctx.now + secs * 1000).toISOString() });
}
export function researchLeft(job: { finishAt: string }, now: number) { return Math.max(0, Math.ceil((Date.parse(job.finishAt) - now) / 1000)); }
export function skipCost(left: number): Cost { return { crystals: Math.max(1, Math.ceil(left / 600)) }; }
export function skipResearch(d: GameState, ctx: Ctx, jobId: string): void {
  const job = d.base.lab.queue.find((j) => j.id === jobId);
  if (!job) throw new GameError('no_job', 'Исследование не найдено');
  const left = researchLeft(job, ctx.now);
  if (left <= 0) return;
  spend(d, ctx, skipCost(left), `skip:${job.researchId}`);
  job.finishAt = nowIso(ctx);
}
export function collectResearch(d: GameState, ctx: Ctx, jobId: string) {
  const i = d.base.lab.queue.findIndex((j) => j.id === jobId);
  if (i < 0) throw new GameError('no_job', 'Исследование не найдено');
  const job = d.base.lab.queue[i];
  if (researchLeft(job, ctx.now) > 0) throw new GameError('not_ready', 'Исследование ещё не завершено');
  const def = RESEARCH_MAP[job.researchId];
  d.base.lab.queue.splice(i, 1);
  const res = grantReward(d, ctx, def.reward, `research:${job.id}`, 'research');
  d.base.lab.completed[def.id] = (d.base.lab.completed[def.id] || 0) + 1;
  d.statistics.researches++;
  ctx.emit({ type: 'research_done' });
  return res;
}

// ---------- Кухня ----------
export const recipeCost = (d: GameState, id: string): Cost => RECIPE_MAP[id].cost;
export function startCook(d: GameState, ctx: Ctx, recipeId: string): void {
  const def = RECIPE_MAP[recipeId];
  if (!def) throw new GameError('no_recipe', 'Рецепт не найден');
  if (!d.base.rooms.kitchen.unlocked) throw new GameError('locked', 'Кухня закрыта');
  if (def.level > roomFx.recipeLevel(d.base.rooms.kitchen.level)) throw new GameError('level', `Нужна Кухня ${def.level} уровня`);
  spend(d, ctx, def.cost, `cook:${recipeId}`);
}
/** quality: 0 — провал, 1..3 — звёзды блюда. runId защищает от двойного начисления. */
export function finishCook(d: GameState, ctx: Ctx, recipeId: string, runId: string, quality: number) {
  const def = RECIPE_MAP[recipeId];
  if (!def) throw new GameError('no_recipe', 'Рецепт не найден');
  const eid = `cook:${runId}`;
  if (d.metadata.processedEvents.includes(eid)) throw new GameError('dup_run', 'Эта попытка уже засчитана');
  if (quality <= 0) {
    const back = scaleCost(def.cost, 0.5);
    grantReward(d, ctx, { bananas: back.bananas || 0 }, eid, 'cook');
    return null;
  }
  const n = quality >= 3 ? 2 : 1;
  const res = grantReward(d, ctx, { food: { [def.food]: n }, xp: def.xp }, eid, 'cook');
  d.base.kitchen.skill += def.xp;
  d.base.kitchen.cooked[recipeId] = (d.base.kitchen.cooked[recipeId] || 0) + n;
  d.statistics.dishesCooked += n;
  for (let i = 0; i < n; i++) ctx.emit({ type: 'dish_cooked', recipeId });
  return res;
}
export function feedCharacter(d: GameState, ctx: Ctx, charId: string, foodId: string): number {
  const f = FOODS[foodId];
  const c = d.characters[charId];
  if (!f || !c?.unlocked) throw new GameError('no_target', 'Нельзя накормить');
  if (!(d.inventory.food[foodId] > 0)) throw new GameError('no_food', 'Такого блюда нет');
  d.inventory.food[foodId]--;
  const fav = CHARACTER_MAP[charId].favoriteFood === foodId ? 1.5 : 1;
  const xp = Math.round(f.xp * fav * (1 + Math.min(0.3, d.base.kitchen.skill / 1000)));
  addCharXp(d, ctx, charId, xp);
  c.fed++; d.statistics.fedCount++;
  ctx.emit({ type: 'fed', charId });
  return xp;
}

// ---------- Мастерская ----------
export function craftCost(d: GameState, id: string): Cost { return scaleCost(CRAFT_MAP[id].cost, roomFx.craftDiscount(d.base.rooms.workshop.level)); }
export function craft(d: GameState, ctx: Ctx, craftId: string) {
  const def = CRAFT_MAP[craftId];
  const ws = d.base.rooms.workshop;
  if (!def) throw new GameError('no_craft', 'Рецепт не найден');
  if (!ws.unlocked) throw new GameError('locked', 'Мастерская закрыта');
  if (def.level > roomFx.craftLevel(ws.level)) throw new GameError('level', `Нужна Мастерская ${def.level} уровня`);
  for (const m of MATERIALS) if ((def.materials[m as MaterialId] || 0) > d.inventory.materials[m]) throw new GameError('materials', 'Не хватает материалов');
  spend(d, ctx, craftCost(d, craftId), `craft:${craftId}`);
  for (const m of MATERIALS) d.inventory.materials[m] -= def.materials[m as MaterialId] || 0;
  const res = grantReward(d, ctx, def.reward, `craft:${uid('c', ctx.rng)}`, 'craft');
  d.base.workshop.crafted[craftId] = (d.base.workshop.crafted[craftId] || 0) + 1;
  d.statistics.crafts++;
  ctx.emit({ type: 'crafted' });
  return res;
}

// ---------- Спортзал ----------
export const trainCooldownLeft = (d: GameState, charId: string, now: number) => {
  const t = d.characters[charId]?.lastTrainedAt;
  if (!t) return 0;
  return Math.max(0, Math.ceil((Date.parse(t) + TRAIN_COOLDOWN_SEC * 1000 - now) / 1000));
};
export const trainCost = (d: GameState, charId: string): Cost => TRAIN_COST(0, d.base.rooms.gym.level, d.characters[charId].level);
export function trainCharacter(d: GameState, ctx: Ctx, charId: string, stat: StatId): void {
  const gym = d.base.rooms.gym, c = d.characters[charId];
  if (!gym.unlocked) throw new GameError('locked', 'Тренировочный зал закрыт');
  if (!c?.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  if (trainCooldownLeft(d, charId, ctx.now) > 0) throw new GameError('cooldown', 'Нанабо устал — подожди немного');
  if ((c.trained[stat] || 0) >= roomFx.gymMax(gym.level)) throw new GameError('max', 'Достигнут предел тренировок. Улучши зал');
  spend(d, ctx, trainCost(d, charId), `train:${charId}`);
  c.trained[stat] = (c.trained[stat] || 0) + 1;
  c.lastTrainedAt = nowIso(ctx);
  addCharXp(d, ctx, charId, 20 + gym.level * 5);
  d.statistics.trainings++; d.base.gym.sessions++;
  ctx.emit({ type: 'trained', charId });
}

// ---------- Секретная комната ----------
export function secretRoomStatus(d: GameState, now: number) {
  const st = d.base.rooms.secret;
  const last = d.base.secretRoom.lastClaimAt ? Date.parse(d.base.secretRoom.lastClaimAt) : null;
  const wait = roomFx.secretCooldownDays(st.level) * 86400000;
  const left = last === null ? 0 : last > now ? wait : Math.max(0, last + wait - now);
  return { canClaim: st.unlocked && left === 0, leftMs: left, tier: roomFx.secretChestTier(st.level) };
}
export function claimSecretRoom(d: GameState, ctx: Ctx) {
  const s = secretRoomStatus(d, ctx.now);
  if (!d.base.rooms.secret.unlocked) throw new GameError('locked', 'Секретная комната закрыта');
  if (!s.canClaim) throw new GameError('cooldown', 'Хранилище ещё пополняется');
  d.base.secretRoom.lastClaimAt = nowIso(ctx);
  return grantReward(d, ctx, { chests: { [s.tier]: 1 } }, `secretroom:${d.base.secretRoom.lastClaimAt}`, 'secretroom');
}

// ---------- Комната Stefania ----------
export const PERSONAL_WALLS = ['#FFE3EE', '#E3F4FF', '#FFF5C7', '#E7FFD9', '#EBDDFF', '#FFE7D1'];
export const PERSONAL_FLOORS = ['#E8B467', '#C9A8FF', '#9AD7A3', '#FFB3C8', '#8FC1F0', '#D9D9E3'];
export const personalUpgradeCost = (lvl: number): Cost => ({ bananas: 200 * lvl * lvl, coins: 40 * lvl });
export function upgradePersonalRoom(d: GameState, ctx: Ctx): void {
  const p = d.base.personalRoom;
  if (p.level >= 5) throw new GameError('max', 'Максимальный уровень комнаты');
  spend(d, ctx, personalUpgradeCost(p.level), 'upgrade:personal');
  p.level++;
  normalizeRooms(d);
}
export function setPersonalStyle(d: GameState, wall?: string, floor?: string, note?: string): void {
  if (wall && PERSONAL_WALLS.includes(wall)) d.base.personalRoom.wall = wall;
  if (floor && PERSONAL_FLOORS.includes(floor)) d.base.personalRoom.floor = floor;
  if (note !== undefined) d.base.personalRoom.note = note.slice(0, 80);
}

// ---------- Секретные предметы ----------
export function findSecret(d: GameState, ctx: Ctx, id: string): boolean {
  const def = SECRET_MAP[id];
  if (!def) throw new GameError('no_secret', 'Такого секрета нет');
  if (d.collections.secrets[id]) return false;
  d.collections.secrets[id] = nowIso(ctx);
  grantReward(d, ctx, { coins: 25, bananas: 60, xp: 15 }, `secret:${id}`, 'secret');
  ctx.emit({ type: 'secret_found', id });
  logHistory(d, ctx, 'secret', `Секрет найден: ${def.name}`);
  ctx.notify({ type: 'toast', text: `Секрет найден: ${def.name}!`, tone: 'good' });
  if (Object.keys(d.collections.secrets).length >= SECRETS.length) {
    for (const c of CHARACTERS) if (c.unlock.kind === 'secrets') grantReward(d, ctx, { characters: [c.id] }, `secrets:all:${c.id}`, 'secret');
  }
  return true;
}
