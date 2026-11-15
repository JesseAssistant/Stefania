import type { Cost, RoomDef, RoomId } from '../types';

const b = (n: number): Cost => ({ bananas: n });
const bc = (x: number, y: number): Cost => ({ bananas: x, coins: y });
const c = (n: number): Cost => ({ coins: n });
const cc = (x: number, y: number): Cost => ({ coins: x, crystals: y });

const up = (k: number): Cost[] => [b(Math.round(150 * k)), bc(Math.round(300 * k), Math.round(30 * k)), bc(Math.round(500 * k), Math.round(120 * k)), cc(Math.round(300 * k), Math.max(2, Math.round(5 * k)))];

export const ROOMS: RoomDef[] = [
  { id: 'hall', name: 'Главный холл', desc: 'Сердце базы: здесь растёт банановая корзина.', color: '#FFD93D',
    unlock: { playerLevel: 1, cost: {} }, maxLevel: 5, upgrades: up(1),
    perks: ['Корзина копит 24 банана в час', 'Скорость x1.5, больше вместимость', 'Скорость x2', 'Скорость x2.5', 'Скорость x3 и огромная вместимость'] },
  { id: 'wardrobe', name: 'Гардеробная', desc: 'Здесь живёт мода: образы, комплекты и скидки.', color: '#FF8FC1',
    unlock: { playerLevel: 1, cost: {} }, maxLevel: 5, upgrades: up(1.2),
    perks: ['4 слота для комплектов', '7 слотов и скидка 3% в магазине', '10 слотов и скидка 6%', '14 слотов и скидка 9%', '20 слотов и скидка 12%'] },
  { id: 'bedroom', name: 'Спальня', desc: 'Уложи Нанабо спать — они проснутся с опытом.', color: '#9DB8FF',
    unlock: { playerLevel: 2, cost: b(120) }, maxLevel: 5, upgrades: up(1.1),
    perks: ['2 кровати', '3 кровати, больше опыта за сон', '4 кровати', '5 кроватей', '6 кроватей и бонус опыта'] },
  { id: 'playroom', name: 'Игровая комната', desc: 'Аркада с мини-играми и место для декораций.', color: '#7ED957',
    unlock: { playerLevel: 3, cost: b(250) }, maxLevel: 5, upgrades: up(1.3),
    perks: ['Аркада: мини-игры без ограничений уровней', '+10% бананов в аркаде', '+20% бананов в аркаде', '+30% бананов в аркаде', '+40% бананов и больше декора'] },
  { id: 'kitchen', name: 'Кухня', desc: 'Готовь банановые блюда и угощай Нанабо.', color: '#FFB347',
    unlock: { playerLevel: 4, cost: bc(400, 30) }, maxLevel: 5, upgrades: up(1.5),
    perks: ['Рецепты 1 уровня', 'Рецепты 2 уровня', 'Рецепты 3 уровня', 'Рецепты 4 уровня', 'Золотой пирог и бонус навыка'] },
  { id: 'lab', name: 'Лаборатория', desc: 'Исследования дают материалы, кристаллы и редкости.', color: '#6FA8FF',
    unlock: { playerLevel: 6, cost: bc(700, 80) }, maxLevel: 5, upgrades: up(1.8),
    perks: ['Исследования 1 уровня, 1 очередь', 'Быстрее на 10%, исследования 2 уровня', '2 очереди, исследования 3 уровня', 'Быстрее на 30%, исследования 4 уровня', 'Исследования 5 уровня и быстрее на 40%'] },
  { id: 'gym', name: 'Тренировочный зал', desc: 'Тренируй скорость, ум, обаяние и удачу.', color: '#FF7F6B',
    unlock: { playerLevel: 8, cost: bc(900, 120) }, maxLevel: 5, upgrades: up(2),
    perks: ['Тренировки до +2 к навыку', 'Тренировки до +4', 'Тренировки до +6, дешевле', 'Тренировки до +8', 'Тренировки до +10 и бонус опыта'] },
  { id: 'workshop', name: 'Мастерская', desc: 'Крафти уникальные декорации из материалов.', color: '#C99A5B',
    unlock: { playerLevel: 10, cost: bc(1200, 200) }, maxLevel: 5, upgrades: up(2.2),
    perks: ['Рецепты 1 уровня', 'Рецепты 2 уровня', 'Рецепты 3 уровня', 'Рецепты 4 уровня', 'Дешевле на 25%'] },
  { id: 'lounge', name: 'Комната отдыха', desc: 'Фотоальбом образов и уютные посиделки.', color: '#C9A8FF',
    unlock: { playerLevel: 12, cost: { bananas: 1500, coins: 300 } }, maxLevel: 5, upgrades: up(2.4),
    perks: ['Альбом на 12 фото', 'Альбом на 24 фото, +10% к корзине', 'Альбом на 36 фото, +20% к корзине', 'Альбом на 48 фото, +30% к корзине', 'Альбом на 60 фото, +40% к корзине'] },
  { id: 'secret', name: 'Секретная комната', desc: 'Открывается после трёх найденных секретов.', color: '#FFE066',
    unlock: { playerLevel: 5, cost: c(300), secrets: 3 }, maxLevel: 5, upgrades: up(3),
    perks: ['Редкий сундук раз в 3 дня', 'Эпический шанс выше', 'Сундук раз в 2 дня', 'Эпический сундук раз в 3 дня', 'Легендарный шанс'] },
];
export const ROOM_MAP: Record<RoomId, RoomDef> = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, RoomDef>;

// ---------- Формулы эффектов комнат ----------
export const roomFx = {
  hallRate: (lvl: number, comfort: number, lounge: number) => Math.round((24 + 14 * (lvl - 1)) * (1 + comfort * 0.01) * (1 + 0.1 * Math.max(0, lounge - 1))),
  hallCapHours: (lvl: number) => 4 + 2 * (lvl - 1),
  beds: (lvl: number) => lvl + 1,
  restXpPerHour: (lvl: number) => 6 * lvl + 4,
  restCapHours: () => 8,
  arcadeBonus: (lvl: number) => 0.1 * (lvl - 1),
  recipeLevel: (lvl: number) => lvl,
  labQueue: (lvl: number) => (lvl >= 3 ? 2 : 1),
  labSpeed: (lvl: number) => [1, 0.9, 0.9, 0.7, 0.6][lvl - 1] ?? 1,
  researchLevel: (lvl: number) => lvl,
  gymMax: (lvl: number) => lvl * 2,
  gymDiscount: (lvl: number) => (lvl >= 3 ? 0.8 : 1),
  craftLevel: (lvl: number) => Math.min(4, lvl),
  craftDiscount: (lvl: number) => (lvl >= 5 ? 0.75 : 1),
  outfitSlots: (lvl: number) => [4, 7, 10, 14, 20][lvl - 1] ?? 4,
  shopDiscount: (lvl: number) => 0.03 * (lvl - 1),
  photoSlots: (lvl: number) => 12 * lvl,
  decorSlots: (room: RoomId, lvl: number, playroom: number) => (room === 'playroom' ? 2 + lvl + (playroom >= 5 ? 1 : 0) : 2 + Math.floor(lvl / 2) + 1),
  secretCooldownDays: (lvl: number) => [3, 3, 2, 2, 1][lvl - 1] ?? 3,
  secretChestTier: (lvl: number): 'rare' | 'epic' | 'legendary' => (lvl >= 5 ? 'legendary' : lvl >= 4 ? 'epic' : 'rare'),
  personalDecorSlots: (lvl: number) => 4 + lvl * 2,
};
