import { useState } from 'react';
import { useApp, useGame } from '../app/ctx';
import { useNav } from '../app/nav';
import { Btn } from '../ui/kit';
import { Nanabo } from '../art/Nanabo';
import { CHARACTER_MAP } from '../game/data/characters';
import { Stage } from '../ui/Scene';
import { PLAYER_NAME } from '../config';
import { fireConfetti } from '../app/bus';
import type { ScreenProps } from '../app/routes';

/** Знакомство: приветствие по имени (всегда «Stefania»), короткое обучение с первым действием. */
export function Welcome(_: ScreenProps) {
  const { api, audio } = useApp();
  const nav = useNav();
  const g = useGame();
  const [step, setStep] = useState(0);
  const [tapped, setTapped] = useState(false);
  const pip = CHARACTER_MAP.pip, mochi = CHARACTER_MAP.mochi;
  const finish = () => { api.welcome(); api.finishTutorial(); nav.reset('tabs'); };
  const go = () => { audio.unlock(); audio.sfx('pop'); setStep((s) => s + 1); };
  const emo = g.characters.pip.emotion;
  return (
    <div className="stack" style={{ flex: 1, padding: 'calc(var(--sat) + 18px) 18px calc(var(--sab) + 18px)', justifyContent: 'space-between', background: 'linear-gradient(180deg,#FFF3C4,#FFF8E7 60%)' }}>
      <div className="row between"><span className="faint small">{step + 1} / 4</span>{step < 3 && <button className="chip" onClick={finish}>Пропустить</button>}</div>
      <div className="stack" style={{ alignItems: 'center', gap: 14 }}>
        {step === 0 && <>
          <h1 className="center" style={{ fontSize: 34, margin: 0 }}>Welcome,<br /><span style={{ color: 'var(--pink-d)' }}>{PLAYER_NAME}!</span></h1>
          <div style={{ width: 210 }} className="pop-in"><Nanabo look={pip.look} emotion="excited" /></div>
          <p className="center muted" style={{ maxWidth: 300 }}>Это твой личный мир Нанабо: база, друзья, наряды и приключения. Я — Pip, и я так долго тебя ждал!</p>
        </>}
        {step === 1 && <>
          <h2 className="big center">Твоя база и друзья</h2>
          <Stage height={190} style={{ width: '100%' }}><div style={{ position: 'absolute', left: '12%', bottom: 10, width: 120 }}><Nanabo look={pip.look} emotion="happy" /></div><div style={{ position: 'absolute', right: '12%', bottom: 10, width: 100 }}><Nanabo look={mochi.look} emotion="love" /></div></Stage>
          <p className="center muted" style={{ maxWidth: 320 }}>На базе десять комнат. Сначала открыты не все — они появятся, когда ты подрастёшь. А Нанабо будут присоединяться к тебе за победы и находки.</p>
        </>}
        {step === 2 && <>
          <h2 className="big center">Что тебя ждёт</h2>
          <div className="stack" style={{ width: '100%' }}>
            {[['🍌', 'Собирай бананы', 'играй в мини-игры и проходи уровни в 5 мирах'], ['👗', 'Наряжай друзей', 'почти сотня вещей, наборы, фото и образы'], ['🏠', 'Строй базу', 'лаборатория, кухня, спортзал и тайные комнаты']].map(([e, t, d]) => <div key={t} className="card row"><span className="emoji">{e}</span><div><div className="bold">{t}</div><div className="small muted">{d}</div></div></div>)}
          </div>
        </>}
        {step === 3 && <>
          <h2 className="big center">Попробуй сама!</h2>
          <button aria-label="Погладить Pip" style={{ width: 200, background: 'none', border: 0, padding: 0 }} onClick={() => { api.emote('pip'); audio.sfx('pop'); setTapped(true); fireConfetti(); }}><Nanabo look={pip.look} emotion={tapped ? emo : 'happy'} /></button>
          <p className="center muted">{tapped ? 'Ура! Pip в восторге. Так ты можешь болтать со всеми Нанабо.' : 'Нажми на Pip — он любит внимание.'}</p>
        </>}
      </div>
      <div className="stack">{step < 3 ? <Btn block xl onClick={go}>{step === 0 ? 'Начать' : 'Дальше'}</Btn> : <Btn block xl color="pink" disabled={!tapped} onClick={finish}>В путь!</Btn>}</div>
    </div>
  );
}
