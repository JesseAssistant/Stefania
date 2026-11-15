import type { AchievementDef, QuestDef, Reward } from '../types';

const q = (kind: QuestDef['kind'], id: string, title: string, desc: string, metric: string, target: number, reward: Reward, extra: Partial<QuestDef> = {}): QuestDef =>
  ({ id, kind, title, desc, metric, target, reward, ...extra });

// Ежедневные и еженедельные считают СОБЫТИЯ (metric = имя события), остальные — вычисляют значение из состояния (metric = "state:...").
export const DAILY_QUESTS: QuestDef[] = [
  q('daily', 'd-bananas-s', 'Банановый сбор', 'Собери 50 бананов любым способом.', 'bananas_earned', 50, { coins: 12, xp: 10 }),
  q('daily', 'd-bananas-m', 'Банановый урожай', 'Собери 150 бананов.', 'bananas_earned', 150, { coins: 25, xp: 15 }),
  q('daily', 'd-levels', 'Два уровня', 'Пройди два уровня на карте приключений.', 'levels_cleared', 2, { bananas: 40, xp: 20 }),
  q('daily', 'd-minigames', 'Время поиграть', 'Сыграй в мини-игры 3 раза.', 'minigames_played', 3, { bananas: 35, xp: 15 }),
  q('daily', 'd-dress2', 'Модный дуэт', 'Переодень двух Нанабо.', 'chars_dressed', 2, { coins: 15, xp: 12 }, { distinct: true, requires: 'chars:2' }),
  q('daily', 'd-dress3', 'Переодень трёх', 'Переодень трёх Нанабо.', 'chars_dressed', 3, { coins: 25, xp: 18 }, { distinct: true, requires: 'chars:3' }),
  q('daily', 'd-basket', 'Корзина бананов', 'Собери бананы из корзины в холле.', 'basket', 1, { bananas: 25, xp: 8 }),
  q('daily', 'd-item', 'Новая вещь', 'Получи любой новый предмет одежды.', 'items_acquired', 1, { coins: 20, xp: 12 }),
  q('daily', 'd-stars', 'Звёздный день', 'Заработай 3 новые звезды на уровнях.', 'stars_earned', 3, { crystals: 1, xp: 20 }),
  q('daily', 'd-chest', 'Сундучок', 'Открой любой сундук.', 'chests_opened', 1, { bananas: 50, xp: 12 }),
  q('daily', 'd-research', 'Научный день', 'Запусти и заверши одно исследование.', 'research', 1, { coins: 20, xp: 15 }, { requires: 'room:lab' }),
  q('daily', 'd-cook', 'У плиты', 'Приготовь одно блюдо на кухне.', 'dishes', 1, { coins: 20, xp: 15 }, { requires: 'room:kitchen' }),
  q('daily', 'd-train', 'Тренировка', 'Потренируй любого Нанабо.', 'trained', 1, { coins: 20, xp: 15 }, { requires: 'room:gym' }),
  q('daily', 'd-feed', 'Угощение', 'Накорми Нанабо блюдом.', 'fed', 1, { coins: 15, xp: 12 }, { requires: 'room:kitchen' }),
  q('daily', 'd-photo', 'Фотосессия', 'Сделай фото образа в альбом.', 'photos_taken', 1, { coins: 20, xp: 12 }, { requires: 'room:lounge' }),
  q('daily', 'd-decor', 'Уют', 'Поставь декорацию в любую комнату.', 'decor_placed', 1, { bananas: 30, xp: 10 }, { requires: 'decor:1' }),
];
export const WEEKLY_QUESTS: QuestDef[] = [
  q('weekly', 'w-bananas', 'Банановая неделя', 'Собери 800 бананов за неделю.', 'bananas_earned', 800, { crystals: 3, coins: 80, xp: 60 }),
  q('weekly', 'w-levels', 'Путешественник', 'Пройди 10 уровней (в том числе повторно).', 'levels_cleared', 10, { crystals: 3, chests: { common: 1 }, xp: 60 }),
  q('weekly', 'w-minigames', 'Игроман', 'Сыграй в 20 мини-игр.', 'minigames_played', 20, { crystals: 2, coins: 100, xp: 60 }),
  q('weekly', 'w-items', 'Модная неделя', 'Получи 4 новых предмета.', 'items_acquired', 4, { crystals: 2, coins: 80, xp: 50 }),
  q('weekly', 'w-stars', 'Звёздная неделя', 'Заработай 12 новых звёзд.', 'stars_earned', 12, { crystals: 4, xp: 70 }, { requires: 'stars:1' }),
  q('weekly', 'w-chests', 'Сундуки!', 'Открой 3 сундука.', 'chests_opened', 3, { crystals: 3, bananas: 150, xp: 40 }),
  q('weekly', 'w-quests', 'Много дел', 'Забери награды за 10 заданий.', 'quests_claimed', 10, { crystals: 3, chests: { rare: 1 }, xp: 80 }),
  q('weekly', 'w-dress', 'Стилист недели', 'Переодень пятерых разных Нанабо.', 'chars_dressed', 5, { crystals: 2, coins: 100, xp: 50 }, { distinct: true, requires: 'chars:5' }),
  q('weekly', 'w-upgrade', 'Строитель', 'Улучши любую комнату.', 'rooms_upgraded', 1, { crystals: 3, coins: 80, xp: 60 }),
  q('weekly', 'w-cook', 'Кулинарная неделя', 'Приготовь 5 блюд.', 'dishes', 5, { crystals: 2, coins: 90, xp: 50 }, { requires: 'room:kitchen' }),
];
export const STORY_QUESTS: QuestDef[] = [
  q('story', 'story-first', 'Первый день на базе', 'Пройди свой первый уровень.', 'state:levels_cleared', 1, { bananas: 60, xp: 25 }),
  q('story', 'story-dress', 'Модный Pip', 'Надень на Нанабо что-нибудь новое.', 'state:outfit_changes', 1, { coins: 20, xp: 20 }),
  q('story', 'story-party', 'Вечеринка знакомств', 'Собери в коллекции троих Нанабо.', 'state:chars', 3, { bananas: 120, coins: 30, characters: ['bumble'], xp: 40 }),
  q('story', 'story-rooms', 'Больше места', 'Открой три комнаты на базе.', 'state:rooms_unlocked', 3, { coins: 60, decor: ['rug-round'], xp: 40 }),
  q('story', 'story-fashion', 'Первый образ', 'Сохрани образ в гардеробе.', 'state:outfits_saved', 1, { coins: 40, items: ['bow-band'], xp: 30 }),
  q('story', 'story-stars', 'Звёздный путь', 'Собери 15 звёзд на уровнях.', 'state:stars', 15, { crystals: 3, chests: { common: 1 }, xp: 60 }),
  q('story', 'story-island', 'Приключение на острове', 'Открой Банановый остров.', 'state:worlds_unlocked', 2, { coins: 80, items: ['sun-hat'], xp: 50 }),
  q('story', 'story-lab', 'Учёные Нанабо', 'Заверши три исследования в лаборатории.', 'state:researches', 3, { crystals: 3, materials: { gear: 3, glitter: 2 }, xp: 60 }),
  q('story', 'story-chef', 'Шеф недели', 'Приготовь пять блюд.', 'state:dishes', 5, { coins: 100, crystals: 2, xp: 60 }),
  q('story', 'story-family', 'Большая семья', 'Собери 8 Нанабо.', 'state:chars', 8, { crystals: 5, chests: { rare: 1 }, xp: 100 }),
  q('story', 'story-city', 'Огни города', 'Открой Весёлый город.', 'state:worlds_unlocked', 4, { crystals: 5, items: ['fx-confetti'], xp: 100 }),
  q('story', 'story-final', 'Хозяйка базы', 'Пройди все 40 уровней.', 'state:levels_cleared', 40, { crystals: 20, chests: { epic: 1 }, xp: 300 }),
];
export const CHALLENGES: QuestDef[] = [
  q('challenge', 'ch-bananas-1k', 'Банановый магнат I', 'Собери за всё время 1 000 бананов.', 'state:bananas_lifetime', 1000, { coins: 60 }),
  q('challenge', 'ch-bananas-5k', 'Банановый магнат II', 'Собери за всё время 5 000 бананов.', 'state:bananas_lifetime', 5000, { coins: 150, crystals: 3 }),
  q('challenge', 'ch-bananas-20k', 'Банановый магнат III', 'Собери за всё время 20 000 бананов.', 'state:bananas_lifetime', 20000, { crystals: 10, chests: { epic: 1 } }),
  q('challenge', 'ch-minigames-25', 'Игрок I', 'Сыграй 25 раз в мини-игры.', 'state:minigames_played', 25, { coins: 80, crystals: 2 }),
  q('challenge', 'ch-minigames-100', 'Игрок II', 'Сыграй 100 раз в мини-игры.', 'state:minigames_played', 100, { crystals: 8, chests: { rare: 1 } }),
  q('challenge', 'ch-levels-20', 'Путешественник', 'Пройди 20 уровней.', 'state:levels_cleared', 20, { crystals: 5, chests: { rare: 1 } }),
  q('challenge', 'ch-perfect-10', 'Перфекционист', 'Получи 3 звезды на 10 уровнях.', 'state:perfect_levels', 10, { crystals: 8, coins: 200 }),
  q('challenge', 'ch-chests-20', 'Король сундуков', 'Открой 20 сундуков.', 'state:chests_opened', 20, { crystals: 6, coins: 150 }),
  q('challenge', 'ch-items-30', 'Гардероб мечты', 'Собери 30 предметов одежды.', 'state:items_owned', 30, { crystals: 6, chests: { rare: 1 } }),
  q('challenge', 'ch-cards-20', 'Коллекционер карточек', 'Найди 20 коллекционных карточек.', 'state:cards', 20, { crystals: 8, decor: ['frame-photo'] }),
  q('challenge', 'ch-train-20', 'Тренер', 'Проведи 20 тренировок.', 'state:trainings', 20, { crystals: 5, coins: 150 }),
  q('challenge', 'ch-quests-30', 'Трудяга', 'Забери награды за 30 заданий.', 'state:quests_claimed', 30, { crystals: 6, chests: { rare: 1 } }),
];
export const SECRET_QUESTS: QuestDef[] = [
  q('secret', 'sq-first', 'Следы Нанабо', 'Найди три секретных предмета (ищи мерцающие места в комнатах и на картах).', 'state:secrets', 3, { chests: { rare: 1 }, crystals: 3 }, { trigger: 'secrets:1' }),
  q('secret', 'sq-room', 'Тайная комната', 'Открой секретную комнату на базе.', 'state:secret_room', 1, { coins: 150, crystals: 4 }, { trigger: 'secrets:3' }),
  q('secret', 'sq-all', 'Хранитель секретов', 'Найди все 8 секретных предметов.', 'state:secrets', 8, { crystals: 15, chests: { legendary: 1 } }, { trigger: 'secrets:5' }),
];
export const ALL_QUESTS: QuestDef[] = [...DAILY_QUESTS, ...WEEKLY_QUESTS, ...STORY_QUESTS, ...CHALLENGES, ...SECRET_QUESTS];
export const QUEST_MAP: Record<string, QuestDef> = Object.fromEntries(ALL_QUESTS.map((x) => [x.id, x]));
export const DAILY_COUNT = 4;
export const WEEKLY_COUNT = 3;

