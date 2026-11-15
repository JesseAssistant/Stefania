// Полная схема игрового состояния (schemaVersion 1) и описания контента.

export type Currency = 'bananas' | 'coins' | 'crystals';
export const CURRENCIES: Currency[] = ['bananas', 'coins', 'crystals'];
export type Cost = Partial<Record<Currency, number>>;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export type ChestTier = 'common' | 'rare' | 'epic' | 'legendary';
export const CHEST_TIERS: ChestTier[] = ['common', 'rare', 'epic', 'legendary'];
export type MaterialId = 'gear' | 'fabric' | 'glitter';
export const MATERIALS: MaterialId[] = ['gear', 'fabric', 'glitter'];

/** Слои отрисовки одежды (снизу вверх). */
export type Layer = 'outfit' | 'costume' | 'shoes' | 'jewelry' | 'accessory' | 'glasses' | 'hat' | 'effect';
export type ItemCategory = 'outfit' | 'costume' | 'hat' | 'eyewear' | 'shoes' | 'jewelry' | 'special';
export type SetCategory = 'theme' | 'season';
export type RoomId =
  | 'hall' | 'bedroom' | 'playroom' | 'lab' | 'kitchen'
  | 'wardrobe' | 'gym' | 'workshop' | 'lounge' | 'secret';
export type StatId = 'speed' | 'brains' | 'charm' | 'luck';
export type Emotion = 'happy' | 'wink' | 'surprised' | 'love' | 'sleepy' | 'excited' | 'sad';
export type MinigameId =
  | 'banana-catcher' | 'memory' | 'kitchen' | 'lab-puzzle'
  | 'treasure-hunt' | 'sorting' | 'reaction' | 'outfit-challenge';

export interface Reward {
  bananas?: number; coins?: number; crystals?: number; xp?: number;
  items?: string[]; decor?: string[]; characters?: string[]; cards?: string[];
  chests?: Partial<Record<ChestTier, number>>;
  materials?: Partial<Record<MaterialId, number>>;
  food?: Record<string, number>;
  charXp?: { id: string; xp: number };
}

/** Что произошло при выдаче награды (для показа игроку). */
export interface RewardResult {
  eventId: string; source: string; applied: boolean;
  bananas: number; coins: number; crystals: number; xp: number;
  items: string[]; decor: string[]; characters: string[]; cards: string[];
  chests: Partial<Record<ChestTier, number>>;
  materials: Partial<Record<MaterialId, number>>;
  food: Record<string, number>;
  /** Компенсация за дубликаты (уже включена в суммы валют). */
  compensation: { what: string; coins: number }[];
  levelUps: number[];
}

// ---------- Контент (конфигурации) ----------
export interface CharacterLook {
  body: string; belly: string; cheek: string; shade?: string;
  build: 'round' | 'tall' | 'chubby' | 'small';
  feature: 'sprout' | 'bunny' | 'cat' | 'antenna' | 'bear' | 'wings' | 'crest' | 'tuft' | 'horns' | 'halo' | 'none';
  featureColor: string;
  eyes: 'big' | 'sleepy' | 'sparkle';
  pattern: 'none' | 'spots' | 'stripes';
  patternColor?: string;
}
export type CharacterUnlock =
  | { kind: 'start' }
  | { kind: 'level'; levelId: string }
  | { kind: 'room'; room: RoomId }
  | { kind: 'quest'; id: string }
  | { kind: 'achievement'; id: string }
  | { kind: 'daily'; day: number }
  | { kind: 'chest' }
  | { kind: 'secrets'; count: number };
export interface CharacterDef {
  id: string; name: string; rarity: Rarity; title: string; bio: string; story: string;
  look: CharacterLook; stats: Record<StatId, number>; unlock: CharacterUnlock;
  unlockText: string; voice: number; favoriteFood?: string;
}

export type ItemUnlock =
  | { type: 'shop' } | { type: 'level'; level: number } | { type: 'world'; world: number }
  | { type: 'stars'; stars: number } | { type: 'reward'; how: string };
