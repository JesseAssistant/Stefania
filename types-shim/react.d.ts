// Упрощённые типы React ТОЛЬКО для офлайн-проверки (tsconfig.offline.json).
// В обычной среде (npm ci + CI) используются настоящие @types/react — этот файл не подключается.
declare module 'react' {
  export type Key = string | number;
  export interface ReactElement { type: unknown; props: unknown; key: Key | null }
  export type ReactNode = ReactElement | string | number | boolean | null | undefined | Iterable<ReactNode>;
  export type CSSProperties = { [k: string]: string | number | undefined };
  export type Dispatch<A> = (v: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
  export interface RefObject<T> { current: T | null }
  export interface MutableRefObject<T> { current: T }
  export type Ref<T> = ((i: T | null) => void) | RefObject<T> | null;
  export type FC<P = object> = (props: P) => ReactNode;
  export type ComponentType<P = object> = FC<P>;
  export interface SyntheticEvent<T = Element> { currentTarget: T; target: EventTarget; preventDefault(): void; stopPropagation(): void; nativeEvent: Event }
  export interface PointerEvent<T = Element> extends SyntheticEvent<T> { clientX: number; clientY: number; pointerId: number; pointerType: string; buttons: number }
  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> { target: EventTarget & T }
  export interface KeyboardEvent<T = Element> extends SyntheticEvent<T> { key: string }
  export function useState<S>(init: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(fn: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(fn: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useRef<T>(init: T): MutableRefObject<T>;
  export function useRef<T>(init: T | null): RefObject<T>;
  export function useRef<T = undefined>(): MutableRefObject<T | undefined>;
  export function useMemo<T>(fn: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...a: never[]) => unknown>(fn: T, deps: readonly unknown[]): T;
  export function useId(): string;
  export function useReducer<S, A>(r: (s: S, a: A) => S, init: S): [S, Dispatch<A>];
  export function useSyncExternalStore<T>(sub: (cb: () => void) => () => void, get: () => T, getServer?: () => T): T;
  export function useContext<T>(c: Context<T>): T;
  export interface Context<T> { Provider: FC<{ value: T; children?: ReactNode }>; _t?: T }
  export function createContext<T>(def: T): Context<T>;
  export function memo<P>(c: FC<P>): FC<P>;
  export function createElement(type: unknown, props?: unknown, ...children: unknown[]): ReactElement;
  export const Fragment: unique symbol;
  export const StrictMode: FC<{ children?: ReactNode }>;
  export class Component<P = object, S = object> { props: P; state: S; constructor(p: P); setState(s: Partial<S>): void; render(): ReactNode; static getDerivedStateFromError?(e: unknown): unknown; componentDidCatch?(e: unknown, info: unknown): void }
}
declare module 'react/jsx-runtime' {
  import type { ReactElement, ReactNode, Key } from 'react';
  export namespace JSX {
    type Element = ReactElement;
    type ElementType = string | ((props: any) => ReactNode);
    interface IntrinsicElements { [name: string]: any }
    interface IntrinsicAttributes { key?: Key }
    interface ElementChildrenAttribute { children: unknown }
  }
  export function jsx(type: unknown, props: unknown, key?: Key): ReactElement;
  export function jsxs(type: unknown, props: unknown, key?: Key): ReactElement;
  export const Fragment: unique symbol;
}
declare module 'react-dom/client' {
  export function createRoot(el: Element | DocumentFragment): { render(n: unknown): void; unmount(): void };
}
declare module 'react-dom/server' {
  export function renderToStaticMarkup(n: unknown): string;
  export function renderToString(n: unknown, o?: { identifierPrefix?: string }): string;
}
