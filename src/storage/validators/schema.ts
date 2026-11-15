import type { GameState } from '../../game/types';
import { CURRENCIES, SAVE_SECTIONS } from '../../game/types';
import { isInt } from '../../game/util';

export interface Validation { ok: boolean; errors: string[]; warnings: string[] }
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Проверка структуры и здравого смысла данных сохранения (после миграции и заполнения значений по умолчанию). */
export function validateState(s: unknown): Validation {
  const errors: string[] = [], warnings: string[] = [];
  if (!isObj(s)) return { ok: false, errors: ['Сохранение не является объектом'], warnings };
  for (const sec of SAVE_SECTIONS) if (!isObj(s[sec])) errors.push(`Нет раздела «${sec}»`);
  if (errors.length) return { ok: false, errors, warnings };
  const d = s as unknown as GameState;
  for (const c of CURRENCIES) if (!isInt(d.currencies[c]) || d.currencies[c] < 0) errors.push(`Некорректный баланс: ${c}`);
  if (!isInt(d.player.level) || d.player.level < 1 || d.player.level > 200) errors.push('Некорректный уровень игрока');
  if (!isInt(d.player.xp) || d.player.xp < 0) errors.push('Некорректный опыт игрока');
  if (typeof d.player.name !== 'string') errors.push('Нет имени игрока');
  for (const [id, c] of Object.entries(d.characters)) {
    if (!isObj(c)) { errors.push(`Повреждён персонаж ${id}`); continue; }
    if (!isInt(c.level) || c.level < 1) errors.push(`Некорректный уровень персонажа ${id}`);
    if (!isObj(c.equipped)) errors.push(`Некорректная одежда персонажа ${id}`);
  }
  for (const [id, l] of Object.entries(d.levels)) {
    if (!isObj(l) || !isInt(l.stars) || l.stars < 0 || l.stars > 3) errors.push(`Некорректные звёзды уровня ${id}`);
  }
  if (!Array.isArray(d.metadata.processedEvents)) errors.push('Повреждён журнал событий');
  if (!isInt(d.metadata.revision)) errors.push('Нет номера ревизии');
  if (!isObj(d.wardrobe.owned)) errors.push('Повреждён гардероб');
  if (!isObj(d.base.rooms)) errors.push('Повреждена база');
  if (!isObj(d.inventory.chests)) errors.push('Повреждён инвентарь');
  if (!d.characters[d.player.selectedCharacterId]) warnings.push('Выбранный персонаж не найден — будет выбран другой');
  return { ok: errors.length === 0, errors, warnings };
}
