import { useRef, useState } from 'react';
import { useApp, useGame, useAct } from '../app/ctx';
import { useNav } from '../app/nav';
import { useMusic } from '../app/useMusic';
import { newRunId } from '../app/runid';
import { fireConfetti } from '../app/bus';
import { Btn, Empty, Screen, Sheet, StarsRow } from '../ui/kit';
import { RewardView } from '../ui/RewardView';
import { RewardChips } from '../ui/RewardChips';
import { GAME_INFO } from '../ui/icons';
import { LEVELS, LEVEL_MAP, WORLD_MAP } from '../game/data/worlds';
import { hashString } from '../game/rng';
import { ALL_MINIGAMES, arcadeStatus, isMinigameUnlocked, taskProgress, type LevelOutcome } from '../game/engine/levels';
import { ARCADE_FULL_PLAYS_PER_DAY } from '../game/data/economy';
import { RECIPE_MAP } from '../game/data/decor';
import { GameView, type GameResult } from '../games';
import { arcadeConfig, DIFFICULTIES } from '../games/arcadeConfig';
import type { LevelDef, LevelGame, MinigameId, RewardResult } from '../game/types';
import type { ScreenProps } from '../app/routes';

type Single = Exclude<LevelGame, { kind: 'task' } | { kind: 'gauntlet' }>;
const isSingle = (g: LevelGame): g is Single => g.kind !== 'task' && g.kind !== 'gauntlet';
const gameName = (g: LevelGame) => (g.kind === 'task' ? 'Задание' : g.kind === 'gauntlet' ? 'Испытание' : GAME_INFO[g.kind].name);

/** Серия испытаний: игрок проходит этапы подряд, ошибка отнимает сердце и повторяет этап. */
function Gauntlet({ game, seed, onDone }: { game: Extract<LevelGame, { kind: 'gauntlet' }>; seed: number; onDone: (r: GameResult, kinds: string[]) => void }) {
  const { audio } = useApp();
  const stages = game.stages.filter(isSingle);
  const [idx, setIdx] = useState(0); const [hearts, setHearts] = useState(game.hearts); const [tries, setTries] = useState(0);
  const [between, setBetween] = useState<null | { ok: boolean }>(null);
  const kinds = stages.map((s) => s.kind);
  const stageDone = (r: GameResult) => {
    if (r.success) { if (idx + 1 >= stages.length) { onDone({ success: true, metric: hearts }, kinds); return; } setBetween({ ok: true }); return; }
    const h = hearts - 1; setHearts(h);
    if (h <= 0) { onDone({ success: false, metric: 0 }, kinds); return; }
    setBetween({ ok: false });
  };
  const go = () => { if (between?.ok) setIdx(idx + 1); else setTries(tries + 1); setBetween(null); audio.sfx('whoosh'); };
  return (
    <>
      <div className="hud"><span className="pill">🏁 {idx + 1}/{stages.length}</span><span className="hearts" aria-label={`Сердец: ${hearts}`}>{'❤️'.repeat(hearts)}{'🖤'.repeat(game.hearts - hearts)}</span><span className="small muted">{gameName(stages[idx])}</span></div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}><GameView key={`${idx}-${tries}`} game={stages[idx]} seed={seed + idx * 101 + tries * 7919} onDone={stageDone} /></div>
      {between && <Sheet mid><div className="stack center" style={{ alignItems: 'center' }}>
        <div className="emoji l">{between.ok ? '🎉' : '💔'}</div>
        <div className="bold">{between.ok ? 'Этап пройден!' : `Не вышло. Сердец осталось: ${hearts}`}</div>
        <div className="small muted">{between.ok ? `Дальше: ${gameName(stages[idx + 1])}` : 'Попробуй этот этап ещё раз.'}</div>
        <Btn block onClick={go}>{between.ok ? 'Дальше' : 'Ещё раз'}</Btn></div></Sheet>}
    </>
  );
}

function starLine(level: LevelDef, n: number) {
  const r = level.stars; return [{ n: 1, text: 'Пройти уровень' }, { n: 2, text: r.twoText }, { n: 3, text: r.threeText }].map((s) => ({ ...s, ok: n >= s.n }));
}
const metricText = (level: LevelDef, m: number): string => {
  switch (level.game.kind) {
    case 'banana-catcher': return `Бананов: ${m}`; case 'memory': return `Ходов: ${m}`; case 'kitchen': return `Ошибок: ${m}`;
    case 'lab-puzzle': return level.game.variant === 'sequence' ? `Ошибок: ${m}` : `Ходов: ${m}`; case 'treasure-hunt': return `Осталось секунд: ${m}`;
    case 'sorting': return `Ошибок: ${m}`; case 'reaction': return `Средняя реакция: ${m} мс`; case 'outfit-challenge': return `Очков: ${m}`;
    case 'gauntlet': return `Сердец: ${m}`; default: return `Целей: ${m}`;
  }
};

