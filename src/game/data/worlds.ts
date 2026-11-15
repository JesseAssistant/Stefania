import type { LevelDef, LevelGame, Reward, StatId, WorldDef } from '../types';

export const WORLDS: WorldDef[] = [
  { id: 'w1', num: 1, name: 'Nanabo Home', subtitle: 'Дом Нанабо', desc: 'Знакомство с базой, первые друзья и первые бананы.', unlockStars: 0,
    theme: { sky1: '#8FD3FF', sky2: '#E8F7FF', ground: '#7ED957', accent: '#FFD93D' }, music: 'w1', secretHint: 'В верхнем правом углу карты что-то растёт…' },
  { id: 'w2', num: 2, name: 'Banana Island', subtitle: 'Банановый остров', desc: 'Пляжи, пальмы и испытания на скорость и внимательность.', unlockStars: 10,
    theme: { sky1: '#6FD6FF', sky2: '#FFF1C2', ground: '#F2D388', accent: '#FF9F1C' }, music: 'w2', secretHint: 'Море выносит на берег странные вещи…' },
  { id: 'w3', num: 3, name: 'Secret Lab', subtitle: 'Тайная лаборатория', desc: 'Головоломки, эксперименты и редкие находки.', unlockStars: 28,
    theme: { sky1: '#4A5BD6', sky2: '#B7B9FF', ground: '#5A6BC4', accent: '#8FD3FF' }, music: 'w3', secretHint: 'Лаборатория хранит больше, чем кажется.' },
  { id: 'w4', num: 4, name: 'Fun City', subtitle: 'Весёлый город', desc: 'Огни, магазины, карнавал и новые наряды.', unlockStars: 48,
    theme: { sky1: '#FF7FC0', sky2: '#FFE0F0', ground: '#7A6BD9', accent: '#FF5E8A' }, music: 'w4', secretHint: 'Кто-то обронил билет у входа.' },
  { id: 'w5', num: 5, name: 'Mystery World', subtitle: 'Мир Тайн', desc: 'Секретные места, сложные задания и финальные испытания.', unlockStars: 72,
    theme: { sky1: '#1E1B4B', sky2: '#6D4FD6', ground: '#2B2D6E', accent: '#FFE066' }, music: 'w5', secretHint: 'Звёзды складываются в подсказку.' },
];
export const WORLD_MAP: Record<string, WorldDef> = Object.fromEntries(WORLDS.map((w) => [w.id, w]));

const AFF: Record<string, StatId> = {
  'banana-catcher': 'speed', reaction: 'speed', memory: 'brains', 'lab-puzzle': 'brains', sorting: 'brains',
  kitchen: 'charm', 'outfit-challenge': 'charm', task: 'charm', 'treasure-hunt': 'luck', gauntlet: 'luck',
};
type Extra = { items?: string[]; characters?: string[]; decor?: string[]; cards?: string[]; chests?: Reward['chests']; materials?: Reward['materials']; crystals?: number; coins?: number };
type StarRule = LevelDef['stars'];

const hi = (two: number, three: number, twoText: string, threeText: string): StarRule => ({ dir: 'high', two, three, twoText, threeText });
const lo = (two: number, three: number, twoText: string, threeText: string): StarRule => ({ dir: 'low', two, three, twoText, threeText });

