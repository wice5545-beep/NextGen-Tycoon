// ============================================================================
//  GameEngine — orchestrates the monthly tick & yearly settlement.
//  Pure & deterministic: same seed + same actions => identical timeline.
// ============================================================================
import {
  GameState,
  Product,
  ProductCategory,
  ProductDesign,
  Game,
  Genre,
  END_YEAR,
} from "@/engine/types";
import { Rng } from "@/engine/rng";
import { clamp, tickEconomy } from "@/engine/economy";
import { tickEvents } from "@/engine/events";
import { tickCompetitors, competitorsYearly } from "@/engine/competitors";
import { tickStock } from "@/engine/stock";
import {
  computeStats,
  computeScore,
  unitCost,
  tickProducts,
  pushLog,
} from "@/engine/products";
import { tickGames, teamQualityFor } from "@/engine/games";
import { GENRE_BY_ID } from "@/data/genres";
import { tickEmployees, totalSalaries } from "@/engine/employees";
import { tickMarketing } from "@/engine/marketing";
import { buildingsSummary } from "@/data/buildings";
import { TECH_BY_ID, researchableTechs } from "@/data/technologies";

/** Advance the simulation by one month. Mutates `state` in place. */
export function tick(state: GameState): GameState {
  if (state.clock.year >= END_YEAR && state.clock.month >= 12) return state; // end of timeline

  const rng = new Rng(state.meta.seed);
  rng.setState(state.meta.rngState);

  // --- advance clock ---
  state.clock.ticks += 1;
  state.clock.month += 1;
  let yearRollover = false;
  if (state.clock.month > 12) {
    state.clock.month = 1;
    state.clock.year += 1;
    yearRollover = true;
  }

  // reset per-month finance accumulators
  state.finance.monthlyRevenue = 0;
  state.finance.monthlyCosts = 0;

  const bSummary = buildingsSummary(state.buildings);

  // --- subsystems (order matters) ---
  tickEconomy(state, rng);
  tickEvents(state, rng);
  tickMarketing(state);
  tickProducts(state, bSummary.hasFactory);
  tickGames(state, rng);
  tickCompetitors(state, rng);
  tickEmployees(state);
  tickStock(state, rng);
  advanceResearch(state, bSummary.rndBonus);

  // --- finance settlement ---
  const salaries = totalSalaries(state);
  const upkeep = bSummary.upkeep;
  state.finance.monthlyCosts += salaries + upkeep;
  const net = state.finance.monthlyRevenue - state.finance.monthlyCosts;
  state.company.cash += net;

  state.finance.history.push({
    year: state.clock.year,
    month: state.clock.month,
    revenue: state.finance.monthlyRevenue,
    costs: state.finance.monthlyCosts,
    cash: state.company.cash,
  });
  if (state.finance.history.length > 240) state.finance.history.shift();

  // valuation = cash + assets + reputation premium
  state.company.valuation =
    state.company.cash +
    state.products.reduce((a, p) => a + p.unitsSold * 5, 0) +
    state.company.reputation * 100_000;
  state.company.innovation = clamp(
    state.research.unlocked.length * 3,
    0,
    100,
  );

  // --- yearly settlement ---
  if (yearRollover) {
    competitorsYearly(state, rng);
    pushLog(
      state,
      `📅 Bilan ${state.clock.year - 1} — Trésorerie : ${Math.round(state.company.cash).toLocaleString()} $`,
      net >= 0 ? "good" : "warn",
    );
  }

  // bankruptcy warning
  if (state.company.cash < -1_000_000) {
    pushLog(state, `🚨 Trésorerie critique ! Risque de faillite.`, "bad");
  }

  state.meta.rngState = rng.getState();
  state.meta.lastTickAt = Date.now();
  return state;
}

