// ============================================================================
//  Employees RPG — tiers, stat progression, salaries, hiring helpers.
// ============================================================================
import type { Employee, EmployeeTier, GameState } from "@/engine/types";
import { Rng } from "@/engine/rng";
import { clamp } from "@/engine/economy";
import { makeEmployeeName } from "@/data/names";
import { pushLog } from "@/engine/products";

export const TIER_ORDER: EmployeeTier[] = ["junior", "confirmed", "senior", "expert", "legend"];

export const TIER_LABEL: Record<EmployeeTier, string> = {
  junior: "Junior",
  confirmed: "Confirmé",
  senior: "Senior",
  expert: "Expert",
  legend: "Légende",
};

const TIER_XP: Record<EmployeeTier, number> = {
  junior: 0,
  confirmed: 120,
  senior: 360,
  expert: 800,
  legend: 1600,
};

const TIER_STAT_RANGE: Record<EmployeeTier, [number, number]> = {
  junior: [10, 35],
  confirmed: [30, 55],
  senior: [50, 72],
  expert: [68, 88],
  legend: [85, 99],
};

/** Generate a hireable candidate of a given tier. */
export function makeCandidate(rng: Rng, tier: EmployeeTier, year: number): Employee {
  const [lo, hi] = TIER_STAT_RANGE[tier];
  const stat = () => rng.int(lo, hi);
  const programming = stat();
  const design = stat();
  const management = stat();
  const creativity = stat();
  const speed = stat();
  const avg = (programming + design + management + creativity + speed) / 5;
  return {
    id: `emp_${rng.int(100000, 999999)}_${year}`,
    name: makeEmployeeName(rng),
    tier,
    programming,
    design,
    management,
    creativity,
    speed,
    salary: Math.round((avg * 1200 + TIER_XP[tier] * 30) / 100) * 100,
    xp: TIER_XP[tier],
    hiredYear: year,
  };
}

/** Monthly XP gain + automatic promotion. */
export function tickEmployees(state: GameState): void {
  for (const e of state.employees) {
    // working grants XP; managers boost the whole team slightly
    e.xp += 6 + Math.round(e.speed / 20);
    const next = nextTier(e.tier);
    if (next && e.xp >= TIER_XP[next]) {
      e.tier = next;
      // promotion bumps stats & salary
      e.programming = clamp(e.programming + 5, 0, 99);
      e.design = clamp(e.design + 5, 0, 99);
      e.creativity = clamp(e.creativity + 5, 0, 99);
      e.speed = clamp(e.speed + 4, 0, 99);
      e.management = clamp(e.management + 4, 0, 99);
      e.salary = Math.round(e.salary * 1.35);
      pushLog(state, `⭐ ${e.name} promu·e ${TIER_LABEL[next]} !`, "good");
    }
  }
}

function nextTier(t: EmployeeTier): EmployeeTier | null {
  const i = TIER_ORDER.indexOf(t);
  return i >= 0 && i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

export function totalSalaries(state: GameState): number {
  return state.employees.reduce((a, e) => a + e.salary, 0);
}