function mk(world: number, index: number, name: string, desc: string, goal: string, game: LevelGame, stars: StarRule, extra: Extra = {}): LevelDef {
  const boss = index === 8;
  const first: Reward = {
    bananas: 40 + 15 * world + 5 * index, xp: 30 + 6 * world + 2 * index + (boss ? 50 : 0),
    coins: world >= 2 ? 10 * (world - 1) + (boss ? 30 : 0) : boss ? 20 : 0,
    ...(extra.items ? { items: extra.items } : {}), ...(extra.characters ? { characters: extra.characters } : {}),
    ...(extra.decor ? { decor: extra.decor } : {}), ...(extra.cards ? { cards: extra.cards } : {}),
    ...(extra.chests ? { chests: extra.chests } : {}), ...(extra.materials ? { materials: extra.materials } : {}),
    ...(extra.crystals ? { crystals: extra.crystals } : {}),
  };
  const star2: Reward = { coins: 10 * world + (extra.coins ?? 0), bananas: 15 * world };
  const star3: Reward = { coins: 15 * world, crystals: boss ? 3 : index % 3 === 0 ? 1 : 0, ...(boss ? { chests: { rare: 1 } } : {}) };
  const replay: Reward = { bananas: 8 + 3 * world, xp: 5 + world };
  return { id: `w${world}l${index}`, world, index, name, desc, goal, game, boss, stars, first, star2, star3, replay, statAffinity: AFF[game.kind] };
}
const catcher = (target: number, duration: number, speed: number, bad: number, moving = false): LevelGame => ({ kind: 'banana-catcher', target, duration, speed, bad, moving });
const memory = (pairs: number, maxMoves: number, peek = false): LevelGame => ({ kind: 'memory', pairs, maxMoves, peek });
const sorting = (rule: 'color' | 'size' | 'category' | 'ripeness', items: number, time: number, maxMistakes: number): LevelGame => ({ kind: 'sorting', rule, items, time, maxMistakes });
const reaction = (rounds: number, decoys: boolean, window: number): LevelGame => ({ kind: 'reaction', rounds, decoys, window });
const treasure = (scene: string, hidden: number, time: number, maxMistakes: number): LevelGame => ({ kind: 'treasure-hunt', scene, hidden, time, maxMistakes });
const lab = (variant: 'lights' | 'sequence' | 'wires' | 'slide', size: number, maxMoves: number): LevelGame => ({ kind: 'lab-puzzle', variant, size, maxMoves });
const kitchen = (recipeId: string, orders: number): LevelGame => ({ kind: 'kitchen', recipeId, orders });
const outfit = (themeId: string, slots: number): LevelGame => ({ kind: 'outfit-challenge', themeId, slots });
const gauntlet = (stages: LevelGame[]): LevelGame => ({ kind: 'gauntlet', stages, hearts: 3 });

const moveStars = (a: number, b: number) => lo(a, b, `Не больше ${a} ходов`, `Не больше ${b} ходов`);
const catchStars = (a: number, b: number) => hi(a, b, `Поймай ${a}+ бананов`, `Поймай ${b}+ бананов`);
const mistakeStars = (a: number) => lo(a, 0, `Не больше ${a} ошибок`, 'Ни одной ошибки');
const reactStars = (a: number, b: number) => lo(a, b, `Средняя реакция до ${a} мс`, `Средняя реакция до ${b} мс`);
const timeStars = (a: number, b: number) => hi(a, b, `Останется ${a}+ секунд`, `Останется ${b}+ секунд`);
const heartStars = hi(2, 3, 'Останется 2+ сердца', 'Пройти без потерь');
const taskStars = hi(2, 3, 'Выполни 2 цели', 'Выполни все цели');
const pointStars = (a: number, b: number) => hi(a, b, `Набери ${a}+ очков`, `Набери ${b}+ очков`);

