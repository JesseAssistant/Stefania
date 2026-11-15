import type { Currency, Rarity } from '../game/types';

export function Banana({ className = 'ic' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32"><path d="M7 7c1-3 4-4 6-2 1 6 8 9 15 10-2 8-9 13-17 11C4 23 3 12 7 7z" fill="#FFD93D" stroke="#C99A00" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 9c0 6 6 11 15 13" fill="none" stroke="#FFF3A0" strokeWidth="2" strokeLinecap="round" /><path d="M7 7c-1-2 0-4 2-5" stroke="#7A4F25" strokeWidth="2.4" strokeLinecap="round" fill="none" /></svg>;
}
export function Coin({ className = 'ic' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#FFC53D" stroke="#C98A00" strokeWidth="2" /><circle cx="16" cy="16" r="8.5" fill="none" stroke="#E8A200" strokeWidth="2" /><path d="M16 10v12M12.5 13.5c0-2 7-2 7 0s-7 3-7 5 7 2 7 0" stroke="#B87500" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>;
}
export function Crystal({ className = 'ic' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32"><path d="M16 2l10 9-10 19L6 11z" fill="#7FDBFF" stroke="#2E9CCB" strokeWidth="1.8" strokeLinejoin="round" /><path d="M6 11h20M16 2l-4 9 4 19M16 2l4 9-4 19" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".8" /></svg>;
}
export const CurIcon = ({ c }: { c: Currency }) => c === 'bananas' ? <Banana /> : c === 'coins' ? <Coin /> : <Crystal />;
export const CUR_NAME: Record<Currency, string> = { bananas: 'Бананы', coins: 'Монеты', crystals: 'Кристаллы' };
export const RAR_NAME: Record<Rarity, string> = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' };
export const MAT_ICON: Record<string, string> = { gear: '⚙️', fabric: '🧵', glitter: '✨' };
export const MAT_NAME: Record<string, string> = { gear: 'Шестерёнки', fabric: 'Ткань', glitter: 'Блёстки' };
export const CHEST_NAME: Record<string, string> = { common: 'Обычный сундук', rare: 'Редкий сундук', epic: 'Эпический сундук', legendary: 'Легендарный сундук' };
export const CHEST_ICON: Record<string, string> = { common: '📦', rare: '🎁', epic: '💎', legendary: '👑' };
export const STAT_NAME: Record<string, string> = { speed: 'Скорость', brains: 'Ум', charm: 'Обаяние', luck: 'Удача' };
export const STAT_ICON: Record<string, string> = { speed: '⚡', brains: '🧠', charm: '💖', luck: '🍀' };
export const LAYER_NAME: Record<string, string> = { outfit: 'Одежда', costume: 'Костюм', shoes: 'Обувь', jewelry: 'Украшения', accessory: 'Аксессуар', glasses: 'Очки', hat: 'Головной убор', effect: 'Эффект' };
export const EMOTION_NAME: Record<string, string> = { happy: 'Радость', wink: 'Подмигивание', surprised: 'Удивление', love: 'Любовь', sleepy: 'Сон', excited: 'Восторг', sad: 'Грусть' };

const CARD_EMOJI: Record<string, string> = { banana: '🍌', bed: '🛏️', basket: '🧺', cup: '🍵', key: '🗝️', smile: '😊', wave: '🌊', sand: '🏖️', shell: '🐚', sun: '🌅', dance: '💃', boat: '⛵', flask: '🧪', gear: '⚙️', scroll: '📜', crystal: '💎', robot: '🤖', plan: '📐', neon: '🌃', tram: '🚋', fountain: '⛲', shop: '🛍️', music: '🎶', lights: '🎆', map: '🗺️', moon: '🌙', maze: '🔮', shadow: '👤', star: '⭐', crown: '👑' };
const ACH_EMOJI: Record<string, string> = { bag: '🎒', banana: '🍌', bolt: '⚡', calendar: '📅', camera: '📸', cards: '🃏', chest: '🧰', clock: '⏰', crown: '👑', dumbbell: '🏋️', flask: '🧪', friend: '🐣', friends: '🐥', gear: '⚙️', globe: '🌍', hanger: '👗', heart: '💖', joystick: '🕹️', key: '🗝️', medal: '🏅', pot: '🍲', room: '🏠', scroll: '📜', sofa: '🛋️', sparkle: '✨', star: '⭐' };
export const cardEmoji = (k: string) => CARD_EMOJI[k] || '🃏';
export const achEmoji = (k: string) => ACH_EMOJI[k] || '🏆';
export const ROOM_EMOJI: Record<string, string> = { hall: '🏛️', wardrobe: '👗', bedroom: '🛏️', playroom: '🎮', kitchen: '🍳', lab: '🧪', gym: '🏋️', workshop: '🔧', lounge: '🛋️', secret: '🗝️' };
export const GAME_INFO: Record<string, { name: string; emoji: string; desc: string }> = {
  'banana-catcher': { name: 'Ловец бананов', emoji: '🧺', desc: 'Лови спелые бананы, обходи гнилые.' },
  memory: { name: 'Память', emoji: '🃏', desc: 'Найди все пары карточек.' },
  kitchen: { name: 'Кухня', emoji: '🍳', desc: 'Клади продукты в нужном порядке.' },
  'lab-puzzle': { name: 'Лаборатория', emoji: '🔬', desc: 'Головоломки с лампочками, проводами и кодами.' },
  'treasure-hunt': { name: 'Поиск сокровищ', emoji: '🔍', desc: 'Найди спрятанные предметы на сцене.' },
  sorting: { name: 'Сортировка', emoji: '🗂️', desc: 'Разложи предметы по правилам.' },
  reaction: { name: 'Реакция', emoji: '⚡', desc: 'Нажимай, когда загорится сигнал.' },
  'outfit-challenge': { name: 'Модный вызов', emoji: '🎀', desc: 'Собери образ под тему.' },
};
