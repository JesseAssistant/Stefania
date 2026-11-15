import type { ChestTier, Emotion, GameState, Layer, MinigameId, RoomId, Settings, StatId } from './types';
import type { GameStore } from './engine/store';
import * as W from './engine/wardrobe';
import * as S from './engine/shop';
import * as B from './engine/base';
import * as C from './engine/characters';
import * as L from './engine/levels';
import { openChest } from './engine/chests';
import { claimDaily } from './engine/daily';
import { claimQuest } from './engine/quests';
import { clamp } from './util';

/** Тонкий фасад над движком. Каждый метод — одна атомарная транзакция. Ошибки правил игры — GameError. */
export function createApi(store: GameStore) {
  const T = store.tx.bind(store);
  return {
    store,
    // ---- игрок и обучение ----
    welcome: () => T((d) => { d.player.welcomed = true; }, 'welcome'),
    setTutorialStep: (n: number) => T((d) => { d.player.tutorial.step = n; }, 'tutorial'),
    finishTutorial: () => T((d) => { d.player.tutorial.done = true; d.player.tutorial.step = 99; }, 'tutorial'),
    markHint: (id: string) => T((d) => { d.player.tutorial.hintsSeen[id] = true; }, 'hint'),
    resetHints: () => T((d) => { d.player.tutorial.hintsSeen = {}; }, 'hint'),
    dismissInstall: () => T((d) => { d.player.installHintSeen = true; }, 'install'),
    startSession: () => T((d, c) => { d.statistics.sessions++; d.statistics.lastPlayedAt = new Date(c.now).toISOString(); }, 'session'),
    addPlaySeconds: (n: number) => T((d, c) => { d.statistics.playSeconds += Math.max(0, Math.round(n)); d.statistics.lastPlayedAt = new Date(c.now).toISOString(); }, 'time'),
    updateSettings: (patch: Partial<Settings>) => T((d) => {
      const s = { ...d.settings, ...patch };
      for (const k of ['master', 'music', 'sfx'] as const) s[k] = clamp(Number(s[k]) || 0, 0, 1);
      d.settings = s;
    }, 'settings'),
    // ---- персонажи ----
    selectCharacter: (id: string) => T((d) => C.selectCharacter(d, id), 'select'),
    setPartner: (id: string) => T((d) => C.setPartner(d, id), 'partner'),
    emote: (id: string): Emotion => T((d, c) => C.emote(d, c, id), 'emote'),
    renameCharacter: (id: string, name: string) => T((d) => C.renameCharacter(d, id, name), 'rename'),
    toggleFavorite: (kind: 'characters' | 'items' | 'outfits', id: string) => T((d) => W.toggleFavorite(d, kind, id), 'fav'),
    feed: (charId: string, food: string) => T((d, c) => B.feedCharacter(d, c, charId, food), 'feed'),
    // ---- гардероб ----
    equip: (charId: string, itemId: string) => T((d, c) => W.equip(d, c, charId, itemId), 'equip'),
    unequip: (charId: string, layer: Layer) => T((d, c) => W.unequip(d, c, charId, layer), 'equip'),
    undoLook: (charId: string) => T((d) => W.undoLook(d, charId), 'equip'),
    applyLook: (charId: string, items: Partial<Record<Layer, string>>) => T((d, c) => W.applyLook(d, c, charId, items), 'equip'),
    equipSet: (charId: string, setId: string) => T((d, c) => W.equipSet(d, c, charId, setId), 'equip'),
    saveOutfit: (charId: string, name: string) => T((d, c) => W.saveOutfit(d, c, charId, name), 'outfit'),
    applyOutfit: (outfitId: string, charId: string) => T((d, c) => W.applyOutfit(d, c, outfitId, charId), 'outfit'),
    deleteOutfit: (id: string) => T((d) => W.deleteOutfit(d, id), 'outfit'),
    renameOutfit: (id: string, name: string) => T((d) => W.renameOutfit(d, id, name), 'outfit'),
    takePhoto: (charId: string, bg: string, caption: string, emo: Emotion) => T((d, c) => W.takePhoto(d, c, charId, bg, caption, emo), 'photo'),
    deletePhoto: (id: string) => T((d) => W.deletePhoto(d, id), 'photo'),
    // ---- магазин и сундуки ----
    buyItem: (id: string) => T((d, c) => S.buyItem(d, c, id), 'buy'),
    buySet: (id: string) => T((d, c) => S.buySet(d, c, id), 'buy'),
    buyChest: (tier: ChestTier) => T((d, c) => S.buyChest(d, c, tier), 'buy'),
    buyDecor: (id: string) => T((d, c) => S.buyDecor(d, c, id), 'buy'),
    openChest: (tier: ChestTier, openId: string) => T((d, c) => openChest(d, c, tier, openId), 'chest'),
    // ---- база ----
    unlockRoom: (id: RoomId) => T((d, c) => B.unlockRoom(d, c, id), 'room'),
    upgradeRoom: (id: RoomId) => T((d, c) => B.upgradeRoom(d, c, id), 'room'),
    placeDecor: (room: RoomId | 'personal', slot: number, id: string) => T((d, c) => B.placeDecor(d, c, room, slot, id), 'decor'),
    removeDecor: (room: RoomId | 'personal', slot: number) => T((d) => B.removeDecor(d, room, slot), 'decor'),
    collectBasket: () => T((d, c) => B.collectBasket(d, c), 'basket'),
    collectRest: () => T((d, c) => B.collectRest(d, c), 'rest'),
    assignBed: (bed: number, id: string | null) => T((d, c) => B.assignBed(d, c, bed, id), 'bed'),
    startResearch: (id: string) => T((d, c) => B.startResearch(d, c, id), 'lab'),
    collectResearch: (jobId: string) => T((d, c) => B.collectResearch(d, c, jobId), 'lab'),
    skipResearch: (jobId: string) => T((d, c) => B.skipResearch(d, c, jobId), 'lab'),
    startCook: (id: string) => T((d, c) => B.startCook(d, c, id), 'cook'),
    finishCook: (id: string, runId: string, quality: number) => T((d, c) => B.finishCook(d, c, id, runId, quality), 'cook'),
    craft: (id: string) => T((d, c) => B.craft(d, c, id), 'craft'),
    train: (charId: string, stat: StatId) => T((d, c) => B.trainCharacter(d, c, charId, stat), 'train'),
    claimSecretRoom: () => T((d, c) => B.claimSecretRoom(d, c), 'secretroom'),
    upgradePersonalRoom: () => T((d, c) => B.upgradePersonalRoom(d, c), 'personal'),
    setPersonalStyle: (wall?: string, floor?: string, note?: string) => T((d) => B.setPersonalStyle(d, wall, floor, note), 'personal'),
    findSecret: (id: string) => T((d, c) => B.findSecret(d, c, id), 'secret'),
    // ---- уровни, мини-игры, награды ----
    completeLevel: (input: { levelId: string; runId: string; success: boolean; metric: number; kinds?: string[] }) => T((d, c) => L.completeLevel(d, c, input), 'level'),
    evaluateTask: (levelId: string, runId: string) => T((d, c) => L.evaluateTaskLevel(d, c, levelId, runId), 'level'),
    finishArcade: (input: { game: MinigameId; runId: string; success: boolean; difficulty: number; metric?: number }) => T((d, c) => L.finishArcade(d, c, input), 'arcade'),
    claimQuest: (id: string) => T((d, c) => { const r = claimQuest(d, c, id); c.notify({ type: 'reward', title: 'Награда за задание', result: r }); return r; }, 'quest'),
    claimDaily: () => T((d, c) => { const r = claimDaily(d, c); c.notify({ type: 'reward', title: 'Ежедневная награда', result: r }); return r; }, 'daily'),
    claimStarMilestone: (id: string) => T((d, c) => { const r = L.claimStarMilestone(d, c, id); c.notify({ type: 'reward', title: 'Награда за звёзды', result: r }); return r; }, 'stars'),
    claimWorldPerfect: (w: number) => T((d, c) => { const r = L.claimWorldPerfect(d, c, w); c.notify({ type: 'reward', title: 'Идеальный мир!', result: r }); return r; }, 'stars'),
    claimCardSet: (w: number) => T((d, c) => { const r = L.claimCardSet(d, c, w); c.notify({ type: 'reward', title: 'Альбом собран!', result: r }); return r; }, 'cards'),
  };
}
export type Api = ReturnType<typeof createApi>;
export type { GameState };
