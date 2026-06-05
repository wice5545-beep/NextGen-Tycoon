// ============================================================================
//  New game factory — builds a fresh, deterministic GameState from a seed.
// ============================================================================
import {
  GameState,
  Competitor,
  AiPersonality,
  SAVE_VERSION,
  START_YEAR,
} from "@/engine/types";
import { Rng } from "@/engine/rng";
import { initialMarket } from "@/engine/economy";
import { initialStockMarket } from "@/engine/stock";
import { makeCandidate } from "@/engine/employees";
import { COMPETITOR_NAMES } from "@/data/names";

export interface NewGameOptions {
  companyName: string;
  seed: number;
  startYear?: number;
}

export function createNewGame(opts: NewGameOptions): GameState {
  const seed = opts.seed >>> 0;
  const rng = new Rng(seed);
  const year = opts.startYear ?? START_YEAR;

  // --- competitors: 12+ persistent AI firms with original names ---
  const personalities: AiPersonality[] = ["aggressive", "innovator", "budget", "premium"];
  const names = rng.shuffle([...COMPETITOR_NAMES]).slice(0, 13);
  const competitors: Competitor[] = names.map((name, i) => ({
    id: `ai_${i}_${seed}`,
    name,
    personality: rng.pick(personalities),
    cash: rng.range(1_000_000, 6_000_000),
    reputation: rng.range(30, 70),
    innovation: rng.range(20, 60),
    marketShare: 0,
    productPower: rng.range(20, 80),
    alive: true,
    foundedYear: year - rng.int(0, 5),
  }));

  // --- player's starting state ---
  const state: GameState = {
    meta: {
      seed,
      version: SAVE_VERSION,
      createdAt: Date.now(),
      lastTickAt: Date.now(),
      rngState: rng.getState(),
    },
    clock: { year, month: 1, ticks: 0 },
    company: {
      id: `co_${seed}`,
      name: opts.companyName || "Ma Société",
      foundedYear: year,
      cash: 500_000,
      debt: 0,
      valuation: 500_000,
      reputation: 25,
      innovation: 10,
    },
    competitors,
    market: initialMarket(year),
    stock: { index: 1000, index_history: [1000], stocks: [] }, // filled below
    research: {
      unlocked: [],
      current: null,
      progress: 0,
      points: 0,
      pointsPerMonth: 1,
    },
    products: [],
    games: [],
    employees: [
      makeCandidate(rng, "junior", year),
      makeCandidate(rng, "confirmed", year),
    ],
    buildings: ["garage"],
    campaigns: [],
    events: [],
    eventCooldowns: {},
    log: [],
    logCounter: 0,
    finance: { monthlyRevenue: 0, monthlyCosts: 0, history: [] },
  };

  // stock market needs company + competitors to exist first
  state.stock = initialStockMarket(state, rng);

  // persist rng cursor after all setup randomness
  state.meta.rngState = rng.getState();

  state.log.unshift({
    id: ++state.logCounter,
    year,
    month: 1,
    text: `🏁 ${state.company.name} fondée en ${year}. Bonne chance !`,
    severity: "good",
  });

  return state;
}