export interface ItemDef {
  id: string; name: string; category: ItemCategory; layer: Layer; rarity: Rarity;
  cost: Cost; unlock: ItemUnlock; desc: string; tags: string[];
  art: { kind: string; c1: string; c2?: string; c3?: string };
  season?: string;
}
export interface SetDef {
  id: string; name: string; category: SetCategory; rarity: Rarity; desc: string;
  pieces: string[]; tags: string[]; unlock: ItemUnlock; season?: string;
}
export interface DecorDef {
  id: string; name: string; rarity: Rarity; comfort: number; cost: Cost;
  desc: string; kind: string; c1: string; c2: string; shopable: boolean;
}

export type LevelGame =
  | { kind: 'banana-catcher'; target: number; duration: number; speed: number; bad: number; moving?: boolean }
  | { kind: 'memory'; pairs: number; maxMoves: number; peek?: boolean }
  | { kind: 'kitchen'; recipeId: string; orders: number }
  | { kind: 'lab-puzzle'; variant: 'lights' | 'sequence' | 'wires' | 'slide'; size: number; maxMoves: number }
  | { kind: 'treasure-hunt'; scene: string; hidden: number; time: number; maxMistakes: number }
  | { kind: 'sorting'; rule: 'color' | 'size' | 'category' | 'ripeness'; items: number; time: number; maxMistakes: number }
  | { kind: 'reaction'; rounds: number; decoys: boolean; window: number }
  | { kind: 'outfit-challenge'; themeId: string; slots: number }
  | { kind: 'task'; goals: TaskGoal[] }
  | { kind: 'gauntlet'; stages: LevelGame[]; hearts: number };
export interface TaskGoal { id: string; text: string; check: string; n?: number; arg?: string }

export interface LevelDef {
  id: string; world: number; index: number; name: string; desc: string; goal: string;
  game: LevelGame; boss?: boolean;
  /** Условия звёзд по метрике игры. dir=high → больше лучше. */
  stars: { dir: 'high' | 'low'; two: number; three: number; twoText: string; threeText: string };
  first: Reward; star2: Reward; star3: Reward; replay: Reward;
  statAffinity: StatId;
}
export interface WorldDef {
  id: string; num: number; name: string; subtitle: string; desc: string;
  unlockStars: number; theme: { sky1: string; sky2: string; ground: string; accent: string };
  music: string; secretHint: string;
}

export interface RoomDef {
  id: RoomId; name: string; desc: string;
  unlock: { playerLevel: number; cost: Cost; secrets?: number };
  upgrades: Cost[]; maxLevel: number; perks: string[]; color: string;
}
export interface QuestDef {
  id: string; kind: 'daily' | 'weekly' | 'story' | 'challenge' | 'secret';
  title: string; desc: string; metric: string; target: number;
  distinct?: boolean; reward: Reward; requires?: string; after?: string;
  /** Для секретных заданий: условие появления */
  trigger?: string;
}
export interface AchievementDef {
  id: string; name: string; desc: string; hidden?: boolean; rare?: boolean;
  reward: Reward; icon: string; metric: string; target: number;
}
export interface RecipeDef {
  id: string; name: string; level: number; cost: Cost; steps: string[]; extras: string[];
  food: string; xp: number; desc: string;
}
export interface ResearchDef {
  id: string; name: string; level: number; cost: Cost; seconds: number; reward: Reward; desc: string;
}
export interface CraftDef { id: string; name: string; level: number; cost: Cost; materials: Partial<Record<MaterialId, number>>; reward: Reward; desc: string }
export interface CardDef { id: string; world: number; name: string; rarity: Rarity; icon: string; desc: string }

