// ============================================================================
//  Buildings — each tier unlocks mechanics & raises caps.
// ============================================================================
import type { BuildingId } from "@/engine/types";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  cost: number;
  staffCap: number;
  rndBonus: number; // research points/month
  upkeep: number; // monthly fixed cost
  unlocks: string;
  requires?: BuildingId;
}

export const BUILDINGS: BuildingDef[] = [
  { id: "garage", name: "Garage", cost: 0, staffCap: 3, rndBonus: 1, upkeep: 500, unlocks: "Point de départ : 1ers prototypes." },
  { id: "office", name: "Bureau", cost: 120_000, staffCap: 10, rndBonus: 3, upkeep: 4_000, unlocks: "Plus d'employés, marketing de base.", requires: "garage" },
  { id: "campus", name: "Campus", cost: 600_000, staffCap: 28, rndBonus: 7, upkeep: 18_000, unlocks: "Équipes parallèles, jeux AAA.", requires: "office" },
  { id: "rnd_center", name: "Centre R&D", cost: 1_400_000, staffCap: 40, rndBonus: 18, upkeep: 32_000, unlocks: "Recherche accélérée, tech avancées.", requires: "campus" },
  { id: "factory", name: "Usine", cost: 2_200_000, staffCap: 55, rndBonus: 10, upkeep: 48_000, unlocks: "Production interne : -25% coût composants.", requires: "campus" },
  { id: "hq", name: "Siège social", cost: 4_500_000, staffCap: 90, rndBonus: 22, upkeep: 90_000, unlocks: "Image de marque, rachats de studios.", requires: "rnd_center" },
  { id: "data_center", name: "Data Center", cost: 6_500_000, staffCap: 120, rndBonus: 28, upkeep: 130_000, unlocks: "Cloud gaming & services en ligne.", requires: "hq" },
];

export const BUILDING_BY_ID: Record<BuildingId, BuildingDef> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
) as Record<BuildingId, BuildingDef>;

export function buildingsSummary(owned: BuildingId[]) {
  let staffCap = 0;
  let rndBonus = 0;
  let upkeep = 0;
  for (const id of owned) {
    const b = BUILDING_BY_ID[id];
    if (!b) continue;
    staffCap = Math.max(staffCap, b.staffCap);
    rndBonus += b.rndBonus;
    upkeep += b.upkeep;
  }
  return {
    staffCap,
    rndBonus,
    upkeep,
    hasFactory: owned.includes("factory"),
    hasDataCenter: owned.includes("data_center"),
    canAcquire: owned.includes("hq"),
  };
}
