import { useState } from 'react';
import { useApp, useGame, useAct, useNow } from '../app/ctx';
import { useNav } from '../app/nav';
import { useMusic } from '../app/useMusic';
import { Bar, Btn, CostView, Empty, Screen, Sheet } from '../ui/kit';
import { CurIcon, MAT_ICON, MAT_NAME, ROOM_EMOJI, STAT_ICON, STAT_NAME, Banana } from '../ui/icons';
import { ROOM_MAP, roomFx } from '../game/data/rooms';
import { CHARACTERS, CHARACTER_MAP } from '../game/data/characters';
import { CRAFTS, DECOR, DECOR_MAP, FOODS, RECIPES, RESEARCH } from '../game/data/decor';
import { Nanabo } from '../art/Nanabo';
import { DecorArt } from '../art/DecorArt';
import { availableDecor, basketStatus, bedCount, craftCost, decorSlotCount, restStatus, researchLeft, roomComfort, secretRoomStatus, skipCost, trainCooldownLeft, trainCost, upgradeCost } from '../game/engine/base';
import { fireConfetti } from '../app/bus';
import { fmt, fmtDuration } from '../game/util';
import { MATERIALS } from '../game/types';
import type { RoomId, StatId } from '../game/types';
import type { ScreenProps } from '../app/routes';
import { RewardView } from '../ui/RewardView';
import { SecretSpot } from '../ui/SecretSpot';
import { Hint } from '../ui/Hint';

