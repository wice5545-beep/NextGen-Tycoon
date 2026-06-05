// ============================================================================
//  Name generators (deterministic via Rng) for AI competitors, employees,
//  products and game titles. Inspired-by, never cloned.
// ============================================================================
import { Rng } from "@/engine/rng";

// 12+ AI competitor names (original, evoking Nintendo/Sony/MS/Valve/Sega/Atari)
export const COMPETITOR_NAMES = [
  "Nintaro",
  "Sonix",
  "Macrosoft",
  "Valvex",
  "Segacore",
  "Atarion",
  "Polaris Interactive",
  "Quantum Play",
  "NeoByte",
  "Hyperion Games",
  "Vortex Systems",
  "Lumina Entertainment",
  "Zenith Digital",
  "Orbital Arcade",
];

const FIRST = ["Alex", "Yuki", "Sam", "Maya", "Leo", "Nora", "Kai", "Ivy", "Theo", "Zoe", "Ravi", "Lena", "Hugo", "Aria", "Milo", "Eva"];
const LAST = ["Tanaka", "Moreau", "Schmidt", "Rossi", "Novak", "Kim", "Silva", "Dubois", "Hassan", "Nielsen", "Costa", "Vega", "Okoro", "Park"];

const PRODUCT_PREFIX = ["Nova", "Apex", "Zenith", "Pulse", "Quantum", "Aurora", "Vertex", "Helix", "Orbit", "Lumen", "Strata", "Nexus"];
const PRODUCT_SUFFIX = ["X", "Pro", "Infinity", "One", "Max", "Prime", "Core", "Z", "Ultra", "S", "Horizon", "Edge"];

const GAME_A = ["Echoes of", "Shadow", "Last", "Rise of", "Eternal", "Neon", "Frozen", "Crimson", "Hidden", "Final", "Beyond", "Project"];
const GAME_B = ["Eclipse", "Empire", "Frontier", "Legacy", "Odyssey", "Realm", "Protocol", "Dawn", "Abyss", "Nexus", "Saga", "Horizon"];

export function makeEmployeeName(rng: Rng): string {
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
}

export function makeProductName(rng: Rng): string {
  return `${rng.pick(PRODUCT_PREFIX)} ${rng.pick(PRODUCT_SUFFIX)}`;
}

export function makeGameTitle(rng: Rng): string {
  return `${rng.pick(GAME_A)} ${rng.pick(GAME_B)}`;
}
