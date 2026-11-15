import { useNav } from '../app/nav';
import { useApp, useGame } from '../app/ctx';
import { Home } from './Home';
import { BaseTab } from './Base';
import { MinionsTab } from './Collection';
import { WardrobeTab } from './Wardrobe';
import { ShopTab } from './Shop';
import { claimableCount } from '../game/engine/quests';
import type { ScreenProps } from '../app/routes';

const TABS = [
  { id: 'home', icon: '🏠', label: 'Главная' }, { id: 'base', icon: '🏰', label: 'База' }, { id: 'minions', icon: '🐣', label: 'Нанабо' },
  { id: 'wardrobe', icon: '👗', label: 'Гардероб' }, { id: 'shop', icon: '🛍️', label: 'Магазин' },
];
export function Tabs(_: ScreenProps) {
  const nav = useNav(); const { audio } = useApp(); const g = useGame();
  const body = nav.tab === 'base' ? <BaseTab /> : nav.tab === 'minions' ? <MinionsTab /> : nav.tab === 'wardrobe' ? <WardrobeTab /> : nav.tab === 'shop' ? <ShopTab /> : <Home />;
  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{body}</div>
      <nav className="tabbar" aria-label="Главное меню">
        {TABS.map((t) => <button key={t.id} className={`tab ${nav.tab === t.id ? 'on' : ''}`} aria-current={nav.tab === t.id} onClick={() => { audio.sfx('tap'); nav.setTab(t.id); }}><span className="ti">{t.icon}</span>{t.label}{t.id === 'home' && claimableCount(g) > 0 && <span className="badge-dot" style={{ top: 4, right: '22%' }}>{claimableCount(g)}</span>}</button>)}
      </nav>
    </>
  );
}
