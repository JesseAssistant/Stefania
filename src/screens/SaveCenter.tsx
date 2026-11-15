import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp, useGame } from '../app/ctx';
import { useNav } from '../app/nav';
import { Btn, Screen, Sheet } from '../ui/kit';
import { buildSaveFile, parseSaveText, serializeSave, summarize, type ImportFailure, type ImportSuccess, type SaveSummary } from '../storage/exportImport';
import { requestPersistence, storageInfo, type BackupMeta, type SaveStatus } from '../storage/saveService';
import { GAME_VERSION, SAVE_FILE_NAME, SCHEMA_VERSION } from '../config';
import { fmt } from '../game/util';
import { fireConfetti, toast } from '../app/bus';

const when = (iso?: string | null) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const REASON: Record<string, string> = { auto: 'Автокопия', import: 'Перед импортом', migration: 'Перед обновлением данных', manual: 'Ручная копия', reset: 'Перед сбросом', restore: 'Перед восстановлением' };
const LAST_EXPORT_KEY = 'nanabo.lastExportAt';
const readLastExport = () => { try { return localStorage.getItem(LAST_EXPORT_KEY); } catch { return null; } };
const stageText: Record<ImportFailure['stage'], string> = { parse: 'Файл не читается как JSON', format: 'Это не файл сохранения этой игры', structure: 'В файле не хватает данных', integrity: 'Файл изменён или повреждён (контрольная сумма не совпала)', compat: 'Файл создан более новой версией игры', migrate: 'Не удалось обновить старый формат', validate: 'Данные в файле не прошли проверку' };

function SummaryRow({ label, a, b }: { label: string; a: string | number; b?: string | number }) {
  return <div className="row between small" style={{ gap: 8 }}><span className="muted">{label}</span><span className="bold">{b === undefined ? a : <>{a} <span className="muted">→</span> {b}</>}</span></div>;
}
function SummaryView({ s, cur }: { s: SaveSummary; cur?: SaveSummary }) {
  return <div className="stack" style={{ gap: 4 }}>
    <SummaryRow label="Уровень Stefania" a={cur ? cur.playerLevel : s.playerLevel} b={cur ? s.playerLevel : undefined} />
    <SummaryRow label="Нанабо" a={cur ? cur.characters : s.characters} b={cur ? s.characters : undefined} />
    <SummaryRow label="Звёзды" a={cur ? cur.stars : s.stars} b={cur ? s.stars : undefined} />
    <SummaryRow label="Достижения" a={cur ? cur.achievements : s.achievements} b={cur ? s.achievements : undefined} />
    <SummaryRow label="Бананы" a={fmt(cur ? cur.bananas : s.bananas)} b={cur ? fmt(s.bananas) : undefined} />
    <SummaryRow label="Монеты" a={fmt(cur ? cur.coins : s.coins)} b={cur ? fmt(s.coins) : undefined} />
    <SummaryRow label="Кристаллы" a={fmt(cur ? cur.crystals : s.crystals)} b={cur ? fmt(s.crystals) : undefined} />
  </div>;
}

