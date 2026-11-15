import type { Cost, ItemCategory, ItemDef, ItemUnlock, Layer, Rarity, SetDef } from '../types';

const b = (n: number): Cost => ({ bananas: n });
const c = (n: number): Cost => ({ coins: n });
const g = (n: number): Cost => ({ crystals: n });
const SHOP: ItemUnlock = { type: 'shop' };
const LV = (level: number): ItemUnlock => ({ type: 'level', level });
const REW = (how: string): ItemUnlock => ({ type: 'reward', how });

type Row = [string, string, ItemCategory, Layer, Rarity, Cost, ItemUnlock, string, string[], string, string, string?, string?, string?];
// [id, name, category, layer, rarity, cost, unlock, desc, tags, artKind, c1, c2, c3, season]
const R: Row[] = [
  // ---- Основная одежда ----
  ['tee-sun', 'Солнечная футболка', 'outfit', 'outfit', 'common', b(60), SHOP, 'Яркая, как спелый банан.', ['casual', 'summer'], 'tee', '#FFD93D', '#FF9F1C'],
  ['tee-sky', 'Небесная футболка', 'outfit', 'outfit', 'common', b(60), SHOP, 'Лёгкая футболка цвета ясного неба.', ['casual'], 'tee', '#6FC3FF', '#FFFFFF'],
  ['tee-berry', 'Ягодная футболка', 'outfit', 'outfit', 'common', b(70), SHOP, 'Розовая с белой полоской.', ['casual', 'party'], 'tee', '#FF7FA8', '#FFFFFF'],
  ['vest-denim', 'Джинсовая жилетка', 'outfit', 'outfit', 'common', b(110), SHOP, 'Классика на все времена.', ['casual', 'city'], 'vest', '#4C7BD9', '#A9C7FF'],
  ['hoodie-mint', 'Мятное худи', 'outfit', 'outfit', 'uncommon', b(160), SHOP, 'Тёплое и очень уютное.', ['cozy', 'casual'], 'hoodie', '#7FE3C0', '#FFFFFF'],
  ['sweater-cozy', 'Уютный свитер', 'outfit', 'outfit', 'uncommon', b(200), LV(3), 'Для прохладных вечеров на базе.', ['cozy', 'winter'], 'sweater', '#FF9A76', '#FFE0B2'],
  ['jersey-champ', 'Форма чемпиона', 'outfit', 'outfit', 'uncommon', b(220), LV(5), 'Номер 1 — для победителей.', ['sport'], 'jersey', '#E94F4F', '#FFFFFF'],
  ['hoodie-night', 'Худи «Ночное небо»', 'outfit', 'outfit', 'rare', c(180), LV(8), 'Звёзды светятся по краям.', ['cozy', 'space'], 'hoodie', '#3B3F9E', '#FFE066'],
  ['dress-star', 'Платье со звёздами', 'outfit', 'outfit', 'rare', c(220), LV(6), 'Для самых нарядных вечеринок.', ['party', 'fashion'], 'dress', '#B28DFF', '#FFE066'],
  // ---- Костюмы ----
  ['sailor', 'Матроска', 'costume', 'costume', 'common', b(140), SHOP, 'Полосатая и очень морская.', ['sea', 'casual'], 'sailor', '#FFFFFF', '#2F5DA8'],
  ['chef-coat', 'Куртка шеф-повара', 'costume', 'costume', 'uncommon', b(260), LV(4), 'В ней любое блюдо вкуснее.', ['chef', 'kitchen'], 'chef', '#FFFFFF', '#D9D9D9'],
  ['dino-onesie', 'Пижама-динозавр', 'costume', 'costume', 'uncommon', b(280), LV(4), 'С гребнем и хвостом!', ['cozy', 'animal'], 'dino', '#7ED957', '#3FA33A'],
  ['bee-suit', 'Костюм пчёлки', 'costume', 'costume', 'uncommon', b(230), SHOP, 'Полосатый и жужжащий.', ['animal'], 'bee', '#FFD23F', '#3A2A1A'],
  ['bunny-suit', 'Костюм зайчика', 'costume', 'costume', 'uncommon', b(240), LV(3), 'Мягкий, с помпоном-хвостиком.', ['animal', 'spring'], 'bunny', '#FFE3EE', '#FFB3C8', undefined, 'spring'],
  ['swim-ring', 'Купальник с уточкой', 'costume', 'costume', 'uncommon', b(220), LV(3), 'Надувная уточка в комплекте.', ['summer', 'beach'], 'swim', '#FF9EB5', '#FFE066', undefined, 'summer'],
  ['pumpkin-suit', 'Костюм тыквы', 'costume', 'costume', 'rare', c(260), LV(7), 'Оранжевый и очень осенний.', ['autumn', 'party'], 'pumpkin', '#FF9F1C', '#6BCB77', undefined, 'autumn'],
  ['santa-suit', 'Костюм Деда Мороза', 'costume', 'costume', 'rare', c(280), LV(7), 'Мешок подарков не входит.', ['winter', 'party'], 'santa', '#E53935', '#FFFFFF', undefined, 'winter'],
  ['pirate-coat', 'Костюм пирата', 'costume', 'costume', 'rare', c(300), LV(8), 'Йо-хо-хо и бутылка сока!', ['pirate', 'adventure'], 'pirate', '#7B3F2A', '#E8C27A'],
  ['wizard-robe', 'Мантия волшебника', 'costume', 'costume', 'rare', c(320), LV(9), 'Расшита звёздочками.', ['magic'], 'wizard', '#5B3FD6', '#FFE066'],
  ['astro-suit', 'Скафандр астронавта', 'costume', 'costume', 'epic', g(45), LV(10), 'Готов к полёту на Луну.', ['space', 'adventure'], 'astro', '#EDEFF5', '#FF6B6B'],
  ['hero-suit', 'Костюм супергероя', 'costume', 'costume', 'epic', g(50), LV(12), 'Каждый день — спасение мира!', ['hero'], 'hero', '#3D7BFF', '#FFD93D'],
  ['knight-armor', 'Рыцарские доспехи', 'costume', 'costume', 'epic', c(1200), LV(14), 'Блестят и позвякивают.', ['knight', 'fancy'], 'knight', '#C5CDD8', '#FFD93D'],
  // ---- Головные уборы ----
  ['cap-red', 'Красная кепка', 'hat', 'hat', 'common', b(50), SHOP, 'Козырёк вперёд!', ['casual', 'sport'], 'cap', '#E94F4F', '#FFFFFF'],
  ['cap-blue', 'Синяя кепка', 'hat', 'hat', 'common', b(50), SHOP, 'Кепка на каждый день.', ['casual'], 'cap', '#3D7BFF', '#FFFFFF'],
  ['beanie-pom', 'Шапка с помпоном', 'hat', 'hat', 'common', b(70), SHOP, 'Тёплая и пушистая.', ['winter', 'cozy'], 'beanie', '#FF7FA8', '#FFFFFF'],
  ['party-hat', 'Праздничный колпак', 'hat', 'hat', 'common', b(60), SHOP, 'Поздравляем!', ['party'], 'party', '#FF6BD6', '#FFE066'],
  ['bunny-ears', 'Ушки зайчика', 'hat', 'hat', 'common', b(80), SHOP, 'Мягкие и подвижные.', ['animal', 'spring'], 'bunnyears', '#FFE3EE', '#FFB3C8', undefined, 'spring'],
  ['chef-hat', 'Поварской колпак', 'hat', 'hat', 'common', b(90), SHOP, 'Высокий и белоснежный.', ['chef', 'kitchen'], 'chefhat', '#FFFFFF', '#E6E6E6'],
  ['beret', 'Берет художника', 'hat', 'hat', 'common', b(100), SHOP, 'Для тех, кто рисует.', ['art', 'fancy'], 'beret', '#B0413E', '#7A2A28'],
  ['bow-band', 'Ободок с бантом', 'hat', 'hat', 'common', b(70), SHOP, 'Милый бантик.', ['cute', 'party'], 'bowband', '#FF7FA8', '#FFC4D8'],
  ['sun-hat', 'Соломенная шляпа', 'hat', 'hat', 'common', b(90), SHOP, 'От солнышка и для красоты.', ['summer', 'beach'], 'sunhat', '#F2D388', '#FF7F7F', undefined, 'summer'],
  ['santa-hat', 'Новогодний колпак', 'hat', 'hat', 'uncommon', b(100), SHOP, 'С белым помпоном.', ['winter', 'party'], 'santahat', '#E53935', '#FFFFFF', undefined, 'winter'],
  ['headphones', 'Наушники', 'hat', 'hat', 'uncommon', b(150), LV(3), 'Музыка всегда с тобой.', ['music', 'city'], 'headphones', '#2B2D42', '#FF6B6B'],
  ['cowboy-hat', 'Ковбойская шляпа', 'hat', 'hat', 'uncommon', b(170), LV(4), 'Йи-ха!', ['western', 'adventure'], 'cowboy', '#B07A3F', '#7A4F25'],
  ['tophat', 'Цилиндр', 'hat', 'hat', 'uncommon', b(180), LV(5), 'Для особых случаев.', ['fancy', 'magic'], 'tophat', '#2B2D42', '#E53935'],
  ['flower-crown', 'Венок из цветов', 'hat', 'hat', 'uncommon', b(190), LV(4), 'Пахнет весной.', ['spring', 'cute'], 'flowers', '#FF9EC4', '#FFE066', '#6BCB77', 'spring'],
  ['propeller-cap', 'Кепка с пропеллером', 'hat', 'hat', 'rare', c(140), LV(6), 'Крутится от радости.', ['funny', 'city'], 'propeller', '#3D7BFF', '#FFD93D'],
  ['pirate-hat', 'Пиратская треуголка', 'hat', 'hat', 'rare', c(150), LV(7), 'С белым черепом.', ['pirate', 'adventure'], 'piratehat', '#2B2D42', '#FFFFFF'],
  ['wizard-hat', 'Шляпа звездочёта', 'hat', 'hat', 'rare', c(170), LV(8), 'Остроконечная и звёздная.', ['magic'], 'wizardhat', '#5B3FD6', '#FFE066'],
  ['knight-helm', 'Рыцарский шлем', 'hat', 'hat', 'rare', c(200), LV(10), 'С перьями на макушке.', ['knight'], 'knighthelm', '#C5CDD8', '#E53935'],
  ['space-helmet', 'Космический шлем', 'hat', 'hat', 'epic', g(35), LV(10), 'Прозрачный и блестящий.', ['space'], 'helmet', '#EDEFF5', '#8FD3FF'],
  ['crown-gold', 'Золотая корона', 'hat', 'hat', 'epic', g(40), LV(12), 'Для настоящих хозяев базы.', ['royal', 'fancy'], 'crown', '#FFC400', '#FF5E7E'],
  // ---- Очки ----
  ['glasses-round', 'Круглые очки', 'eyewear', 'glasses', 'common', b(60), SHOP, 'Умный вид гарантирован.', ['smart', 'casual'], 'round', '#2B2D42'],
  ['shades', 'Солнечные очки', 'eyewear', 'glasses', 'common', b(80), SHOP, 'Крутые и тёмные.', ['summer', 'cool'], 'shades', '#1E1E2F'],
  ['threed-glasses', '3D-очки', 'eyewear', 'glasses', 'common', b(90), SHOP, 'Красное и синее стёклышко.', ['city', 'funny'], 'threeD', '#E94F4F', '#3D7BFF'],
  ['eyepatch', 'Пиратская повязка', 'eyewear', 'glasses', 'uncommon', b(110), LV(3), 'Только для настоящих пиратов.', ['pirate'], 'patch', '#2B2D42'],
  ['visor', 'Очки учёного', 'eyewear', 'glasses', 'uncommon', b(130), LV(4), 'Для опытов в лаборатории.', ['science', 'smart'], 'visor', '#8FD3FF', '#FFFFFF'],
  ['glasses-heart', 'Очки-сердечки', 'eyewear', 'glasses', 'uncommon', b(140), LV(3), 'Всё вокруг становится милее.', ['love', 'cute'], 'heart', '#FF5E8A'],
  ['glasses-star', 'Очки-звёздочки', 'eyewear', 'glasses', 'uncommon', b(150), LV(4), 'Блестят на вечеринках.', ['party', 'fashion'], 'star', '#FFD93D'],
  ['monocle', 'Монокль', 'eyewear', 'glasses', 'rare', c(130), LV(7), 'Так выглядит барон.', ['fancy', 'smart'], 'monocle', '#C99A2E'],
  // ---- Аксессуары ----
  ['bowtie-red', 'Бабочка', 'eyewear', 'accessory', 'common', b(50), SHOP, 'Элегантная красная бабочка.', ['fancy', 'party'], 'bowtie', '#E94F4F', '#B53030'],
  ['necktie', 'Галстук', 'eyewear', 'accessory', 'common', b(60), SHOP, 'Деловой стиль.', ['fancy', 'city'], 'necktie', '#3D7BFF', '#2B58B8'],
  ['lollipop', 'Леденец', 'eyewear', 'accessory', 'common', b(50), SHOP, 'Сладкий и разноцветный.', ['cute', 'party'], 'lollipop', '#FF6BD6', '#FFE066'],
  ['balloon', 'Воздушный шарик', 'eyewear', 'accessory', 'common', b(60), SHOP, 'Держится за ниточку.', ['party'], 'balloon', '#FF5E7E', '#FFFFFF'],
  ['scarf-knit', 'Вязаный шарф', 'eyewear', 'accessory', 'common', b(90), SHOP, 'Тёплый и очень длинный.', ['winter', 'cozy'], 'scarf', '#E94F4F', '#FFFFFF'],
  ['backpack', 'Рюкзачок', 'eyewear', 'accessory', 'common', b(100), SHOP, 'Для походов и находок.', ['adventure'], 'backpack', '#FF9F1C', '#7A4F25'],
  ['umbrella', 'Зонтик', 'eyewear', 'accessory', 'uncommon', b(120), LV(3), 'Дождю не страшен.', ['rain', 'cute'], 'umbrella', '#FF5E8A', '#FFFFFF'],
  ['flag-win', 'Флажок победителя', 'eyewear', 'accessory', 'uncommon', b(130), LV(4), 'Для самых лучших!', ['sport'], 'flag', '#E94F4F', '#FFFFFF'],
  ['wand', 'Волшебная палочка', 'eyewear', 'accessory', 'rare', c(160), LV(7), 'Искрится на кончике.', ['magic'], 'wand', '#8E5BD9', '#FFE066'],
  ['cape-hero', 'Плащ героя', 'eyewear', 'accessory', 'rare', c(180), LV(8), 'Развевается на ветру.', ['hero'], 'cape', '#E53935', '#FFD93D'],
  ['fairy-wings', 'Крылышки феи', 'eyewear', 'accessory', 'epic', g(30), LV(10), 'Переливаются на свету.', ['magic', 'cute'], 'wings', '#CFF4FF', '#FFC8F0'],
  // ---- Обувь ----
  ['sandals', 'Сандалики', 'shoes', 'shoes', 'common', b(60), SHOP, 'Летом — самое то.', ['summer', 'beach'], 'sandals', '#FFB347', '#FFFFFF', undefined, 'summer'],
  ['sneakers-white', 'Белые кроссовки', 'shoes', 'shoes', 'common', b(70), SHOP, 'Бегать и прыгать.', ['sport', 'casual'], 'sneakers', '#FFFFFF', '#3D7BFF'],
  ['slippers', 'Тапочки', 'shoes', 'shoes', 'common', b(80), SHOP, 'Мягкие и домашние.', ['cozy'], 'slippers', '#FFB3C8', '#FFFFFF'],
  ['rainboots', 'Резиновые сапожки', 'shoes', 'shoes', 'common', b(100), SHOP, 'Лужи — это весело.', ['rain', 'autumn'], 'rainboots', '#FFD93D', '#E6A800', undefined, 'autumn'],
  ['flippers', 'Ласты', 'shoes', 'shoes', 'uncommon', b(110), LV(3), 'Шлёп-шлёп по пляжу.', ['summer', 'beach'], 'flippers', '#5EDDD0', '#2DB5A7', undefined, 'summer'],
  ['boots-brown', 'Коричневые ботинки', 'shoes', 'shoes', 'uncommon', b(130), LV(4), 'Крепкие и надёжные.', ['adventure', 'western', 'pirate'], 'boots', '#7A4F25', '#C99A5B'],
  ['bunny-slippers', 'Тапочки-зайчики', 'shoes', 'shoes', 'uncommon', b(140), LV(4), 'С ушками на носках.', ['cozy', 'animal', 'spring'], 'bunnyslip', '#FFE3EE', '#FFB3C8'],
  ['skates', 'Роликовые коньки', 'shoes', 'shoes', 'rare', c(150), LV(6), 'Катиться — одно удовольствие.', ['sport', 'city'], 'skates', '#FF5E8A', '#FFFFFF'],
  // ---- Украшения ----
  ['bracelet-friend', 'Браслет дружбы', 'jewelry', 'jewelry', 'common', b(70), SHOP, 'Разноцветные бусинки.', ['cute', 'casual'], 'bracelet', '#FF7FA8', '#6FC3FF'],
  ['bell-collar', 'Колокольчик', 'jewelry', 'jewelry', 'common', b(80), SHOP, 'Дзынь-дзынь!', ['cute'], 'bell', '#FFD93D', '#C99A2E'],
  ['pearls', 'Жемчужное ожерелье', 'jewelry', 'jewelry', 'uncommon', c(120), LV(5), 'Нежное и блестящее.', ['fancy', 'sea'], 'pearls', '#FFFFFF', '#E8E0FF'],
  ['pendant-heart', 'Кулон-сердечко', 'jewelry', 'jewelry', 'uncommon', c(110), LV(4), 'С любовью.', ['love', 'cute'], 'pendant', '#FF5E8A', '#FFC4D8'],
  ['medal-gold', 'Золотая медаль', 'jewelry', 'jewelry', 'uncommon', b(150), LV(5), 'За отличные результаты.', ['sport'], 'medal', '#FFC400', '#E53935'],
  ['brooch-star', 'Брошь-звезда', 'jewelry', 'jewelry', 'rare', c(130), LV(6), 'Сверкает при каждом шаге.', ['fashion', 'fancy'], 'brooch', '#FFD93D', '#FFF3B0'],
  ['crystal-necklace', 'Хрустальное ожерелье', 'jewelry', 'jewelry', 'epic', g(20), LV(10), 'Преломляет радугу.', ['fancy', 'magic'], 'crystal', '#8FD3FF', '#C9A8FF'],
  ['star-stefania', 'Звезда Stefania', 'jewelry', 'jewelry', 'rare', b(0), REW('Награда за прохождение обучения'), 'Особый подарок от всех Нанабо.', ['personal', 'fancy'], 'starstef', '#FFD93D', '#FF7FA8'],
  // ---- Специальные предметы ----
  ['fx-bubbles', 'Мыльные пузыри', 'special', 'effect', 'uncommon', b(200), LV(4), 'Пузыри летают вокруг.', ['fun', 'summer'], 'bubbles', '#BFE9FF', '#FFFFFF'],
  ['fx-confetti', 'Конфетти', 'special', 'effect', 'uncommon', b(190), LV(4), 'Праздник каждый день.', ['party'], 'confetti', '#FF5E8A', '#FFD93D', '#3D7BFF'],
  ['fx-hearts', 'Летящие сердечки', 'special', 'effect', 'rare', c(230), LV(6), 'Любовь в воздухе.', ['love', 'cute'], 'hearts', '#FF5E8A', '#FFC4D8'],
  ['fx-sparkles', 'Искры', 'special', 'effect', 'rare', c(250), LV(6), 'Сверкающая пыльца.', ['magic', 'fashion'], 'sparkles', '#FFE066', '#FFFFFF'],
  ['fx-fireflies', 'Светлячки', 'special', 'effect', 'rare', c(240), LV(7), 'Мерцают в сумерках.', ['magic', 'night'], 'fireflies', '#E8FF7A', '#FFFFFF'],
  ['fx-snow', 'Снегопад', 'special', 'effect', 'rare', c(240), LV(7), 'Лёгкие снежинки.', ['winter'], 'snow', '#FFFFFF', '#BFE9FF', undefined, 'winter'],
  ['fx-petals', 'Лепестки сакуры', 'special', 'effect', 'rare', c(240), LV(7), 'Нежные розовые лепестки.', ['spring'], 'petals', '#FFB3D1', '#FFE3EE', undefined, 'spring'],
  ['fx-halo', 'Сияющий нимб', 'special', 'effect', 'epic', g(50), LV(12), 'Мягкое золотое сияние над головой.', ['magic', 'fancy'], 'halo', '#FFE066', '#FFFFFF'],
  ['fx-rainbow', 'Радужный след', 'special', 'effect', 'epic', g(40), LV(10), 'Радуга за спиной.', ['fun', 'cute'], 'rainbow', '#FF5E7E', '#FFD93D', '#3D7BFF'],
  ['fx-golden', 'Золотое сияние', 'special', 'effect', 'legendary', b(0), REW('Награда за 60 звёзд'), 'Редкая аура настоящих героев.', ['legend'], 'glow', '#FFC400', '#FFF3B0'],
  ['golden-banana', 'Золотой банан', 'special', 'accessory', 'legendary', b(0), REW('Награда за достижение «Treasure Hunter»'), 'Символ главного банана базы.', ['legend', 'banana'], 'goldbanana', '#FFC400', '#FFF3B0'],
  ['crown-stefania', 'Корона Stefania', 'special', 'hat', 'legendary', b(0), REW('Награда за 120 звёзд'), 'Корона хозяйки базы.', ['personal', 'royal', 'legend'], 'crown', '#FF7FA8', '#FFE066'],
];

