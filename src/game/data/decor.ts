import type { CardDef, CraftDef, DecorDef, RecipeDef, ResearchDef, Rarity, Cost } from '../types';

const b = (n: number): Cost => ({ bananas: n });
const c = (n: number): Cost => ({ coins: n });
const g = (n: number): Cost => ({ crystals: n });

type D = [string, string, Rarity, number, Cost, string, string, string, string, boolean];
const rows: D[] = [
  ['lamp-sun', 'Лампа-солнышко', 'common', 2, b(80), 'Тёплый свет на весь вечер.', 'lamp', '#FFD93D', '#FFF3B0', true],
  ['plant-pot', 'Горшок с росточком', 'common', 2, b(70), 'Растёт быстрее бананов!', 'plant', '#6BCB77', '#C98B3D', true],
  ['rug-round', 'Круглый ковёр', 'common', 3, b(120), 'Мягкий и пушистый.', 'rug', '#FF9EB5', '#FFE3EE', true],
  ['poster-star', 'Постер со звездой', 'common', 2, b(90), 'Для настенного творчества.', 'poster', '#6FC3FF', '#FFE066', true],
  ['beanbag', 'Кресло-мешок', 'uncommon', 4, b(180), 'Падаешь — и сразу уютно.', 'beanbag', '#FF9A76', '#FFE0B2', true],
  ['clock-banana', 'Часы-банан', 'uncommon', 3, b(150), 'Тикают весело.', 'clock', '#FFD93D', '#2B2D42', true],
  ['frame-photo', 'Рамка с фото', 'uncommon', 3, b(140), 'Для любимых моментов.', 'frame', '#C9A8FF', '#FFFFFF', true],
  ['bookshelf', 'Книжная полка', 'uncommon', 4, c(60), 'Полна приключений.', 'shelf', '#B07A3F', '#E8C27A', true],
  ['balloons', 'Связка шариков', 'uncommon', 3, b(130), 'Поднимают настроение.', 'balloons', '#FF5E8A', '#6FC3FF', true],
  ['fairy-lights', 'Гирлянда', 'uncommon', 4, c(70), 'Мерцают по вечерам.', 'lights', '#FFE066', '#FF9EC4', true],
  ['aquarium', 'Аквариум', 'rare', 6, c(160), 'С разноцветными рыбками.', 'aquarium', '#6FC3FF', '#FF9F1C', true],
  ['globe', 'Глобус', 'rare', 5, c(130), 'Куда отправимся?', 'globe', '#5EDDD0', '#7ED957', true],
  ['telescope', 'Телескоп', 'rare', 6, c(180), 'Смотреть на звёзды.', 'telescope', '#8E5BD9', '#C5CDD8', true],
  ['teddy', 'Плюшевый мишка', 'rare', 5, c(140), 'Обнимашки гарантированы.', 'teddy', '#C99A5B', '#FFE0B2', true],
  ['arcade-cab', 'Игровой автомат', 'rare', 7, c(220), 'Рекорды ждут!', 'arcade', '#3D7BFF', '#FF5E8A', true],
  ['disco-ball', 'Диско-шар', 'epic', 8, g(14), 'Устраивает вечеринку сам.', 'disco', '#C5CDD8', '#FFFFFF', true],
  ['piano', 'Рояль', 'epic', 9, g(22), 'Звучит как мечта.', 'piano', '#2B2D42', '#FFFFFF', true],
  ['trophy', 'Золотой кубок', 'epic', 8, g(18), 'За самые большие победы.', 'trophy', '#FFC400', '#FFF3B0', true],
  ['banana-statue', 'Банановая статуя', 'legendary', 14, g(60), 'Гордость базы.', 'statue', '#FFC400', '#FFF3B0', true],
  ['gear-clock', 'Шестерёнчатые часы', 'rare', 6, {}, 'Сделаны в мастерской.', 'clock', '#C99A2E', '#2B2D42', false],
  ['glitter-lamp', 'Блестящий торшер', 'rare', 6, {}, 'Сделан своими руками.', 'lamp', '#FF7FC0', '#FFE3F4', false],
  ['cloth-cat', 'Тканевый котик', 'uncommon', 4, {}, 'Мягкая поделка.', 'teddy', '#FFB3C8', '#FFFFFF', false],
  ['star-garland', 'Звёздная гирлянда', 'epic', 9, {}, 'Блестящая гордость мастерской.', 'lights', '#FFE066', '#FFFFFF', false],
  ['lab-orb', 'Светящийся шар', 'epic', 9, {}, 'Результат научных опытов.', 'globe', '#8FD3FF', '#C9A8FF', false],
];
export const DECOR: DecorDef[] = rows.map(([id, name, rarity, comfort, cost, desc, kind, c1, c2, shopable]) => ({ id, name, rarity, comfort, cost, desc, kind, c1, c2, shopable }));
export const DECOR_MAP: Record<string, DecorDef> = Object.fromEntries(DECOR.map((d) => [d.id, d]));