// ============================================================================
//  Research
// ============================================================================
function advanceResearch(state: GameState, rndBonus: number): void {
  const r = state.research;
  // points come from R&D-minded employees + building bonus
  const fromStaff = state.employees.reduce(
    (a, e) => a + e.programming * 0.02 + e.creativity * 0.015,
    0,
  );
  r.pointsPerMonth = 1 + rndBonus + fromStaff;
  r.points += r.pointsPerMonth;

  if (r.current) {
    const tech = TECH_BY_ID[r.current];
    if (!tech) {
      r.current = null;
      return;
    }
    r.progress += r.pointsPerMonth;
    if (r.progress >= tech.cost) {
      r.unlocked.push(tech.id);
      r.points = Math.max(0, r.points - tech.cost);
      r.current = null;
      r.progress = 0;
      pushLog(state, `🔬 Recherche terminée : ${tech.name}`, "good");
    }
  }
}

export function startResearch(state: GameState, techId: string): boolean {
  if (state.research.current) return false;
  const avail = researchableTechs(state.clock.year, state.research.unlocked);
  if (!avail.some((t) => t.id === techId)) return false;
  state.research.current = techId;
  state.research.progress = 0;
  return true;
}

// ============================================================================
//  Player actions (mutations exposed to the store)
// ============================================================================
export interface ProductDraft {
  name: string;
  category: ProductCategory;
  componentIds: string[];
  price: number;
  design: ProductDesign;
}

/** R&D budget to bring a product to market = sum of component costs * factor. */
export function productDevCost(draft: ProductDraft): number {
  const bom = unitCost(draft.componentIds, false);
  return Math.round(50_000 + bom * 800);
}

export function createProduct(state: GameState, draft: ProductDraft): { ok: boolean; reason?: string } {
  if (draft.componentIds.length === 0) return { ok: false, reason: "Aucun composant sélectionné." };
  const cost = productDevCost(draft);
  if (state.company.cash < cost) return { ok: false, reason: "Budget insuffisant." };
  if (!state.market.segments[draft.category]?.unlocked)
    return { ok: false, reason: "Segment de marché pas encore disponible." };

  state.company.cash -= cost;
  const stats = computeStats(draft.componentIds, state.research.unlocked);
  const score = computeScore(stats, draft.category);
  const product: Product = {
    id: `prod_${state.logCounter}_${state.clock.ticks}`,
    name: draft.name,
    category: draft.category,
    design: draft.design,
    price: draft.price,
    componentIds: draft.componentIds,
    stats,
    score,
    releaseYear: null,
    releaseMonth: null,
    hype: 5,
    unitsSold: 0,
    unitsLastMonth: 0,
    active: false,
    rndProgress: 0,
  };
  state.products.push(product);
  pushLog(state, `🛠️ Développement lancé : ${product.name}`, "info");
  return { ok: true };
}

export interface GameDraft {
  title: string;
  genre: Genre;
  platformId: string | null;
  budget: number;
  marketing: number;
}

export function createGame(state: GameState, draft: GameDraft): { ok: boolean; reason?: string } {
  const total = draft.budget + draft.marketing;
  if (state.company.cash < total) return { ok: false, reason: "Budget insuffisant." };
  state.company.cash -= total;

  const teamQuality = teamQualityFor(state, draft.genre);
  // dev time scales with budget vs genre baseline (more money → bigger scope)
  const base = teamQualityDevMonths(state, draft.genre);
  const game: Game = {
    id: `game_${state.logCounter}_${state.clock.ticks}`,
    title: draft.title,
    genre: draft.genre,
    platformId: draft.platformId,
    budget: draft.budget,
    devMonthsTotal: base,
    devMonthsDone: 0,
    teamQuality,
    marketing: draft.marketing,
    reviewScore: 0,
    unitsSold: 0,
    unitsLastMonth: 0,
    releaseYear: null,
    shipped: false,
  };
  state.games.push(game);
  pushLog(state, `🎬 Production démarrée : « ${game.title} »`, "info");
  return { ok: true };
}

function teamQualityDevMonths(state: GameState, genre: Genre): number {
  // faster team → shorter dev (down to a floor)
  const speed = state.employees.reduce((a, e) => a + e.speed, 0) / Math.max(1, state.employees.length);
  const base = GENRE_BY_ID[genre].baseDevMonths;
  return Math.max(3, Math.round(base * clamp(1.3 - speed / 120, 0.6, 1.3)));
}
