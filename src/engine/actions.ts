// ============================================================================
//  Additional player actions: hiring, buildings, studio acquisitions.
// ============================================================================
import type { Employee, GameState, BuildingId } from "@/engine/types";
import { pushLog } from "@/engine/products";
import { clamp } from "@/engine/economy";
import { buildingsSummary, BUILDING_BY_ID } from "@/data/buildings";

export function hireEmployee(state: GameState, candidate: Employee): { ok: boolean; reason?: string } {
  const cap = buildingsSummary(state.buildings).staffCap;
  if (state.employees.length >= cap)
    return { ok: false, reason: "Capacité atteinte — agrandis tes locaux." };
  const signing = Math.round(candidate.salary * 0.5);
  if (state.company.cash < signing)
    return { ok: false, reason: "Prime d'embauche trop chère." };
  state.company.cash -= signing;
  state.employees.push(candidate);
  pushLog(state, `🧑‍💻 Embauche : ${candidate.name} (${candidate.tier})`, "info");
  return { ok: true };
}

export function fireEmployee(state: GameState, id: string): void {
  const e = state.employees.find((x) => x.id === id);
  if (!e) return;
  state.employees = state.employees.filter((x) => x.id !== id);
  state.company.cash -= Math.round(e.salary * 0.25); // severance
  pushLog(state, `👋 Départ : ${e.name}`, "warn");
}

export function buildBuilding(state: GameState, id: BuildingId): { ok: boolean; reason?: string } {
  const def = BUILDING_BY_ID[id];
  if (!def) return { ok: false, reason: "Bâtiment inconnu." };
  if (state.buildings.includes(id)) return { ok: false, reason: "Déjà construit." };
  if (def.requires && !state.buildings.includes(def.requires))
    return { ok: false, reason: `Nécessite : ${BUILDING_BY_ID[def.requires].name}.` };
  if (state.company.cash < def.cost) return { ok: false, reason: "Budget insuffisant." };
  state.company.cash -= def.cost;
  state.buildings.push(id);
  pushLog(state, `🏢 Construit : ${def.name} — ${def.unlocks}`, "good");
  return { ok: true };
}

/** Acquire an AI competitor (requires HQ). */
export function acquireCompetitor(state: GameState, id: string): { ok: boolean; reason?: string } {
  if (!buildingsSummary(state.buildings).canAcquire)
    return { ok: false, reason: "Nécessite un Siège social." };
  const c = state.competitors.find((x) => x.id === id && x.alive);
  if (!c) return { ok: false, reason: "Cible indisponible." };
  const price = Math.round((c.valuationHint ?? c.cash + c.productPower * 50_000) * 1.2);
  if (state.company.cash < price) return { ok: false, reason: `Prix : ${price.toLocaleString()} $.` };
  state.company.cash -= price;
  c.alive = false;
  c.acquired = state.company.id;
  state.company.reputation = clamp(state.company.reputation + 6, 0, 100);
  pushLog(state, `🤝 Tu rachètes ${c.name} pour ${price.toLocaleString()} $ !`, "good");
  return { ok: true };
}

export function acquisitionPrice(state: GameState, id: string): number {
  const c = state.competitors.find((x) => x.id === id);
  if (!c) return 0;
  return Math.round((c.valuationHint ?? c.cash + c.productPower * 50_000) * 1.2);
}
