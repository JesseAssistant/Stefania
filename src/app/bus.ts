/** Лёгкая шина событий интерфейса (тосты, конфетти). Не хранит игровое состояние. */
type Tone = 'good' | 'bad' | 'info';
export interface ToastMsg { id: number; text: string; tone: Tone }
let seq = 1;
const toastSubs = new Set<(t: ToastMsg) => void>();
const confettiSubs = new Set<() => void>();
export const toast = (text: string, tone: Tone = 'info') => { const m = { id: seq++, text, tone }; toastSubs.forEach((f) => f(m)); };
export const onToast = (f: (t: ToastMsg) => void) => { toastSubs.add(f); return () => { toastSubs.delete(f); }; };
export const fireConfetti = () => confettiSubs.forEach((f) => f());
export const onConfetti = (f: () => void) => { confettiSubs.add(f); return () => { confettiSubs.delete(f); }; };
