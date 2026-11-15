import type { ChestTier, Cost, Reward } from '../types';

// ---------- Уровень игрока ----------
export const MAX_PLAYER_LEVEL = 50;
export const xpToNext = (lvl: number) => Math.round(60 + 30 * (lvl - 1) + 6 * (lvl - 1) ** 2);
export function playerLevelReward(lvl: number): Reward {
  const r: Reward = { bananas: 40 + 10 * lvl, coins: 10 + 2 * lvl };
  if (lvl % 5 === 0) r.crystals = 3 + Math.floor(lvl / 5);
  if (lvl % 10 === 0) r.chests = { rare: 1 };
  else if (lvl % 5 === 0) r.chests = { common: 1 };
  return r;
}
export const PLAYER_LEVEL_PERKS: Record<number, string> = {
  2: 'Открывается Спальня', 3: 'Открывается Игровая комната', 4: 'Открывается Кухня', 5: 'Секретная комната (после секретов)',
  6: 'Открывается Лаборатория', 8: 'Открывается Тренировочный зал', 10: 'Открывается Мастерская', 12: 'Открывается Комната отдыха',
  15: 'Больше слотов в Комнате Stefania',
};

// ---------- Уровень Нанабо ----------
export const MAX_CHAR_LEVEL = 20;
export const charXpToNext = (lvl: number) => 30 + 20 * (lvl - 1);
export function charLevelReward(lvl: number): Reward | null {
  if (lvl === 5) return { coins: 50 };
  if (lvl === 10) return { crystals: 3 };
  if (lvl === 15) return { chests: { rare: 1 } };
  if (lvl === 20) return { crystals: 8, coins: 200 };
  return null;
}
export const CHAR_LEVEL_PERKS = 'Каждые 4 уровня +1 ко всем навыкам. Награды на 5, 10, 15 и 20 уровнях.';

// ---------- Аркада: защита от бесконечной накрутки ----------
export const ARCADE_FULL_PLAYS_PER_DAY = 6;
export const LEVEL_REPLAY_FULL_PER_DAY = 4;
export const arcadeReward = (playerLevel: number, difficulty: number): Reward => ({
  bananas: Math.round((14 + 2 * Math.min(playerLevel, 30)) * [0.8, 1, 1.35][difficulty - 1]), xp: 4 + difficulty * 2,
});

// ---------- Сундуки ----------
export interface ChestDef {
  name: string; price: Cost; rolls: number; color: string; pityAt: number; pityMin: 'rare' | 'epic';
  kinds: [string, number][]; itemRarity: [string, number][];
  bananas: [number, number]; coins: [number, number]; crystals: [number, number];
}
export const CHESTS: Record<ChestTier, ChestDef> = {
  common: { name: 'Обычный сундук', price: { bananas: 150 }, rolls: 2, color: '#C99A5B', pityAt: 0, pityMin: 'rare',
    kinds: [['bananas', 30], ['coins', 15], ['crystals', 2], ['item', 20], ['decor', 8], ['card', 12], ['material', 10], ['food', 5]],
    itemRarity: [['common', 70], ['uncommon', 25], ['rare', 5]], bananas: [30, 80], coins: [10, 25], crystals: [1, 1] },
  rare: { name: 'Редкий сундук', price: { coins: 150 }, rolls: 3, color: '#6FA8FF', pityAt: 6, pityMin: 'rare',
    kinds: [['bananas', 20], ['coins', 25], ['crystals', 8], ['item', 22], ['decor', 8], ['card', 10], ['material', 7], ['food', 3]],
    itemRarity: [['common', 15], ['uncommon', 45], ['rare', 33], ['epic', 7]], bananas: [80, 200], coins: [30, 70], crystals: [1, 3] },
  epic: { name: 'Эпический сундук', price: { crystals: 25 }, rolls: 4, color: '#B45CFF', pityAt: 4, pityMin: 'epic',
    kinds: [['bananas', 12], ['coins', 18], ['crystals', 18], ['item', 28], ['decor', 8], ['card', 10], ['material', 6]],
    itemRarity: [['uncommon', 20], ['rare', 45], ['epic', 35]], bananas: [200, 400], coins: [80, 160], crystals: [3, 8] },
  legendary: { name: 'Легендарный сундук', price: { crystals: 70 }, rolls: 5, color: '#FFC400', pityAt: 3, pityMin: 'epic',
    kinds: [['bananas', 8], ['coins', 14], ['crystals', 22], ['item', 32], ['decor', 12], ['card', 8], ['material', 4]],
    itemRarity: [['rare', 35], ['epic', 65]], bananas: [400, 800], coins: [200, 400], crystals: [8, 20] },
};
export const CHEST_CHARACTER_CHANCE: Record<ChestTier, number> = { common: 0, rare: 0.06, epic: 0.18, legendary: 0.4 };
/** Компенсация монетами за дубликат (оценка стоимости) */
export function duplicateCompensation(cost: Cost, rarityBase: number): number {
  const v = (cost.bananas || 0) * 0.12 + (cost.coins || 0) * 0.3 + (cost.crystals || 0) * 7;
  return Math.max(rarityBase, Math.round(v));
}
export const DUP_BASE: Record<string, number> = { common: 5, uncommon: 10, rare: 20, epic: 40, legendary: 80 };
export const CHARACTER_DUP_XP = 40;

// ---------- Ежедневные награды ----------
export const DAILY_CYCLE: Reward[] = [
  { bananas: 50 }, { coins: 25 }, { bananas: 100, chests: { common: 1 } }, { coins: 60 },
  { bananas: 150, crystals: 1 }, { crystals: 3, coins: 40 }, { chests: { rare: 1 }, bananas: 200, crystals: 2 },
];
export const DAILY_DAY7_CHARACTER = 'pudding';
export const DAILY_GRACE_DAYS = 1; // можно пропустить 1 день, серия не сбросится
export function dailyReward(day: number, cycle: number): Reward {
  const base = DAILY_CYCLE[(day - 1) % 7];
  const mult = 1 + Math.min(cycle, 5) * 0.1;
  const r: Reward = { ...base };
  if (r.bananas) r.bananas = Math.round(r.bananas * mult);
  if (r.coins) r.coins = Math.round(r.coins * mult);
  if (day === 7 && cycle === 0) r.characters = [DAILY_DAY7_CHARACTER];
  if (day === 7 && cycle >= 1) r.chests = { epic: 1 };
  return r;
}

// ---------- Базовые начальные значения ----------
export const START_WALLET = { bananas: 120, coins: 30, crystals: 2 };
export const PARTNER_BONUS_CAP = 0.25;
export const TRAIN_COST = (lvl: number, gymLevel: number, charLevel: number): Cost => ({ bananas: Math.round((30 + charLevel * 6) * (gymLevel >= 3 ? 0.8 : 1)) });
export const TRAIN_COOLDOWN_SEC = 20 * 60;
export const FEED_COOLDOWN_SEC = 0;
export const LAB_SKIP_CRYSTALS_PER_10MIN = 1;
export const SKIP_PRICE_MIN = 1;
