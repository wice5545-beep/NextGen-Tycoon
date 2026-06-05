// ============================================================================
//  Products subsystem — stat computation, scoring & monthly sales.
// ============================================================================
import type { GameState, Product, ProductCategory, ProductStats } from "@/engine/types";
import { COMPONENT_BY_ID } from "@/data/components";
import { TECH_BY_ID } from "@/data/technologies";
import { clamp, seasonalMultiplier } from "@/engine/economy";

const EMPTY_STATS: ProductStats = {
  performance: 0,
  reliability: 0,
  thermals: 0,
  battery: 0,
  satisfaction: 0,
};

/** Sum component contributions + tech boosts, clamped to 0..100. */
export function computeStats(
  componentIds: string[],
  unlockedTech: string[],
): ProductStats {
  const s: ProductStats = { ...EMPTY_STATS };
  for (const id of componentIds) {
    const c = COMPONENT_BY_ID[id];
    if (!c) continue;
    for (const k of Object.keys(c.stats) as (keyof ProductStats)[]) {
      s[k] += c.stats[k] ?? 0;
    }
  }
  // tech boosts raise ceilings for owned tech
  for (const tid of unlockedTech) {
    const t = TECH_BY_ID[tid];
    if (!t?.boosts) continue;
    for (const k of Object.keys(t.boosts) as (keyof ProductStats)[]) {
      s[k] += (t.boosts[k] ?? 0) * 0.25;
    }
  }
  for (const k of Object.keys(s) as (keyof ProductStats)[]) {
    s[k] = clamp(Math.round(s[k]), 0, 100);
  }
  return s;
}

/** Per-category stat weighting → overall 0..100 consumer score. */
const WEIGHTS: Record<ProductCategory, ProductStats> = {
  console_home: { performance: 0.4, reliability: 0.2, thermals: 0.15, battery: 0.0, satisfaction: 0.25 },
  handheld: { performance: 0.25, reliability: 0.15, thermals: 0.1, battery: 0.3, satisfaction: 0.2 },
  vr_ar: { performance: 0.35, reliability: 0.15, thermals: 0.1, battery: 0.1, satisfaction: 0.3 },
  phone: { performance: 0.3, reliability: 0.15, thermals: 0.1, battery: 0.25, satisfaction: 0.2 },
  pc: { performance: 0.45, reliability: 0.2, thermals: 0.15, battery: 0.0, satisfaction: 0.2 },
  cloud: { performance: 0.3, reliability: 0.3, thermals: 0.0, battery: 0.0, satisfaction: 0.4 },
};

export function computeScore(stats: ProductStats, category: ProductCategory): number {
  const w = WEIGHTS[category];
  let score = 0;
  let wsum = 0;
  for (const k of Object.keys(w) as (keyof ProductStats)[]) {
    score += stats[k] * w[k];
    wsum += w[k];
  }
  return clamp(Math.round(score / (wsum || 1)), 0, 100);
}

/** Bill-of-materials unit cost (with factory discount). */
export function unitCost(componentIds: string[], hasFactory: boolean): number {
  let c = 0;
  for (const id of componentIds) c += COMPONENT_BY_ID[id]?.cost ?? 0;
  c *= 1.4; // assembly + margin overhead
  if (hasFactory) c *= 0.75;
  return Math.round(c);
}

/**
 * Monthly demand for one active product.
 * Demand = segment size share * appeal(score, price) * hype * sentiment.
 */
export function productMonthlySales(state: GameState, p: Product): number {
  if (!p.active || p.releaseYear == null) return 0;
  const seg = state.market.segments[p.category];
  if (!seg?.unlocked) return 0;

  // appeal from value-for-money: high score vs price
  const fairPrice = 80 + p.score * 6; // expected price for this score
  const priceRatio = fairPrice / Math.max(1, p.price);
  const valueAppeal = clamp(priceRatio, 0.2, 1.8);

  const quality = Math.pow(p.score / 100, 1.5);
  const hypeMult = 0.6 + (p.hype / 100) * 1.2;
  const sentiment = 0.7 + (state.market.sentiment + 1) * 0.3;

  // competition pressure: stronger rivals shrink our slice
  const rivalPower = state.competitors
    .filter((c) => c.alive)
    .reduce((a, c) => a + c.productPower, 0);
  const compShare = 1 / (1 + rivalPower / 400);

  // age decay — products sell hardest near launch
  const monthsSince =
    (state.clock.year - p.releaseYear) * 12 + (state.clock.month - (p.releaseMonth ?? 1));
  const lifecycle = Math.exp(-Math.max(0, monthsSince) / 30);

  const season = seasonalMultiplier(state.clock.month);
  const base = seg.size * 0.12;
  const units = base * quality * valueAppeal * hypeMult * sentiment * compShare * lifecycle * season;
  return Math.max(0, Math.round(units));
}

/** advance R&D of in-development products; ship when ready. */
export function tickProducts(state: GameState, hasFactory: boolean): void {
  for (const p of state.products) {
    if (!p.active) {
      // in development
      p.rndProgress = clamp(p.rndProgress + devSpeed(state), 0, 100);
      if (p.rndProgress >= 100) {
        p.active = true;
        p.releaseYear = state.clock.year;
        p.releaseMonth = state.clock.month;
        pushLog(state, `🚀 Lancement produit : ${p.name} (score ${p.score})`, "good");
      }
      continue;
    }
    // hype naturally decays once shipped
    p.hype = clamp(p.hype - 4, 0, 100);
    const sold = productMonthlySales(state, p);
    p.unitsLastMonth = sold;
    p.unitsSold += sold;
    const revenue = sold * p.price;
    const cogs = sold * unitCost(p.componentIds, hasFactory);
    state.finance.monthlyRevenue += revenue;
    state.finance.monthlyCosts += cogs;
  }
}

function devSpeed(state: GameState): number {
  // engineers accelerate development
  const eng = state.employees.reduce(
    (a, e) => a + e.programming * 0.4 + e.speed * 0.6,
    0,
  );
  return clamp(4 + eng / 40, 4, 30);
}

export function pushLog(
  state: GameState,
  text: string,
  severity: GameState["log"][number]["severity"] = "info",
): void {
  state.logCounter += 1;
  state.log.unshift({
    id: state.logCounter,
    year: state.clock.year,
    month: state.clock.month,
    text,
    severity,
  });
  if (state.log.length > 200) state.log.length = 200;
}
