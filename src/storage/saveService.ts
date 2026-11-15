import type { GameState } from '../game/types';
import { GAME_VERSION, LS_MIRROR_KEY, MAX_BACKUPS, SAVE_FORMAT, SCHEMA_VERSION } from '../config';
import { createNewState } from '../game/engine/newGame';
import { canonicalize, sha256 } from './sha256';
import type { StorageAdapter } from './adapters';
import { migrateData } from './migrations';
import { hydrate } from './hydrate';
import { validateState } from './validators/schema';
import { summarize } from './exportImport';
import type { ImportSuccess, SaveSummary } from './exportImport';
import type { GameStore } from '../game/engine/store';

/** Запись в хранилище: оболочка вокруг состояния + контрольная сумма для обнаружения тихой порчи данных. */
export interface StoredSave { wrapper: 1; schemaVersion: number; gameVersion: string; revision: number; savedAt: string; checksum: string; state: any }
export interface BackupMeta { id: string; createdAt: string; reason: string; revision: number; summary: SaveSummary }
export type SavePhase = 'idle' | 'saving' | 'ok' | 'error';
export interface SaveStatus { phase: SavePhase; lastSavedAt?: string; lastRevision?: number; error?: string; failures: number; mirrorOk: boolean }
export interface LoadResult {
  state: GameState; source: 'idb' | 'prev' | 'mirror' | 'backup' | 'new'; isNew: boolean; warnings: string[];
  migrated: { from: number; to: number; name: string }[]; recovered: boolean;
}
const PERMANENT = new Set(['import', 'migration', 'manual', 'reset', 'restore']);
const AUTO_KEEP = 7;

export const wrap = (state: GameState, now: number): StoredSave => ({
  wrapper: 1, schemaVersion: SCHEMA_VERSION, gameVersion: GAME_VERSION, revision: state.metadata.revision,
  savedAt: new Date(now).toISOString(), checksum: sha256(canonicalize(state)), state,
});

export class SaveService {
  status: SaveStatus = { phase: 'idle', failures: 0, mirrorOk: true };
  private listeners = new Set<(s: SaveStatus) => void>();
  private pending: GameState | null = null;
  private draining: Promise<void> | null = null;
  private lastWrapper: StoredSave | null = null;
  private retryTimer: any = null;

  constructor(private adapter: StorageAdapter, private opts: { now?: () => number; mirror?: Pick<Storage, 'getItem' | 'setItem'> | null; retryMs?: number } = {}) {}
  private now = () => (this.opts.now ? this.opts.now() : Date.now());
  subscribe(cb: (s: SaveStatus) => void) { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; }
  private setStatus(p: Partial<SaveStatus>) { this.status = { ...this.status, ...p }; this.listeners.forEach((l) => l(this.status)); }

