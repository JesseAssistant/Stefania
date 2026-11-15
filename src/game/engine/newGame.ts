import type { CharacterState, GameState, RoomId, StatId } from '../types';
import { CHARACTERS } from '../data/characters';
import { ROOMS } from '../data/rooms';
import { LEVELS, WORLDS } from '../data/worlds';
import { START_WALLET } from '../data/economy';
import { ITEM_MAP } from '../data/items';
import { GAME_VERSION, PLAYER_NAME } from '../../config';
import { START_CHARACTERS } from '../data/characters';
import { dateKey, weekKey } from '../util';
import { normalizeRooms } from './base';
import { refreshProgress } from './levels';
import { refreshStateQuests } from './quests';

const STATS: StatId[] = ['speed', 'brains', 'charm', 'luck'];
export const newCharacterState = (): CharacterState => ({
  unlocked: false, level: 1, xp: 0, trained: { speed: 0, brains: 0, charm: 0, luck: 0 }, equipped: {}, history: [], emotion: 'happy', fed: 0,
});
export function randomSeed(): number {
  try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; } catch { return Math.floor(Math.random() * 4294967296) >>> 0; }
}
export function randomId(): string {
  return `inst_${randomSeed().toString(36)}${randomSeed().toString(36)}`;
}

export function createNewState(now: number, installId?: string, seed?: number): GameState {
  const iso = new Date(now).toISOString();
  const rooms = {} as GameState['base']['rooms'];
  for (const r of ROOMS) {
    const open = r.unlock.playerLevel <= 1 && !Object.keys(r.unlock.cost).length && !r.unlock.secrets;
    rooms[r.id as RoomId] = { unlocked: open, level: open ? 1 : 0, unlockedAt: open ? iso : undefined, decor: [], occupants: [] };
  }
  const characters: GameState['characters'] = {};
  for (const c of CHARACTERS) characters[c.id] = newCharacterState();
  for (const id of START_CHARACTERS) { characters[id].unlocked = true; characters[id].unlockedAt = iso; characters[id].source = 'start'; }
  const s: GameState = {
    player: {
      name: PLAYER_NAME, level: 1, xp: 0, totalXp: 0, createdAt: iso, selectedCharacterId: 'pip', partnerId: 'pip',
      favorites: { characters: [], items: [], outfits: [] }, tutorial: { step: 0, done: false, hintsSeen: {} }, flags: {},
      welcomed: false, installHintSeen: false,
    },
    currencies: { ...START_WALLET, lifetime: { bananas: 0, coins: 0, crystals: 0, spentBananas: 0, spentCoins: 0, spentCrystals: 0 }, ledger: [] },
    characters,
    inventory: { chests: { common: 1, rare: 0, epic: 0, legendary: 0 }, materials: { gear: 0, fabric: 0, glitter: 0 }, decor: {}, food: {}, pity: { rare: 0, epic: 0, legendary: 0 }, lastChest: null },
    wardrobe: { owned: {}, ownedSets: {} },
    outfits: { saved: [], photos: [] },
    base: {
      rooms, hall: { lastCollectAt: iso }, bedroom: { lastCollectAt: iso }, secretRoom: { lastClaimAt: null },
      lab: { queue: [], completed: {} }, kitchen: { skill: 0, cooked: {} }, workshop: { crafted: {} }, gym: { sessions: 0 },
      personalRoom: { level: 1, decor: [], wall: '#FFE3EE', floor: '#E8B467', note: 'Это моя комната!' },
    },
    worlds: {}, levels: {},
    quests: {
      daily: { key: '', ids: [], progress: {} }, weekly: { key: '', ids: [], progress: {} }, story: {}, challenges: {}, secret: {},
      claimedCount: 0, claimedToday: { key: '', n: 0 }, log: [],
    },
    achievements: {},
    collections: { cards: {}, secrets: {}, worldSetsClaimed: {}, starMilestonesClaimed: {}, history: [{ at: iso, type: 'start', text: 'Начало приключения!' }] },
    minigames: { unlocked: ['banana-catcher', 'memory'], stats: {}, arcadeToday: { key: '', counts: {} }, runs: {} },
    statistics: {
      sessions: 0, playSeconds: 0, firstPlayedAt: iso, lastPlayedAt: iso, levelsCleared: 0, starsEarned: 0, minigamesPlayed: 0, itemsBought: 0,
      chestsOpened: 0, dishesCooked: 0, researches: 0, crafts: 0, trainings: 0, fedCount: 0, photosTaken: 0, outfitsSaved: 0, outfitChanges: 0,
      decorPlaced: 0, roomsUpgraded: 0, basketCollects: 0, perfectLevels: 0, maxStreak: 0, emotes: 0,
    },
    dailyRewards: { lastClaimDate: null, streak: 0, totalClaims: 0, cycle: 0, history: [] },
    settings: { musicOn: true, sfxOn: true, master: 0.8, music: 0.6, sfx: 0.8, animations: 'high', language: 'ru', haptics: true, reduceMotion: false },
    metadata: {
      revision: 0, savedAt: iso, installId: installId || randomId(), rng: seed ?? randomSeed(), processedEvents: [],
      createdVersion: GAME_VERSION, lastVersion: GAME_VERSION, migrations: [],
    },
  };
  reconcile(s, now);
  return s;
}

/**
 * Приводит состояние в соответствие с текущим контентом: добавляет новых персонажей, комнаты, уровни, миры
 * (так новые версии игры расширяют контент без потери прогресса) и чинит мелкие нестыковки.
 * НИЧЕГО не удаляет и не обнуляет.
 */
export function reconcile(s: GameState, now: number): void {
  for (const c of CHARACTERS) {
    const cur = (s.characters[c.id] ||= newCharacterState());
    cur.trained ||= { speed: 0, brains: 0, charm: 0, luck: 0 };
    for (const st of STATS) cur.trained[st] ||= 0;
    cur.equipped ||= {}; cur.history ||= []; cur.emotion ||= 'happy'; cur.level ||= 1; cur.xp ||= 0; cur.fed ||= 0;
    for (const [layer, id] of Object.entries(cur.equipped)) if (id && ITEM_MAP[id] === undefined) delete (cur.equipped as Record<string, string>)[layer];
  }
  for (const r of ROOMS) {
    const cur = (s.base.rooms[r.id] ||= { unlocked: false, level: 0, decor: [], occupants: [] });
    cur.decor ||= []; cur.occupants ||= [];
  }
  for (const w of WORLDS) s.worlds[w.id] ||= { unlocked: false };
  for (const l of LEVELS) s.levels[l.id] ||= { status: 'locked', stars: 0, best: null, plays: 0, clears: 0 };
  const k = dateKey(now), wk = weekKey(now);
  void k; void wk;
  if (!s.characters[s.player.selectedCharacterId]?.unlocked) s.player.selectedCharacterId = START_CHARACTERS[0];
  if (!s.characters[s.player.partnerId]?.unlocked) s.player.partnerId = s.player.selectedCharacterId;
  normalizeRooms(s);
  refreshProgress(s);
  refreshStateQuests(s);
}
