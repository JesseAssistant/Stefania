import { useEffect, useState } from 'react';
import { useApp } from './ctx';
import { useNav } from './nav';
import { Btn } from '../ui/kit';
import type { SaveStatus } from '../storage/saveService';

/** Если сохранить не удалось — игрок видит это сразу и может выгрузить прогресс вручную. */
export function SaveBanner() {
  const { svc } = useApp();
  const nav = useNav();
  const [st, setSt] = useState<SaveStatus>(svc.status);
  useEffect(() => svc.subscribe(setSt), [svc]);
  if (st.phase !== 'error' || st.failures < 2) return null;
  return <div className="banner warn" style={{ position: 'absolute', left: 10, right: 10, top: 'calc(var(--sat) + 8px)', zIndex: 35 }}>
    <div>⚠️ Не удаётся сохранить прогресс на устройстве.</div>
    <div className="small" style={{ fontWeight: 600, margin: '4px 0' }}>Игра попробует снова. На всякий случай выгрузи копию сохранения.</div>
    <Btn small color="red" onClick={() => nav.push('save')}>Открыть центр сохранений</Btn></div>;
}