// ---------- Кухня ----------
export const FOODS: Record<string, { name: string; xp: number; color: string }> = {
  smoothie: { name: 'Банановый смузи', xp: 14, color: '#FFE066' },
  pancakes: { name: 'Банановые блинчики', xp: 22, color: '#E8B467' },
  split: { name: 'Банан-сплит', xp: 30, color: '#FF9EC4' },
  bread: { name: 'Банановый хлеб', xp: 38, color: '#C99A5B' },
  choco: { name: 'Банан в шоколаде', xp: 46, color: '#8B5A2B' },
  pizza: { name: 'Банановая пицца', xp: 56, color: '#FF9F1C' },
  cake: { name: 'Банановый торт', xp: 70, color: '#FFB3D1' },
  pie: { name: 'Золотой банановый пирог', xp: 100, color: '#FFC400' },
};
export const INGREDIENTS: Record<string, { name: string; color: string; shape: string }> = {
  banana: { name: 'Банан', color: '#FFD93D', shape: 'banana' }, milk: { name: 'Молоко', color: '#F4F8FF', shape: 'bottle' },
  ice: { name: 'Лёд', color: '#BFE9FF', shape: 'cube' }, honey: { name: 'Мёд', color: '#FFB300', shape: 'drop' },
  flour: { name: 'Мука', color: '#F4F1E8', shape: 'bag' }, egg: { name: 'Яйцо', color: '#FFF5DC', shape: 'egg' },
  cream: { name: 'Сливки', color: '#FFFFFF', shape: 'swirl' }, choco: { name: 'Шоколад', color: '#7A4F25', shape: 'bar' },
  berry: { name: 'Ягоды', color: '#E53979', shape: 'berry' }, cheese: { name: 'Сыр', color: '#FFD166', shape: 'cheese' },
  sugar: { name: 'Сахар', color: '#FFFFFF', shape: 'cube' }, nut: { name: 'Орехи', color: '#B07A3F', shape: 'nut' },
  tomato: { name: 'Томат', color: '#E53935', shape: 'berry' }, gold: { name: 'Золотая пыль', color: '#FFC400', shape: 'sparkle' },
  cherry: { name: 'Вишня', color: '#B0003A', shape: 'berry' }, vanilla: { name: 'Ваниль', color: '#FFF0C2', shape: 'drop' },
};
const r = (id: string, name: string, level: number, cost: Cost, steps: string[], extras: string[], food: string, xp: number, desc: string): RecipeDef => ({ id, name, level, cost, steps, extras, food, xp, desc });
export const RECIPES: RecipeDef[] = [
  r('smoothie', 'Банановый смузи', 1, b(15), ['banana', 'milk', 'ice'], ['flour', 'cheese', 'tomato'], 'smoothie', 8, 'Освежающее начало дня.'),
  r('pancakes', 'Банановые блинчики', 1, b(25), ['flour', 'egg', 'milk', 'banana'], ['ice', 'cheese', 'tomato'], 'pancakes', 12, 'Пышные и румяные.'),
  r('split', 'Банан-сплит', 2, b(35), ['banana', 'cream', 'berry', 'choco'], ['flour', 'cheese', 'egg'], 'split', 16, 'Сладкий десерт с ягодами.'),
  r('bread', 'Банановый хлеб', 2, b(45), ['flour', 'egg', 'banana', 'sugar', 'nut'], ['ice', 'cheese', 'berry'], 'bread', 20, 'Ароматный, с орешками.'),
  r('choco', 'Банан в шоколаде', 3, b(55), ['banana', 'choco', 'nut', 'cream'], ['flour', 'cheese', 'tomato', 'ice'], 'choco', 24, 'Хрустящая глазурь.'),
  r('pizza', 'Банановая пицца', 3, b(70), ['flour', 'tomato', 'cheese', 'banana', 'honey'], ['choco', 'cream', 'ice'], 'pizza', 30, 'Смелое сочетание!'),
  r('cake', 'Банановый торт', 4, b(90), ['flour', 'egg', 'sugar', 'banana', 'cream', 'cherry'], ['cheese', 'tomato', 'ice'], 'cake', 38, 'Праздничный торт.'),
  r('pie', 'Золотой пирог', 5, b(130), ['flour', 'egg', 'banana', 'honey', 'vanilla', 'gold'], ['cheese', 'tomato', 'choco'], 'pie', 55, 'Редкий и очень вкусный.'),
];
export const RECIPE_MAP: Record<string, RecipeDef> = Object.fromEntries(RECIPES.map((x) => [x.id, x]));

