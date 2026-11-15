import { Hint } from '../ui/Hint';
import { useMemo, useState } from 'react';
import { useApp, useGame, useNow, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { useMusic } from '../app/useMusic';
import { Bar, Btn, CurrencyBar, Screen } from '../ui/kit';
import { Stage } from '../ui/Scene';
import { Nanabo } from '../art/Nanabo';
import { CHARACTER_MAP } from '../game/data/characters';
import { xpToNext } from '../game/data/economy';
import { basketStatus } from '../game/engine/base';
import { dailyStatus } from '../game/engine/daily';
import { claimableCount } from '../game/engine/quests';
import { DailySheet } from './Daily';
import { PLAYER_NAME } from '../config';
import { Banana } from '../ui/icons';

const SAYINGS: Record<string, string[]> = {
  happy: ['Привет, Stefania!', 'Какой чудесный день!', 'Пойдём искать бананы?'], wink: ['Я знаю секрет 😉', 'Тссс… никому!'], surprised: ['Ого!', 'Это что, банан?!'],
  love: ['Ты лучшая!', 'Обнимашки!'], sleepy: ['Хочу вздремнуть…', 'Зеваю…'], excited: ['Ура-ура!', 'Приключение ждёт!'], sad: ['Мне немножко грустно…', 'Поиграем?'],
};
function isIosBrowser() { const ua = navigator.userAgent; return /iPad|iPhone|iPod/.test(ua) && !(navigator as unknown as { standalone?: boolean }).standalone && !window.matchMedia('(display-mode: standalone)').matches; }

export function Home() {
  const { api, audio } = useApp(); const g = useGame(); const nav = useNav(); const now = useNow(3000); const act = useAct();
  useMusic('home');
  const [daily, setDaily] = useState(false);
  const [saying, setSaying] = useState(0);
  const ch = g.characters[g.player.selectedCharacterId], def = CHARACTER_MAP[g.player.selectedCharacterId];
  const partner = g.player.partnerId !== g.player.selectedCharacterId ? g.characters[g.player.partnerId] : null;
  const basket = basketStatus(g, now), ds = dailyStatus(g, now), quests = claimableCount(g);
  const lines = SAYINGS[ch.emotion] || SAYINGS.happy;
  const showInstall = useMemo(() => !g.player.installHintSeen && isIosBrowser(), [g.player.installHintSeen]);
  const need = xpToNext(g.player.level);
  return (
    <Screen noBack tabs title={<div className="row"><div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--banana)', display: 'grid', placeItems: 'center', fontWeight: 900, boxShadow: 'var(--shadow-s)' }} aria-label={`Уровень ${g.player.level}`}>{g.player.level}</div><div><div style={{ fontSize: 16 }}>{PLAYER_NAME}</div><div className="tiny faint">Уровень {g.player.level}</div></div></div>} right={<CurrencyBar />}>
      <div className="stack">
        <Hint id="home" text="Нажми на Нанабо, чтобы поболтать. «Играть» открывает карту приключений, а банановая корзина копит бананы, пока тебя нет." />
        <div><div className="row between tiny faint"><span>Опыт</span><span>{g.player.xp} / {need}</span></div><Bar value={g.player.xp} max={need} /></div>
        <Stage height={250}>
          <button aria-label={`Поговорить с ${def.name}`} style={{ position: 'absolute', left: partner ? '8%' : '25%', bottom: 14, width: partner ? '48%' : '50%', background: 'none', border: 0, padding: 0 }} onClick={() => { const e = api.emote(def.id); audio.sfx('pop'); setSaying((s) => s + 1); void e; }}>
            <Nanabo look={def.look} equipped={ch.equipped} emotion={ch.emotion} title={def.name} />
          </button>
          {partner && <button aria-label="Напарник" style={{ position: 'absolute', right: '6%', bottom: 14, width: '36%', background: 'none', border: 0, padding: 0 }} onClick={() => { api.emote(g.player.partnerId); audio.sfx('pop'); }}><Nanabo look={CHARACTER_MAP[g.player.partnerId].look} equipped={partner.equipped} emotion={partner.emotion} /></button>}
          <div className="pill" style={{ position: 'absolute', left: 10, top: 10, background: '#fff' }}>{ch.nickname || def.name}</div>
          <div key={saying} className="pop-in" style={{ position: 'absolute', right: 12, top: 12, background: '#fff', borderRadius: 16, padding: '6px 12px', fontWeight: 800, fontSize: 13, maxWidth: '55%', boxShadow: 'var(--shadow-s)' }}>{lines[saying % lines.length]}</div>
        </Stage>
        <Btn block xl color="pink" onClick={() => nav.push('map')}>▶ Играть</Btn>
        <div className="grid g2">
          <button className="menu-btn" onClick={() => ds.canClaim ? setDaily(true) : setDaily(true)} style={ds.canClaim ? { outline: '3px solid var(--banana)' } : undefined}><span className="emoji">🎁</span><span>Награда дня</span><span className="tiny muted">{ds.canClaim ? 'Можно забрать!' : `Серия: ${g.dailyRewards.streak}`}</span>{ds.canClaim && <span className="badge-dot">!</span>}</button>
          <button className="menu-btn" onClick={() => { const r = act(() => api.collectBasket(), { sfx: 'coin', ok: undefined }); void r; }}><span className="emoji"><Banana className="ic" /></span><span>Корзина</span><span className="tiny muted">{basket.amount} / {basket.cap}</span>{basket.amount >= 1 && <span className="badge-dot">{basket.amount}</span>}</button>
        </div>
        <div className="big-btn-grid">
          <button className="menu-btn" onClick={() => nav.push('quests')}><span className="emoji">📜</span>Задания{quests > 0 && <span className="badge-dot">{quests}</span>}</button>
          <button className="menu-btn" onClick={() => nav.push('arcade')}><span className="emoji">🎮</span>Мини-игры</button>
          <button className="menu-btn" onClick={() => nav.push('album')}><span className="emoji">📚</span>Коллекции</button>
          <button className="menu-btn" onClick={() => nav.push('photos')}><span className="emoji">📸</span>Фотоальбом</button>
          <button className="menu-btn" onClick={() => nav.push('chests')}><span className="emoji">🎁</span>Сундуки{(g.inventory.chests.common + g.inventory.chests.rare + g.inventory.chests.epic + g.inventory.chests.legendary) > 0 && <span className="badge-dot">{g.inventory.chests.common + g.inventory.chests.rare + g.inventory.chests.epic + g.inventory.chests.legendary}</span>}</button>
          <button className="menu-btn" onClick={() => nav.push('personal')}><span className="emoji">💖</span>Комната Stefania</button>
          <button className="menu-btn" onClick={() => nav.push('sandbox')}><span className="emoji">🧪</span>Свободная игра</button>
          <button className="menu-btn" onClick={() => nav.push('settings')}><span className="emoji">⚙️</span>Настройки</button>
        </div>
        {showInstall && <div className="card tint stack"><div className="bold">📲 Установи игру на iPhone</div><div className="small muted">В Safari нажми «Поделиться» <b>⬆️</b> → «На экран “Домой”». Тогда игра откроется как приложение и будет работать без интернета.</div><div className="row"><Btn small onClick={() => nav.push('install')}>Подробнее</Btn><Btn small ghost onClick={() => api.dismissInstall()}>Не сейчас</Btn></div></div>}
      </div>
      {daily && <DailySheet onClose={() => setDaily(false)} />}
    </Screen>
  );
}
