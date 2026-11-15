import type { Reward } from '../game/types';
import { ITEM_MAP } from '../game/data/items';
import { DECOR_MAP } from '../game/data/decor';
import { CHARACTER_MAP } from '../game/data/characters';
import { CHEST_ICON, MAT_ICON } from './icons';

/** Короткий список того, что входит в награду: для карточек «что я получу». */
export function rewardLabels(r: Reward): string[] {
  const out: string[] = [];
  if (r.bananas) out.push(`🍌 ${r.bananas}`); if (r.coins) out.push(`🪙 ${r.coins}`); if (r.crystals) out.push(`💎 ${r.crystals}`); if (r.xp) out.push(`✨ ${r.xp}`);
  for (const id of r.characters || []) out.push(`🌟 ${CHARACTER_MAP[id]?.name ?? 'друг'}`);
  for (const id of r.items || []) out.push(`👕 ${ITEM_MAP[id]?.name ?? id}`);
  for (const id of r.decor || []) out.push(`🪴 ${DECOR_MAP[id]?.name ?? id}`);
  if (r.cards?.length) out.push(`🃏 карточка`);
  for (const [t, n] of Object.entries(r.chests || {})) if (n) out.push(`${CHEST_ICON[t]} ×${n}`);
  for (const [m, n] of Object.entries(r.materials || {})) if (n) out.push(`${MAT_ICON[m]} ×${n}`);
  return out;
}
export function RewardChips({ r }: { r: Reward }) {
  const l = rewardLabels(r);
  if (!l.length) return null;
  return <span className="row wrap" style={{ gap: 4 }}>{l.map((x, i) => <span key={i} className="pill">{x}</span>)}</span>;
}
