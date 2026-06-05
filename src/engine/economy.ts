// ============================================================================
//  Economy subsystem — world market size, segment growth, macro cycle.
// ============================================================================
import type { GameState, MarketState, ProductCategory } from "@/engine/types";
import type { Rng } from "@/engine/rng";

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Which segments are unlocked from a given year (tech eras roughly). */
export function segmentUnlockYear(cat: ProductCategory): number {
  switch (cat) {
    case "console_home": return 1972;
    case "handheld": return 1980;
    case "pc": return 1990;
    case "phone": return 2008;
    case "vr_ar": return 2014;
    case "cloud": return 2013;
  }
}

/** Build the initial market state at game start. */
export function initialMarket(year: number): MarketState {
  const cats: ProductCategory[] = ["console_home", "handheld", "vr_ar", "phone", "pc", "cloud"];
  const segments = {} as MarketState["segments"];
  for (const c of cats) {
    const unlocked = year >= segmentUnlockYear(c);
    segments[c] = {
      size: unlocked ? baseSegmentSize(c) : 0,
      growth: 0.012,
      unlocked,
    };
  }
  return { worldSize: 1, sentiment: 0.1, cycle: 0, segments };
}

function baseSegmentSize(c: ProductCategory): number {
  switch (c) {
    case "console_home": return 200_000;
    case "handheld": return 120_000;
    case "pc": return 90_000;
    case "phone": return 0;
    case "vr_ar": return 0;
    case "cloud": return 0;
  }
}

/**
 * Monthly economy update.
 * - macro cycle gently oscillates and is nudged by events (via sentiment).
 * - each unlocked segment grows; newly-reached eras come online.
 * - Q4 seasonality lifts demand (holidays).
 */
export function tickEconomy(state: GameState, rng: Rng): void {
  const m = state.market;
  m.cycle += 0.08;
  const macro = Math.sin(m.cycle) * 0.4 + rng.noise(0.05);
  // sentiment drifts toward the macro signal
  m.sentiment = clamp(lerp(m.sentiment, macro, 0.1), -1, 1);

  const year = state.clock.year;

  for (const cat of Object.keys(m.segments) as ProductCategory[]) {
    const seg = m.segments[cat];
    if (!seg.unlocked && year >= segmentUnlockYear(cat)) {
      seg.unlocked = true;
      seg.size = newSegmentSeed(cat);
    }
    if (!seg.unlocked) continue;

    // growth accelerates for younger segments, decelerates for mature ones.
    // (Holiday-quarter seasonality is applied at sale time via seasonalMultiplier,
    //  not baked into segment size, to avoid permanent inflation.)
    const ageBoost = clamp(1.4 - seg.size / 5_000_000, 0.4, 1.4);
    const g = seg.growth * ageBoost * (1 + m.sentiment * 0.5);
    seg.size = Math.max(0, seg.size * (1 + g));
  }
  m.worldSize = Object.values(m.segments).reduce((a, s) => a + s.size, 0);
}

function newSegmentSeed(cat: ProductCategory): number {
  switch (cat) {
    case "phone": return 300_000;
    case "vr_ar": return 60_000;
    case "cloud": return 80_000;
    default: return 100_000;
  }
}

/** Apply seasonal multiplier on read (used by sales) without mutating state. */
export function seasonalMultiplier(month: number): number {
  return month >= 10 ? 1.25 : month <= 2 ? 0.9 : 1.0;
}