export function LevelScreen({ params }: ScreenProps) {
  const level = LEVEL_MAP[params.id as string];
  const g = useGame(); const { api } = useApp(); const act = useAct(); const nav = useNav();
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const [attempt, setAttempt] = useState(0);
  const [out, setOut] = useState<LevelOutcome | null>(null);
  const runId = useRef('');
  useMusic(phase === 'play' ? 'play' : level ? WORLD_MAP[`w${level.world}`].music : 'home');
  if (!level) return <Screen title="Уровень"><Empty text="Такого уровня нет." /></Screen>;
  const world = WORLD_MAP[`w${level.world}`]; const st = g.levels[level.id];
  const idx = LEVELS.findIndex((l) => l.id === level.id); const next = LEVELS[idx + 1];
  const start = () => { runId.current = newRunId('lvl'); setAttempt((a) => a + 1); setPhase('play'); };
  const finish = (r: GameResult, kinds?: string[]) => {
    const res = act(() => api.completeLevel({ levelId: level.id, runId: runId.current, success: r.success, metric: r.metric, kinds }), { quiet: true });
    if (res.ok) { setOut(res.value); setPhase('result'); if (res.value.first || res.value.newStars > 0) fireConfetti(); } else setPhase('intro');
  };
  const goal = level.game;

  if (phase === 'play' && goal.kind !== 'task') {
    return (
      <Screen scroll={false} title={`${level.index}. ${level.name}`} onBack={() => setPhase('intro')} bg={world.theme.sky1 + '88'}>
        {goal.kind === 'gauntlet'
          ? <Gauntlet key={attempt} game={goal} seed={hashString(runId.current)} onDone={finish} />
          : <GameView key={attempt} game={goal} seed={hashString(runId.current)} onDone={(r) => finish(r)} />}
      </Screen>
    );
  }
  if (phase === 'result' && out) {
    const ok = out.success; const lines = starLine(level, out.stars);
    return (
      <Screen title={ok ? 'Уровень пройден!' : 'Не получилось'} onBack={() => nav.pop()}>
        <div className="stack center" style={{ alignItems: 'center' }}>
          <div className="emoji xl">{ok ? (out.stars === 3 ? '🏆' : '🎉') : '💪'}</div>
          <div style={{ fontSize: 40 }}><StarsRow n={out.stars} /></div>
          <div className="muted">{metricText(level, out.metric)}{out.improvedBest && ok ? ' · новый рекорд!' : ''}</div>
          {!ok && <div className="small muted">Ничего страшного — попробуй ещё раз, прогресс не потерян.</div>}
          <div className="card stack" style={{ width: '100%' }}>{lines.map((s) => <div key={s.n} className="row" style={{ gap: 8, opacity: s.ok ? 1 : .55 }}><span>{s.ok ? '✅' : '⬜'}</span><span className="small">{'⭐'.repeat(s.n)} {s.text}</span></div>)}</div>
          {ok && <RewardView r={out.rewards} compact />}
          {out.bonusPct > 0 && <div className="small" style={{ color: 'var(--green)' }}>Бонус напарника: +{out.bonusPct}% бананов</div>}
          <div className="stack" style={{ width: '100%' }}>
            {ok && next && g.levels[next.id]?.status !== 'locked' && <Btn block onClick={() => nav.replace('level', { id: next.id })}>Дальше: {next.name} →</Btn>}
            <Btn block color={ok ? 'teal' : undefined} onClick={start}>Играть ещё раз</Btn>
            <Btn block ghost onClick={() => nav.pop()}>К карте</Btn>
          </div>
        </div>
      </Screen>
    );
  }

  // ---- Вступление ----
  const locked = st?.status === 'locked';
  const tasks = goal.kind === 'task' ? taskProgress(g, level) : [];
  return (
    <Screen title={`${level.index}. ${level.name}`} bg={world.theme.sky1 + '88'}>
      <div className="stack">
        <div className="card tint stack center" style={{ alignItems: 'center' }}>
          <div className="emoji xl">{goal.kind === 'task' ? '📋' : goal.kind === 'gauntlet' ? '🏁' : GAME_INFO[goal.kind].emoji}</div>
          <div className="small muted">{world.name} · {level.boss ? 'Босс-уровень' : `Уровень ${level.index}`} · {gameName(goal)}</div>
          <div>{level.desc}</div>
          <div className="bold">🎯 {level.goal}</div>
          <StarsRow n={st?.stars || 0} />
          {st?.best != null && <div className="tiny muted">Лучший результат: {metricText(level, st.best)}</div>}
        </div>
        {goal.kind === 'gauntlet' && <div className="card small">Этапов: {goal.stages.length}. Сердец: {goal.hearts}. Ошибка в этапе отнимает сердце — этап придётся пройти заново.</div>}
        {goal.kind === 'task' && <div className="card stack"><div className="bold">Цели</div>{level.game.kind === 'task' && level.game.goals.map((t, i) => <div key={t.id} className="row" style={{ gap: 8 }}><span>{tasks[i] ? '✅' : '⬜'}</span><span>{t.text}</span></div>)}</div>}
        <div className="card stack"><div className="bold">Звёзды</div>{starLine(level, 0).map((s) => <div key={s.n} className="small">{'⭐'.repeat(s.n)} {goal.kind === 'task' ? (s.n === 1 ? 'Выполнить 1 цель' : s.n === 2 ? 'Выполнить 2 цели' : 'Выполнить все цели') : s.text}</div>)}</div>
        <div className="card stack"><div className="bold">Награды</div>
          <div className="small muted">За первое прохождение:</div><RewardChips r={level.first} />
          <div className="small muted">За 2 звезды:</div><RewardChips r={level.star2} />
          <div className="small muted">За 3 звезды:</div><RewardChips r={level.star3} /></div>
        {locked ? <div className="banner">🔒 Сначала пройди предыдущий уровень</div>
          : goal.kind === 'task'
            ? <Btn block xl onClick={() => { runId.current = newRunId('task'); const r = act(() => api.evaluateTask(level.id, runId.current), { quiet: true }); if (r.ok) { setOut(r.value); setPhase('result'); if (r.value.newStars > 0) fireConfetti(); } }}>Проверить цели</Btn>
            : <Btn block xl onClick={start}>▶ Играть</Btn>}
      </div>
    </Screen>
  );
}