// ---------- Лаборатория ----------
const rs = (id: string, name: string, level: number, cost: Cost, seconds: number, reward: ResearchDef['reward'], desc: string): ResearchDef => ({ id, name, level, cost, seconds, reward, desc });
export const RESEARCH: ResearchDef[] = [
  rs('r-gear', 'Анализ шестерёнок', 1, b(40), 60, { materials: { gear: 2 }, xp: 10 }, 'Находим полезные детали.'),
  rs('r-fabric', 'Опыты с тканью', 1, b(40), 90, { materials: { fabric: 2 }, xp: 10 }, 'Новая прочная ткань.'),
  rs('r-glitter', 'Синтез блёсток', 2, b(70), 180, { materials: { glitter: 2 }, xp: 14 }, 'Блестит и не пачкает.'),
  rs('r-mix', 'Смесь материалов', 2, c(15), 300, { materials: { gear: 2, fabric: 2, glitter: 1 }, xp: 18 }, 'Всего понемногу.'),
  rs('r-crystal', 'Микро-кристаллы', 3, c(40), 600, { crystals: 2, xp: 24 }, 'Крошечные, но ценные.'),
  rs('r-chest', 'Находка в архиве', 3, c(50), 900, { chests: { common: 1 }, xp: 26 }, 'Старый сундук из архива.'),
  rs('r-orb', 'Светящийся шар', 4, c(90), 1200, { decor: ['lab-orb'], xp: 40 }, 'Новая декорация базы.'),
  rs('r-rare', 'Редкая находка', 5, c(150), 1800, { chests: { rare: 1 }, crystals: 3, xp: 60 }, 'Научный прорыв!'),
];
export const RESEARCH_MAP: Record<string, ResearchDef> = Object.fromEntries(RESEARCH.map((x) => [x.id, x]));

// ---------- Мастерская ----------
const cr = (id: string, name: string, level: number, cost: Cost, materials: CraftDef['materials'], reward: CraftDef['reward'], desc: string): CraftDef => ({ id, name, level, cost, materials, reward, desc });
export const CRAFTS: CraftDef[] = [
  cr('c-cat', 'Тканевый котик', 1, b(60), { fabric: 3 }, { decor: ['cloth-cat'] }, 'Мягкая игрушка.'),
  cr('c-clock', 'Шестерёнчатые часы', 2, b(120), { gear: 4 }, { decor: ['gear-clock'] }, 'Идут точно!'),
  cr('c-lamp', 'Блестящий торшер', 3, c(40), { glitter: 3, gear: 2 }, { decor: ['glitter-lamp'] }, 'Сияет по вечерам.'),
  cr('c-garland', 'Звёздная гирлянда', 4, c(100), { glitter: 5, fabric: 3, gear: 3 }, { decor: ['star-garland'] }, 'Лучшая гирлянда на базе.'),
];
export const CRAFT_MAP: Record<string, CraftDef> = Object.fromEntries(CRAFTS.map((x) => [x.id, x]));

