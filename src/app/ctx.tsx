import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { GameStore } from '../game/engine/store';
import type { Api } from '../game/api';
import type { SaveService } from '../storage/saveService';
import type { AudioEngine, Sfx } from '../audio/engine';
import { GameError, type GameState } from '../game/types';
import { toast } from './bus';

export interface App { store: GameStore; api: Api; svc: SaveService; audio: AudioEngine }
const Ctx = createContext<App>(null as unknown as App);
export const AppProvider = Ctx.Provider;
export const useApp = () => useContext(Ctx);
export function useGame(): GameState { const { store } = useApp(); return useSyncExternalStore(store.subscribe, store.getState); }
export function useNow(ms = 1000): number {
  const { store } = useApp();
  const [n, setN] = useState(() => store.now());
  useEffect(() => { const t = setInterval(() => setN(store.now()), ms); return () => clearInterval(t); }, [ms, store]);
  return n;
}
export type ActResult<T> = { ok: true; value: T } | { ok: false; error: string };
/** Выполняет действие игры: ошибки правил показываются тостом, состояние при ошибке не меняется. */
export function useAct() {
  const { audio } = useApp();
  return useCallback(<T,>(fn: () => T, o: { ok?: string; sfx?: Sfx; quiet?: boolean } = {}): ActResult<T> => {
    try {
      const value = fn();
      if (o.ok) toast(o.ok, 'good');
      if (!o.quiet) audio.sfx(o.sfx || 'good');
      return { ok: true, value };
    } catch (e) {
      if (e instanceof GameError) { toast(e.message, 'bad'); audio.sfx('error'); return { ok: false, error: e.message }; }
      console.error(e);
      toast('Что-то пошло не так. Прогресс не изменён.', 'bad'); audio.sfx('error');
      return { ok: false, error: 'internal' };
    }
  }, [audio]);
}
