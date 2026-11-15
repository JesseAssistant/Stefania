import type { LevelGame } from '../game/types';

/** Итог мини-игры: success — победа, metric — число для звёзд (смысл зависит от игры, см. data/worlds.ts). */
export interface GameResult { success: boolean; metric: number; note?: string }
export type Cfg<K extends LevelGame['kind']> = Extract<LevelGame, { kind: K }>;
export interface GameProps<K extends LevelGame['kind']> { cfg: Cfg<K>; seed: number; onDone: (r: GameResult) => void }
export type PE = { clientX: number; clientY: number; currentTarget: { getBoundingClientRect(): { left: number; top: number; width: number; height: number } } };
