import type { CharacterDef, CharacterLook } from '../types';

// Нанабо — оригинальные добрые существа (собственный дизайн, не связанный с чужими франшизами).
const L = (o: Partial<CharacterLook> & Pick<CharacterLook, 'body' | 'belly' | 'cheek'>): CharacterLook => ({
  build: 'round', feature: 'none', featureColor: '#6BCB77', eyes: 'big', pattern: 'none', ...o,
});

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'pip', name: 'Pip', rarity: 'common', title: 'Весёлый хранитель базы',
    bio: 'Всегда первым встречает гостей и любит считать бананы по три раза.',
    story: 'Пип нашёл первый банановый росток на заднем дворе и решил, что ему нужна хозяйка. Так появилась Stefania.',
    look: L({ body: '#FFD93D', belly: '#FFF3B0', cheek: '#FF9E9E', feature: 'sprout' }),
    stats: { speed: 3, brains: 3, charm: 4, luck: 3 }, unlock: { kind: 'start' }, unlockText: 'Живёт на базе с самого начала', voice: 1,
  },
  {
    id: 'mochi', name: 'Mochi', rarity: 'common', title: 'Сонный мастер обнимашек',
    bio: 'Мягкий, как зефир. Может уснуть где угодно, даже посреди танца.',
    story: 'Мочи приехал в коробке с надписью «Осторожно, милота». Коробку он, кстати, оставил себе.',
    look: L({ body: '#FFF1D6', belly: '#FFFFFF', cheek: '#FFB3C1', build: 'small', feature: 'bunny', featureColor: '#FFC8D6', eyes: 'sleepy' }),
    stats: { speed: 2, brains: 3, charm: 5, luck: 3 }, unlock: { kind: 'start' }, unlockText: 'Живёт на базе с самого начала', voice: 1.3,
  },
  {
    id: 'zuzu', name: 'Zuzu', rarity: 'common', title: 'Искра с антенной',
    bio: 'Быстрый, шумный и очень любопытный. Антенна ловит весёлые новости.',
    story: 'Зузу прилетел на воздушном шаре, потому что услышал, что на базе вкусно пахнет бананами.',
    look: L({ body: '#FFB347', belly: '#FFE2B0', cheek: '#FF8A8A', build: 'tall', feature: 'antenna', featureColor: '#FF5E5E' }),
    stats: { speed: 5, brains: 2, charm: 3, luck: 3 }, unlock: { kind: 'level', levelId: 'w1l5' }, unlockText: 'Пройди уровень «Спелые и не очень» (Мир 1)', voice: 1.15,
  },
  {
    id: 'tofu', name: 'Tofu', rarity: 'common', title: 'Спокойный философ',
    bio: 'Круглый, белый и невозмутимый. Говорит мало, но всегда по делу.',
    story: 'Тофу считает, что любое приключение лучше с чашкой тёплого банановского чая.',
    look: L({ body: '#F4F1E8', belly: '#FFFFFF', cheek: '#FFC4B8', build: 'chubby', feature: 'tuft', featureColor: '#9AA5B1' }),
    stats: { speed: 2, brains: 5, charm: 3, luck: 3 }, unlock: { kind: 'level', levelId: 'w1l8' }, unlockText: 'Победи босса Мира 1', voice: 0.85,
  },
  {
    id: 'bumble', name: 'Bumble', rarity: 'uncommon', title: 'Полосатый трудяга',
    bio: 'Жужжит, когда доволен. Любит порядок и гудящие машины.',
    story: 'Бамбл всегда жил на краю базы, пока Stefania не пригласила его на вечеринку знакомств.',
    look: L({ body: '#FFD23F', belly: '#FFF0A0', cheek: '#FF9B9B', feature: 'wings', featureColor: '#BFE9FF', pattern: 'stripes', patternColor: '#5B4636' }),
    stats: { speed: 4, brains: 3, charm: 3, luck: 4 }, unlock: { kind: 'quest', id: 'story-party' }, unlockText: 'Награда сюжетного задания «Вечеринка знакомств»', voice: 1.1,
  },
  {
    id: 'kiko', name: 'Kiko', rarity: 'uncommon', title: 'Бирюзовый акробат',
    bio: 'Прыгает выше всех и никогда не падает. Почти никогда.',
    story: 'Кико тренировался на Банановом острове и мечтал прыгнуть через радугу.',
    look: L({ body: '#5EDDD0', belly: '#CFFAF3', cheek: '#FF9EB5', build: 'tall', feature: 'cat', featureColor: '#2DB5A7' }),
    stats: { speed: 5, brains: 3, charm: 3, luck: 3 }, unlock: { kind: 'level', levelId: 'w2l4' }, unlockText: 'Пройди уровень «Прыжок через волну» (Мир 2)', voice: 1.2,
  },
  {
    id: 'waffle', name: 'Waffle', rarity: 'uncommon', title: 'Шеф-повар базы',
    bio: 'Пахнет корицей. Каждый день придумывает новое банановое блюдо.',
    story: 'Вафля услышала шипение сковородки и пришла проверить, всё ли в порядке на кухне.',
    look: L({ body: '#E8B467', belly: '#FBE3B4', cheek: '#FF8F8F', build: 'chubby', feature: 'tuft', featureColor: '#B5732D', pattern: 'spots', patternColor: '#C98B3D' }),
    stats: { speed: 2, brains: 4, charm: 4, luck: 3 }, unlock: { kind: 'room', room: 'kitchen' }, unlockText: 'Открой Кухню', voice: 0.95, favoriteFood: 'pancakes',
  },
  {
    id: 'pudding', name: 'Pudding', rarity: 'uncommon', title: 'Розовое солнышко',
    bio: 'Улыбается так, что у всех сразу поднимается настроение.',
    story: 'Пудинг приходит в гости каждую неделю, а теперь решил остаться насовсем.',
    look: L({ body: '#FFB6D1', belly: '#FFE3EE', cheek: '#FF7FA8', build: 'small', feature: 'sprout', featureColor: '#FF7FA8' }),
    stats: { speed: 3, brains: 3, charm: 5, luck: 4 }, unlock: { kind: 'daily', day: 7 }, unlockText: 'Награда 7-го дня календаря', voice: 1.25,
  },
  {
    id: 'sprocket', name: 'Sprocket', rarity: 'rare', title: 'Изобретатель',
    bio: 'Собирает приборы из чего угодно. Иногда они даже работают.',
    story: 'Спрокет сидел в лаборатории с чертежами, пока Stefania не включила свет и не спросила: «Что мы изобретаем?»',
    look: L({ body: '#6FA8FF', belly: '#D8E8FF', cheek: '#FF9EB5', build: 'tall', feature: 'antenna', featureColor: '#FFD93D' }),
    stats: { speed: 3, brains: 5, charm: 2, luck: 3 }, unlock: { kind: 'room', room: 'lab' }, unlockText: 'Открой Лабораторию', voice: 0.9,
  },
  {
    id: 'boba', name: 'Boba', rarity: 'rare', title: 'Сладкий соня-мишка',
    bio: 'Пахнет ванилью, обожает пушистые пледы и сказки на ночь.',
    story: 'Боба нашёлся в сундуке, свернувшись калачиком среди монет.',
    look: L({ body: '#C9A8FF', belly: '#EFE3FF', cheek: '#FF9EC4', build: 'chubby', feature: 'bear', featureColor: '#A57FE8', pattern: 'spots', patternColor: '#E6D6FF', eyes: 'sleepy' }),
    stats: { speed: 2, brains: 3, charm: 5, luck: 5 }, unlock: { kind: 'chest' }, unlockText: 'Выпадает из сундуков (редкий и выше)', voice: 0.9,
  },
  {
    id: 'nova', name: 'Nova', rarity: 'rare', title: 'Звёздный исследователь',
    bio: 'Мечтает дотянуться до звёзд и всегда носит с собой карту созвездий.',
    story: 'Нова упала в лабораторию с метеоритным дождём и осталась, потому что здесь пахнет приключениями.',
    look: L({ body: '#5B5FD6', belly: '#B7B9FF', cheek: '#FF9EC4', feature: 'crest', featureColor: '#FFE066', eyes: 'sparkle' }),
    stats: { speed: 3, brains: 5, charm: 3, luck: 4 }, unlock: { kind: 'level', levelId: 'w3l8' }, unlockText: 'Победи босса Мира 3', voice: 1.05,
  },
  {
    id: 'rex', name: 'Rex', rarity: 'rare', title: 'Маленький силач',
    bio: 'Тренируется каждый день и громко рычит «р-р-р» для храбрости.',
    story: 'Рекс пришёл в тренировочный зал с гантелей, которая была больше него самого.',
    look: L({ body: '#7ED957', belly: '#D5F5BE', cheek: '#FF9E9E', feature: 'crest', featureColor: '#3FA33A', pattern: 'spots', patternColor: '#5DB545' }),
    stats: { speed: 4, brains: 2, charm: 3, luck: 3 }, unlock: { kind: 'room', room: 'gym' }, unlockText: 'Открой Тренировочный зал', voice: 0.8,
  },
  {
    id: 'jinx', name: 'Jinx', rarity: 'epic', title: 'Тайна из Весёлого города',
    bio: 'Хитрая улыбка, пушистый хвост и привычка исчезать, когда пора мыть посуду.',
    story: 'Джинкс выглянул из-за афиши в Весёлом городе и подмигнул Stefania — так всё началось.',
    look: L({ body: '#8E5BD9', belly: '#D9C3FF', cheek: '#FF8FB8', build: 'tall', feature: 'cat', featureColor: '#5A2FA8', pattern: 'stripes', patternColor: '#5A2FA8', eyes: 'sparkle' }),
    stats: { speed: 5, brains: 4, charm: 4, luck: 5 }, unlock: { kind: 'level', levelId: 'w4l8' }, unlockText: 'Победи босса Мира 4', voice: 1.1,
  },
  {
    id: 'glimmer', name: 'Glimmer', rarity: 'epic', title: 'Сияющая модница',
    bio: 'Обожает наряды, блёстки и красивые фотографии. Её гардероб бесконечен.',
    story: 'Глиммер родилась в блеске заката над Банановым островом и с тех пор следит за модой.',
    look: L({ body: '#FFC9E8', belly: '#FFF0F8', cheek: '#FF7FC0', build: 'tall', feature: 'wings', featureColor: '#FFE9A8', eyes: 'sparkle' }),
    stats: { speed: 3, brains: 4, charm: 6, luck: 4 }, unlock: { kind: 'achievement', id: 'collector' }, unlockText: 'Награда за достижение «Collector»', voice: 1.3,
  },
  {
    id: 'sir-bananaby', name: 'Sir Bananaby', rarity: 'legendary', title: 'Золотой рыцарь Банановой империи',
    bio: 'Благородный, смелый и немного смешной. Клянётся защищать каждый банан.',
    story: 'Сэр Бананаби охранял Мир Тайн тысячу лет и ждал хозяйку, которая вернёт ему улыбку. Это была Stefania.',
    look: L({ body: '#FFC400', belly: '#FFF0A0', cheek: '#FF8A5C', feature: 'crest', featureColor: '#FF9F1C', eyes: 'sparkle', pattern: 'stripes', patternColor: '#FFE066' }),
    stats: { speed: 5, brains: 5, charm: 5, luck: 5 }, unlock: { kind: 'level', levelId: 'w5l8' }, unlockText: 'Победи финального босса Мира Тайн', voice: 0.75,
  },
  {
    id: 'stella', name: 'Stella', rarity: 'legendary', title: 'Звёздный подарок для Stefania',
    bio: 'Хранительница секретов. Светится в темноте и знает, где спрятаны все сокровища.',
    story: 'Стелла ждала в тайной комнате, пока Stefania не найдёт все секреты. Она — особый подарок от всех Нанабо.',
    look: L({ body: '#FFF6C9', belly: '#FFFFFF', cheek: '#FFB3D1', build: 'round', feature: 'halo', featureColor: '#FFE066', eyes: 'sparkle' }),
    stats: { speed: 4, brains: 5, charm: 6, luck: 6 }, unlock: { kind: 'secrets', count: 8 }, unlockText: 'Найди все 8 секретных предметов', voice: 1.2,
  },
];

export const CHARACTER_MAP: Record<string, CharacterDef> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
export const START_CHARACTERS = CHARACTERS.filter((c) => c.unlock.kind === 'start').map((c) => c.id);
