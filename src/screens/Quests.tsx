import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { Bar, Btn, Chips, Empty, Screen } from '../ui/kit';
import { RewardChips } from '../ui/RewardChips';
import { achEmoji } from '../ui/icons';
import { ACHIEVEMENTS, CHALLENGES, QUEST_MAP, SECRET_QUESTS, STORY_QUESTS } from '../game/data/quests';
import { achievementProgress } from '../game/engine/achievements';
import { progressOf, requiresMet } from '../game/engine/quests';
import { fireConfetti } from '../app/bus';
import type { QuestDef } from '../game/types';

type Tab = 'daily' | 'weekly' | 'story' | 'challenge' | 'secret' | 'ach';
export function QuestsScreen() {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const [tab, setTab] = useState<Tab>('daily');
  const claimable = (defs: QuestDef[]) => defs.filter((d) => { const p = progressOf(g, d); return p.done && !p.claimed; }).length;
  const daily = g.quests.daily.ids.map((i) => QUEST_MAP[i]).filter(Boolean);
  const weekly = g.quests.weekly.ids.map((i) => QUEST_MAP[i]).filter(Boolean);
  const secret = SECRET_QUESTS.filter((d) => g.quests.secret[d.id]?.revealed);
  const lists: Record<Exclude<Tab, 'ach'>, QuestDef[]> = { daily, weekly, story: STORY_QUESTS.filter((d) => requiresMet(g, d.requires)), challenge: CHALLENGES.filter((d) => requiresMet(g, d.requires)), secret };
  const badge = (t: Exclude<Tab, 'ach'>) => { const n = claimable(lists[t]); return n ? ` (${n})` : ''; };
  const ach = ACHIEVEMENTS.filter((a) => !a.hidden || g.achievements[a.id]);
  return (
    <Screen title="📜 Задания">
      <Chips<Tab> value={tab} onChange={setTab} options={[{ id: 'daily', label: `Сегодня${badge('daily')}` }, { id: 'weekly', label: `Неделя${badge('weekly')}` }, { id: 'story', label: `Сюжет${badge('story')}` }, { id: 'challenge', label: `Вызовы${badge('challenge')}` }, { id: 'secret', label: `Секреты${badge('secret')}` }, { id: 'ach', label: `🏆 ${Object.keys(g.achievements).length}/${ACHIEVEMENTS.length}` }]} />
      {tab !== 'ach' ? (
        <div className="stack">
          {tab === 'daily' && <div className="small muted center">Задания обновляются каждый день. Выполнено наград сегодня: {g.quests.claimedToday.n}</div>}
          {lists[tab].length === 0 && <Empty icon={tab === 'secret' ? '🕵️' : '📜'} text={tab === 'secret' ? 'Секретные задания появятся, когда ты найдёшь первые секреты. Ищи мерцающие ✨ на базе и картах.' : 'Здесь пока пусто.'} />}
          {lists[tab].map((d) => { const p = progressOf(g, d); return (
            <div key={d.id} className="card stack" style={{ opacity: p.claimed ? .55 : 1 }}>
              <div className="row between"><div className="bold">{d.title}</div>{p.claimed && <span>✅</span>}</div>
              <div className="small muted">{d.desc}</div>
              <div className="row" style={{ gap: 8 }}><div style={{ flex: 1 }}><Bar value={p.value} max={d.target} tone="teal" /></div><span className="small bold">{p.value}/{d.target}</span></div>
              <div className="row between wrap" style={{ gap: 8 }}><RewardChips r={d.reward} />
                {!p.claimed && <Btn small disabled={!p.done} onClick={() => { const r = act(() => api.claimQuest(d.id), { quiet: true }); if (r.ok) fireConfetti(); }}>{p.done ? 'Забрать' : 'В процессе'}</Btn>}</div>
            </div>); })}
        </div>
      ) : (
        <div className="stack">
          {ach.map((a) => { const got = g.achievements[a.id]; const pr = achievementProgress(g, a.id); return (
            <div key={a.id} className="card row" style={{ gap: 12, opacity: got ? 1 : .8 }}>
              <div className="emoji l" style={{ filter: got ? undefined : 'grayscale(1) opacity(.5)' }}>{achEmoji(a.icon)}</div>
              <div style={{ flex: 1 }}><div className="bold">{a.name}{a.rare ? ' 💎' : ''}</div><div className="small muted">{a.desc}</div>
                {got ? <div className="tiny" style={{ color: 'var(--green)' }}>Получено {new Date(got.at).toLocaleDateString('ru-RU')}</div> : <div className="row" style={{ gap: 6 }}><div style={{ flex: 1 }}><Bar value={pr.value} max={pr.target} /></div><span className="tiny">{pr.value}/{pr.target}</span></div>}</div>
            </div>); })}
          <div className="tiny muted center">Есть и скрытые достижения — они покажутся, когда ты их получишь.</div>
        </div>
      )}
    </Screen>
  );
}
