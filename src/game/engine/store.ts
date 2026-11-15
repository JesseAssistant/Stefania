import { GameError } from '../types';
import type { GameState, Notice } from '../types';
import { GAME_VERSION, MAX_PROCESSED_EVENTS } from '../../config';
import { clone } from '../util';
import { ITEMS } from '../data/items';
import { ROOMS } from '../data/rooms';
import { CHARACTERS } from '../data/characters';
import { makeCtx } from './context';
import type { Ctx } from './context';
import { assertWalletValid } from './economy';
import { handleQuestEvents, refreshStateQuests, rolloverQuests } from './quests';
import { evaluateAchievements } from './achievements';
import { refreshProgress } from './levels';
import { normalizeRooms } from './base';
import { reconcile } from './newGame';

export type Persist = (state: GameState, reason: string) => void;
export interface StoreOptions { clock?: () => number; persist?: Persist }

/**
 * Хранилище состояния. Все изменения идут через tx(): работа ведётся на копии (draft), при любой ошибке
 * состояние остаётся прежним (атомарность), после успеха — проверка инвариантов, фиксация и сохранение.
 */
export class GameStore {
  private state: GameState;
  private mainState: GameState | null = null;
  private listeners = new Set<() => void>();
  private noticeListeners = new Set<(n: Notice) => void>();
  private clock: () => number;
  private persistFn?: Persist;
  mode: 'main' | 'sandbox' = 'main';

  constructor(initial: GameState, opts: StoreOptions = {}) {
    this.clock = opts.clock || (() => Date.now());
    this.persistFn = opts.persist;
    this.state = initial;
  }
  getState = (): GameState => this.state;
  now = (): number => this.clock();
  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  onNotice = (l: (n: Notice) => void) => { this.noticeListeners.add(l); return () => { this.noticeListeners.delete(l); }; };
  private emitChange() { this.listeners.forEach((l) => l()); }
  notify(n: Notice) { this.noticeListeners.forEach((l) => l(n)); }

  tx<T>(fn: (d: GameState, ctx: Ctx) => T, reason = 'tx'): T {
    const d = clone(this.state);
    const ctx = makeCtx(d, this.clock());
    rolloverQuests(d, ctx);
    const value = fn(d, ctx);
    for (let i = 0; i < 8; i++) {
      const evs = ctx.events.splice(0, ctx.events.length);
      refreshProgress(d, ctx);
      handleQuestEvents(d, evs);
      refreshStateQuests(d);
      const gained = evaluateAchievements(d, ctx);
      if (!ctx.events.length && !gained) break;
    }
    refreshProgress(d, ctx);
    refreshStateQuests(d);
    normalizeRooms(d);
    assertWalletValid(d);
    const pe = d.metadata.processedEvents;
    if (pe.length > MAX_PROCESSED_EVENTS) pe.splice(0, pe.length - MAX_PROCESSED_EVENTS);
    d.metadata.revision++;
    d.metadata.savedAt = new Date(ctx.now).toISOString();
    d.metadata.lastVersion = GAME_VERSION;
    this.state = d;
    if (this.mode === 'main') this.persistFn?.(d, reason);
    this.emitChange();
    for (const n of ctx.notices) this.notify(n);
    return value;
  }
  /** Безопасный вызов: ошибки игры превращаются в сообщение, состояние не меняется. */
  attempt<T>(fn: (d: GameState, ctx: Ctx) => T, reason = 'tx'): { ok: true; value: T } | { ok: false; error: string; code: string } {
    try { return { ok: true, value: this.tx(fn, reason) }; } catch (e) {
      if (e instanceof GameError) return { ok: false, error: e.message, code: e.code };
      console.error(e);
      return { ok: false, error: 'Что-то пошло не так. Прогресс не изменён.', code: 'internal' };
    }
  }
  /** Полная замена состояния (импорт, сброс, восстановление). Сохраняется сразу. */
  replaceState(next: GameState, reason = 'replace') {
    reconcile(next, this.clock());
    this.state = next;
    this.mode = 'main'; this.mainState = null;
    this.persistFn?.(next, reason);
    this.emitChange();
  }
  // ---- Свободная игра: временная копия, не сохраняется и не трогает основной прогресс ----
  enterSandbox() {
    if (this.mode === 'sandbox') return;
    this.mainState = this.state;
    const s = clone(this.state);
    s.currencies.bananas = s.currencies.coins = s.currencies.crystals = 99999;
    for (const it of ITEMS) s.wardrobe.owned[it.id] ||= { at: new Date(this.clock()).toISOString(), source: 'sandbox' };
    for (const r of ROOMS) if (!s.base.rooms[r.id].unlocked) { s.base.rooms[r.id].unlocked = true; s.base.rooms[r.id].level = 1; }
    for (const c of CHARACTERS) s.characters[c.id].unlocked = true;
    s.player.level = Math.max(s.player.level, 50);
    s.inventory.chests = { common: 9, rare: 9, epic: 9, legendary: 9 };
    s.inventory.materials = { gear: 99, fabric: 99, glitter: 99 };
    normalizeRooms(s);
    this.state = s; this.mode = 'sandbox';
    this.emitChange();
  }
  exitSandbox() {
    if (this.mode !== 'sandbox' || !this.mainState) return;
    this.state = this.mainState; this.mainState = null; this.mode = 'main';
    this.emitChange();
  }
}