export const LEVELS: LevelDef[] = [
  // ---------------- Мир 1 ----------------
  mk(1, 1, 'Первый банан', 'Лови падающие бананы и наполни корзину.', 'Поймай 8 бананов', catcher(8, 25, 1, 0), catchStars(12, 16), { items: ['cap-red'], cards: ['card-w1-1'] }),
  mk(1, 2, 'Парные карточки', 'Найди одинаковых Нанабо — Pip учит тренировать память.', 'Найди все пары за 12 ходов', memory(3, 12), moveStars(7, 4), { items: ['bowtie-red'] }),
  mk(1, 3, 'Ремонт базы', 'Помоги Pip обустроить дом: открой комнату, оденься и собери бананы.', 'Выполни цели задания', { kind: 'task', goals: [
    { id: 'room', text: 'Открой Спальню', check: 'room', arg: 'bedroom' }, { id: 'dress', text: 'Надень любую вещь на Нанабо', check: 'equipped', n: 1 },
    { id: 'basket', text: 'Собери бананы из корзины в холле', check: 'basket', n: 1 }] }, taskStars, { decor: ['lamp-sun'], cards: ['card-w1-2'] }),
  mk(1, 4, 'Бананопад', 'Бананы валятся с неба — но иногда попадаются гнилые!', 'Поймай 14 бананов', catcher(14, 30, 1.2, 0.15), catchStars(18, 22), { items: ['sneakers-white'] }),
  mk(1, 5, 'Спелые и не очень', 'Разложи бананы по корзинкам: зелёные, спелые и перезрелые.', 'Не больше 4 ошибок', sorting('ripeness', 12, 40, 4), mistakeStars(2), { characters: ['zuzu'], cards: ['card-w1-3'] }),
  mk(1, 6, 'Быстрые лапки', 'Нажимай на цель, как только она появится.', 'Успей за 6 раундов', reaction(6, false, 1400), reactStars(750, 600), { items: ['glasses-round'] }),
  mk(1, 7, 'Найди ключ', 'Ключ от кладовой спрятан где-то в доме.', 'Найди 4 предмета за 60 секунд', treasure('home', 4, 60, 5), timeStars(25, 40), { cards: ['card-w1-4'], materials: { gear: 2 } }),
  mk(1, 8, 'Хаос на базе', 'Бананы, карточки и сортировка одновременно! Победи сумятицу.', 'Пройди 3 испытания, не потеряв все сердца', gauntlet([catcher(12, 25, 1.3, 0.2), memory(4, 14), sorting('ripeness', 10, 35, 3)]), heartStars, { characters: ['tofu'], chests: { common: 1 }, cards: ['card-w1-5'] }),
  // ---------------- Мир 2 ----------------
  mk(2, 1, 'Пляжный сбор', 'Ветер качает бананы — лови их на лету.', 'Поймай 16 бананов', catcher(16, 30, 1.3, 0.15, true), catchStars(20, 26), { items: ['sandals'], cards: ['card-w2-1'] }),
  mk(2, 2, 'Раковины на песке', 'Найди одинаковые ракушки.', 'Найди все пары за 22 хода', memory(6, 22), moveStars(15, 12), { items: ['shades'] }),
  mk(2, 3, 'Остров-загадка', 'Клад где-то рядом. Ищи подсказки на пляже.', 'Найди 5 предметов за 60 секунд', treasure('beach', 5, 60, 5), timeStars(22, 38), { cards: ['card-w2-2'], materials: { fabric: 2 } }),
  mk(2, 4, 'Прыжок через волну', 'Нажимай вовремя, но не трогай медуз!', 'Успей за 8 раундов', reaction(8, true, 1200), reactStars(700, 560), { characters: ['kiko'] }),
  mk(2, 5, 'Размеры бананов', 'Сортируй бананы: маленькие, средние и большие.', 'Не больше 3 ошибок', sorting('size', 14, 40, 3), mistakeStars(1), { cards: ['card-w2-3'], items: ['flippers'] }),
  mk(2, 6, 'Первое блюдо', 'Приготовь смузи по рецепту: правильные продукты по порядку.', 'Приготовь 2 заказа', kitchen('smoothie', 2), mistakeStars(2), { decor: ['plant-pot'] }),
  mk(2, 7, 'Костюм пирата', 'Собери образ пирата по теме.', 'Набери очки за образ', outfit('pirate', 4), pointStars(28, 40), { items: ['eyepatch'], cards: ['card-w2-4'] }),
  mk(2, 8, 'Король острова', 'Финальное испытание острова: скорость, внимание и поиск.', 'Пройди 3 испытания', gauntlet([catcher(20, 30, 1.5, 0.25, true), reaction(8, true, 1100), treasure('beach', 5, 45, 3)]), heartStars, { chests: { rare: 1 }, cards: ['card-w2-5'], items: ['pirate-hat'] }),
  // ---------------- Мир 3 ----------------
  mk(3, 1, 'Первая колба', 'Нажимай на кнопки, пока все лампочки не погаснут.', 'Реши за 20 ходов', lab('lights', 3, 20), moveStars(8, 5), { cards: ['card-w3-1'], items: ['visor'] }),
  mk(3, 2, 'Последовательность', 'Запомни порядок вспышек и повтори его.', 'Повтори 5 вспышек', lab('sequence', 5, 4), lo(2, 0, 'Не больше 2 ошибок', 'Без ошибок'), { materials: { glitter: 2 } }),
  mk(3, 3, 'Провода', 'Соедини провода одного цвета — меняй местами концы.', 'Реши за 20 ходов', lab('wires', 5, 20), moveStars(10, 7), { cards: ['card-w3-2'] }),
  mk(3, 4, 'Пробирки', 'Разложи предметы по категориям: еда, инструменты, одежда.', 'Не больше 3 ошибок', sorting('category', 16, 40, 3), mistakeStars(1), { decor: ['bookshelf'] }),
  mk(3, 5, 'Идеальная смесь', 'Эксперимент: приготовь банан-сплит без единой ошибки.', 'Приготовь 2 заказа', kitchen('split', 2), mistakeStars(2), { cards: ['card-w3-3'], items: ['chef-hat'] }),
  mk(3, 6, 'Пропавшие детали', 'Детали робота разлетелись по лаборатории.', 'Найди 6 предметов за 55 секунд', treasure('lab', 6, 55, 4), timeStars(20, 34), { materials: { gear: 3 } }),
  mk(3, 7, 'Сложный замок', 'Сетка 4×4: погаси все лампочки.', 'Реши за 30 ходов', lab('lights', 4, 30), moveStars(14, 9), { cards: ['card-w3-4'], items: ['hoodie-night'] }),
  mk(3, 8, 'Реактор', 'Реактор перегрелся! Реши три головоломки подряд.', 'Пройди 3 испытания', gauntlet([lab('lights', 4, 28), lab('wires', 6, 24), memory(8, 24)]), heartStars, { characters: ['nova'], chests: { rare: 1 }, cards: ['card-w3-5'] }),
  // ---------------- Мир 4 ----------------
  mk(4, 1, 'Городская толпа', 'Бананы летят между домами — не зевай!', 'Поймай 20 бананов', catcher(20, 30, 1.6, 0.25, true), catchStars(25, 31), { cards: ['card-w4-1'], items: ['threed-glasses'] }),
  mk(4, 2, 'Витрина', 'Собери образ для вечеринки.', 'Набери очки за образ', outfit('party', 4), pointStars(30, 40), { items: ['glasses-star'] }),
  mk(4, 3, 'Неоновые огни', 'Найди одинаковые огни на вывесках.', 'Найди все пары за 26 ходов', memory(8, 26), moveStars(20, 16), { cards: ['card-w4-2'] }),
  mk(4, 4, 'Магазинчик', 'Загляни в магазин: купи вещи, сохрани образ и открой сундук.', 'Выполни цели задания', { kind: 'task', goals: [
    { id: 'buy', text: 'Купи 2 предмета в магазине', check: 'bought', n: 2 }, { id: 'save', text: 'Сохрани образ в гардеробе', check: 'outfit_saved', n: 1 },
    { id: 'chest', text: 'Открой любой сундук', check: 'chest_opened', n: 1 }] }, taskStars, { chests: { common: 1 }, cards: ['card-w4-3'] }),
  mk(4, 5, 'Метро', 'Поезда мелькают. Нажимай на пассажиров, а не на знаки!', 'Успей за 10 раундов', reaction(10, true, 1000), reactStars(650, 520), { items: ['headphones'] }),
  mk(4, 6, 'Сортировка подарков', 'Разложи подарки по цветам.', 'Не больше 3 ошибок', sorting('color', 18, 40, 3), mistakeStars(1), { decor: ['balloons'] }),
  mk(4, 7, 'Охота за билетами', 'Карнавальные билеты разбросаны по городу.', 'Найди 7 предметов за 60 секунд', treasure('city', 7, 60, 4), timeStars(18, 32), { cards: ['card-w4-4'], materials: { glitter: 2 } }),
  mk(4, 8, 'Карнавал', 'Главное шоу города: скорость, стиль и реакция.', 'Пройди 3 испытания', gauntlet([catcher(24, 30, 1.7, 0.3, true), outfit('space', 5), reaction(10, true, 950)]), heartStars, { characters: ['jinx'], chests: { epic: 1 }, cards: ['card-w4-5'] }),
  // ---------------- Мир 5 ----------------
  mk(5, 1, 'Туманный мост', 'Бананы мелькают в тумане — лови!', 'Поймай 24 бананов', catcher(24, 30, 1.9, 0.3, true), catchStars(29, 35), { cards: ['card-w5-1'], items: ['cape-hero'] }),
  mk(5, 2, 'Зеркальный зал', 'Много зеркал — и много одинаковых карточек.', 'Найди все пары за 30 ходов', memory(10, 30), moveStars(24, 20), { items: ['monocle'] }),
  mk(5, 3, 'Шёпот карт', 'Запомни длинную последовательность вспышек.', 'Повтори 7 вспышек', lab('sequence', 7, 3), lo(1, 0, 'Не больше 1 ошибки', 'Без ошибок'), { cards: ['card-w5-2'], materials: { glitter: 3 } }),
  mk(5, 4, 'Лунная кухня', 'Приготовь золотой пирог по сложному рецепту.', 'Приготовь 2 заказа', kitchen('pie', 2), mistakeStars(1), { decor: ['telescope'] }),
  mk(5, 5, 'Портал', 'Сетка 5×5: погаси все лампочки и открой портал.', 'Реши за 40 ходов', lab('lights', 5, 40), moveStars(20, 14), { cards: ['card-w5-3'] }),
  mk(5, 6, 'Тени', 'Тени двигаются быстро. Нажимай только на Нанабо!', 'Успей за 12 раундов', reaction(12, true, 900), reactStars(620, 500), { items: ['wand'] }),
  mk(5, 7, 'Звёздный наряд', 'Создай образ мага из лучших вещей.', 'Набери очки за образ', outfit('magic', 6), pointStars(48, 60), { cards: ['card-w5-4'], items: ['fx-sparkles'] }),
  mk(5, 8, 'Последняя тайна', 'Финальное испытание: логика, поиск и скорость.', 'Пройди 3 испытания', gauntlet([lab('lights', 4, 24), treasure('mystery', 8, 50, 3), catcher(26, 30, 2, 0.3, true)]), heartStars, { characters: ['sir-bananaby'], chests: { legendary: 1 }, cards: ['card-w5-5'] }),
];
export const LEVEL_MAP: Record<string, LevelDef> = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const levelsOfWorld = (w: number) => LEVELS.filter((l) => l.world === w);

