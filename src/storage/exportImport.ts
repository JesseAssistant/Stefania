import type { GameState, SaveFile } from '../game/types';
import { GAME_VERSION, LEGACY_FORMATS, SAVE_FORMAT, SCHEMA_VERSION } from '../config';
import { LEVELS } from '../game/data/worlds';
import { CHARACTERS } from '../game/data/characters';
import { clone } from '../game/util';
import { canonicalize, sha256 } from './sha256';
import { validateState } from './validators/schema';
import { migrateData } from './migrations';
import type { Migration } from './migrations';
import { MIGRATIONS } from './migrations';
import { hydrate } from './hydrate';

const NON_DATA_KEYS = ['integrity', 'exportedAt'];
export function computeChecksum(file: Record<string, unknown>): string {
  const body: Record<string, unknown> = {};
  for (const k of Object.keys(file)) if (!NON_DATA_KEYS.includes(k)) body[k] = file[k];
  return sha256(canonicalize(body));
}
export function buildSaveFile(state: GameState, now: number): SaveFile {
  const data = clone(state);
  const file: Record<string, unknown> = { format: SAVE_FORMAT, schemaVersion: SCHEMA_VERSION, gameVersion: GAME_VERSION, ...data };
  const sections = Object.keys(data).length;
  const checksum = computeChecksum(file);
  return { ...(file as unknown as SaveFile), exportedAt: new Date(now).toISOString(), integrity: { algorithm: 'sha256', checksum, sections } };
}
export const serializeSave = (file: SaveFile): string => JSON.stringify(file, null, 2);

export interface SaveSummary {
  gameVersion: string; schemaVersion: number; exportedAt: string; bytes: number;
  playerLevel: number; bananas: number; coins: number; crystals: number; characters: number; stars: number; levelsCleared: number; achievements: number; revision: number;
}
export function summarize(state: GameState, meta: { gameVersion: string; schemaVersion: number; exportedAt: string; bytes: number }): SaveSummary {
  const stars = LEVELS.reduce((a, l) => a + (state.levels[l.id]?.stars || 0), 0);
  return {
    ...meta, playerLevel: state.player.level, bananas: state.currencies.bananas, coins: state.currencies.coins, crystals: state.currencies.crystals,
    characters: CHARACTERS.filter((c) => state.characters[c.id]?.unlocked).length, stars,
    levelsCleared: LEVELS.filter((l) => (state.levels[l.id]?.stars || 0) > 0).length, achievements: Object.keys(state.achievements).length, revision: state.metadata.revision,
  };
}

export interface ImportSuccess {
  ok: true; state: GameState; summary: SaveSummary; migrated: boolean; applied: { from: number; to: number; name: string }[];
  warnings: string[]; integrity: 'ok' | 'missing'; exportedSchema: number;
}
export interface ImportFailure { ok: false; errors: string[]; stage: 'parse' | 'format' | 'structure' | 'integrity' | 'compat' | 'migrate' | 'validate' }
export type ImportResult = ImportSuccess | ImportFailure;

/**
 * Полный конвейер проверки: JSON -> формат -> структура -> целостность -> совместимость схемы -> миграция -> валидация.
 * Текущий прогресс заменяется ТОЛЬКО после успешного завершения всех шагов (см. SaveService.applyImport).
 */
export function parseSaveText(text: string, now: number, registry: Migration[] = MIGRATIONS, target: number = SCHEMA_VERSION): ImportResult {
  let raw: any;
  try { raw = JSON.parse(text); } catch { return { ok: false, stage: 'parse', errors: ['Файл не является корректным JSON'] }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, stage: 'structure', errors: ['Неверная структура файла'] };
  const fmt = raw.format;
  if (fmt !== SAVE_FORMAT && !LEGACY_FORMATS.includes(fmt)) return { ok: false, stage: 'format', errors: ['Это не файл сохранения игры (неизвестный формат)'] };
  if (!Number.isInteger(raw.schemaVersion) || raw.schemaVersion < 0) return { ok: false, stage: 'structure', errors: ['В файле нет корректной версии схемы'] };
  const warnings: string[] = [];
  let integrity: 'ok' | 'missing' = 'missing';
  if (raw.integrity && typeof raw.integrity === 'object') {
    if (raw.integrity.algorithm !== 'sha256') return { ok: false, stage: 'integrity', errors: ['Неизвестный алгоритм проверки целостности'] };
    if (computeChecksum(raw) !== raw.integrity.checksum) return { ok: false, stage: 'integrity', errors: ['Контрольная сумма не совпадает: файл повреждён или изменён. Текущий прогресс не тронут.'] };
    integrity = 'ok';
  } else warnings.push('В файле нет контрольной суммы — проверена только структура.');
  const mig = migrateData(raw, registry, target);
  if (!mig.ok) return { ok: false, stage: raw.schemaVersion > target ? 'compat' : 'migrate', errors: [mig.error || 'Миграция не удалась'] };
  let hy: { state: GameState; warnings: string[] };
  try { hy = hydrate(mig.data, now); } catch (e) { return { ok: false, stage: 'validate', errors: [`Не удалось прочитать данные: ${(e as Error).message}`] }; }
  warnings.push(...hy.warnings);
  const v = validateState(hy.state);
  if (!v.ok) return { ok: false, stage: 'validate', errors: v.errors };
  warnings.push(...v.warnings);
  if (mig.applied.length) hy.state.metadata.migrations.push(...mig.applied.map((a) => ({ from: a.from, to: a.to, at: new Date(now).toISOString() })));
  const summary = summarize(hy.state, { gameVersion: String(raw.gameVersion || '?'), schemaVersion: raw.schemaVersion, exportedAt: String(raw.exportedAt || ''), bytes: new TextEncoder().encode(text).length });
  return { ok: true, state: hy.state, summary, migrated: mig.applied.length > 0, applied: mig.applied, warnings, integrity, exportedSchema: raw.schemaVersion };
}
