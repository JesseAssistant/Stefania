import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Route { name: string; params?: Record<string, unknown> }
export interface Nav {
  stack: Route[]; top: Route;
  push: (name: string, params?: Record<string, unknown>) => void;
  pop: () => void;
  replace: (name: string, params?: Record<string, unknown>) => void;
  reset: (name: string, params?: Record<string, unknown>) => void;
  popTo: (name: string) => void;
  tab: string; setTab: (t: string) => void;
}
const NavCtx = createContext<Nav>(null as unknown as Nav);
export const useNav = () => useContext(NavCtx);
export function NavProvider({ initial, children }: { initial: Route; children: (nav: Nav) => ReactNode }) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const [tab, setTab] = useState('home');
  const push = useCallback((name: string, params?: Record<string, unknown>) => setStack((s) => [...s, { name, params }]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const replace = useCallback((name: string, params?: Record<string, unknown>) => setStack((s) => [...s.slice(0, -1), { name, params }]), []);
  const reset = useCallback((name: string, params?: Record<string, unknown>) => setStack([{ name, params }]), []);
  const popTo = useCallback((name: string) => setStack((s) => { const i = s.map((r) => r.name).lastIndexOf(name); return i >= 0 ? s.slice(0, i + 1) : s; }), []);
  const nav = useMemo<Nav>(() => ({ stack, top: stack[stack.length - 1], push, pop, replace, reset, popTo, tab, setTab }), [stack, push, pop, replace, reset, popTo, tab]);
  return <NavCtx.Provider value={nav}>{children(nav)}</NavCtx.Provider>;
}
