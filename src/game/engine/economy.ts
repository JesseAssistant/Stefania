import { CURRENCIES, GameError } from '../types';
import type { Cost, Currency, GameState } from '../types';
import { isInt } from '../util';
import type { Ctx } from './context';
import { nowIso } from './context';

/**
 * ЕДИНЫЙ сервис экономики. Любое изменение валюты в игре проходит ТОЛЬКО через earn() и spend().
 * Инварианты: суммы — целые неотрицательные числа; нельзя уйти в минус; нельзя потратить больше, чем есть.
 */
const LEDGER_MAX = 60;

function pushLedger(d: GameState, ctx: Ctx, currency: Currency, delta: number, reason: string) {
  d.currencies.ledger.push({ at: nowIso(ctx), currency, delta, reason });
  if (d.currencies.ledger.length > LEDGER_MAX) d.currencies.ledger.splice(0, d.currencies.ledger.length - LEDGER_MAX);
}

export function normalizeCost(cost: Cost): Cost {
  const out: Cost = {};
  for (const c of CURRENCIES) {
    const v = cost[c];
    if (v === undefined || v === 0) continue;
    if (!isInt(v) || v < 0) throw new GameError('bad_cost', 'Некорректная стоимость');
    out[c] = v;
  }
  return out;
}
export function canAfford(d: GameState, cost: Cost): boolean {
  for (const c of CURRENCIES) if ((cost[c] || 0) > d.currencies[c]) return false;
  return true;
}
export function missing(d: GameState, cost: Cost): Cost {
  const m: Cost = {};
  for (const c of CURRENCIES) { const need = (cost[c] || 0) - d.currencies[c]; if (need > 0) m[c] = need; }
  return m;
}
export function earn(d: GameState, ctx: Ctx, currency: Currency, amount: number, reason: string): void {
  if (amount === 0) return;
  if (!isInt(amount) || amount < 0) throw new GameError('bad_amount', `Некорректное начисление: ${amount}`);
  d.currencies[currency] += amount;
  d.currencies.lifetime[currency] += amount;
  pushLedger(d, ctx, currency, amount, reason);
  ctx.emit({ type: 'currency_earned', currency, amount, reason });
}
export function spend(d: GameState, ctx: Ctx, cost: Cost, reason: string): void {
  const c = normalizeCost(cost);
  if (!canAfford(d, c)) throw new GameError('insufficient', 'Не хватает валюты для покупки');
  for (const cur of CURRENCIES) {
    const v = c[cur] || 0;
    if (!v) continue;
    d.currencies[cur] -= v;
    const key = cur === 'bananas' ? 'spentBananas' : cur === 'coins' ? 'spentCoins' : 'spentCrystals';
    d.currencies.lifetime[key] += v;
    pushLedger(d, ctx, cur, -v, reason);
  }
}
/** Проверка инвариантов валюты (вызывается перед фиксацией транзакции и при импорте). */
export function assertWalletValid(d: GameState): void {
  for (const c of CURRENCIES) {
    const v = d.currencies[c];
    if (!isInt(v) || v < 0) throw new GameError('wallet_invalid', `Недопустимый баланс ${c}: ${v}`);
  }
}
export function costText(cost: Cost): string {
  const names: Record<Currency, string> = { bananas: 'бананов', coins: 'монет', crystals: 'кристаллов' };
  return CURRENCIES.filter((c) => cost[c]).map((c) => `${cost[c]} ${names[c]}`).join(' + ') || 'бесплатно';
}
export function scaleCost(cost: Cost, k: number): Cost {
  const out: Cost = {};
  for (const c of CURRENCIES) if (cost[c]) out[c] = Math.max(1, Math.ceil((cost[c] as number) * k));
  return out;
}
