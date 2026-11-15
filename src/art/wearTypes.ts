import type { ReactNode } from 'react';
import type { CharacterLook } from '../game/types';
import type { Anchors } from './anchors';

/** Что рисует предмет: back — позади тела, inner — на теле (обрезается по силуэту), front — поверх. */
export interface WearParts { back?: ReactNode; inner?: ReactNode; front?: ReactNode }
export interface WearCtx { a: Anchors; look: CharacterLook; c1: string; c2: string; c3: string; uid: string }
export type WearFn = (w: WearCtx) => WearParts;