const a = (id: string, name: string, desc: string, icon: string, metric: string, target: number, reward: Reward, extra: Partial<AchievementDef> = {}): AchievementDef =>
  ({ id, name, desc, icon, metric, target, reward, ...extra });
export const ACHIEVEMENTS: AchievementDef[] = [
  a('first-banana', 'First Banana', 'Собери свой первый банан.', 'banana', 'bananas_lifetime', 1, { bananas: 20 }),
  a('banana-pile', 'Куча бананов', 'Собери за всё время 1 000 бананов.', 'banana', 'bananas_lifetime', 1000, { coins: 40 }),
  a('banana-hoarder', 'Банановый магнат', 'Собери за всё время 10 000 бананов.', 'banana', 'bananas_lifetime', 10000, { crystals: 6 }, { rare: true }),
  a('tutorial-done', 'Добро пожаловать!', 'Пройди обучение.', 'heart', 'tutorial_done', 1, { items: ['star-stefania'], coins: 30 }),
  a('new-friend', 'New Friend', 'Открой первого нового Нанабо.', 'friend', 'chars_new', 1, { coins: 30 }),
  a('collector', 'Collector', 'Собери 10 Нанабо.', 'friends', 'chars', 10, { crystals: 5, characters: ['glimmer'] }),
  a('full-house', 'Полный дом', 'Собери всех 16 Нанабо.', 'friends', 'chars', 16, { crystals: 15 }, { rare: true }),
  a('fashion-star', 'Fashion Star', 'Создай свой первый образ.', 'hanger', 'outfits_saved', 1, { coins: 40 }),
  a('stylist', 'Стилист', 'Сохрани 5 образов.', 'hanger', 'outfits_saved', 5, { coins: 80, crystals: 1 }),
  a('trendsetter', 'Законодатель мод', 'Сохрани 15 образов.', 'hanger', 'outfits_saved', 15, { crystals: 5 }, { rare: true }),
  a('shopaholic', 'Шопоголик', 'Купи 10 предметов.', 'bag', 'items_bought', 10, { coins: 60 }),
  a('wardrobe-full', 'Бездонный шкаф', 'Собери 40 предметов одежды.', 'bag', 'items_owned', 40, { crystals: 8 }, { rare: true }),
  a('photographer', 'Фотограф', 'Сохрани первое фото в альбом.', 'camera', 'photos', 1, { coins: 40 }),
  a('paparazzi', 'Папарацци', 'Сохрани 10 фото в альбом.', 'camera', 'photos', 10, { crystals: 3 }),
  a('room-designer', 'Room Designer', 'Улучши три комнаты хотя бы до 2 уровня.', 'room', 'rooms_upgraded_count', 3, { coins: 100, crystals: 2 }),
  a('architect', 'Архитектор', 'Открой все 10 комнат.', 'room', 'rooms_unlocked', 10, { crystals: 8 }, { rare: true }),
  a('master-builder', 'Мастер-строитель', 'Улучши любую комнату до 5 уровня.', 'room', 'rooms_max_level', 5, { crystals: 6 }, { rare: true }),
  a('decorator', 'Декоратор', 'Расставь 10 декораций.', 'sofa', 'decor_placed', 10, { coins: 80 }),
  a('nanabo-master', 'Nanabo Master', 'Достигни 10 уровня игрока.', 'crown', 'player_level', 10, { crystals: 5 }),
  a('nanabo-legend', 'Легенда базы', 'Достигни 25 уровня игрока.', 'crown', 'player_level', 25, { crystals: 15 }, { rare: true }),
  a('treasure-hunter', 'Treasure Hunter', 'Найди три секретных предмета.', 'chest', 'secrets', 3, { items: ['golden-banana'], crystals: 3 }),
  a('secret-keeper', 'Хранитель секретов', 'Найди все 8 секретных предметов.', 'key', 'secrets', 8, { crystals: 10 }, { hidden: true, rare: true }),
  a('first-star', 'Первая звезда', 'Получи первую звезду.', 'star', 'stars', 1, { bananas: 30 }),
  a('star-collector', 'Звёздный сборщик', 'Собери 30 звёзд.', 'star', 'stars', 30, { coins: 100, crystals: 2 }),
  a('star-master', 'Звёздный мастер', 'Собери 60 звёзд.', 'star', 'stars', 60, { crystals: 6 }),
  a('star-legend', 'Звёздная легенда', 'Собери все 120 звёзд.', 'star', 'stars', 120, { crystals: 20 }, { rare: true }),
  a('perfect-player', 'Perfect Player', 'Получи 3 звезды на 5 уровнях.', 'medal', 'perfect_levels', 5, { coins: 120, crystals: 3 }),
  a('perfect-world', 'Идеальный мир', 'Получи 3 звезды на всех уровнях одного мира.', 'medal', 'perfect_worlds', 1, { crystals: 8 }, { rare: true }),
  a('world-traveler', 'Путешественник', 'Открой 3 мира.', 'globe', 'worlds_unlocked', 3, { coins: 120 }),
  a('globe-trotter', 'Покоритель миров', 'Открой все 5 миров.', 'globe', 'worlds_unlocked', 5, { crystals: 8 }),
  a('boss-slayer', 'Победитель боссов', 'Пройди первого босса.', 'bolt', 'bosses_cleared', 1, { coins: 80 }),
  a('boss-master', 'Мастер боссов', 'Пройди всех 5 боссов.', 'bolt', 'bosses_cleared', 5, { crystals: 10 }, { rare: true }),
  a('minigame-fan', 'Любитель игр', 'Сыграй 25 раз в мини-игры.', 'joystick', 'minigames_played', 25, { coins: 60 }),
  a('minigame-pro', 'Профи аркады', 'Сыграй 100 раз в мини-игры.', 'joystick', 'minigames_played', 100, { crystals: 5 }),
  a('all-games', 'Мастер на все руки', 'Сыграй во все 8 мини-игр.', 'joystick', 'distinct_minigames', 8, { crystals: 5 }, { rare: true }),
  a('chef', 'Повар', 'Приготовь 5 блюд.', 'pot', 'dishes', 5, { coins: 60 }),
  a('master-chef', 'Мастер-шеф', 'Приготовь 25 блюд.', 'pot', 'dishes', 25, { crystals: 5 }),
  a('scientist', 'Учёный', 'Заверши 5 исследований.', 'flask', 'researches', 5, { coins: 70 }),
  a('crafter', 'Мастер на все руки', 'Создай 3 предмета в мастерской.', 'gear', 'crafts', 3, { coins: 80 }),
  a('trainer', 'Тренер', 'Проведи 10 тренировок.', 'dumbbell', 'trainings', 10, { coins: 80 }),
  a('caretaker', 'Заботливый хозяин', 'Накорми Нанабо 10 раз.', 'heart', 'fed', 10, { coins: 60 }),
  a('chest-opener', 'Открывашка', 'Открой первый сундук.', 'chest', 'chests_opened', 1, { bananas: 50 }),
  a('chest-lover', 'Любитель сундуков', 'Открой 20 сундуков.', 'chest', 'chests_opened', 20, { crystals: 5 }),
  a('lucky-legend', 'Невероятная удача', 'Получи легендарного Нанабо.', 'sparkle', 'legendary_chars', 1, { crystals: 10 }, { hidden: true, rare: true }),
  a('streak-3', 'Три дня подряд', 'Получи ежедневную награду 3 дня подряд.', 'calendar', 'max_streak', 3, { coins: 40 }),
  a('streak-7', 'Неделя с Нанабо', 'Серия из 7 дней.', 'calendar', 'max_streak', 7, { crystals: 3 }),
  a('streak-28', 'Месяц на базе', 'Серия из 28 дней.', 'calendar', 'max_streak', 28, { crystals: 15 }, { rare: true }),
  a('quest-doer', 'Исполнительная', 'Забери награды за 10 заданий.', 'scroll', 'quests_claimed', 10, { coins: 60 }),
  a('quest-master', 'Мастер заданий', 'Забери награды за 50 заданий.', 'scroll', 'quests_claimed', 50, { crystals: 6 }),
  a('card-collector', 'Коллекционер карточек', 'Найди 15 карточек.', 'cards', 'cards', 15, { crystals: 3 }),
  a('album-complete', 'Полный альбом', 'Найди все 30 карточек.', 'cards', 'cards', 30, { crystals: 12 }, { rare: true }),
  a('hour-of-fun', 'Час веселья', 'Проведи в игре 1 час.', 'clock', 'play_hours', 1, { coins: 50 }),
];
export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((x) => [x.id, x]));
