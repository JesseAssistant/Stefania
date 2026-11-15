import type { Layer } from '../game/types';
import type { WearFn } from './wearTypes';
import { OUTFITS, COSTUMES } from './wearOutfit';
import { HATS } from './wearHat';
import { GLASSES, ACCESSORIES, SHOES, JEWELRY } from './wearMisc';
import { EFFECTS } from './wearFx';

const BY_LAYER: Record<Layer, Record<string, WearFn>> = {
  outfit: OUTFITS, costume: COSTUMES, hat: HATS, glasses: GLASSES, accessory: ACCESSORIES, shoes: SHOES, jewelry: JEWELRY, effect: EFFECTS,
};
export function wearFn(layer: Layer, kind: string): WearFn | undefined { return BY_LAYER[layer]?.[kind]; }
export function allArtKinds(): Record<Layer, string[]> {
  const o = {} as Record<Layer, string[]>;
  for (const l of Object.keys(BY_LAYER) as Layer[]) o[l] = Object.keys(BY_LAYER[l]);
  return o;
}
/** Порядок отрисовки слоёв поверх тела (снизу вверх). */
export const DRAW_ORDER: Layer[] = ['shoes', 'outfit', 'costume', 'jewelry', 'accessory', 'glasses', 'hat', 'effect'];
