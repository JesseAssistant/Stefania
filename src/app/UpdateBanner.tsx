import { useEffect, useState } from 'react';
import { onUpdateAvailable, applyUpdate } from '../pwa/register';
import { useApp } from './ctx';
import { Btn } from '../ui/kit';

export function UpdateBanner() {
  const [w, setW] = useState(false);
  const { svc } = useApp();
  useEffect(() => onUpdateAvailable(setW), []);
  if (!w) return null;
  return <div className="banner info" style={{ position: 'absolute', left: 10, right: 10, bottom: 'calc(var(--tab-h) + var(--sab) + 10px)', zIndex: 15, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
    <span>✨ Доступна новая версия. Прогресс сохранится.</span><Btn small onClick={async () => { await svc.flush(); applyUpdate(); }}>Обновить</Btn></div>;
}
