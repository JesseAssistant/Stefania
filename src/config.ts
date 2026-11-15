// Единая точка настройки названия, версий и ключей хранилища.
// Название игры можно сменить здесь — оно используется в меню, manifest и сохранениях.
export const PLAYER_NAME = 'Stefania'; // имя всегда пишется по-английски
export const GAME_TITLE = "Stefania's Nanabo World";
export const GAME_SHORT = 'Nanabo World';
export const GAME_VERSION = '1.0.0';
export const SCHEMA_VERSION = 1;
export const SAVE_FORMAT = 'STEFANIA_WORLD_SAVE';
/** Форматы, которые импорт тоже принимает (на случай переименований). */
export const LEGACY_FORMATS = ['STEFANIA_MINION_WORLD_SAVE', 'STEFANIA_NANABO_WORLD_SAVE'];
export const SAVE_FILE_NAME = 'STEFANIA_SAVE.json';
export const DB_NAME = 'stefania-world';
export const DB_VERSION = 1;
export const LS_MIRROR_KEY = 'stefania.save.mirror.v1';
export const MAX_BACKUPS = 30;
export const MAX_PROCESSED_EVENTS = 4000;
