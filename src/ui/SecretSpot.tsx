import { useApp, useGame, useAct } from '../app/ctx';
import { SECRET_MAP } from '../game/data/decor';
import { fireConfetti } from '../app/bus';

/** Скрытый предмет: мерцающая звёздочка в заданном месте экрана. Исчезает после находки; награда выдаётся один раз. */
export function SecretSpot({ id }: { id: string }) {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const def = SECRET_MAP[id];
  if (!def || g.collections.secrets[id]) return null;
  return <button aria-label="Что-то мерцает… Нажми, чтобы найти секрет" onClick={() => { const r = act(() => api.findSecret(id), { sfx: 'star' }); if (r.ok && r.value) fireConfetti(); }}
    style={{ position: 'absolute', left: `${def.x}%`, top: `${def.y}%`, width: 44, height: 44, transform: 'translate(-50%,-50%)', zIndex: 20, background: 'transparent', border: 0, fontSize: 26, cursor: 'pointer', padding: 0 }}><span style={{ display: 'inline-block', opacity: .6, animation: 'twinkle 2.4s ease-in-out infinite' }}>✨</span></button>;
}