/* ---------------- Аркада ---------------- */
export function ArcadeScreen() {
  const g = useGame(); const { api } = useApp(); const act = useAct();
  const [sel, setSel] = useState<MinigameId | null>(null);
  const [run, setRun] = useState<{ game: MinigameId; d: number; id: string; cfg: Single } | null>(null);
  const [res, setRes] = useState<{ ok: boolean; reward: RewardResult | null } | null>(null);
  const [diff, setDiff] = useState(2);
  const now = Date.now();
  useMusic(run ? 'play' : 'base');
  const begin = (game: MinigameId, d: number) => { const id = newRunId('arc'); setRun({ game, d, id, cfg: arcadeConfig(game, d, hashString(id)) }); setSel(null); setRes(null); };
  const done = (r: GameResult) => {
    if (!run) return;
    const o = act(() => api.finishArcade({ game: run.game, runId: run.id, success: r.success, difficulty: run.d, metric: r.metric }), { quiet: true });
    if (o.ok) { setRes({ ok: r.success, reward: o.value }); if (r.success) fireConfetti(); }
  };
  if (run && !res) return <Screen scroll={false} title={GAME_INFO[run.game].name} onBack={() => setRun(null)}><GameView key={run.id} game={run.cfg} seed={hashString(run.id)} onDone={done} /></Screen>;
  if (run && res) return (
    <Screen title={res.ok ? 'Победа!' : 'Не получилось'} onBack={() => { setRun(null); setRes(null); }}>
      <div className="stack center" style={{ alignItems: 'center' }}>
        <div className="emoji xl">{res.ok ? '🎉' : '💪'}</div>
        {res.reward ? <RewardView r={res.reward} /> : <div className="muted">{res.ok ? 'Готово!' : 'Попробуй ещё раз — это просто тренировка.'}</div>}
        <Btn block onClick={() => begin(run.game, run.d)}>Играть ещё раз</Btn>
        <Btn block ghost onClick={() => { setRun(null); setRes(null); }}>К списку игр</Btn>
      </div>
    </Screen>
  );
  return (
    <Screen title="🎮 Мини-игры">
      <div className="stack">
        <div className="small muted center">Полная награда: {ARCADE_FULL_PLAYS_PER_DAY} победы в день в каждой игре, потом — немного бананов.</div>
        <div className="grid g2">
          {ALL_MINIGAMES.map((id) => { const info = GAME_INFO[id]; const open = isMinigameUnlocked(g, id); const s = g.minigames.stats[id]; const a = arcadeStatus(g, id, now); return (
            <button key={id} className={`menu-btn ${open ? '' : 'locked'}`} disabled={!open} onClick={() => setSel(id)} style={{ opacity: open ? 1 : .55 }}>
              <span className="emoji l">{open ? info.emoji : '🔒'}</span><span>{info.name}</span>
              <span className="lock-note">{open ? `Побед: ${s?.wins || 0} · бонус ${a.fullLeft}/${ARCADE_FULL_PLAYS_PER_DAY}` : unlockHint(id)}</span>
            </button>); })}
        </div>
      </div>
      {sel && <Sheet onClose={() => setSel(null)} title={`${GAME_INFO[sel].emoji} ${GAME_INFO[sel].name}`}>
        <div className="stack"><div className="center muted">{GAME_INFO[sel].desc}</div>
          <div className="row" style={{ justifyContent: 'center' }}>{DIFFICULTIES.map((d) => <button key={d.id} className={`chip ${diff === d.id ? 'on' : ''}`} onClick={() => setDiff(d.id)}>{d.name}</button>)}</div>
          <Btn block xl onClick={() => begin(sel, diff)}>▶ Играть</Btn></div>
      </Sheet>}
    </Screen>
  );
}
function unlockHint(id: MinigameId): string {
  switch (id) { case 'sorting': return 'Пройди 5 уровень мира 1'; case 'reaction': return 'Пройди 6 уровень мира 1'; case 'treasure-hunt': return 'Пройди 7 уровень мира 1'; case 'kitchen': return 'Открой кухню'; case 'lab-puzzle': return 'Открой лабораторию'; case 'outfit-challenge': return 'Гардеробная 2 ур. или мир 2'; default: return ''; }
}

