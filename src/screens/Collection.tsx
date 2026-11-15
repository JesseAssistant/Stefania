import { useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { Bar, Btn, Chips, CurrencyBar, RarTag, Screen, Sheet } from '../ui/kit';
import { Nanabo } from '../art/Nanabo';
import { CHARACTERS, CHARACTER_MAP } from '../game/data/characters';
import { FOODS } from '../game/data/decor';
import { charXpToNext, MAX_CHAR_LEVEL, CHAR_LEVEL_PERKS } from '../game/data/economy';
import { effectiveStat } from '../game/engine/rewards';
import { RAR_NAME, STAT_ICON, STAT_NAME } from '../ui/icons';
import type { Rarity, StatId } from '../game/types';
import type { ScreenProps } from '../app/routes';
import { fireConfetti } from '../app/bus';

type Filter = 'all' | 'mine' | 'fav' | Rarity;
export function MinionsTab() {
  const g = useGame(); const nav = useNav();
  const [f, setF] = useState<Filter>('all');
  const mine = CHARACTERS.filter((c) => g.characters[c.id]?.unlocked).length;
  const list = CHARACTERS.filter((c) => f === 'all' ? true : f === 'mine' ? g.characters[c.id].unlocked : f === 'fav' ? g.player.favorites.characters.includes(c.id) : c.rarity === f);
  return (
    <Screen noBack tabs title={`Нанабо ${mine}/${CHARACTERS.length}`} right={<CurrencyBar only={['bananas']} />}>
      <Chips<Filter> value={f} onChange={setF} options={[{ id: 'all', label: 'Все' }, { id: 'mine', label: 'Мои' }, { id: 'fav', label: '⭐ Любимые' }, ...(['common', 'uncommon', 'rare', 'epic', 'legendary'] as Rarity[]).map((r) => ({ id: r as Filter, label: RAR_NAME[r] }))]} />
      <div className="grid g3">
        {list.map((c) => {
          const st = g.characters[c.id];
          return <button key={c.id} className={`tile rar-${c.rarity} ${st.unlocked ? '' : 'locked'} ${g.player.selectedCharacterId === c.id ? 'sel' : ''}`} onClick={() => nav.push('character', { id: c.id })} aria-label={st.unlocked ? c.name : 'Закрытый Нанабо'}>
            <div style={{ width: '88%', filter: st.unlocked ? undefined : 'brightness(0) opacity(.45)' }}><Nanabo look={c.look} equipped={st.equipped} animate={false} shadow={false} /></div>
            <div className="nm">{st.unlocked ? (st.nickname || c.name) : '???'}</div>
            {st.unlocked ? <span className="tiny muted">Ур. {st.level}</span> : <span className="tiny">🔒</span>}
            {g.player.favorites.characters.includes(c.id) && <span className="corner">⭐</span>}
            {g.player.partnerId === c.id && <span className="corner l">🤝</span>}
          </button>;
        })}
      </div>
      {list.length === 0 && <div className="center muted" style={{ padding: 30 }}>Здесь пока пусто.</div>}
    </Screen>
  );
}

export function CharacterScreen({ params }: ScreenProps) {
  const id = String(params.id);
  const { api, audio } = useApp(); const g = useGame(); const nav = useNav(); const act = useAct();
  const def = CHARACTER_MAP[id], st = g.characters[id];
  const [feed, setFeed] = useState(false); const [rename, setRename] = useState(false); const [name, setName] = useState(st?.nickname || '');
  const [story, setStory] = useState(false);
  if (!def || !st) return <Screen title="Нанабо"><div>Не найден</div></Screen>;
  const fav = g.player.favorites.characters.includes(id);
  const need = charXpToNext(st.level);
  return (
    <Screen title={st.unlocked ? (st.nickname || def.name) : 'Закрытый Нанабо'} right={st.unlocked ? <button className="icon-btn" aria-label="Любимый" onClick={() => act(() => api.toggleFavorite('characters', id), { sfx: 'pop' })}>{fav ? '⭐' : '☆'}</button> : undefined}>
      <div className="stack">
        <div className="stage" style={{ ['--sky1' as string]: '#E6F4FF', ['--sky2' as string]: '#FFF3C4', height: 280 } as never}>
          <div className="ground" />
          <button aria-label="Поговорить" style={{ position: 'absolute', left: '22%', width: '56%', bottom: 14, background: 'none', border: 0, padding: 0, filter: st.unlocked ? undefined : 'brightness(0) opacity(.4)' }} onClick={() => { if (st.unlocked) { api.emote(id); audio.sfx('pop'); } }}>
            <Nanabo look={def.look} equipped={st.equipped} emotion={st.unlocked ? st.emotion : 'happy'} title={def.name} />
          </button>
          <div style={{ position: 'absolute', left: 10, top: 10 }}><RarTag r={def.rarity} /></div>
        </div>
        <div className="center"><div className="big">{st.unlocked ? (st.nickname || def.name) : '???'}</div><div className="muted">{st.unlocked ? def.title : 'Как открыть?'}</div></div>
        {!st.unlocked && <div className="card tint center"><div className="bold">🔒 {def.unlockText}</div></div>}
        {st.unlocked && <>
          <div className="card stack">
            <div className="row between"><span className="bold">Уровень {st.level}{st.level >= MAX_CHAR_LEVEL ? ' (максимум)' : ''}</span><span className="small muted">{st.level >= MAX_CHAR_LEVEL ? '' : `${st.xp} / ${need} опыта`}</span></div>
            <Bar value={st.level >= MAX_CHAR_LEVEL ? 1 : st.xp} max={st.level >= MAX_CHAR_LEVEL ? 1 : need} tone="teal" />
            <div className="tiny faint">{CHAR_LEVEL_PERKS}</div>
          </div>
          <div className="card grid g2">
            {(['speed', 'brains', 'charm', 'luck'] as StatId[]).map((s) => <div key={s} className="row"><span className="emoji" style={{ fontSize: 22 }}>{STAT_ICON[s]}</span><div className="grow"><div className="small bold">{STAT_NAME[s]}</div><Bar value={effectiveStat(g, id, s)} max={20} tone="pink" /></div><span className="bold">{effectiveStat(g, id, s)}</span></div>)}
          </div>
          <div className="grid g2">
            <Btn onClick={() => act(() => api.selectCharacter(id), { ok: `${def.name} теперь на главной` })} disabled={g.player.selectedCharacterId === id}>{g.player.selectedCharacterId === id ? '✓ На главной' : 'На главную'}</Btn>
            <Btn color="teal" onClick={() => act(() => api.setPartner(id), { ok: 'Напарник выбран: бонус бананов в играх!' })} disabled={g.player.partnerId === id}>{g.player.partnerId === id ? '🤝 Напарник' : 'Сделать напарником'}</Btn>
            <Btn color="pink" onClick={() => { api.selectCharacter(id); nav.setTab('wardrobe'); nav.reset('tabs'); }}>👗 Одеть</Btn>
            <Btn ghost onClick={() => setFeed(true)}>🍽️ Накормить</Btn>
            <Btn ghost onClick={() => setRename(true)}>✏️ Прозвище</Btn>
            <Btn ghost onClick={() => setStory(true)}>📖 История</Btn>
          </div>
          {def.favoriteFood && <div className="small muted center">Любимое блюдо: {FOODS[def.favoriteFood]?.name} (больше опыта!)</div>}
        </>}
        <div className="card flat"><div className="small muted">{def.bio}</div></div>
      </div>
      {feed && <Sheet onClose={() => setFeed(false)} title="Чем угостим?">
        {Object.entries(g.inventory.food).filter(([, n]) => n > 0).length === 0 ? <div className="center stack" style={{ alignItems: 'center' }}><div className="emoji l">🍽️</div><div className="muted">Блюд нет. Приготовь что-нибудь на Кухне!</div><Btn onClick={() => { setFeed(false); nav.push('room', { id: 'kitchen' }); }}>На кухню</Btn></div> :
          <div className="stack">{Object.entries(g.inventory.food).filter(([, n]) => n > 0).map(([fid, n]) => <div key={fid} className="card row"><span className="emoji" style={{ color: FOODS[fid]?.color }}>🍽️</span><div className="grow"><div className="bold">{FOODS[fid]?.name}</div><div className="small muted">×{n} · +{FOODS[fid]?.xp} опыта{def.favoriteFood === fid ? ' (любимое!)' : ''}</div></div><Btn small onClick={() => { const r = act(() => api.feed(id, fid), { sfx: 'good' }); if (r.ok) { fireConfetti(); } }}>Дать</Btn></div>)}</div>}
      </Sheet>}
      {rename && <Sheet onClose={() => setRename(false)} title="Прозвище">
        <input className="field" maxLength={14} value={name} onChange={(e: { target: { value: string } }) => setName(e.target.value)} placeholder={def.name} aria-label="Прозвище" />
        <div className="grid g2" style={{ marginTop: 12 }}><Btn ghost onClick={() => { api.renameCharacter(id, ''); setRename(false); }}>Сбросить</Btn><Btn onClick={() => { api.renameCharacter(id, name); setRename(false); }}>Сохранить</Btn></div>
      </Sheet>}
      {story && <Sheet onClose={() => setStory(false)} title={`История: ${def.name}`}><div className="stack"><p style={{ margin: 0 }}>{def.story}</p><Btn block onClick={() => setStory(false)}>Закрыть</Btn></div></Sheet>}
    </Screen>
  );
}
