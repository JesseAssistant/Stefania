import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Cost, Currency, Rarity } from '../game/types';
import { CURRENCIES } from '../game/types';
import { CurIcon, RAR_NAME } from './icons';
import { useApp, useGame } from '../app/ctx';
import { useNav } from '../app/nav';
import { fmt } from '../game/util';
import { onConfetti, onToast, type ToastMsg } from '../app/bus';

type Ev = { target: EventTarget; currentTarget: EventTarget };
export function Btn({ children, onClick, color, small, block, xl, ghost, disabled, className = '', style, 'aria-label': aria }: { children?: ReactNode; onClick?: () => void; color?: 'pink' | 'teal' | 'blue' | 'red'; small?: boolean; block?: boolean; xl?: boolean; ghost?: boolean; disabled?: boolean; className?: string; style?: CSSProperties; 'aria-label'?: string }) {
  const { audio } = useApp();
  return <button className={['btn', color, small && 'small', block && 'block', xl && 'xl', ghost && 'ghost', className].filter(Boolean).join(' ')} disabled={disabled} style={style} aria-label={aria}
    onClick={() => { audio.sfx('tap'); onClick?.(); }}>{children}</button>;
}
export function IconBtn({ children, onClick, badge, label }: { children: ReactNode; onClick: () => void; badge?: number; label: string }) {
  const { audio } = useApp();
  return <button className="icon-btn" aria-label={label} onClick={() => { audio.sfx('tap'); onClick(); }}>{children}{badge ? <span className="badge-dot">{badge > 99 ? '99+' : badge}</span> : null}</button>;
}
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}
export function Bar({ value, max, tone }: { value: number; max: number; tone?: 'teal' | 'pink' }) {
  return <div className={`bar ${tone || ''}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}><i style={{ width: `${Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))}%` }} /></div>;
}
export function StarsRow({ n, of = 3 }: { n: number; of?: number }) {
  return <span className="stars" aria-label={`${n} из ${of} звёзд`}>{Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? '' : 'off'}>⭐</span>)}</span>;
}
export const RarTag = ({ r }: { r: Rarity }) => <span className={`tag-rar rar-${r}`}>{RAR_NAME[r]}</span>;

export function CurrencyBar({ only }: { only?: Currency[] }) {
  const g = useGame();
  return <div className="curbar">{(only || CURRENCIES).map((c) => <CurPill key={c} c={c} v={g.currencies[c]} />)}</div>;
}
function CurPill({ c, v }: { c: Currency; v: number }) {
  const prev = useRef(v); const [bump, setBump] = useState(false);
  useEffect(() => { if (prev.current !== v) { prev.current = v; setBump(true); const t = setTimeout(() => setBump(false), 450); return () => clearTimeout(t); } }, [v]);
  return <span className={`cur ${bump ? 'bump' : ''}`} aria-label={`${c}: ${v}`}><CurIcon c={c} />{fmt(v)}</span>;
}
/** Цена: красным подсвечивается нехватающая валюта. */
export function CostView({ cost, discount }: { cost: Cost; discount?: boolean }) {
  const g = useGame();
  const entries = (Object.entries(cost) as [Currency, number][]).filter(([, n]) => n > 0);
  if (!entries.length) return <span className="bold">Бесплатно</span>;
  return <span className="row gap-s wrap" style={{ display: 'inline-flex' }}>{entries.map(([c, n]) => <span key={c} className="bold" style={{ color: g.currencies[c] >= n ? undefined : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><CurIcon c={c} />{fmt(n)}</span>)}{discount && <span className="tiny" style={{ color: 'var(--green)' }}>скидка</span>}</span>;
}

export function Screen({ title, children, onBack, right, tabs = false, noBack, scroll = true, bg }: { title?: ReactNode; children: ReactNode; onBack?: () => void; right?: ReactNode; tabs?: boolean; noBack?: boolean; scroll?: boolean; bg?: string }) {
  const nav = useNav();
  return (
    <>
      <div className="topbar" style={bg ? { background: bg } : undefined}>
        {!noBack && nav.stack.length > 1 && <IconBtn label="Назад" onClick={onBack || nav.pop}>←</IconBtn>}
        <h1>{title}</h1>
        {right}
      </div>
      {scroll ? <div className={`content ${tabs ? 'with-tabs' : ''}`}>{children}</div> : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>}
    </>
  );
}
export function Sheet({ children, onClose, mid, title }: { children: ReactNode; onClose?: () => void; mid?: boolean; title?: ReactNode }) {
  return (
    <div className={`overlay ${mid ? 'mid' : ''}`} onClick={(e: Ev) => { if (e.target === e.currentTarget) onClose?.(); }} role="dialog" aria-modal="true">
      <div className="sheet">
        {!mid && <div className="grabber" />}
        {title && <h2 className="center" style={{ marginBottom: 10 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  const { audio } = useApp();
  return <div className="chip-row" role="tablist">{options.map((o) => <button key={o.id} role="tab" aria-selected={o.id === value} className={`chip ${o.id === value ? 'on' : ''}`} onClick={() => { audio.sfx('tap'); onChange(o.id); }}>{o.label}</button>)}</div>;
}
export function Empty({ icon = '🍌', text, action }: { icon?: string; text: string; action?: ReactNode }) {
  return <div className="center stack" style={{ padding: 28, alignItems: 'center' }}><div className="emoji l">{icon}</div><div className="muted">{text}</div>{action}</div>;
}

export function Toasts() {
  const [list, setList] = useState<ToastMsg[]>([]);
  useEffect(() => onToast((t) => { setList((l) => [...l.slice(-2), t]); setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 3000); }), []);
  return <div className="toasts" aria-live="polite">{list.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.text}</div>)}</div>;
}
export function ConfettiLayer() {
  const [burst, setBurst] = useState(0);
  useEffect(() => onConfetti(() => { setBurst((b) => b + 1); setTimeout(() => setBurst(0), 2600); }), []);
  if (!burst) return null;
  const cols = ['#FFD93D', '#FF7FA8', '#3CCFC0', '#5B8CFF', '#9B6BFF', '#FF9F43'];
  return <div className="confetti" key={burst} style={{ zIndex: 50 }}>{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, background: cols[i % cols.length], animationDelay: `${(i % 9) * 0.06}s`, animationDuration: `${1.8 + (i % 5) * 0.25}s` }} />)}</div>;
}