// ---------- Сохраняемое состояние ----------
export interface TutorialState { step: number; done: boolean; hintsSeen: Record<string, boolean> }
export interface PlayerState {
  name: string; level: number; xp: number; totalXp: number; createdAt: string;
  selectedCharacterId: string; partnerId: string;
  favorites: { characters: string[]; items: string[]; outfits: string[] };
  tutorial: TutorialState; flags: Record<string, boolean | number | string>;
  welcomed: boolean; installHintSeen: boolean;
}
export interface CurrencyState {
  bananas: number; coins: number; crystals: number;
  lifetime: { bananas: number; coins: number; crystals: number; spentBananas: number; spentCoins: number; spentCrystals: number };
  ledger: { at: string; currency: Currency; delta: number; reason: string }[];
}
export interface CharacterState {
  unlocked: boolean; unlockedAt?: string; source?: string;
  level: number; xp: number; trained: Record<StatId, number>;
  equipped: Partial<Record<Layer, string>>;
  history: Partial<Record<Layer, string | null>>[];
  emotion: Emotion; fed: number; lastTrainedAt?: string; nickname?: string;
}
export interface InventoryState {
  chests: Record<ChestTier, number>; materials: Record<MaterialId, number>;
  decor: Record<string, number>; food: Record<string, number>;
  pity: { rare: number; epic: number; legendary: number };
  lastChest?: { openId: string; tier: ChestTier; result: RewardResult } | null;
}
export interface WardrobeState {
  owned: Record<string, { at: string; source: string }>;
  ownedSets: Record<string, { at: string }>;
}
export interface SavedOutfit {
  id: string; name: string; charId: string; items: Partial<Record<Layer, string>>;
  favorite: boolean; createdAt: string;
}
export interface PhotoEntry {
  id: string; charId: string; items: Partial<Record<Layer, string>>; emotion: Emotion;
  background: string; caption: string; createdAt: string;
}
export interface OutfitsState { saved: SavedOutfit[]; photos: PhotoEntry[] }
export interface RoomState {
  unlocked: boolean; level: number; unlockedAt?: string;
  decor: (string | null)[]; occupants: (string | null)[];
}
export interface LabJob { id: string; researchId: string; startedAt: string; finishAt: string }
export interface BaseState {
  rooms: Record<RoomId, RoomState>;
  hall: { lastCollectAt: string };
  bedroom: { lastCollectAt: string };
  secretRoom: { lastClaimAt: string | null };
  lab: { queue: LabJob[]; completed: Record<string, number> };
  kitchen: { skill: number; cooked: Record<string, number> };
  workshop: { crafted: Record<string, number> };
  gym: { sessions: number };
  personalRoom: { level: number; decor: (string | null)[]; wall: string; floor: string; note: string };
}
export interface WorldProgress { unlocked: boolean; unlockedAt?: string; rewardClaimed?: boolean }
export interface LevelProgress {
  status: 'locked' | 'open' | 'cleared'; stars: number; best: number | null;
  plays: number; clears: number; firstClearAt?: string; lastPlayedAt?: string;
}
export interface QuestProgress { value: number; seen?: string[]; claimed: boolean; done: boolean }
export interface QuestsState {
  daily: { key: string; ids: string[]; progress: Record<string, QuestProgress> };
  weekly: { key: string; ids: string[]; progress: Record<string, QuestProgress> };
  story: Record<string, QuestProgress>;
  challenges: Record<string, QuestProgress>;
  secret: Record<string, QuestProgress & { revealed: boolean }>;
  claimedCount: number; claimedToday: { key: string; n: number };
  log: { id: string; at: string }[];
}
export interface CollectionsState {
  cards: Record<string, { at: string; count: number }>;
  secrets: Record<string, string>;
  worldSetsClaimed: Record<string, boolean>;
  starMilestonesClaimed: Record<string, boolean>;
  history: { at: string; type: string; text: string }[];
}
export interface MinigameStat { plays: number; wins: number; best: number | null; lastAt?: string }
export interface MinigamesState {
  unlocked: MinigameId[]; stats: Record<string, MinigameStat>;
  arcadeToday: { key: string; counts: Record<string, number> };
  runs: Record<string, true>;
}
export interface Statistics {
  sessions: number; playSeconds: number; firstPlayedAt: string; lastPlayedAt: string;
  levelsCleared: number; starsEarned: number; minigamesPlayed: number; itemsBought: number;
  chestsOpened: number; dishesCooked: number; researches: number; crafts: number; trainings: number;
  fedCount: number; photosTaken: number; outfitsSaved: number; outfitChanges: number;
  decorPlaced: number; roomsUpgraded: number; basketCollects: number; perfectLevels: number;
  maxStreak: number; emotes: number;
}
export interface DailyState {
  lastClaimDate: string | null; streak: number; totalClaims: number; cycle: number;
  history: { date: string; day: number; reward: Reward }[];
}
export interface Settings {
  musicOn: boolean; sfxOn: boolean; master: number; music: number; sfx: number;
  animations: 'high' | 'medium' | 'low'; language: string; haptics: boolean; reduceMotion: boolean;
}
export interface Metadata {
  revision: number; savedAt: string; installId: string; rng: number;
  processedEvents: string[]; createdVersion: string; lastVersion: string;
  migrations: { from: number; to: number; at: string }[];
}
export interface GameState {
  player: PlayerState; currencies: CurrencyState;
  characters: Record<string, CharacterState>;
  inventory: InventoryState; wardrobe: WardrobeState; outfits: OutfitsState;
  base: BaseState; worlds: Record<string, WorldProgress>; levels: Record<string, LevelProgress>;
  quests: QuestsState; achievements: Record<string, { at: string }>;
  collections: CollectionsState; minigames: MinigamesState; statistics: Statistics;
  dailyRewards: DailyState; settings: Settings; metadata: Metadata;
}
/** Файл STEFANIA_SAVE.json */
export interface SaveFile extends GameState {
  format: string; schemaVersion: number; gameVersion: string; exportedAt: string;
  integrity: { algorithm: 'sha256'; checksum: string; sections: number };
}
export const SAVE_SECTIONS: (keyof GameState)[] = [
  'player', 'currencies', 'characters', 'inventory', 'wardrobe', 'outfits', 'base', 'worlds', 'levels',
  'quests', 'achievements', 'collections', 'minigames', 'statistics', 'dailyRewards', 'settings', 'metadata',
];

