// ============================================================================
//  World events — weighted RNG, era-gated, with concrete effects.
//  Determinism: all randomness comes from the seeded Rng.
// ============================================================================
import type { EventDef, EventEffect, GameState, ProductCategory } from "@/engine/types";
import type { Rng } from "@/engine/rng";
import { clamp } from "@/engine/economy";
import { pushLog } from "@/engine/products";
import { researchableTechs } from "@/data/technologies";

export const EVENTS: EventDef[] = [
  {
    key: "econ_crisis",
    title: "Crise économique mondiale",
    description: "Récession brutale. La consommation s'effondre, ventes -40%.",
    severity: "bad",
    weight: 6,
    eraStart: 1973,
    eraEnd: 2100,
    cooldown: 48,
    effects: [
      { type: "market_sentiment", value: -0.6 },
      { type: "stock_shock", value: -0.25 },
    ],
  },
  {
    key: "component_shortage",
    title: "Pénurie de composants",
    description: "Chaîne d'appro perturbée : production ralentie, coûts en hausse.",
    severity: "warn",
    weight: 8,
    eraStart: 1980,
    eraEnd: 2100,
    cooldown: 30,
    effects: [
      { type: "segment_mult", target: "console_home", value: -0.2 },
      { type: "company_cash", value: -0.05 },
    ],
  },
  {
    key: "gaming_boom",
    title: "Boom du gaming",
    description: "Le jeu vidéo explose dans la culture mainstream. Hype +35%.",
    severity: "good",
    weight: 9,
    eraStart: 1978,
    eraEnd: 2100,
    cooldown: 36,
    effects: [
      { type: "market_sentiment", value: 0.5 },
      { type: "hype_global", value: 25 },
    ],
  },
  {
    key: "ai_revolution",
    title: "Révolution de l'IA",
    description: "Une percée majeure en IA débloque de nouvelles technologies.",
    severity: "good",
    weight: 5,
    eraStart: 2015,
    eraEnd: 2100,
    cooldown: 60,
    effects: [{ type: "unlock_tech", value: 1 }],
  },
  {
    key: "cyberattack",
    title: "Cyberattaque mondiale",
    description: "Les services en ligne sont paralysés. Cloud & réputation touchés.",
    severity: "bad",
    weight: 6,
    eraStart: 2003,
    eraEnd: 2100,
    cooldown: 36,
    effects: [
      { type: "segment_mult", target: "cloud", value: -0.35 },
      { type: "company_reputation", value: -6 },
    ],
  },
  {
    key: "vr_explosion",
    title: "Explosion de la VR",
    description: "La VR devient grand public : le marché VR/AR triple.",
    severity: "good",
    weight: 5,
    eraStart: 2016,
    eraEnd: 2100,
    cooldown: 48,
    effects: [{ type: "segment_mult", target: "vr_ar", value: 2.0 }],
  },
  {
    key: "hype_train",
    title: "Phénomène viral",
    description: "Un titre viral dope l'engouement pour tout le secteur.",
    severity: "good",
    weight: 7,
    eraStart: 1995,
    eraEnd: 2100,
    cooldown: 24,
    effects: [{ type: "hype_global", value: 18 }],
  },
  {
    key: "regulation",
    title: "Régulation des loot boxes",
    description: "De nouvelles lois encadrent la monétisation. Prudence du marché.",
    severity: "warn",
    weight: 5,
    eraStart: 2018,
    eraEnd: 2100,
    cooldown: 40,
    effects: [{ type: "market_sentiment", value: -0.2 }],
  },
  {
    key: "crypto_mania",
    title: "Manie crypto",
    description: "Spéculation effrénée : les actifs crypto s'envolent.",
    severity: "info",
    weight: 6,
    eraStart: 2017,
    eraEnd: 2100,
    cooldown: 30,
    effects: [{ type: "stock_shock", target: "crypto", value: 0.5 }],
  },
  {
    key: "indie_renaissance",
    title: "Renaissance indé",
    description: "Les studios indépendants séduisent : hype modérée et durable.",
    severity: "good",
    weight: 7,
    eraStart: 2008,
    eraEnd: 2100,
    cooldown: 28,
    effects: [{ type: "hype_global", value: 12 }],
  },
];

export const EVENT_BY_KEY: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.key, e]),
);

/** Maybe fire one event this month based on weights + era + cooldowns. */
export function tickEvents(state: GameState, rng: Rng): void {
  // ~10% chance of *an* event each month; otherwise quiet
  if (!rng.bool(0.1)) {
    decayCooldowns(state);
    return;
  }
  const year = state.clock.year;
  const eligible = EVENTS.filter(
    (e) =>
      year >= e.eraStart &&
      year <= e.eraEnd &&
      (state.eventCooldowns[e.key] ?? 0) <= 0,
  );
  decayCooldowns(state);
  if (eligible.length === 0) return;

  // contextual weighting: crises likelier when sentiment is overheated
  const weights = eligible.map((e) => {
    let w = e.weight;
    if (e.key === "econ_crisis" && state.market.sentiment > 0.5) w *= 2;
    if (e.key === "gaming_boom" && state.market.sentiment < -0.3) w *= 1.6;
    return w;
  });
  const idx = rng.weightedIndex(weights);
  if (idx < 0) return;
  const def = eligible[idx];
  applyEvent(state, def, rng);
  state.eventCooldowns[def.key] = def.cooldown;
}

function decayCooldowns(state: GameState): void {
  for (const k of Object.keys(state.eventCooldowns)) {
    if (state.eventCooldowns[k] > 0) state.eventCooldowns[k] -= 1;
  }
}

function applyEvent(state: GameState, def: EventDef, rng: Rng): void {
  for (const eff of def.effects) applyEffect(state, eff, rng);
  state.events.unshift({
    key: def.key,
    title: def.title,
    description: def.description,
    severity: def.severity,
    year: state.clock.year,
    month: state.clock.month,
  });
  if (state.events.length > 100) state.events.length = 100;
  pushLog(state, `${iconFor(def.severity)} ${def.title}`, def.severity);
}

function applyEffect(state: GameState, eff: EventEffect, rng: Rng): void {
  switch (eff.type) {
    case "market_sentiment":
      state.market.sentiment = clamp(state.market.sentiment + eff.value, -1, 1);
      break;
    case "segment_mult": {
      const seg = state.market.segments[eff.target as ProductCategory];
      if (seg?.unlocked) seg.size = Math.max(0, seg.size * (1 + eff.value));
      break;
    }
    case "company_cash":
      state.company.cash += state.company.cash * eff.value;
      break;
    case "company_reputation":
      state.company.reputation = clamp(state.company.reputation + eff.value, 0, 100);
      break;
    case "hype_global":
      for (const p of state.products) p.hype = clamp(p.hype + eff.value, 0, 100);
      break;
    case "unlock_tech": {
      const avail = researchableTechs(state.clock.year, state.research.unlocked);
      if (avail.length > 0) {
        const t = rng.pick(avail);
        state.research.unlocked.push(t.id);
        pushLog(state, `🧠 Tech débloquée par percée : ${t.name}`, "good");
      }
      break;
    }
    case "stock_shock": {
      for (const s of state.stock.stocks) {
        if (eff.target && s.kind !== eff.target) continue;
        s.price = Math.max(0.1, s.price * (1 + eff.value + rng.noise(0.05)));
      }
      break;
    }
  }
}

function iconFor(sev: string): string {
  return sev === "good" ? "📈" : sev === "bad" ? "💥" : sev === "warn" ? "⚠️" : "🌍";
}
