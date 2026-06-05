// ============================================================================
//  Stock market — equities (player + AI), tech basket, fictional crypto.
//  Prices driven by sales, hype, reputation, innovation + noise.
// ============================================================================
import type { GameState, Stock, StockMarket } from "@/engine/types";
import type { Rng } from "@/engine/rng";
import { clamp } from "@/engine/economy";

const HISTORY_CAP = 60;

export function initialStockMarket(state: GameState, rng: Rng): StockMarket {
  const stocks: Stock[] = [];

  // player equity
  stocks.push(mkStock("NGT", state.company.name, "equity", 40, state.company.id));

  // competitor equities (seeded so runs stay deterministic)
  for (const c of state.competitors) {
    stocks.push(mkStock(ticker(c.name), c.name, "equity", 30 + rng.next() * 40, c.id));
  }

  // tech basket + crypto
  stocks.push(mkStock("SEMI", "Semiconducteurs", "tech", 50));
  stocks.push(mkStock("DSPL", "Displays Inc.", "tech", 35));
  stocks.push(mkStock("AICR", "AI Core", "tech", 60));
  stocks.push(mkStock("BTX", "Bitax", "crypto", 12));
  stocks.push(mkStock("ETN", "Etheon", "crypto", 8));

  return { index: 1000, index_history: [1000], stocks };
}

function mkStock(
  ticker: string,
  name: string,
  kind: Stock["kind"],
  price: number,
  ownerId?: string,
): Stock {
  return { ticker, name, kind, price: round2(price), history: [round2(price)], ownerId, shares: 0 };
}

export function tickStock(state: GameState, rng: Rng): void {
  const sm = state.stock;
  let indexSum = 0;
  let count = 0;

  for (const s of sm.stocks) {
    let drift = rng.noise(0.04); // base volatility

    if (s.kind === "crypto") {
      drift += rng.noise(0.12); // crypto is wild
    } else if (s.kind === "tech") {
      drift += state.market.sentiment * 0.02 + rng.noise(0.03);
    } else if (s.ownerId) {
      // equity tied to its company's fundamentals
      const fund = fundamentals(state, s.ownerId);
      drift += fund;
    }
    // overall market sentiment lifts everything a bit
    drift += state.market.sentiment * 0.01;

    s.price = clamp(round2(s.price * (1 + drift)), 0.1, 1_000_000);
    s.history.push(s.price);
    if (s.history.length > HISTORY_CAP) s.history.shift();

    indexSum += s.price;
    count++;
  }

  sm.index = round2((indexSum / Math.max(1, count)) * 20);
  sm.index_history.push(sm.index);
  if (sm.index_history.length > HISTORY_CAP) sm.index_history.shift();
}

/** company-driven price drift (-… to +…). */
function fundamentals(state: GameState, ownerId: string): number {
  if (ownerId === state.company.id) {
    const units = state.products.reduce((a, p) => a + p.unitsLastMonth, 0);
    const hype = state.products.reduce((a, p) => a + p.hype, 0) / Math.max(1, state.products.length);
    return (
      clamp(units / 500_000, -0.05, 0.08) +
      (hype / 100) * 0.02 +
      (state.company.reputation / 100) * 0.01 -
      0.01
    );
  }
  const c = state.competitors.find((x) => x.id === ownerId);
  if (!c || !c.alive) return -0.08; // delisting pressure
  return (
    clamp(c.productPower / 3000, -0.04, 0.05) +
    (c.reputation / 100) * 0.015 +
    (c.innovation / 100) * 0.01 -
    0.012
  );
}

function ticker(name: string): string {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** player buys/sells — used by store actions. returns ok. */
export function trade(state: GameState, ticker: string, qty: number): boolean {
  const s = state.stock.stocks.find((x) => x.ticker === ticker);
  if (!s) return false;
  const cost = s.price * qty;
  if (qty > 0 && state.company.cash < cost) return false; // can't afford
  if (qty < 0 && s.shares < -qty) return false; // can't oversell
  state.company.cash -= cost;
  s.shares += qty;
  return true;
}
