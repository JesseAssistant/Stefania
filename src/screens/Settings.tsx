import { useApp, useGame } from '../app/ctx';
import { useNav } from '../app/nav';
import { Btn, Chips, Screen, Switch } from '../ui/kit';
import { GAME_VERSION, SCHEMA_VERSION } from '../config';
import type { Settings } from '../game/types';
import { fmt } from '../game/util';

export function SettingsScreen() {
  const g = useGame(); const { api, audio } = useApp(); const nav = useNav();
  const s = g.settings;
  const set = (p: Partial<Settings>) => api.updateSettings(p);
  const hours = Math.floor(g.statistics.playSeconds / 3600), mins = Math.floor((g.statistics.playSeconds % 3600) / 60);
  return (
    <Screen title="⚙️ Настройки">
      <div className="stack">
        <div className="card stack">
          <div className="bold">Звук</div>
          <div className="row between"><span>Музыка</span><Switch on={s.musicOn} onChange={(v) => set({ musicOn: v })} label="Музыка" /></div>
          <div className="row between"><span>Звуки</span><Switch on={s.sfxOn} onChange={(v) => { set({ sfxOn: v }); if (v) audio.sfx('good'); }} label="Звуковые эффекты" /></div>
          {([['master', 'Общая громкость'], ['music', 'Музыка'], ['sfx', 'Звуки']] as const).map(([k, label]) => (
            <label key={k} className="stack" style={{ gap: 2 }}><span className="small muted">{label}: {Math.round(s[k] * 100)}%</span>
              <input type="range" min={0} max={100} value={Math.round(s[k] * 100)} aria-label={label} onChange={(e: { target: { value: string } }) => set({ [k]: Number(e.target.value) / 100 } as Partial<Settings>)} /></label>))}
          <div className="tiny muted">iPhone включает звук только после касания экрана — это правило Safari. Если звука нет, проверь, что выключен беззвучный режим.</div>
        </div>
        <div className="card stack">
          <div className="bold">Анимации</div>
          <Chips<Settings['animations']> value={s.animations} onChange={(v) => set({ animations: v })} options={[{ id: 'high', label: 'Полные' }, { id: 'medium', label: 'Средние' }, { id: 'low', label: 'Минимум (экономит батарею)' }]} />
          <div className="row between"><span>Уменьшить движение</span><Switch on={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} label="Уменьшить движение" /></div>
          <div className="row between"><span>Вибрация</span><Switch on={s.haptics} onChange={(v) => set({ haptics: v })} label="Вибрация" /></div>
        </div>
        <div className="card stack">
          <div className="bold">Прогресс и данные</div>
          <Btn block color="teal" onClick={() => nav.push('save')}>💾 Центр сохранений</Btn>
          <Btn block ghost onClick={() => nav.push('install')}>📲 Установка и офлайн-режим</Btn>
          <Btn block ghost onClick={() => nav.push('sandbox')}>🧪 Свободная игра</Btn>
          <Btn block ghost onClick={() => { api.resetHints(); }}>💡 Показать подсказки заново</Btn>
        </div>
        <div className="card stack">
          <div className="bold">О игре</div>
          <div className="small">Stefania’s Nanabo World · версия {GAME_VERSION} · формат данных {SCHEMA_VERSION}</div>
          <div className="small muted">Сессий: {g.statistics.sessions} · времени в игре: {hours} ч {mins} мин · уровней пройдено: {g.statistics.levelsCleared} · бананов за всё время: {fmt(g.currencies.lifetime.bananas)}</div>
          <div className="small muted">Язык: русский.</div>
        </div>
      </div>
    </Screen>
  );
}