/* ---------------- Готовка (кухня) ---------------- */
export function CookScreen({ params }: ScreenProps) {
  const id = params.id as string; const recipe = RECIPE_MAP[id];
  const { api } = useApp(); const act = useAct(); const nav = useNav();
  const runId = useRef(newRunId('cook'));
  const [res, setRes] = useState<{ q: number; r: RewardResult | null } | null>(null);
  const [confirm, setConfirm] = useState(false);
  useMusic('play');
  if (!recipe) return <Screen title="Кухня"><Empty text="Такого рецепта нет." /></Screen>;
  const done = (r: GameResult) => {
    const q = !r.success ? 0 : r.metric === 0 ? 3 : r.metric <= 2 ? 2 : 1;
    const o = act(() => api.finishCook(id, runId.current, q), { quiet: true });
    if (o.ok) { setRes({ q, r: o.value }); if (q > 0) fireConfetti(); }
  };
  const leave = () => { if (res) { nav.pop(); return; } setConfirm(true); };
  if (res) return (
    <Screen title={res.q > 0 ? `${recipe.name} готов!` : 'Блюдо не удалось'} onBack={() => nav.pop()}>
      <div className="stack center" style={{ alignItems: 'center' }}>
        <div className="emoji xl">{res.q > 0 ? '🍽️' : '😿'}</div>
        {res.q > 0 ? <><StarsRow n={res.q} />{res.r && <RewardView r={res.r} />}<div className="small muted">Угости блюдом Нанабо на кухне.</div></> : <div className="muted">Половина бананов вернулась. Попробуй ещё раз!</div>}
        <Btn block onClick={() => nav.pop()}>На кухню</Btn>
      </div>
    </Screen>
  );
  return (
    <Screen scroll={false} title={`Готовим: ${recipe.name}`} onBack={leave}>
      <GameView game={{ kind: 'kitchen', recipeId: id, orders: 1 }} seed={hashString(runId.current)} onDone={done} />
      {confirm && <Sheet mid onClose={() => setConfirm(false)}><div className="stack center" style={{ alignItems: 'center' }}><div className="bold">Выйти из готовки?</div><div className="small muted">Блюдо не получится, но половина бананов вернётся.</div>
        <Btn block ghost onClick={() => setConfirm(false)}>Продолжить готовить</Btn>
        <Btn block color="red" onClick={() => { act(() => api.finishCook(id, runId.current, 0), { quiet: true }); nav.pop(); }}>Выйти</Btn></div></Sheet>}
    </Screen>
  );
}
