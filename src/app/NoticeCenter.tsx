import { useEffect, useState } from 'react';
import type { Notice } from '../game/types';
import { useApp } from './ctx';
import { Btn, Sheet } from '../ui/kit';
import { RewardView } from '../ui/RewardView';
import { ACHIEVEMENT_MAP } from '../game/data/quests';
import { CHARACTER_MAP } from '../game/data/characters';
import { Nanabo } from '../art/Nanabo';
import { PLAYER_LEVEL_PERKS } from '../game/data/economy';
import { fireConfetti, toast } from './bus';
import { achEmoji } from '../ui/icons';

/** Очередь всплывающих наград и событий: показываются по одному, ничего не теряется. */
export function NoticeCenter() {
  const { store, audio } = useApp();
  const [queue, setQueue] = useState<Notice[]>([]);
  useEffect(() => store.onNotice((n) => {
    if (n.type === 'toast') { toast(n.text, n.tone === 'bad' ? 'bad' : n.tone === 'good' ? 'good' : 'info'); return; }
    if (n.type === 'charlevel') { toast(`${CHARACTER_MAP[n.id]?.name} достиг уровня ${n.level}!`, 'good'); audio.sfx('star'); return; }
    if (n.type === 'saveError') return;
    setQueue((q) => [...q, n]);
  }), [store, audio]);
  const cur = queue[0];
  useEffect(() => {
    if (!cur) return;
    audio.sfx(cur.type === 'levelup' ? 'levelup' : cur.type === 'achievement' ? 'star' : cur.type === 'character' ? 'win' : 'coin');
    if (cur.type !== 'reward') fireConfetti();
  }, [cur, audio]);
  if (!cur) return null;
  const next = () => setQueue((q) => q.slice(1));
  if (cur.type === 'reward') return <Sheet mid onClose={next} title={cur.title}><RewardView r={cur.result} /><Btn block onClick={next} style={{ marginTop: 14 }}>Ура!</Btn></Sheet>;
  if (cur.type === 'levelup') return <Sheet mid onClose={next} title={`🎉 Уровень ${cur.level}!`}><RewardView r={cur.reward} />{PLAYER_LEVEL_PERKS[cur.level] && <div className="card flat small center" style={{ marginTop: 10 }}>🔓 {PLAYER_LEVEL_PERKS[cur.level]}</div>}<Btn block onClick={next} style={{ marginTop: 14 }}>Продолжить</Btn></Sheet>;
  if (cur.type === 'achievement') { const a = ACHIEVEMENT_MAP[cur.id]; return <Sheet mid onClose={next} title="Достижение!"><div className="center stack" style={{ alignItems: 'center' }}><div className="emoji l pop-in">{achEmoji(a?.icon || '')}</div><div className="big">{a?.name}</div><div className="muted">{a?.desc}</div></div><Btn block onClick={next} style={{ marginTop: 14 }}>Отлично!</Btn></Sheet>; }
  if (cur.type === 'character') { const c = CHARACTER_MAP[cur.id]; return <Sheet mid onClose={next} title="Новый друг!"><div className="center stack" style={{ alignItems: 'center' }}><div style={{ width: 170 }} className="pop-in"><Nanabo look={c.look} emotion="excited" /></div><div className="big">{c.name}</div><div className="muted">{c.title}</div></div><Btn block onClick={next} style={{ marginTop: 14 }}>Привет!</Btn></Sheet>; }
  return null;
}