export function RoomScreen({ params }: ScreenProps) {
  const id = params.id as RoomId;
  const def = ROOM_MAP[id];
  const g = useGame(); const { api } = useApp(); const act = useAct(); const nav = useNav();
  useMusic('base');
  const st = g.base.rooms[id];
  const [decorSlot, setDecorSlot] = useState<number | null>(null);
  if (!def) return <Screen title="Комната"><Empty text="Такой комнаты нет." /></Screen>;
  const reqOk = g.player.level >= def.unlock.playerLevel && (!def.unlock.secrets || Object.keys(g.collections.secrets).length >= def.unlock.secrets);
  const up = upgradeCost(g, id);

  if (!st.unlocked) {
    return (
      <Screen title={`${ROOM_EMOJI[id]} ${def.name}`} bg={def.color + '55'}>
        <div className="stack">
          <div className="card center stack" style={{ alignItems: 'center' }}>
            <div className="emoji xl">🔒</div>
            <div className="bold">{def.name}</div>
            <div className="muted">{def.desc}</div>
            <div className="small muted">Нужен уровень Stefania: {def.unlock.playerLevel}{def.unlock.secrets ? ` и секретов: ${def.unlock.secrets} (найдено ${Object.keys(g.collections.secrets).length})` : ''}</div>
            <Btn disabled={!reqOk} onClick={() => { const r = act(() => api.unlockRoom(id), { sfx: 'levelup' }); if (r.ok) fireConfetti(); }}>Открыть за <CostView cost={def.unlock.cost} /></Btn>
          </div>
          <div className="card"><div className="bold">Что даст комната</div><ul className="small" style={{ paddingLeft: 18, margin: '6px 0 0' }}>{def.perks.map((p, i) => <li key={i}>Уровень {i + 1}: {p}</li>)}</ul></div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title={`${ROOM_EMOJI[id]} ${def.name}`} bg={def.color + '55'}>
      <div className="stack">
        <Hint id="room" text="Улучшай комнаты и расставляй декорации — чем уютнее база, тем больше бананов копится в корзине." />
        <div className="card tint stack" style={{ borderLeft: `6px solid ${def.color}` }}>
          <div className="row between"><div><div className="bold">Уровень {st.level} из {def.maxLevel}</div><div className="small muted">{def.perks[st.level - 1]}</div></div>
            <span className="pill">Уют {roomComfort(g, id)}</span></div>
          <Bar value={st.level} max={def.maxLevel} />
          {up ? <Btn block onClick={() => { const r = act(() => api.upgradeRoom(id), { sfx: 'levelup' }); if (r.ok) fireConfetti(); }}>Улучшить до {st.level + 1}: <CostView cost={up} /></Btn> : <div className="center bold" style={{ color: 'var(--green)' }}>Максимальный уровень ✨</div>}
          {st.level < def.maxLevel && <div className="tiny muted">Дальше: {def.perks[st.level]}</div>}
        </div>

        {id === 'hall' && <HallPanel />}
        {id === 'bedroom' && <BedroomPanel />}
        {id === 'kitchen' && <KitchenPanel />}
        {id === 'lab' && <LabPanel />}
        {id === 'gym' && <GymPanel />}
        {id === 'workshop' && <WorkshopPanel />}
        {id === 'secret' && <SecretPanel />}
        {id === 'playroom' && <div className="card stack"><div className="bold">Аркада</div><div className="small muted">Мини-игры без привязки к уровням. Бонус бананов: +{Math.round(roomFx.arcadeBonus(st.level) * 100)}%.</div><Btn block color="teal" onClick={() => nav.push('arcade')}>🎮 Играть в аркаде</Btn></div>}
        {id === 'wardrobe' && <div className="card stack"><div className="small muted">Слотов для комплектов: {roomFx.outfitSlots(st.level)}. Скидка в магазине: {Math.round(roomFx.shopDiscount(st.level) * 100)}%.</div><Btn block color="pink" onClick={() => { nav.popTo('tabs'); nav.setTab('wardrobe'); }}>👗 Открыть гардероб</Btn></div>}
        {id === 'lounge' && <div className="card stack"><div className="small muted">Альбом на {roomFx.photoSlots(st.level)} фото ({g.outfits.photos.length} занято). Бонус к корзине: +{Math.max(0, (st.level - 1) * 10)}%.</div><Btn block color="blue" onClick={() => nav.push('photos')}>📸 Фотоальбом</Btn></div>}

        <div className="card stack">
          <div className="row between"><div className="bold">Декорации</div><span className="small muted">{st.decor.filter(Boolean).length}/{decorSlotCount(g, id)}</span></div>
          <div className="grid g3">
            {st.decor.map((d, i) => (
              <button key={i} className="tile" style={{ minHeight: 84 }} onClick={() => setDecorSlot(i)} aria-label={d ? `Слот ${i + 1}: ${DECOR_MAP[d].name}` : `Пустой слот ${i + 1}`}>
                {d ? <><div style={{ width: 52, height: 52 }}><DecorArt d={DECOR_MAP[d]} /></div><div className="nm">{DECOR_MAP[d].name}</div></> : <><div className="emoji">➕</div><div className="tiny muted">Пусто</div></>}
              </button>
            ))}
          </div>
        </div>
      </div>
      {(id === 'hall' || id === 'kitchen' || id === 'lab' || id === 'lounge') && <SecretSpot id={`sec-${id}`} />}
      {decorSlot !== null && <DecorPicker room={id} slot={decorSlot} onClose={() => setDecorSlot(null)} />}
    </Screen>
  );
}

export function DecorPicker({ room, slot, onClose }: { room: RoomId | 'personal'; slot: number; onClose: () => void }) {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const nav = useNav();
  const cur = room === 'personal' ? g.base.personalRoom.decor[slot] : g.base.rooms[room].decor[slot];
  const have = DECOR.filter((d) => (g.inventory.decor[d.id] || 0) > 0);
  return (
    <Sheet onClose={onClose} title={cur ? `Слот ${slot + 1}: ${DECOR_MAP[cur].name}` : `Слот ${slot + 1}`}>
      <div className="stack">
        {cur && <Btn block ghost onClick={() => { act(() => api.removeDecor(room, slot), { sfx: 'whoosh' }); onClose(); }}>Убрать в хранилище</Btn>}
        {have.length === 0 ? <Empty icon="🪴" text="Декораций пока нет. Их можно купить в магазине, найти в сундуках или создать в мастерской." action={<Btn onClick={() => { onClose(); nav.popTo('tabs'); nav.setTab('shop');; }}>В магазин</Btn>} /> : (
          <div className="grid g3">{have.map((d) => { const free = availableDecor(g, d.id) + (cur === d.id ? 1 : 0); return (
            <button key={d.id} className={`tile rar-${d.rarity}`} disabled={free <= 0 && cur !== d.id} style={{ opacity: free > 0 ? 1 : .45 }} onClick={() => { const r = act(() => api.placeDecor(room, slot, d.id), { sfx: 'equip' }); if (r.ok) onClose(); }}>
              <div style={{ width: 52, height: 52 }}><DecorArt d={d} /></div><div className="nm">{d.name}</div><div className="tiny muted">Уют +{d.comfort} · ×{Math.max(0, availableDecor(g, d.id))}</div>
            </button>); })}</div>
        )}
      </div>
    </Sheet>
  );
}

function HallPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const now = useNow(1000);
  const b = basketStatus(g, now);
  return (
    <div className="card stack">
      <div className="row between"><div className="bold">🧺 Банановая корзина</div><span className="pill"><Banana /> {b.amount}/{b.cap}</span></div>
      <Bar value={b.amount} max={b.cap} tone="teal" />
      <div className="small muted">+{b.rate} бананов в час. {b.full ? 'Корзина полна — забери награду!' : `До полной корзины: ${fmtDuration(b.secondsToFull)}`}</div>
      <Btn block disabled={b.amount < 1} onClick={() => act(() => api.collectBasket(), { sfx: 'coin' })}>Забрать {b.amount} <Banana /></Btn>
    </div>
  );
}

function BedroomPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const now = useNow(2000);
  const [bed, setBed] = useState<number | null>(null);
  const rest = restStatus(g, now);
  const n = bedCount(g);
  const occ = g.base.rooms.bedroom.occupants;
  return (
    <div className="card stack">
      <div className="bold">🛏️ Кровати ({occ.filter(Boolean).length}/{n})</div>
      <div className="small muted">Спящие Нанабо копят опыт: {rest.perHour} в час каждому, максимум за 8 часов.</div>
      <div className="grid g3">
        {Array.from({ length: n }, (_, i) => { const cid = occ[i]; return (
          <button key={i} className="tile" onClick={() => setBed(i)} aria-label={cid ? `Кровать ${i + 1}: ${CHARACTER_MAP[cid].name}` : `Пустая кровать ${i + 1}`}>
            {cid ? <><div style={{ width: 64 }}><Nanabo look={CHARACTER_MAP[cid].look} equipped={g.characters[cid].equipped} emotion="sleepy" animate={false} shadow={false} /></div><div className="nm">{CHARACTER_MAP[cid].name}</div></> : <><div className="emoji l">🛏️</div><div className="tiny muted">Свободно</div></>}
          </button>); })}
      </div>
      <Btn block disabled={rest.total < 1} onClick={() => { const r = act(() => api.collectRest(), { sfx: 'star' }); if (r.ok) toastXp(r.value); }}>Разбудить и забрать +{rest.total} опыта</Btn>
      {bed !== null && (
        <Sheet onClose={() => setBed(null)} title={`Кровать ${bed + 1}`}>
          <div className="stack">
            {occ[bed] && <Btn block ghost onClick={() => { act(() => api.assignBed(bed, null), { sfx: 'whoosh' }); setBed(null); }}>Освободить кровать</Btn>}
            <div className="grid g3">{CHARACTERS.filter((c) => g.characters[c.id].unlocked).map((c) => (
              <button key={c.id} className="tile" onClick={() => { act(() => api.assignBed(bed, c.id), { sfx: 'equip' }); setBed(null); }}>
                <div style={{ width: 60 }}><Nanabo look={c.look} equipped={g.characters[c.id].equipped} animate={false} shadow={false} /></div><div className="nm">{g.characters[c.id].nickname || c.name}</div>
              </button>))}</div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
function toastXp(_: number) { /* опыт показывает центр уведомлений */ }

function KitchenPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const nav = useNav();
  const lvl = roomFx.recipeLevel(g.base.rooms.kitchen.level);
  const [feed, setFeed] = useState(false);
  const foods = Object.entries(g.inventory.food).filter(([, n]) => n > 0);
  return (
    <>
      <div className="card stack">
        <div className="row between"><div className="bold">🍳 Рецепты</div><span className="small muted">Навык повара: {g.base.kitchen.skill}</span></div>
        {RECIPES.map((r) => { const locked = r.level > lvl; return (
          <div key={r.id} className="row between" style={{ opacity: locked ? .5 : 1, gap: 8 }}>
            <div style={{ flex: 1 }}><div className="bold">{r.name}</div><div className="tiny muted">{locked ? `🔒 Кухня ${r.level} уровня` : `${r.desc} · приготовлено: ${g.base.kitchen.cooked[r.id] || 0}`}</div></div>
            <Btn small disabled={locked} onClick={() => { if (act(() => api.startCook(r.id), { quiet: true }).ok) nav.push('cook', { id: r.id }); }}><CostView cost={r.cost} /></Btn>
          </div>); })}
      </div>
      <div className="card stack">
        <div className="row between"><div className="bold">🍽️ Блюда</div>{foods.length > 0 && <Btn small color="pink" onClick={() => setFeed(true)}>Угостить</Btn>}</div>
        {foods.length === 0 ? <div className="small muted">Приготовь блюдо — оно появится здесь.</div> : <div className="row wrap">{foods.map(([f, n]) => <span key={f} className="pill">🍽️ {FOODS[f]?.name} ×{n}</span>)}</div>}
      </div>
      {feed && <FeedSheet onClose={() => setFeed(false)} />}
    </>
  );
}
function FeedSheet({ onClose }: { onClose: () => void }) {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const [food, setFood] = useState<string | null>(null);
  const foods = Object.entries(g.inventory.food).filter(([, n]) => n > 0);
  const cur = food && g.inventory.food[food] > 0 ? food : foods[0]?.[0] || null;
  return (
    <Sheet onClose={onClose} title="Кого угостить?">
      <div className="stack">
        <div className="row wrap">{foods.map(([f, n]) => <button key={f} className={`chip ${f === cur ? 'on' : ''}`} onClick={() => setFood(f)}>{FOODS[f]?.name} ×{n}</button>)}</div>
        {!cur ? <Empty icon="🍽️" text="Блюда закончились." /> : <div className="grid g3">{CHARACTERS.filter((c) => g.characters[c.id].unlocked).map((c) => (
          <button key={c.id} className="tile" onClick={() => act(() => api.feed(c.id, cur), { sfx: 'good' })}>
            <div style={{ width: 60 }}><Nanabo look={c.look} equipped={g.characters[c.id].equipped} animate={false} shadow={false} emotion={c.favoriteFood === cur ? 'love' : 'happy'} /></div>
            <div className="nm">{g.characters[c.id].nickname || c.name}</div>{c.favoriteFood === cur && <div className="tiny" style={{ color: 'var(--pink-d)' }}>любимое!</div>}
          </button>))}</div>}
        <Btn block ghost onClick={onClose}>Готово</Btn>
      </div>
    </Sheet>
  );
}

function LabPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const now = useNow(1000);
  const [res, setRes] = useState<ReturnType<typeof api.collectResearch> | null>(null);
  const lab = g.base.rooms.lab; const lvl = roomFx.researchLevel(lab.level); const slots = roomFx.labQueue(lab.level);
  return (
    <>
      <div className="card stack">
        <div className="row between"><div className="bold">🧪 Исследования</div><span className="small muted">Места: {g.base.lab.queue.length}/{slots}</span></div>
        {g.base.lab.queue.map((j) => { const def = RESEARCH.find((r) => r.id === j.researchId)!; const left = researchLeft(j, now); const total = Math.max(1, Math.round(def.seconds * roomFx.labSpeed(lab.level))); return (
          <div key={j.id} className="card tint stack">
            <div className="row between"><div className="bold">{def.name}</div><span className="small">{left > 0 ? fmtDuration(left) : 'Готово!'}</span></div>
            <Bar value={total - left} max={total} tone="teal" />
            {left > 0 ? <Btn small ghost onClick={() => act(() => api.skipResearch(j.id), { sfx: 'coin' })}>Ускорить за <CostView cost={skipCost(left)} /></Btn> : <Btn small color="teal" onClick={() => { const r = act(() => api.collectResearch(j.id), { sfx: 'win' }); if (r.ok) setRes(r.value); }}>Забрать результат</Btn>}
          </div>); })}
        {g.base.lab.queue.length === 0 && <div className="small muted">Лаборатория свободна. Выбери исследование.</div>}
      </div>
      <div className="card stack">
        <div className="bold">Доступные исследования</div>
        {RESEARCH.map((r) => { const locked = r.level > lvl; const busy = g.base.lab.queue.length >= slots; return (
          <div key={r.id} className="row between" style={{ opacity: locked ? .5 : 1, gap: 8 }}>
            <div style={{ flex: 1 }}><div className="bold">{r.name}</div><div className="tiny muted">{locked ? `🔒 Лаборатория ${r.level} уровня` : `${r.desc} · ${fmtDuration(Math.round(r.seconds * roomFx.labSpeed(lab.level)))}`}</div></div>
            <Btn small disabled={locked || busy} onClick={() => act(() => api.startResearch(r.id), { sfx: 'buy' })}><CostView cost={r.cost} /></Btn>
          </div>); })}
      </div>
      {res && <Sheet mid onClose={() => setRes(null)} title="Исследование завершено!"><div className="stack"><RewardView r={res} /><Btn block onClick={() => setRes(null)}>Отлично!</Btn></div></Sheet>}
    </>
  );
}

function GymPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const now = useNow(1000);
  const gym = g.base.rooms.gym; const max = roomFx.gymMax(gym.level);
  const mine = CHARACTERS.filter((c) => g.characters[c.id].unlocked);
  const [cid, setCid] = useState(g.player.selectedCharacterId);
  const c = g.characters[cid] ? CHARACTER_MAP[cid] : mine[0];
  const cs = g.characters[c.id];
  const left = trainCooldownLeft(g, c.id, now);
  return (
    <div className="card stack">
      <div className="bold">🏋️ Тренировки</div>
      <div className="row wrap">{mine.map((m) => <button key={m.id} className={`chip ${m.id === c.id ? 'on' : ''}`} onClick={() => setCid(m.id)}>{g.characters[m.id].nickname || m.name}</button>)}</div>
      <div className="row" style={{ gap: 12 }}>
        <div style={{ width: 90 }}><Nanabo look={c.look} equipped={cs.equipped} emotion={left > 0 ? 'sleepy' : 'excited'} animate={false} /></div>
        <div className="stack" style={{ flex: 1, gap: 6 }}>{(['speed', 'brains', 'charm', 'luck'] as StatId[]).map((s) => (
          <div key={s}><div className="row between tiny"><span>{STAT_ICON[s]} {STAT_NAME[s]}</span><span>{cs.trained[s] || 0}/{max}</span></div><Bar value={cs.trained[s] || 0} max={max} tone="pink" /></div>))}</div>
      </div>
      <div className="small muted">{left > 0 ? `Нанабо отдыхает: ${fmtDuration(left)}` : <>Одна тренировка: <CostView cost={trainCost(g, c.id)} /></>}</div>
      <div className="grid g2">{(['speed', 'brains', 'charm', 'luck'] as StatId[]).map((s) => <Btn key={s} small disabled={left > 0 || (cs.trained[s] || 0) >= max} onClick={() => act(() => api.train(c.id, s), { sfx: 'star' })}>{STAT_ICON[s]} {STAT_NAME[s]}</Btn>)}</div>
    </div>
  );
}

function WorkshopPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const lvl = roomFx.craftLevel(g.base.rooms.workshop.level);
  return (
    <div className="card stack">
      <div className="row between"><div className="bold">🔧 Создание декораций</div><div className="row gap-s tiny">{MATERIALS.map((m) => <span key={m} className="pill">{MAT_ICON[m]} {g.inventory.materials[m]}</span>)}</div></div>
      {CRAFTS.map((c) => { const locked = c.level > lvl; const enough = MATERIALS.every((m) => (c.materials[m] || 0) <= g.inventory.materials[m]); return (
        <div key={c.id} className="row between" style={{ opacity: locked ? .5 : 1, gap: 8 }}>
          <div style={{ flex: 1 }}><div className="bold">{c.name}</div>
            <div className="tiny muted">{locked ? `🔒 Мастерская ${c.level} уровня` : MATERIALS.filter((m) => c.materials[m]).map((m) => `${MAT_ICON[m]}${c.materials[m]}`).join(' ') + ` · создано: ${g.base.workshop.crafted[c.id] || 0}`}</div></div>
          <Btn small disabled={locked || !enough} onClick={() => act(() => api.craft(c.id), { sfx: 'win' })}><CostView cost={craftCost(g, c.id)} /></Btn>
        </div>); })}
      <div className="tiny muted">Материалы добываются в лаборатории и на уровнях. {MATERIALS.map((m) => MAT_NAME[m]).join(', ')}.</div>
    </div>
  );
}

function SecretPanel() {
  const g = useGame(); const { api } = useApp(); const act = useAct(); const now = useNow(1000);
  const s = secretRoomStatus(g, now);
  const [res, setRes] = useState<ReturnType<typeof api.claimSecretRoom> | null>(null);
  return (
    <div className="card stack center" style={{ alignItems: 'center' }}>
      <div className="emoji xl">🗝️</div>
      <div className="bold">Тайное хранилище</div>
      <div className="small muted">Здесь копится сундук уровня «{s.tier === 'legendary' ? 'легендарный' : s.tier === 'epic' ? 'эпический' : 'редкий'}».</div>
      <Btn disabled={!s.canClaim} onClick={() => { const r = act(() => api.claimSecretRoom(), { sfx: 'chest' }); if (r.ok) { setRes(r.value); fireConfetti(); } }}>{s.canClaim ? 'Забрать сундук' : `Через ${fmtDuration(Math.ceil(s.leftMs / 1000))}`}</Btn>
      {res && <Sheet mid onClose={() => setRes(null)} title="Сундук получен!"><div className="stack"><RewardView r={res} /><Btn block onClick={() => setRes(null)}>Отлично!</Btn></div></Sheet>}
    </div>
  );
}
void CurIcon; void fmt;
