import { useApp, useGame, useNow, useAct } from '../app/ctx';
import { Btn, Sheet } from '../ui/kit';
import { dailyStatus } from '../game/engine/daily';
import { DAILY_CYCLE, dailyReward } from '../game/data/economy';
import type { Reward } from '../game/types';
import { fireConfetti } from '../app/bus';

function rewardChips(r: Reward) {
  const out: string[] = [];
  if (r.bananas) out.push(`🍌${r.bananas}`); if (r.coins) out.push(`🪙${r.coins}`); if (r.crystals) out.push(`💎${r.crystals}`);
  if (r.chests) for (const [t, n] of Object.entries(r.chests)) if (n) out.push(t === 'common' ? '📦' : t === 'rare' ? '🎁' : t === 'epic' ? '💎📦' : '👑');
  if (r.characters?.length) out.push('🌟');
  return out;
}
export function DailySheet({ onClose }: { onClose: () => void }) {
  const { api } = useApp(); const g = useGame(); const now = useNow(5000); const act = useAct();
  const st = dailyStatus(g, now);
  const streak = g.dailyRewards.streak;
  const done = st.canClaim ? (streak % 7) : (streak % 7 || (streak ? 7 : 0));
  return (
    <Sheet onClose={onClose} title="Ежедневная награда">
      <div className="center small muted" style={{ marginBottom: 8 }}>Серия: <b>{streak}</b> {streak === 1 ? 'день' : 'дн.'} подряд. Можно пропустить один день — серия не сгорит.</div>
      <div className="grid g4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {DAILY_CYCLE.map((_, i) => {
          const day = i + 1, r = dailyReward(day, st.canClaim ? st.cycle : Math.floor(Math.max(0, streak - 1) / 7));
          const claimed = day <= done && !(st.canClaim && day === st.nextDay), isNext = st.canClaim && day === st.nextDay;
          return <div key={day} className="tile" style={{ opacity: claimed ? .55 : 1, outline: isNext ? '4px solid var(--banana)' : undefined, borderColor: day === 7 ? 'var(--r-legendary)' : undefined, gridColumn: day === 7 ? 'span 2' : undefined }}>
            <div className="tiny faint">День {day}</div><div className="small bold">{rewardChips(r).join(' ')}</div>{claimed && <div className="corner">✅</div>}{day === 7 && <div className="tiny">+ друг!</div>}
          </div>;
        })}
      </div>
      <Btn block xl style={{ marginTop: 14 }} disabled={!st.canClaim} onClick={() => { const res = act(() => api.claimDaily(), { sfx: 'win' }); if (res.ok) { fireConfetti(); onClose(); } }}>{st.canClaim ? 'Забрать награду' : 'Приходи завтра!'}</Btn>
      {!st.canClaim && st.reason && <div className="center small muted" style={{ marginTop: 8 }}>{st.reason}</div>}
    </Sheet>
  );
}
