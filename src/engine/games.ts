// ============================================================================
//  Games subsystem — development progress, review scoring, sales.
// ============================================================================
import type { GameState, Game, Genre } from "@/engine/types";
import type { Rng } from "@/engine/rng";
import { clamp } from "@/engine/economy";
import { GENRE_BY_ID } from "@/data/genres";
import { pushLog } from "@/engine/products";

/** Snapshot the current team's quality for a genre (0..100). */
export function teamQualityFor(state: GameState, genre: Genre): number {
  const g = GENRE_BY_ID[genre];
  const team = state.employees;
  if (team.length === 0) return 15;
  const avg = (sel: (e: GameState["employees"][number]) => number) =>
    team.reduce((a, e) => a + sel(e), 0) / team.length;
  const q =
    avg((e) => e.programming) * g.affinity.programming +
    avg((e) => e.design) * g.affinity.design +
    avg((e) => e.creativity) * g.affinity.creativity;
  // bigger teams help up to a point
  const sizeBoost = clamp(1 + Math.log10(team.length) * 0.15, 1, 1.6);
  return clamp(q * sizeBoost, 0, 100);
}

/** advance dev; on completion compute a review score & start selling. */
export function tickGames(state: GameState, rng: Rng): void {
  for (const game of state.games) {
    if (!game.shipped) {
      game.devMonthsDone += 1;
      if (game.devMonthsDone >= game.devMonthsTotal) {
        shipGame(state, game, rng);
      }
      continue;
    }
    // post-launch sales with decay
    const sold = gameMonthlySales(state, game);
    game.unitsLastMonth = sold;
    game.unitsSold += sold;
    const price = 50; // avg game price
    state.finance.monthlyRevenue += sold * price;
  }
}

function shipGame(state: GameState, game: Game, rng: Rng): void {
  const g = GENRE_BY_ID[game.genre];

  // budget adequacy: under-funded games review worse
  const expected = g.baseDevMonths * 60_000;
  const budgetFit = clamp(game.budget / expected, 0.4, 1.4);

  // marketing adds a little, talent dominates
  const base = game.teamQuality * 0.8 + budgetFit * 12 + game.marketing / 8;
  const luck = rng.noise(10);
  game.reviewScore = clamp(Math.round(base + luck), 1, 100);
  game.shipped = true;
  game.releaseYear = state.clock.year;

  // reputation impact
  const repDelta = (game.reviewScore - 60) / 12;
  state.company.reputation = clamp(state.company.reputation + repDelta, 0, 100);

  const sev = game.reviewScore >= 80 ? "good" : game.reviewScore >= 50 ? "info" : "bad";
  pushLog(state, `🎮 « ${game.title} » sort — note ${game.reviewScore}/100`, sev);
}

function gameMonthlySales(state: GameState, game: Game): number {
  if (game.releaseYear == null) return 0;
  const g = GENRE_BY_ID[game.genre];
  const monthsSince = (state.clock.year - game.releaseYear) * 12;
  const decay = Math.exp(-monthsSince / 12);

  // popularity of the genre in this era
  const eraPop = state.clock.year >= g.hotFrom ? g.appeal : g.appeal * 0.6;

  // install base of the platform it targets (or whole market if PC/none)
  let reach = state.market.worldSize * 0.05;
  if (game.platformId) {
    const plat = state.products.find((p) => p.id === game.platformId);
    if (plat) reach = Math.max(reach, plat.unitsSold * 0.15);
  }

  const quality = Math.pow(game.reviewScore / 100, 2);
  const hype = 0.7 + game.marketing / 300;
  return Math.max(0, Math.round(reach * quality * eraPop * hype * decay * 0.02));
}
