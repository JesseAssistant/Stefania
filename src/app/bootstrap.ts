import { GameStore } from '../game/engine/store';
import { createApi, type Api } from '../game/api';
import { IdbAdapter, MemoryAdapter } from '../storage/adapters';
import { SaveService, type LoadResult } from '../storage/saveService';
import { AudioEngine } from '../audio/engine';
import { createNewState } from '../game/engine/newGame';
import type { App } from './ctx';

export interface Booted { app: App; load: LoadResult; storageOk: boolean }

/** Создаёт хранилище, загружает сохранение (с восстановлением), запускает игровую сессию. */
export async function bootstrap(): Promise<Booted> {
  let adapter: IdbAdapter | MemoryAdapter = new IdbAdapter();
  let mirror: Storage | null = null;
  try { mirror = window.localStorage; mirror.getItem('x'); } catch { mirror = null; }
  const svc0 = new SaveService(adapter, { mirror });
  let load: LoadResult;
  let storageOk = true;
  try { load = await svc0.load(); } catch (e) {
    // IndexedDB недоступна (например, приватный режим): играем в памяти и честно предупреждаем
    storageOk = false;
    adapter = new MemoryAdapter();
    load = { state: createNewState(Date.now()), source: 'new', isNew: true, warnings: [`Память устройства недоступна (${(e as Error).message}). Прогресс не сохранится — экспортируй его вручную в настройках.`], migrated: [], recovered: false };
  }
  const svc = storageOk ? svc0 : new SaveService(adapter, { mirror });
  const store = new GameStore(load.state, { persist: (s) => svc.save(s) });
  const api: Api = createApi(store);
  const audio = new AudioEngine();
  audio.apply(load.state.settings);
  api.startSession();
  // Автокопия не чаще раза в 12 часов (последние 7 хранятся)
  svc.lastAutoBackupAt().then((t) => { if (Date.now() - t > 12 * 3600 * 1000 && !load.isNew) svc.createBackup(store.getState(), 'auto').catch(() => {}); }).catch(() => {});
  return { app: { store, api, svc, audio }, load, storageOk };
}