export const ITEMS: ItemDef[] = R.map(([id, name, category, layer, rarity, cost, unlock, desc, tags, kind, c1, c2, c3, season]) => ({
  id, name, category, layer, rarity, cost, unlock, desc, tags, art: { kind, c1, c2, c3 }, ...(season ? { season } : {}),
}));
export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

const S = (id: string, name: string, category: 'theme' | 'season', rarity: Rarity, desc: string, pieces: string[], tags: string[], season?: string): SetDef => {
  let lvl = 1;
  for (const p of pieces) { const u = ITEM_MAP[p].unlock; if (u.type === 'level') lvl = Math.max(lvl, u.level); }
  return { id, name, category, rarity, desc, pieces, tags, unlock: lvl > 1 ? LV(lvl) : SHOP, ...(season ? { season } : {}) };
};
export const SETS: SetDef[] = [
  S('set-pirate', 'Пират Нанабо', 'theme', 'rare', 'Полный набор пирата-искателя приключений.', ['pirate-coat', 'pirate-hat', 'eyepatch', 'boots-brown'], ['pirate', 'adventure']),
  S('set-space', 'Космонавт', 'theme', 'epic', 'К звёздам на борту базы!', ['astro-suit', 'space-helmet', 'sneakers-white'], ['space']),
  S('set-chef', 'Шеф Нанабо', 'theme', 'uncommon', 'Для настоящего повара.', ['chef-coat', 'chef-hat', 'necktie', 'sneakers-white'], ['chef', 'kitchen']),
  S('set-magic', 'Юный волшебник', 'theme', 'rare', 'Мантия, шляпа, палочка и искры.', ['wizard-robe', 'wizard-hat', 'wand', 'fx-sparkles'], ['magic']),
  S('set-hero', 'Супергерой', 'theme', 'epic', 'Всегда готов помочь друзьям.', ['hero-suit', 'cape-hero', 'shades', 'sneakers-white'], ['hero']),
  S('set-knight', 'Рыцарь Банановой империи', 'theme', 'epic', 'Доспехи, шлем и флаг победы.', ['knight-armor', 'knight-helm', 'flag-win', 'boots-brown'], ['knight', 'fancy']),
  S('set-party', 'Вечеринка!', 'theme', 'rare', 'Платье, колпак, шарик и конфетти.', ['dress-star', 'party-hat', 'balloon', 'fx-confetti'], ['party']),
  S('set-sport', 'Чемпион', 'theme', 'uncommon', 'Форма, кепка, кроссовки и медаль.', ['jersey-champ', 'cap-red', 'sneakers-white', 'medal-gold'], ['sport']),
  S('set-winter', 'Зимняя сказка', 'season', 'rare', 'Колпак, шарф и снегопад.', ['santa-suit', 'santa-hat', 'scarf-knit', 'fx-snow'], ['winter'], 'winter'),
  S('set-spring', 'Весенний луг', 'season', 'rare', 'Зайчик, цветочный венок и лепестки.', ['bunny-suit', 'bunny-ears', 'flower-crown', 'fx-petals', 'bunny-slippers'], ['spring'], 'spring'),
  S('set-summer', 'Пляжный день', 'season', 'uncommon', 'Купальник, шляпа и ласты.', ['swim-ring', 'sun-hat', 'flippers', 'shades'], ['summer'], 'summer'),
  S('set-autumn', 'Золотая осень', 'season', 'rare', 'Тыква, берет, зонтик и сапожки.', ['pumpkin-suit', 'beret', 'umbrella', 'rainboots'], ['autumn'], 'autumn'),
];
export const SET_MAP: Record<string, SetDef> = Object.fromEntries(SETS.map((s) => [s.id, s]));

export const CATEGORY_LABEL: Record<string, string> = {
  outfit: 'Одежда', costume: 'Костюмы', hat: 'Шапки', eyewear: 'Очки и аксессуары', shoes: 'Обувь', jewelry: 'Украшения',
  special: 'Особое', theme: 'Образы', season: 'Сезонное',
};
export const CATEGORY_ORDER = ['outfit', 'costume', 'hat', 'eyewear', 'shoes', 'jewelry', 'special', 'theme', 'season'] as const;
export const LAYER_ORDER: Layer[] = ['outfit', 'costume', 'shoes', 'jewelry', 'accessory', 'glasses', 'hat', 'effect'];
export const LAYER_LABEL: Record<Layer, string> = {
  outfit: 'Одежда', costume: 'Костюм', shoes: 'Обувь', jewelry: 'Украшение', accessory: 'Аксессуар', glasses: 'Очки', hat: 'Головной убор', effect: 'Эффект',
};