  /** Ставит состояние в очередь записи. Пишется всегда самое свежее; запись не блокирует интерфейс. */
  save(state: GameState): void {
    this.pending = state;
    if (!this.draining) this.draining = Promise.resolve().then(() => this.drain());
  }
  private async drain(): Promise<void> {
    try {
      while (this.pending) {
        const st = this.pending; this.pending = null;
        this.setStatus({ phase: 'saving' });
        try {
          await this.writeNow(st);
          this.setStatus({ phase: 'ok', lastSavedAt: new Date(this.now()).toISOString(), lastRevision: st.metadata.revision, error: undefined, failures: 0 });
        } catch (e) {
          const msg = (e as Error)?.message || 'неизвестная ошибка';
          if (!this.pending) this.pending = st; // повторим позже
          this.setStatus({ phase: 'error', error: msg, failures: this.status.failures + 1 });
          this.scheduleRetry();
          break;
        }
      }
    } finally { this.draining = null; }
  }
  private scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => { this.retryTimer = null; if (this.pending && !this.draining) this.draining = Promise.resolve().then(() => this.drain()); }, this.opts.retryMs ?? 4000);
    (this.retryTimer as any)?.unref?.();
  }
  private async writeNow(state: GameState): Promise<void> {
    const w = wrap(state, this.now());
    // зеркало в localStorage — вторая страховка на случай сбоев IndexedDB в Safari
    let mirrorOk = true;
    try { if (this.opts.mirror) this.opts.mirror.setItem(LS_MIRROR_KEY, JSON.stringify(w)); } catch { mirrorOk = false; }
    this.status.mirrorOk = mirrorOk;
    const entries: [string, any][] = [];
    if (this.lastWrapper) entries.push(['save.prev', this.lastWrapper]);
    entries.push(['save', w]);
    await this.adapter.putMany('kv', entries);
    this.lastWrapper = w;
  }
  async flush(): Promise<void> {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    if (this.pending && !this.draining) this.draining = Promise.resolve().then(() => this.drain());
    while (this.draining) await this.draining;
  }

  // ---------- чтение ----------
  private readStored(w: any, label: string, warnings: string[]): { state: GameState; applied: { from: number; to: number; name: string }[]; revision: number } | null {
    try {
      if (!w || typeof w !== 'object' || !w.state) return null;
      if (w.checksum && sha256(canonicalize(w.state)) !== w.checksum) { warnings.push(`Запись «${label}» повреждена (контрольная сумма не совпала).`); return null; }
      const file = { format: SAVE_FORMAT, schemaVersion: Number.isInteger(w.schemaVersion) ? w.schemaVersion : SCHEMA_VERSION, ...w.state };
      const mig = migrateData(file);
      if (!mig.ok) { warnings.push(`Запись «${label}»: ${mig.error}`); return null; }
      const hy = hydrate(mig.data, this.now());
      const v = validateState(hy.state);
      if (!v.ok) { warnings.push(`Запись «${label}» не прошла проверку: ${v.errors.join('; ')}`); return null; }
      return { state: hy.state, applied: mig.applied, revision: hy.state.metadata.revision };
    } catch (e) { warnings.push(`Запись «${label}» не прочитана: ${(e as Error).message}`); return null; }
  }
  async load(): Promise<LoadResult> {
    const warnings: string[] = [];
    let rawMain: any, rawPrev: any, rawMirror: any;
    try { rawMain = await this.adapter.get('kv', 'save'); rawPrev = await this.adapter.get('kv', 'save.prev'); } catch (e) { warnings.push(`Хранилище устройства недоступно: ${(e as Error).message}`); }
    try { const m = this.opts.mirror?.getItem(LS_MIRROR_KEY); if (m) rawMirror = JSON.parse(m); } catch { /* зеркало необязательно */ }
    const cands: { src: LoadResult['source']; raw: any }[] = [{ src: 'idb', raw: rawMain }, { src: 'mirror', raw: rawMirror }, { src: 'prev', raw: rawPrev }];
    const parsed: { src: LoadResult['source']; r: NonNullable<ReturnType<SaveService['readStored']>>; raw: any }[] = [];
    let sawAny = false;
    for (const c of cands) {
      if (!c.raw) continue;
      sawAny = true;
      const r = this.readStored(c.raw, c.src, warnings);
      if (r) parsed.push({ src: c.src, r, raw: c.raw }); else await this.quarantine(c.raw, c.src);
    }
    // выбираем самую свежую ревизию; при равенстве предпочитаем основное хранилище
    parsed.sort((a, b) => b.r.revision - a.r.revision);
    const best = parsed[0];
    if (best) {
      if (best.src === 'mirror' && rawMain) warnings.push('Основное хранилище отставало — восстановлено из резервной копии браузера.');
      if (best.src === 'prev') warnings.push('Последняя запись была повреждена — восстановлена предыдущая.');
      if (best.r.applied.length) await this.createBackupRaw(best.raw, 'migration', best.r.state).catch(() => {});
      this.lastWrapper = best.src === 'idb' ? best.raw : null;
      return { state: best.r.state, source: best.src, isNew: false, warnings, migrated: best.r.applied, recovered: best.src !== 'idb' };
    }
    // ничего не прочитали — пробуем резервные копии
    try {
      const metas = await this.listBackups();
      for (const m of metas) {
        const rec = await this.adapter.get('backups', m.id);
        const r = rec && this.readStored(rec.stored, `backup ${m.id}`, warnings);
        if (r) { warnings.push('Основное сохранение не прочитано — восстановлено из резервной копии.'); return { state: r.state, source: 'backup', isNew: false, warnings, migrated: r.applied, recovered: true }; }
      }
    } catch { /* нет доступа к резервным копиям */ }
    if (sawAny) warnings.push('Не удалось прочитать сохранение. Повреждённые данные сохранены отдельно, начата новая игра.');
    return { state: createNewState(this.now()), source: 'new', isNew: true, warnings, migrated: [], recovered: false };
  }
  private async quarantine(raw: any, label: string) {
    try { await this.adapter.put('quarantine', `${this.now()}_${label}`, raw); } catch { /* не критично */ }
  }

  // ---------- резервные копии ----------
  async createBackup(state: GameState, reason: string): Promise<BackupMeta> {
    const stored = wrap(state, this.now());
    const meta: BackupMeta = {
      id: `${String(this.now()).padStart(14, '0')}_${reason}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      createdAt: new Date(this.now()).toISOString(), reason, revision: state.metadata.revision,
      summary: summarize(state, { gameVersion: GAME_VERSION, schemaVersion: SCHEMA_VERSION, exportedAt: new Date(this.now()).toISOString(), bytes: JSON.stringify(stored).length }),
    };
    await this.adapter.put('backups', meta.id, { meta, stored });
    await this.trimBackups();
    return meta;
  }
  private async createBackupRaw(rawWrapper: any, reason: string, state: GameState) {
    const meta: BackupMeta = {
      id: `${String(this.now()).padStart(14, '0')}_${reason}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      createdAt: new Date(this.now()).toISOString(), reason, revision: rawWrapper.revision ?? state.metadata.revision,
      summary: summarize(state, { gameVersion: String(rawWrapper.gameVersion || '?'), schemaVersion: rawWrapper.schemaVersion ?? 0, exportedAt: String(rawWrapper.savedAt || ''), bytes: JSON.stringify(rawWrapper).length }),
    };
    await this.adapter.put('backups', meta.id, { meta, stored: rawWrapper });
  }
  async listBackups(): Promise<BackupMeta[]> {
    const all = await this.adapter.list('backups');
    return all.map((x) => x.value.meta as BackupMeta).sort((a, b) => (a.id < b.id ? 1 : -1));
  }
  /** Удаляем только авто-копии старше AUTO_KEEP. Копии перед импортом/миграцией/сбросом не удаляются никогда. */
  private async trimBackups() {
    const metas = await this.listBackups();
    const autos = metas.filter((m) => !PERMANENT.has(m.reason));
    for (const m of autos.slice(AUTO_KEEP)) await this.adapter.del('backups', m.id);
    void MAX_BACKUPS;
  }
  async lastAutoBackupAt(): Promise<number> {
    const m = (await this.listBackups()).find((x) => x.reason === 'auto');
    return m ? Date.parse(m.createdAt) : 0;
  }
  async readBackup(id: string): Promise<{ state: GameState; warnings: string[] } | null> {
    const rec = await this.adapter.get('backups', id);
    if (!rec) return null;
    const warnings: string[] = [];
    const r = this.readStored(rec.stored, `backup ${id}`, warnings);
    return r ? { state: r.state, warnings } : null;
  }

  // ---------- высокоуровневые операции ----------
  /** Импорт: резервная копия текущего -> замена -> принудительная запись -> проверка чтением. */
  async applyImport(store: GameStore, imp: ImportSuccess): Promise<{ backup: BackupMeta; verified: boolean }> {
    const backup = await this.createBackup(store.getState(), 'import');
    const next = imp.state;
    next.metadata.revision = Math.max(next.metadata.revision, store.getState().metadata.revision) + 1;
    store.replaceState(next, 'import');
    await this.flush();
    return { backup, verified: await this.verifyPersisted(store.getState()) };
  }
  /** Восстановление из резервной копии: сначала копия текущего прогресса (reason 'restore'), потом замена и проверка записи. */
  async restoreBackup(store: GameStore, id: string): Promise<{ backup: BackupMeta; verified: boolean; warnings: string[] } | null> {
    const rb = await this.readBackup(id);
    if (!rb) return null;
    const backup = await this.createBackup(store.getState(), 'restore');
    rb.state.metadata.revision = Math.max(rb.state.metadata.revision, store.getState().metadata.revision) + 1;
    store.replaceState(rb.state, 'restore');
    await this.flush();
    return { backup, verified: await this.verifyPersisted(store.getState()), warnings: rb.warnings };
  }
  async resetProgress(store: GameStore): Promise<BackupMeta> {
    const backup = await this.createBackup(store.getState(), 'reset');
    const fresh = createNewState(this.now());
    fresh.metadata.revision = store.getState().metadata.revision + 1;
    store.replaceState(fresh, 'reset');
    await this.flush();
    return backup;
  }
  async verifyPersisted(state: GameState): Promise<boolean> {
    try {
      const w = await this.adapter.get('kv', 'save');
      return !!w && w.revision === state.metadata.revision && w.checksum === sha256(canonicalize(state));
    } catch { return false; }
  }
}
export async function storageInfo(): Promise<{ persisted: boolean | null; usage: number | null; quota: number | null }> {
  try {
    const s = (navigator as any).storage;
    const persisted = s?.persisted ? await s.persisted() : null;
    const est = s?.estimate ? await s.estimate() : null;
    return { persisted, usage: est?.usage ?? null, quota: est?.quota ?? null };
  } catch { return { persisted: null, usage: null, quota: null }; }
}
export async function requestPersistence(): Promise<boolean> {
  try { return (await (navigator as any).storage?.persist?.()) ?? false; } catch { return false; }
}
