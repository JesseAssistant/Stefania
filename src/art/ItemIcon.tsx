import type { ItemDef } from '../game/types';
import { Nanabo, layerView } from './Nanabo';
import type { CharacterLook } from '../game/types';

/** Манекен для превью предметов в магазине и шкафу. */
export const MANNEQUIN: CharacterLook = { body: '#E7ECF3', belly: '#F7F9FC', cheek: '#FFC9D6', build: 'round', feature: 'none', featureColor: '#B8C2D1', eyes: 'big', pattern: 'none' };

export function ItemIcon({ item, className }: { item: ItemDef; className?: string }) {
  return <Nanabo look={MANNEQUIN} equipped={{ [item.layer]: item.id }} view={layerView(item.layer)} animate={false} shadow={false} className={className} title={item.name} />;
}
