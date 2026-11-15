import { useRef, useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { newRunId } from '../app/runid';
import { fireConfetti } from '../app/bus';
import { Btn, Screen } from '../ui/kit';
import { RewardView } from '../ui/RewardView';
import { CHEST_ICON, CHEST_NAME } from '../ui/icons';
import { CostView } from '../ui/kit';
import { CHESTS } from '../game/data/economy';
import type { ChestTier, RewardResult } from '../game/types';
import type { ScreenProps } from '../app/routes';

type Phase = 'closed' | 'shaking' | 'open';
/** Открытие сундука. openId создаётся один раз на «подход» и защищает от двойного открытия при повторном нажатии. */
export function ChestScreen({ params }: ScreenProps) {
  const g = useGame(); const { api, audio } = useApp(); const act = useAct(); const nav = useNav();
  const [tier, setTier] = useState<ChestTier>((params.tier as ChestTier) || 'common');
  const [phase, setPhase] = useState<Phase>('closed');
  const [res, setRes] = useState<RewardResult | null>(null);
  const openId = useRef<string>(newRunId('chest'));
  const def = CHESTS[tier]; const have = g.inventory.chests[tier];
  const open = () => {
    if (phase !== 'closed') return;
    const r = act(() => api.openChest(tier, openId.current), { quiet: true });
    if (!r.ok) return;
    setPhase('shaking'); audio.sfx('chest');
    setTimeout(() => { setRes(r.value); setPhase('open'); fireConfetti(); audio.sfx('win'); }, 900);
  };
  const again = () => { openId.current = newRunId('chest'); setRes(null); setPhase('closed'); };
  return (
    <Screen title="🎁 Сундуки" bg={def.color + '55'}>
      <div className="stack center" style={{ alignItems: 'center' }}>
        <div className="row" style={{ gap: 8 }}>{(Object.keys(CHESTS) as ChestTier[]).map((t) => <button key={t} className={`chip ${t === tier ? 'on' : ''}`} disabled={phase === 'shaking'} onClick={() => { setTier(t); again(); }}>{CHEST_ICON[t]} {g.inventory.chests[t]}</button>)}</div>
        <div className="bold" style={{ fontSize: 20 }}>{CHEST_NAME[tier]}</div>
        {phase !== 'open' && <div className={phase === 'shaking' ? 'shake' : 'art-bob'} style={{ fontSize: 120, lineHeight: 1, filter: `drop-shadow(0 8px 0 ${def.color}55)` }} aria-hidden="true">{phase === 'shaking' ? '🎁' : CHEST_ICON[tier]}</div>}
        {phase === 'open' && res && <div className="card stack" style={{ width: '100%' }}><RewardView r={res} /></div>}
        <div className="small muted">В сундуке {def.rolls} награды{def.pityAt ? ` · гарантированная редкость раз в ${def.pityAt} сундуков` : ''}</div>
        {phase === 'closed' && (have > 0
          ? <Btn block xl onClick={open}>Открыть ({have})</Btn>
          : <div className="stack" style={{ width: '100%' }}><div className="muted">Сундуков этого вида нет.</div><Btn block onClick={() => { act(() => api.buyChest(tier), { sfx: 'buy' }); }}>Купить за <CostView cost={def.price} /></Btn></div>)}
        {phase === 'open' && <div className="stack" style={{ width: '100%' }}>{have > 0 && <Btn block onClick={again}>Открыть ещё ({have})</Btn>}<Btn block ghost onClick={() => nav.pop()}>Готово</Btn></div>}
      </div>
    </Screen>
  );
}
