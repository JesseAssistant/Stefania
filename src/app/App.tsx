import { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp, useGame, type App } from './ctx';
import { NavProvider, useNav } from './nav';
import { ROUTES, Missing } from './routes';
import { NoticeCenter } from './NoticeCenter';
import { ConfettiLayer, Toasts, Btn, Sheet } from '../ui/kit';
import { bootstrap, type Booted } from './bootstrap';
import { Nanabo } from '../art/Nanabo';
import { CHARACTER_MAP } from '../game/data/characters';
import { UpdateBanner } from './UpdateBanner';
import { SaveBanner } from './SaveBanner';

function Shell({ notes, onNotesClose }: { notes: string[] | null; onNotesClose: () => void }) {
  const nav = useNav();
  const { store, audio, api, svc } = useApp();
  const g = useGame();
  // жест пользователя для звука (Safari) + пауза в фоне + гарантированная запись при сворачивании
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: false, passive: true });
    const vis = () => { if (document.hidden) { audio.suspend(); void svc.flush(); } else audio.resume(); };
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('pointerdown', unlock); document.removeEventListener('visibilitychange', vis); };
  }, [audio, svc]);
  useEffect(() => { if (__E2E__) (window as unknown as { __game: unknown }).__game = { store, api, svc, audio, nav }; }, [store, api, svc, audio, nav]);
  useEffect(() => { audio.apply(g.settings); }, [audio, g.settings.musicOn, g.settings.sfxOn, g.settings.master, g.settings.music, g.settings.sfx]); // eslint-disable-line
  useEffect(() => { const t = setInterval(() => { if (!document.hidden && store.mode === 'main') api.addPlaySeconds(60); }, 60000); return () => clearInterval(t); }, [api, store]);
  const Comp = ROUTES[nav.top.name];
  const cls = ['app', g.settings.reduceMotion && 'reduce-motion', g.settings.animations === 'low' && 'anim-low'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {store.mode === 'sandbox' && <div className="banner warn" style={{ position: 'absolute', top: 'calc(var(--sat) + 4px)', left: 8, right: 8, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span>🧪 Свободная игра: прогресс не сохраняется</span><Btn small color="red" onClick={() => { store.exitSandbox(); nav.reset('tabs'); }}>Выйти</Btn></div>}
      <div className="screen" key={nav.stack.length + nav.top.name}>{Comp ? <Comp params={nav.top.params || {}} /> : <Missing name={nav.top.name} />}</div>
      {notes && <Sheet mid title="Мы позаботились о твоём прогрессе" onClose={onNotesClose}><div className="stack small">{notes.map((n, i) => <div key={i} className="card flat">{n}</div>)}</div><Btn block onClick={onNotesClose} style={{ marginTop: 12 }}>Понятно</Btn></Sheet>}
      <SaveBanner />
      <UpdateBanner />
      <NoticeCenter />
      <Toasts />
      <ConfettiLayer />
    </div>
  );
}

export function Root() {
  const [booted, setBooted] = useState<Booted | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[] | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    bootstrap().then((b) => {
      window.addEventListener('pagehide', () => { void b.app.svc.flush(); });
      setBooted(b);
      const w = [...b.load.warnings]; if (w.length) setNotes(w);
    }).catch((e) => setFatal(String(e?.message || e)));
  }, []);
  if (fatal) return <div className="app" style={{ padding: 30 }}><h2>Не удалось запустить игру</h2><p>{fatal}</p><p className="muted small">Прогресс не потерян. Перезагрузи страницу. Если ошибка повторяется — открой игру в Safari и проверь, что не включён приватный режим.</p></div>;
  if (!booted) return <div className="app" style={{ display: 'grid', placeItems: 'center' }}><div className="center"><div style={{ width: 140 }}><Nanabo look={CHARACTER_MAP.pip.look} emotion="happy" /></div><div className="bold" style={{ marginTop: 8 }}>Загрузка…</div></div></div>;
  const first = booted.app.store.getState().player.welcomed ? 'tabs' : 'welcome';
  return (
    <AppProvider value={booted.app}>
      <NavProvider initial={{ name: first }}>{() => <Shell notes={notes} onNotesClose={() => setNotes(null)} />}</NavProvider>
    </AppProvider>
  );
}
