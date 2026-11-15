import { DB_NAME, DB_VERSION } from '../config';

/** Абстракция хранилища: в браузере — IndexedDB, в тестах — память. */
export interface StorageAdapter {
  get(store: string, key: string): Promise<any | undefined>;
  put(store: string, key: string, value: any): Promise<void>;
  putMany(store: string, entries: [string, any][]): Promise<void>;
  del(store: string, key: string): Promise<void>;
  list(store: string): Promise<{ key: string; value: any }[]>;
}
export const STORES = ['kv', 'backups', 'quarantine'] as const;

export class MemoryAdapter implements StorageAdapter {
  data: Record<string, Map<string, any>> = { kv: new Map(), backups: new Map(), quarantine: new Map() };
  failWrites = false;
  async get(s: string, k: string) { const v = this.data[s].get(k); return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  async put(s: string, k: string, v: any) { if (this.failWrites) throw new Error('write failed (test)'); this.data[s].set(k, JSON.parse(JSON.stringify(v))); }
  async putMany(s: string, e: [string, any][]) { if (this.failWrites) throw new Error('write failed (test)'); for (const [k, v] of e) this.data[s].set(k, JSON.parse(JSON.stringify(v))); }
  async del(s: string, k: string) { this.data[s].delete(k); }
  async list(s: string) { return [...this.data[s].entries()].map(([key, value]) => ({ key, value: JSON.parse(JSON.stringify(value)) })); }
}

export class IdbAdapter implements StorageAdapter {
  private dbp: Promise<IDBDatabase> | null = null;
  private open(): Promise<IDBDatabase> {
    if (this.dbp) return this.dbp;
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        // ВАЖНО: существующие хранилища никогда не удаляются и не пересоздаются.
        const db = req.result;
        for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      req.onerror = () => { this.dbp = null; reject(req.error || new Error('IndexedDB недоступна')); };
      req.onblocked = () => { this.dbp = null; reject(new Error('IndexedDB заблокирована другой вкладкой')); };
    });
    return this.dbp;
  }
  private async run<T>(store: string, mode: IDBTransactionMode, fn: (os: IDBObjectStore) => IDBRequest | void): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const os = tx.objectStore(store);
      let result: any;
      const req = fn(os);
      if (req) req.onsuccess = () => { result = (req as IDBRequest).result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Ошибка транзакции IndexedDB'));
      tx.onabort = () => reject(tx.error || new Error('Транзакция IndexedDB прервана (возможно, нет места)'));
    });
  }
  get(store: string, key: string) { return this.run<any>(store, 'readonly', (os) => os.get(key)); }
  async put(store: string, key: string, value: any) { await this.run<void>(store, 'readwrite', (os) => { os.put(value, key); }); }
  async putMany(store: string, entries: [string, any][]) { await this.run<void>(store, 'readwrite', (os) => { for (const [k, v] of entries) os.put(v, k); }); }
  async del(store: string, key: string) { await this.run<void>(store, 'readwrite', (os) => { os.delete(key); }); }
  async list(store: string) {
    const db = await this.open();
    return new Promise<{ key: string; value: any }[]>((resolve, reject) => {
      const out: { key: string; value: any }[] = [];
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { out.push({ key: String(c.key), value: c.value }); c.continue(); } };
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
    });
  }
}
export const idbAvailable = () => typeof indexedDB !== 'undefined';
