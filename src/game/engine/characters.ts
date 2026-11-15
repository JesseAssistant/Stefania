import { GameError } from '../types';
import type { Emotion, GameState } from '../types';
import type { Ctx } from './context';

const EMOTIONS: Emotion[] = ['happy', 'wink', 'surprised', 'love', 'excited', 'sleepy'];
export function selectCharacter(d: GameState, id: string): void {
  if (!d.characters[id]?.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  d.player.selectedCharacterId = id;
}
export function setPartner(d: GameState, id: string): void {
  if (!d.characters[id]?.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  d.player.partnerId = id;
}
export function emote(d: GameState, ctx: Ctx, id: string): Emotion {
  const c = d.characters[id];
  if (!c?.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  const i = EMOTIONS.indexOf(c.emotion);
  c.emotion = EMOTIONS[(i + 1 + Math.floor(ctx.rng() * 2)) % EMOTIONS.length];
  d.statistics.emotes++;
  ctx.emit({ type: 'emote' });
  return c.emotion;
}
export function renameCharacter(d: GameState, id: string, name: string): void {
  const c = d.characters[id];
  if (!c?.unlocked) throw new GameError('no_char', 'Этот Нанабо ещё не открыт');
  c.nickname = name.trim().slice(0, 14) || undefined;
}
