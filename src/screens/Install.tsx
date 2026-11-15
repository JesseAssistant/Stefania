import { useEffect, useState } from 'react';
import { useApp } from '../app/ctx';
import { Btn, Screen } from '../ui/kit';
import { GAME_VERSION } from '../config';
import { requestPersistence, storageInfo } from '../storage/saveService';
import { toast } from '../app/bus';

const isStandalone = () => (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function InstallScreen() {
  const { api } = useApp();
  const [standalone] = useState(isStandalone());
  const [swState, setSwState] = useState<'checking' | 'ready' | 'none'>('checking');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    api.dismissInstall();
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then((r) => setSwState(r && r.active ? 'ready' : 'none')).catch(() => setSwState('none')); else setSwState('none');
    void storageInfo().then((i) => setPersisted(i.persisted));
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [api]);
  const ios = isIos();
  return (
    <Screen title="📲 Установка и офлайн">
      <div className="stack">
        <div className="card stack">
          <div className="bold">{standalone ? '✅ Игра установлена на экран «Домой»' : 'Поставь игру на экран «Домой»'}</div>
          {!standalone && (ios ? <ol className="small" style={{ paddingLeft: 20, margin: 0, display: 'grid', gap: 6 }}>
            <li>Открой игру в <b>Safari</b> (не в другом браузере и не во встроенном просмотре ссылок).</li>
            <li>Нажми кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх).</li>
            <li>Выбери <b>«На экран “Домой”»</b> и нажми «Добавить».</li>
            <li>Запускай игру с новой иконки — она откроется на весь экран.</li></ol>
            : <div className="small muted">В меню браузера выбери «Установить приложение» или «Добавить на главный экран».</div>)}
          <div className="small muted">Установленная игра надёжнее хранит прогресс: Safari реже очищает данные у приложений на экране «Домой».</div>
        </div>
        <div className="card stack">
          <div className="bold">Офлайн-режим</div>
          <div className="small">{swState === 'ready' ? '✅ Игра сохранена на устройстве и работает без интернета.' : swState === 'checking' ? 'Проверяю…' : '⚠️ Офлайн-режим пока не готов. Открой игру один раз с интернетом и подожди несколько секунд.'}</div>
          <div className="small muted">Сейчас: {online ? 'есть интернет' : 'интернета нет — это нормально, игра работает'}.</div>
          <div className="small muted">Версия игры: {GAME_VERSION}. Новые версии игра скачивает сама и предлагает обновиться — прогресс при этом не меняется.</div>
          <Btn small ghost onClick={async () => { const r = await navigator.serviceWorker?.getRegistration(); if (!r) { toast('Офлайн-режим ещё не включён', 'bad'); return; } try { await r.update(); toast('Проверка выполнена. Если есть новая версия, появится кнопка «Обновить».', 'good'); } catch { toast('Не удалось проверить (нет интернета?)', 'bad'); } }}>Проверить обновление</Btn>
        </div>
        <div className="card stack">
          <div className="bold">Защита прогресса</div>
          <div className="small">{persisted === true ? '✅ Постоянное хранилище включено.' : persisted === false ? '⚠️ Постоянное хранилище не включено — иногда браузер может очистить данные.' : 'Состояние хранилища неизвестно.'}</div>
          {persisted === false && <Btn small ghost onClick={async () => { const ok = await requestPersistence(); setPersisted(ok); toast(ok ? 'Включено' : 'Браузер не разрешил. Сначала установи игру на экран «Домой».', ok ? 'good' : 'bad'); }}>Запросить постоянное хранилище</Btn>}
          <div className="small muted">Главное правило: время от времени сохраняй файл в «Центре сохранений» — тогда прогресс не потеряется ни при каких обстоятельствах.</div>
        </div>
      </div>
    </Screen>
  );
}
