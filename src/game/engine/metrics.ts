import type { GameState } from '../types';
import { CHARACTERS } from '../data/characters';
import { LEVELS, WORLDS, levelsOfWorld } from '../data/worlds';
import { ROOMS } from '../data/rooms';
import { CHARACTER_MAP } from '../data/characters';

/** Вычисляемые из состояния метрики — для достижений и «state:»-заданий. Идемпотентны и не зависят от событий. */
export function stateMetric(s: GameState, key: string): number {
  switch (key) {
    case 'bananas_lifetime': return s.currencies.lifetime.bananas;
    case 'chars': return CHARACTERS.filter((c) => s.characters[c.id]?.unlocked).length;
    case 'chars_new': return Math.max(0, CHARACTERS.filter((c) => s.characters[c.id]?.unlocked && c.unlock.kind !== 'start').length);
    case 'legendary_chars': return CHARACTERS.filter((c) => c.rarity === 'legendary' && s.characters[c.id]?.unlocked).length;
    case 'outfits_saved': return s.statistics.outfitsSaved;
    case 'outfit_changes': return s.statistics.outfitChanges;
    case 'items_bought': return s.statistics.itemsBought;
    case 'items_owned': return Object.keys(s.wardrobe.owned).length;
    case 'photos': return s.statistics.photosTaken;
    case 'rooms_upgraded_count': return ROOMS.filter((r) => (s.base.rooms[r.id]?.level || 0) >= 2).length;
    case 'rooms_unlocked': return ROOMS.filter((r) => s.base.rooms[r.id]?.unlocked).length;
    case 'rooms_max_level': return Math.max(0, ...ROOMS.map((r) => (s.base.rooms[r.id]?.unlocked ? s.base.rooms[r.id].level : 0)));
    case 'secret_room': return s.base.rooms.secret?.unlocked ? 1 : 0;
    case 'decor_placed': return s.statistics.decorPlaced;
    case 'player_level': return s.player.level;
    case 'secrets': return Object.keys(s.collections.secrets).length;
    case 'stars': return LEVELS.reduce((a, l) => a + (s.levels[l.id]?.stars || 0), 0);
    case 'levels_cleared': return LEVELS.filter((l) => (s.levels[l.id]?.stars || 0) >= 1).length;
    case 'perfect_levels': return LEVELS.filter((l) => (s.levels[l.id]?.stars || 0) >= 3).length;
    case 'perfect_worlds': return WORLDS.filter((w) => levelsOfWorld(w.num).every((l) => (s.levels[l.id]?.stars || 0) >= 3)).length;
    case 'worlds_unlocked': return WORLDS.filter((w) => s.worlds[w.id]?.unlocked).length;
    case 'bosses_cleared': return LEVELS.filter((l) => l.boss && (s.levels[l.id]?.stars || 0) >= 1).length;
    case 'minigames_played': return s.statistics.minigamesPlayed;
    case 'distinct_minigames': return Object.values(s.minigames.stats).filter((m) => m.plays > 0).length;
    case 'dishes': return s.statistics.dishesCooked;
    case 'researches': return s.statistics.researches;
    case 'crafts': return s.statistics.crafts;
    case 'trainings': return s.statistics.trainings;
    case 'fed': return s.statistics.fedCount;
    case 'chests_opened': return s.statistics.chestsOpened;
    case 'max_streak': return s.statistics.maxStreak;
    case 'quests_claimed': return s.quests.claimedCount;
    case 'cards': return Object.keys(s.collections.cards).length;
    case 'play_hours': return Math.floor(s.statistics.playSeconds / 3600);
    case 'tutorial_done': return s.player.tutorial.done ? 1 : 0;
    case 'achievements': return Object.keys(s.achievements).length;
    default: return 0;
  }
}
export const unlockedCharIds = (s: GameState) => Object.keys(s.characters).filter((id) => s.characters[id].unlocked && CHARACTER_MAP[id]);
export const totalStars = (s: GameState) => stateMetric(s, 'stars');