// ---------- Коллекционные карточки (по мирам) ----------
const WN = ['Дом', 'Остров', 'Лаборатория', 'Город', 'Тайны'];
const cardNames: string[][] = [
  ['Первый росток', 'Уютная кровать', 'Банановая корзинка', 'Утренний чай', 'Ключ от базы', 'Счастливый Пип'],
  ['Волна и пальма', 'Золотой песок', 'Ракушка-секрет', 'Закат острова', 'Танец на пляже', 'Банановая лодка'],
  ['Колба с искрами', 'Шестерёнка-талисман', 'Схема открытия', 'Светящийся кристалл', 'Робот-помощник', 'Тайный чертёж'],
  ['Неоновая вывеска', 'Ночной трамвай', 'Фонтан желаний', 'Витрина мечты', 'Городской концерт', 'Карнавал огней'],
  ['Карта созвездий', 'Лунная дверь', 'Хрустальный лабиринт', 'Тень Сэра', 'Звёздный ключ', 'Корона Тайн'],
];
const cardIcons = ['banana', 'bed', 'basket', 'cup', 'key', 'smile', 'wave', 'sand', 'shell', 'sun', 'dance', 'boat', 'flask', 'gear', 'scroll', 'crystal', 'robot', 'plan', 'neon', 'tram', 'fountain', 'shop', 'music', 'lights', 'map', 'moon', 'maze', 'shadow', 'star', 'crown'];
const cardRar: Rarity[] = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'epic'];
export const CARDS: CardDef[] = cardNames.flatMap((names, w) => names.map((name, i) => ({
  id: `card-w${w + 1}-${i + 1}`, world: w + 1, name, rarity: cardRar[i], icon: cardIcons[w * 6 + i], desc: `Коллекционная карточка из мира «${WN[w]}».`,
})));
export const CARD_MAP: Record<string, CardDef> = Object.fromEntries(CARDS.map((x) => [x.id, x]));

// ---------- Секретные предметы (спрятаны в сценах) ----------
export interface SecretDef { id: string; name: string; where: string; hint: string; screen: string; x: number; y: number }
export const SECRETS: SecretDef[] = [
  { id: 'sec-hall', name: 'Затерянный банан', where: 'Главный холл', hint: 'Что-то блестит у окна в холле…', screen: 'room:hall', x: 14, y: 20 },
  { id: 'sec-kitchen', name: 'Серебряная ложка', where: 'Кухня', hint: 'На кухне что-то звякнуло под столом.', screen: 'room:kitchen', x: 88, y: 78 },
  { id: 'sec-lab', name: 'Светящаяся пробирка', where: 'Лаборатория', hint: 'В лаборатории мигает странный огонёк.', screen: 'room:lab', x: 8, y: 52 },
  { id: 'sec-lounge', name: 'Старый ключик', where: 'Комната отдыха', hint: 'Подушка в комнате отдыха слегка шевелится.', screen: 'room:lounge', x: 50, y: 88 },
  { id: 'sec-world1', name: 'Первый росток', where: 'Карта: Дом', hint: 'На карте мира 1 растёт что-то необычное.', screen: 'world:1', x: 90, y: 12 },
  { id: 'sec-world2', name: 'Бутылка с запиской', where: 'Карта: Остров', hint: 'Море что-то вынесло на берег.', screen: 'world:2', x: 6, y: 90 },
  { id: 'sec-world4', name: 'Билет на карнавал', where: 'Карта: Город', hint: 'В городе кто-то обронил билет.', screen: 'world:4', x: 52, y: 6 },
  { id: 'sec-personal', name: 'Письмо от Нанабо', where: 'Комната Stefania', hint: 'В твоей комнате лежит письмо.', screen: 'personal', x: 92, y: 34 },
];
export const SECRET_MAP: Record<string, SecretDef> = Object.fromEntries(SECRETS.map((s) => [s.id, s]));