// ---------- События и уведомления ----------
export type GameEvent =
  | { type: 'currency_earned'; currency: Currency; amount: number; reason: string }
  | { type: 'level_cleared'; levelId: string; stars: number; first: boolean }
  | { type: 'stars_earned'; amount: number }
  | { type: 'minigame_played'; game: string; won: boolean }
  | { type: 'outfit_changed'; charId: string }
  | { type: 'outfit_saved' } | { type: 'photo_taken' }
  | { type: 'room_upgraded'; room: RoomId; level: number } | { type: 'room_unlocked'; room: RoomId }
  | { type: 'item_acquired'; itemId: string } | { type: 'item_bought'; itemId: string }
  | { type: 'character_unlocked'; id: string } | { type: 'chest_opened'; tier: ChestTier }
  | { type: 'quest_claimed'; id: string } | { type: 'daily_claimed'; streak: number }
  | { type: 'research_done' } | { type: 'dish_cooked'; recipeId: string }
  | { type: 'basket_collected' } | { type: 'trained'; charId: string } | { type: 'fed'; charId: string }
  | { type: 'decor_placed' } | { type: 'secret_found'; id: string } | { type: 'crafted' }
  | { type: 'player_level'; level: number } | { type: 'card_found'; id: string } | { type: 'emote' };

export type Notice =
  | { type: 'reward'; title: string; result: RewardResult }
  | { type: 'levelup'; level: number; reward: RewardResult }
  | { type: 'achievement'; id: string }
  | { type: 'character'; id: string }
  | { type: 'charlevel'; id: string; level: number }
  | { type: 'toast'; text: string; tone?: 'good' | 'bad' | 'info' }
  | { type: 'saveError'; message: string };

export class GameError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; this.name = 'GameError'; }
}
