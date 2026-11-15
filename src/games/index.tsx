import type { LevelGame } from '../game/types';
import type { GameResult } from './types';
import { BananaCatcher } from './BananaCatcher';
import { Memory } from './Memory';
import { Kitchen } from './Kitchen';
import { LabPuzzle } from './LabPuzzle';
import { Treasure } from './Treasure';
import { Sorting } from './Sorting';
import { Reaction } from './Reaction';
import { OutfitChallenge } from './OutfitChallenge';

export type { GameResult } from './types';
/** Запускает одиночную мини-игру по её конфигурации. Серия испытаний (gauntlet) собирается выше, из таких игр. */
export function GameView({ game, seed, onDone }: { game: Exclude<LevelGame, { kind: 'task' } | { kind: 'gauntlet' }>; seed: number; onDone: (r: GameResult) => void }) {
  switch (game.kind) {
    case 'banana-catcher': return <BananaCatcher cfg={game} seed={seed} onDone={onDone} />;
    case 'memory': return <Memory cfg={game} seed={seed} onDone={onDone} />;
    case 'kitchen': return <Kitchen cfg={game} seed={seed} onDone={onDone} />;
    case 'lab-puzzle': return <LabPuzzle cfg={game} seed={seed} onDone={onDone} />;
    case 'treasure-hunt': return <Treasure cfg={game} seed={seed} onDone={onDone} />;
    case 'sorting': return <Sorting cfg={game} seed={seed} onDone={onDone} />;
    case 'reaction': return <Reaction cfg={game} seed={seed} onDone={onDone} />;
    case 'outfit-challenge': return <OutfitChallenge cfg={game} seed={seed} onDone={onDone} />;
  }
}
