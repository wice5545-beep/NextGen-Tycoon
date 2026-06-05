// ============================================================================
//  Game genres + their dev/market profiles.
//  affinity = how strongly the genre benefits from each employee stat.
//  marketBias = popularity multiplier that drifts across eras.
// ============================================================================
import type { Genre } from "@/engine/types";

export interface GenreDef {
  id: Genre;
  name: string;
  /** weighting of employee stats for review quality (sums ~1) */
  affinity: { programming: number; design: number; creativity: number };
  baseDevMonths: number;
  /** base appeal; popularity is further modulated by era in games.ts */
  appeal: number;
  /** year the genre becomes popular */
  hotFrom: number;
}

export const GENRES: GenreDef[] = [
  { id: "fps", name: "FPS", affinity: { programming: 0.45, design: 0.3, creativity: 0.25 }, baseDevMonths: 8, appeal: 1.0, hotFrom: 1993 },
  { id: "rpg", name: "RPG", affinity: { programming: 0.3, design: 0.35, creativity: 0.35 }, baseDevMonths: 12, appeal: 1.05, hotFrom: 1985 },
  { id: "mmo", name: "MMO", affinity: { programming: 0.5, design: 0.25, creativity: 0.25 }, baseDevMonths: 18, appeal: 1.1, hotFrom: 2004 },
  { id: "survival", name: "Survival", affinity: { programming: 0.4, design: 0.3, creativity: 0.3 }, baseDevMonths: 9, appeal: 0.95, hotFrom: 2013 },
  { id: "horror", name: "Horror", affinity: { programming: 0.3, design: 0.3, creativity: 0.4 }, baseDevMonths: 7, appeal: 0.9, hotFrom: 1996 },
  { id: "sandbox", name: "Sandbox", affinity: { programming: 0.45, design: 0.25, creativity: 0.3 }, baseDevMonths: 10, appeal: 1.0, hotFrom: 2009 },
  { id: "simulation", name: "Simulation", affinity: { programming: 0.4, design: 0.35, creativity: 0.25 }, baseDevMonths: 9, appeal: 0.92, hotFrom: 1989 },
  { id: "open_world", name: "Open World", affinity: { programming: 0.4, design: 0.3, creativity: 0.3 }, baseDevMonths: 16, appeal: 1.15, hotFrom: 2008 },
];

export const GENRE_BY_ID: Record<Genre, GenreDef> = Object.fromEntries(
  GENRES.map((g) => [g.id, g]),
) as Record<Genre, GenreDef>;
