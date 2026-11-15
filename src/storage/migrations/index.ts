import { SCHEMA_VERSION } from '../../config';
import { migrateV0toV1 } from './v0_to_v1';

/**
 * Реестр миграций сохранений. Каждая миграция:
 *  - получает ГЛУБОКУЮ КОПИЮ данных (исходные данные не меняются);
 *  - переносит все старые данные в новую структуру, не обнуляя валюту, персонажей, одежду, прогресс и достижения;
 *  - не заполняет «значения по умолчанию» — это делает hydrate() после всей цепочки.
 *
 * Как добавить новую версию схемы (пример: v1 -> v2):
 *  1) увеличьте SCHEMA_VERSION в src/config.ts;
 *  2) создайте src/storage/migrations/v1_to_v2.ts и добавьте её в MIGRATIONS ниже;
 *  3) добавьте тест в tests/migration/.
 */
export interface Migration { from: number; to: number; name: string; migrate: (data: any) => any }
export const MIGRATIONS: Migration[] = [
  { from: 0, to: 1, name: 'prototype-v0 -> schema-1', migrate: migrateV0toV1 },
];

export interface MigrationResult { ok: boolean; data?: any; applied: { from: number; to: number; name: string }[]; error?: string }

export function planMigrations(from: number, target: number, registry: Migration[]): Migration[] | null {
  const plan: Migration[] = [];
  let cur = from;
  while (cur < target) {
    const m = registry.find((x) => x.from === cur);
    if (!m) return null;
    plan.push(m); cur = m.to;
  }
  return cur === target ? plan : null;
}
export function migrateData(raw: any, registry: Migration[] = MIGRATIONS, target: number = SCHEMA_VERSION): MigrationResult {
  const from = Number(raw?.schemaVersion ?? 0);
  if (!Number.isInteger(from) || from < 0) return { ok: false, applied: [], error: 'Некорректная версия схемы сохранения' };
  if (from > target) return { ok: false, applied: [], error: `Сохранение создано более новой версией игры (схема ${from}). Обнови игру, чтобы открыть его.` };
  if (from === target) return { ok: true, data: raw, applied: [] };
  const plan = planMigrations(from, target, registry);
  if (!plan) return { ok: false, applied: [], error: `Нет пути миграции со схемы ${from} на ${target}` };
  let data = JSON.parse(JSON.stringify(raw));
  const applied: MigrationResult['applied'] = [];
  for (const m of plan) {
    try {
      data = m.migrate(JSON.parse(JSON.stringify(data)));
      data.schemaVersion = m.to;
      applied.push({ from: m.from, to: m.to, name: m.name });
    } catch (e) {
      return { ok: false, applied, error: `Ошибка миграции ${m.from}→${m.to}: ${(e as Error).message}` };
    }
  }
  return { ok: true, data, applied };
}