export function SaveCenter() {
  const { store, svc, audio } = useApp(); const g = useGame(); const nav = useNav();
  const [st, setSt] = useState<SaveStatus>(svc.status);
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [info, setInfo] = useState<{ persisted: boolean | null; usage: number | null; quota: number | null } | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(readLastExport());
  const [imp, setImp] = useState<ImportSuccess | null>(null);
  const [fail, setFail] = useState<ImportFailure | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false); const [pasted, setPasted] = useState('');
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sandbox = store.mode === 'sandbox';

  const refresh = useCallback(async () => { try { setBackups(await svc.listBackups()); } catch { setBackups([]); } setInfo(await storageInfo()); }, [svc]);
  useEffect(() => svc.subscribe(setSt), [svc]);
  useEffect(() => { void refresh(); }, [refresh]);

  const cur = summarize(g, { gameVersion: GAME_VERSION, schemaVersion: SCHEMA_VERSION, exportedAt: g.metadata.savedAt, bytes: 0 });

  // ---------- экспорт ----------
  const makeText = () => serializeSave(buildSaveFile(store.getState(), store.now()));
  const markExported = () => { const t = new Date().toISOString(); try { localStorage.setItem(LAST_EXPORT_KEY, t); } catch { /* не критично */ } setLastExport(t); };
  const download = () => {
    const text = makeText(); const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = SAVE_FILE_NAME; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000); markExported(); toast(`Файл ${SAVE_FILE_NAME} скачан. Проверь папку «Загрузки».`, 'good');
  };
  const share = async () => {
    const text = makeText(); const file = new File([text], SAVE_FILE_NAME, { type: 'application/json' });
    const n = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> };
    if (n.canShare && n.share && n.canShare({ files: [file] })) {
      try { await n.share({ files: [file], title: 'Сохранение Stefania’s Nanabo World' }); markExported(); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    download();
  };
  const copy = async () => { try { await navigator.clipboard.writeText(makeText()); markExported(); toast('Сохранение скопировано в буфер обмена', 'good'); } catch { toast('Не удалось скопировать. Используй «Скачать файл».', 'bad'); } };

  // ---------- импорт ----------
  const check = (text: string) => { setFail(null); setImp(null); const r = parseSaveText(text, store.now()); if (r.ok) setImp(r); else setFail(r); };
  const onFile = async (e: { target: { files: FileList | null; value: string } }) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { check(await f.text()); } catch { setFail({ ok: false, stage: 'parse', errors: ['Не удалось прочитать файл'] }); }
    e.target.value = '';
  };
  const applyImport = async () => {
    if (!imp || busy) return; setBusy(true);
    try {
      const r = await svc.applyImport(store, imp);
      setImp(null); await refresh(); fireConfetti(); audio.sfx('win');
      setDone(r.verified ? 'Прогресс загружен и проверен. Копия прежнего прогресса лежит в списке копий.' : 'Прогресс загружен, но проверить запись не удалось. Прежняя копия сохранена в списке копий.');
    } catch { toast('Не удалось применить файл. Текущий прогресс не изменён.', 'bad'); }
    setBusy(false);
  };

  // ---------- копии ----------
  const makeBackup = async () => { setBusy(true); try { await svc.createBackup(store.getState(), 'manual'); await refresh(); toast('Копия создана', 'good'); } catch { toast('Не удалось создать копию', 'bad'); } setBusy(false); };
  const restore = async () => {
    if (!restoreId || busy) return; setBusy(true);
    try { const r = await svc.restoreBackup(store, restoreId); if (!r) toast('Копия не читается', 'bad'); else { setDone(r.verified ? 'Прогресс восстановлен. Прежний прогресс сохранён отдельной копией.' : 'Прогресс восстановлен, проверить запись не удалось.'); fireConfetti(); } } catch { toast('Не удалось восстановить. Текущий прогресс не изменён.', 'bad'); }
    setRestoreId(null); await refresh(); setBusy(false);
  };
  const reset = async () => { setBusy(true); try { await svc.resetProgress(store); setResetOpen(0); await refresh(); setDone('Начата новая игра. Прежний прогресс лежит в копии «Перед сбросом».'); } catch { toast('Не удалось сбросить', 'bad'); } setBusy(false); };

  if (sandbox) return <Screen title="💾 Сохранения"><div className="card center stack" style={{ alignItems: 'center' }}><div className="emoji l">🧪</div><div className="bold">Сейчас включена свободная игра</div><div className="small muted">Она не сохраняется. Выйди из неё, чтобы работать с настоящим прогрессом.</div><Btn onClick={() => nav.pop()}>Назад</Btn></div></Screen>;

  const persistedText = info?.persisted === true ? '✅ Постоянное хранилище включено' : info?.persisted === false ? '⚠️ Браузер может очистить данные при нехватке места' : 'Состояние хранилища неизвестно';
  return (
    <Screen title="💾 Сохранения">
      <div className="stack">
        <div className="card tint stack">
          <div className="row between"><div className="bold">Автосохранение</div><span className="pill" style={{ background: st.phase === 'error' ? '#FFD5D5' : '#D8F6D2' }}>{st.phase === 'error' ? '⚠️ Ошибка записи' : st.phase === 'saving' ? 'Сохраняю…' : '✅ Сохранено'}</span></div>
          <div className="small muted">Последняя запись: {when(st.lastSavedAt || g.metadata.savedAt)} · запись №{g.metadata.revision}</div>
          {st.phase === 'error' && <div className="banner warn">Не получается записать на устройство: {st.error || 'неизвестная ошибка'}. Выгрузи файл сохранения ниже.</div>}
          <div className="small">{persistedText}{info?.usage != null && info.quota ? ` · занято ${(info.usage / 1048576).toFixed(1)} МБ` : ''}</div>
          {info?.persisted === false && <Btn small ghost onClick={async () => { const ok = await requestPersistence(); toast(ok ? 'Постоянное хранилище включено' : 'Браузер не разрешил. Установи игру на экран «Домой» и попробуй снова.', ok ? 'good' : 'bad'); void refresh(); }}>Включить постоянное хранилище</Btn>}
          <SummaryView s={cur} />
        </div>

        <div className="card stack">
          <div className="bold">📤 Сохранить в файл</div>
          <div className="small muted">Файл <b>{SAVE_FILE_NAME}</b> — полная копия прогресса. Храни его в «Файлах» или в iCloud: по нему игру можно восстановить даже на другом устройстве и после обновлений.</div>
          <div className="small">Последний файл: {lastExport ? when(lastExport) : 'ещё не сохраняла'}</div>
          <Btn block color="teal" onClick={() => void share()}>Сохранить файл (поделиться / «Файлы»)</Btn>
          <div className="row" style={{ gap: 8 }}><Btn block small ghost onClick={download}>Скачать файл</Btn><Btn block small ghost onClick={() => void copy()}>Скопировать текст</Btn></div>
        </div>

        <div className="card stack">
          <div className="bold">📥 Загрузить из файла</div>
          <div className="small muted">Перед заменой игра проверит файл, покажет что внутри и сделает копию текущего прогресса.</div>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" onChange={onFile} style={{ display: 'none' }} aria-label="Выбрать файл сохранения" />
          <Btn block onClick={() => fileRef.current?.click()}>Выбрать файл…</Btn>
          <Btn block small ghost onClick={() => { setPasteOpen(true); setPasted(''); }}>Вставить текст сохранения</Btn>
        </div>

        <div className="card stack">
          <div className="row between"><div className="bold">🗂️ Резервные копии</div><Btn small ghost disabled={busy} onClick={() => void makeBackup()}>Создать сейчас</Btn></div>
          <div className="tiny muted">При запуске игра сама делает копию, если прошло больше 12 часов (хранится 7 последних). Копии «перед импортом», «перед сбросом» и ручные не удаляются.</div>
          {backups.length === 0 && <div className="small muted">Копий пока нет.</div>}
          {backups.map((b) => <div key={b.id} className="card tint stack" style={{ gap: 6 }}>
            <div className="row between"><span className="bold small">{REASON[b.reason] || b.reason}</span><span className="tiny muted">{when(b.createdAt)}</span></div>
            <div className="small muted">Ур. {b.summary.playerLevel} · Нанабо {b.summary.characters} · ⭐ {b.summary.stars} · 🍌 {fmt(b.summary.bananas)}</div>
            <Btn small ghost onClick={() => setRestoreId(b.id)}>Восстановить из этой копии</Btn>
          </div>)}
        </div>

        <div className="card stack" style={{ borderLeft: '6px solid #E53935' }}>
          <div className="bold">⚠️ Начать заново</div>
          <div className="small muted">Весь прогресс будет обнулён. Но перед этим игра сделает копию, и её можно будет вернуть.</div>
          <Btn block color="red" onClick={() => setResetOpen(1)}>Сбросить прогресс…</Btn>
        </div>
        <div className="tiny muted center">Версия игры {GAME_VERSION} · формат данных {SCHEMA_VERSION}</div>
      </div>

      {pasteOpen && <Sheet onClose={() => setPasteOpen(false)} title="Вставь текст сохранения">
        <div className="stack"><textarea className="field" rows={8} value={pasted} onChange={(e: { target: { value: string } }) => setPasted(e.target.value)} placeholder='{ "format": "STEFANIA_WORLD_SAVE", … }' aria-label="Текст сохранения" style={{ fontFamily: 'monospace', fontSize: 12 }} />
          <Btn block disabled={!pasted.trim()} onClick={() => { check(pasted); setPasteOpen(false); }}>Проверить</Btn></div>
      </Sheet>}

      {fail && <Sheet mid onClose={() => setFail(null)}><div className="stack center" style={{ alignItems: 'center' }}>
        <div className="emoji l">🚫</div><div className="bold">Файл не подошёл</div>
        <div>{stageText[fail.stage]}</div>
        <div className="small muted" style={{ textAlign: 'left' }}>{fail.errors.slice(0, 4).map((e, i) => <div key={i}>• {e}</div>)}</div>
        <div className="small" style={{ color: 'var(--green)' }}>Твой текущий прогресс не тронут.</div>
        <Btn block onClick={() => setFail(null)}>Понятно</Btn></div></Sheet>}

      {imp && <Sheet onClose={() => setImp(null)} title="Заменить прогресс этим файлом?">
        <div className="stack">
          <div className="small muted center">Файл сохранён {when(imp.summary.exportedAt)} · версия игры {imp.summary.gameVersion}{imp.migrated ? ' · данные будут обновлены до новой версии' : ''}</div>
          <div className="card tint"><div className="small muted" style={{ marginBottom: 4 }}>Сейчас → из файла</div><SummaryView s={imp.summary} cur={cur} /></div>
          {imp.warnings.length > 0 && <div className="banner">{imp.warnings.slice(0, 3).map((w, i) => <div key={i}>• {w}</div>)}</div>}
          {imp.integrity === 'missing' && <div className="banner">В файле нет контрольной суммы — это старый формат. Данные проверены на структуру.</div>}
          <div className="small center" style={{ color: 'var(--green)' }}>Перед заменой игра сохранит копию текущего прогресса.</div>
          <Btn block xl disabled={busy} onClick={() => void applyImport()}>Заменить прогресс</Btn>
          <Btn block ghost onClick={() => setImp(null)}>Отмена</Btn>
        </div></Sheet>}

      {restoreId && <Sheet mid onClose={() => setRestoreId(null)}><div className="stack center" style={{ alignItems: 'center' }}>
        <div className="bold">Восстановить из копии?</div>
        <div className="small muted">Текущий прогресс заменится копией от {when(backups.find((b) => b.id === restoreId)?.createdAt)}. Сам он тоже сохранится отдельной копией.</div>
        <Btn block disabled={busy} onClick={() => void restore()}>Восстановить</Btn><Btn block ghost onClick={() => setRestoreId(null)}>Отмена</Btn></div></Sheet>}

      {resetOpen > 0 && <Sheet mid onClose={() => setResetOpen(0)}><div className="stack center" style={{ alignItems: 'center' }}>
        <div className="emoji l">⚠️</div><div className="bold">{resetOpen === 1 ? 'Точно начать заново?' : 'Последнее подтверждение'}</div>
        <div className="small muted">{resetOpen === 1 ? 'Все Нанабо, наряды, звёзды и валюта будут обнулены.' : 'Копия прежнего прогресса сохранится, и её можно будет восстановить в списке копий.'}</div>
        {resetOpen === 1 ? <Btn block color="red" onClick={() => setResetOpen(2)}>Да, продолжить</Btn> : <Btn block color="red" disabled={busy} onClick={() => void reset()}>Сбросить прогресс</Btn>}
        <Btn block ghost onClick={() => setResetOpen(0)}>Отмена</Btn></div></Sheet>}

      {done && <Sheet mid onClose={() => setDone(null)}><div className="stack center" style={{ alignItems: 'center' }}><div className="emoji l">✅</div><div>{done}</div><Btn block onClick={() => setDone(null)}>Отлично</Btn></div></Sheet>}
    </Screen>
  );
}