export const STAR_MILESTONES: { id: string; stars: number; reward: Reward; text: string }[] = [
  { id: 'sm10', stars: 10, reward: { chests: { common: 1 }, coins: 30 }, text: 'Сундук и 30 монет' },
  { id: 'sm25', stars: 25, reward: { coins: 200, items: ['bow-band'] }, text: '200 монет и ободок с бантом' },
  { id: 'sm40', stars: 40, reward: { chests: { rare: 1 }, crystals: 5 }, text: 'Редкий сундук и 5 кристаллов' },
  { id: 'sm60', stars: 60, reward: { items: ['fx-golden'], crystals: 8 }, text: 'Золотое сияние и 8 кристаллов' },
  { id: 'sm80', stars: 80, reward: { chests: { epic: 1 }, decor: ['trophy'] }, text: 'Эпический сундук и золотой кубок' },
  { id: 'sm100', stars: 100, reward: { crystals: 20, decor: ['piano'] }, text: '20 кристаллов и рояль' },
  { id: 'sm120', stars: 120, reward: { items: ['crown-stefania'], chests: { legendary: 1 } }, text: 'Корона Stefania и легендарный сундук' },
];
export const WORLD_PERFECT_REWARD: Reward = { crystals: 10, cards: [], chests: { rare: 1 } };

export const TOTAL_STARS = LEVELS.length * 3;
