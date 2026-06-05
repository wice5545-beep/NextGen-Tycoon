// ============================================================================
//  NextGen Tycoon — Domain types (engine)
//  Everything here is plain serializable data: a GameState round-trips through
//  JSON.stringify with zero loss, which is what makes save/load trivial.
// ============================================================================

export const SAVE_VERSION = 1;

export const START_YEAR = 1970;
export const END_YEAR = 2100;

export type Severity = "info" | "good" | "warn" | "bad";

export type ProductCategory =
  | "console_home"
  | "handheld"
  | "vr_ar"
  | "phone"
  | "pc"
  | "cloud";

export type Genre =
  | "fps"
  | "rpg"
  | "mmo"
  | "survival"
  | "horror"
  | "sandbox"
  | "simulation"
  | "open_world";

export type EmployeeTier =
  | "junior"
  | "confirmed"
  | "senior"
  | "expert"
  | "legend";

export type BuildingId =
  | "garage"
  | "office"
  | "campus"
  | "hq"
  | "rnd_center"
  | "factory"
  | "data_center";

export type AiPersonality = "aggressive" | "innovator" | "budget" | "premium";

export type StockKind = "equity" | "tech" | "crypto";

// --- Tech tree --------------------------------------------------------------
export interface Technology {
  id: string;
  name: string;
  category: string;
  eraStart: number;
  eraEnd: number;
  cost: number; // research points
  requires: string[];
  description: string;
  /** stat boosts unlocked products can leverage */
  boosts?: Partial<Record<keyof ProductStats, number>>;
}

export interface ProductStats {
  performance: number;
  reliability: number;
  thermals: number; // higher = cooler/better
  battery: number;
  satisfaction: number;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: ProductCategory[] | "all";
  requiresTech?: string;
  cost: number; // unit BOM cost
  era: number; // year available from
  stats: Partial<ProductStats>;
}

// --- Player-owned entities --------------------------------------------------
export interface ProductDesign {
  color: string;
  formFactor: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  design: ProductDesign;
  price: number;
  componentIds: string[];
  stats: ProductStats;
  /** 0..100 overall consumer score */
  score: number;
  releaseYear: number | null;
  releaseMonth: number | null;
  hype: number; // 0..100
  unitsSold: number;
  unitsLastMonth: number;
  active: boolean;
  rndProgress: number; // 0..100 before it can ship
}

export interface Game {
  id: string;
  title: string;
  genre: Genre;
  platformId: string | null;
  budget: number;
  devMonthsTotal: number;
  devMonthsDone: number;
  teamQuality: number; // derived snapshot at start
  marketing: number;
  reviewScore: number; // 0..100, set on release
  unitsSold: number;
  unitsLastMonth: number;
  releaseYear: number | null;
  shipped: boolean;
}

export interface Employee {
  id: string;
  name: string;
  tier: EmployeeTier;
  programming: number;
  design: number;
  management: number;
  creativity: number;
  speed: number;
  salary: number;
  xp: number;
  hiredYear: number;
}

export interface Campaign {
  id: string;
  productId: string;
  channel: "social" | "tv" | "influencer" | "event" | "teaser";
  spend: number;
  monthsLeft: number;
  power: number;
}

export interface Company {
  id: string;
  name: string;
  foundedYear: number;
  cash: number;
  debt: number;
  valuation: number;
  reputation: number; // 0..100
  innovation: number; // 0..100
}

export interface Competitor {
  id: string;
  name: string;
  personality: AiPersonality;
  cash: number;
  reputation: number;
  innovation: number;
  marketShare: number; // 0..1 (recomputed)
  productPower: number; // headline product strength
  alive: boolean;
  foundedYear: number;
  acquired?: string; // id of acquirer if merged/bought
  valuationHint?: number; // cached buyout valuation (set yearly)
}

// --- Market & finance -------------------------------------------------------
export interface MarketSegment {
  size: number; // current monthly addressable units
  growth: number; // monthly growth rate
  unlocked: boolean;
}

export interface MarketState {
  worldSize: number;
  sentiment: number; // -1..1
  cycle: number; // macro phase accumulator
  segments: Record<ProductCategory, MarketSegment>;
}

export interface Stock {
  ticker: string;
  name: string;
  kind: StockKind;
  price: number;
  history: number[]; // capped ring of recent prices
  ownerId?: string; // competitor/company id if equity
  shares: number; // shares owned by player
}

export interface StockMarket {
  index: number;
  index_history: number[];
  stocks: Stock[];
}

// --- Events -----------------------------------------------------------------
export interface EventEffect {
  type:
    | "market_sentiment"
    | "segment_mult"
    | "company_cash"
    | "company_reputation"
    | "unlock_tech"
    | "stock_shock"
    | "hype_global";
  target?: string; // segment / tech / ticker
  value: number;
}

export interface EventDef {
  key: string;
  title: string;
  description: string;
  severity: Severity;
  weight: number;
  eraStart: number;
  eraEnd: number;
  cooldown: number; // months before it can fire again
  effects: EventEffect[];
}

export interface GameEvent {
  key: string;
  title: string;
  description: string;
  severity: Severity;
  year: number;
  month: number;
}

export interface LogEntry {
  id: number;
  year: number;
  month: number;
  text: string;
  severity: Severity;
}

// --- Research ---------------------------------------------------------------
export interface ResearchState {
  unlocked: string[];
  current: string | null;
  progress: number; // points into current
  points: number; // banked points
  pointsPerMonth: number;
}

// --- Root state -------------------------------------------------------------
export interface GameState {
  meta: {
    seed: number;
    version: number;
    createdAt: number;
    lastTickAt: number;
    rngState: number; // current PRNG cursor (keeps determinism across saves)
  };
  clock: { year: number; month: number; ticks: number };
  company: Company;
  competitors: Competitor[];
  market: MarketState;
  stock: StockMarket;
  research: ResearchState;
  products: Product[];
  games: Game[];
  employees: Employee[];
  buildings: BuildingId[];
  campaigns: Campaign[];
  events: GameEvent[];
  eventCooldowns: Record<string, number>;
  log: LogEntry[];
  logCounter: number;
  finance: {
    monthlyRevenue: number;
    monthlyCosts: number;
    history: { year: number; month: number; revenue: number; costs: number; cash: number }[];
  };
}
