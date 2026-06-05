// ============================================================================
//  AI competitors — persistent rivals that act every month/year:
//  R&D investment, product launches, bankruptcies, acquisitions & mergers.
// ============================================================================
import type { Competitor, GameState } from "@/engine/types";
import type { Rng } from "@/engine/rng";
import { clamp } from "@/engine/economy";
import { pushLog } from "@/engine/products";
import { makeProductName } from "@/data/names";

/** Monthly behaviour for every living competitor. */
export function tickCompetitors(state: GameState, rng: Rng): void {
  const alive = state.competitors.filter((c) => c.alive);

  for (const c of alive) {
    const trait = personalityFactors(c.personality);

    // R&D investment grows innovation, costs cash
    const rnd = c.cash * trait.rndRate * (0.6 + rng.next() * 0.8);
    c.cash -= rnd;
    c.innovation = clamp(c.innovation + rnd / 200_000, 0, 100);

    // baseline market income proportional to product power & reputation
    const income =
      c.productPower * 1800 * (0.5 + c.reputation / 100) *
      (0.8 + (state.market.sentiment + 1) * 0.2);
    c.cash += income - c.productPower * 600; // running costs

    // occasionally launch a refreshed product → bumps power & reputation
    if (rng.bool(trait.launchChance)) {
      const gain = 20 + c.innovation * 0.5 + rng.range(0, 20);
      c.productPower = clamp(c.productPower * 0.7 + gain, 10, 300);
      c.reputation = clamp(c.reputation + rng.range(1, 5), 0, 100);
      if (rng.bool(0.25)) {
        pushLog(
          state,
          `🏭 ${c.name} lance « ${makeProductName(rng)} » (puissance ${Math.round(c.productPower)})`,
          "info",
        );
      }
    } else {
      // power erodes if they don't iterate
      c.productPower = clamp(c.productPower - rng.range(0.5, 2.5), 5, 300);
    }

    // bankruptcy
    if (c.cash < -2_000_000) {
      c.alive = false;
      pushLog(state, `💀 ${c.name} fait faillite.`, "warn");
    }
  }

  // M&A: wealthy aggressive/premium firms may absorb a weak rival
  maybeAcquire(state, rng);

  recomputeShares(state);
}

function maybeAcquire(state: GameState, rng: Rng): void {
  if (!rng.bool(0.04)) return;
  const living = state.competitors.filter((c) => c.alive);
  const buyer = living
    .filter((c) => c.cash > 8_000_000 && (c.personality === "aggressive" || c.personality === "premium"))
    .sort((a, b) => b.cash - a.cash)[0];
  if (!buyer) return;
  const target = living
    .filter((c) => c.id !== buyer.id && c.productPower < 60)
    .sort((a, b) => a.productPower - b.productPower)[0];
  if (!target) return;

  buyer.cash -= 6_000_000;
  buyer.productPower = clamp(buyer.productPower + target.productPower * 0.6, 10, 320);
  buyer.reputation = clamp(buyer.reputation + 4, 0, 100);
  target.alive = false;
  target.acquired = buyer.id;
  pushLog(state, `🤝 ${buyer.name} rachète ${target.name}.`, "info");
}

/** Yearly strategic recalibration. */
export function competitorsYearly(state: GameState, rng: Rng): void {
  for (const c of state.competitors) {
    if (!c.alive) continue;
    // drift personality occasionally to keep runs fresh
    if (rng.bool(0.08)) {
      c.personality = rng.pick(["aggressive", "innovator", "budget", "premium"]);
    }
    c.valuationHint = c.cash + c.productPower * 50_000 + c.reputation * 80_000;
  }
}

function recomputeShares(state: GameState): void {
  const living = state.competitors.filter((c) => c.alive);
  const playerPower = state.products
    .filter((p) => p.active)
    .reduce((a, p) => a + p.score * 1.2, 0);
  const total = living.reduce((a, c) => a + c.productPower, playerPower) || 1;
  for (const c of living) c.marketShare = c.productPower / total;
}

interface Traits {
  rndRate: number;
  launchChance: number;
}
function personalityFactors(p: Competitor["personality"]): Traits {
  switch (p) {
    case "aggressive": return { rndRate: 0.06, launchChance: 0.22 };
    case "innovator": return { rndRate: 0.1, launchChance: 0.16 };
    case "budget": return { rndRate: 0.03, launchChance: 0.12 };
    case "premium": return { rndRate: 0.07, launchChance: 0.1 };
  }
}
