// ============================================================================
//  Technology tree — locked by era (1970 → 2100).
//  A tech becomes researchable only when the in-game year >= eraStart AND all
//  `requires` are unlocked. Boosts feed into product stat ceilings.
// ============================================================================
import type { Technology } from "@/engine/types";

export const TECHNOLOGIES: Technology[] = [
  // ---------------- 1970–1980 ----------------
  { id: "cpu_8bit", name: "CPU 8-bit", category: "compute", eraStart: 1970, eraEnd: 1985, cost: 60, requires: [], description: "Premiers microprocesseurs grand public.", boosts: { performance: 6 } },
  { id: "cartridge", name: "Cartouches", category: "storage", eraStart: 1972, eraEnd: 1990, cost: 50, requires: [], description: "Support de jeu enfichable.", boosts: { reliability: 5 } },
  { id: "crt", name: "Écran CRT", category: "display", eraStart: 1970, eraEnd: 1995, cost: 40, requires: [], description: "Affichage à tube cathodique.", boosts: { satisfaction: 3 } },
  { id: "arcade", name: "Arcade Machines", category: "platform", eraStart: 1971, eraEnd: 1990, cost: 80, requires: ["cpu_8bit"], description: "Bornes d'arcade rentables.", boosts: { satisfaction: 6 } },

  // ---------------- 1980–1990 ----------------
  { id: "cpu_16bit", name: "CPU 16-bit", category: "compute", eraStart: 1983, eraEnd: 1998, cost: 120, requires: ["cpu_8bit"], description: "Puissance doublée, sprites avancés.", boosts: { performance: 10 } },
  { id: "stereo_audio", name: "Audio Stéréo", category: "audio", eraStart: 1984, eraEnd: 2000, cost: 70, requires: [], description: "Son stéréo immersif.", boosts: { satisfaction: 5 } },
  { id: "battery_save", name: "Sauvegarde", category: "storage", eraStart: 1986, eraEnd: 2005, cost: 60, requires: ["cartridge"], description: "Mémoire sauvegarde sur pile.", boosts: { satisfaction: 6, reliability: 3 } },
  { id: "color_screen", name: "Écrans Couleur", category: "display", eraStart: 1985, eraEnd: 2002, cost: 90, requires: ["crt"], description: "Palette couleur étendue.", boosts: { satisfaction: 7 } },

  // ---------------- 1990–2000 ----------------
  { id: "cdrom", name: "CD-ROM", category: "storage", eraStart: 1991, eraEnd: 2006, cost: 160, requires: ["cpu_16bit"], description: "Stockage optique massif.", boosts: { performance: 8, satisfaction: 6 } },
  { id: "gpu_3d", name: "GPU 3D", category: "compute", eraStart: 1994, eraEnd: 2010, cost: 220, requires: ["cpu_16bit"], description: "Accélération 3D matérielle.", boosts: { performance: 16 } },
  { id: "internet", name: "Internet", category: "network", eraStart: 1995, eraEnd: 2015, cost: 180, requires: [], description: "Connexion réseau domestique.", boosts: { satisfaction: 8 } },
  { id: "online_play", name: "Jeux en ligne", category: "network", eraStart: 1997, eraEnd: 2015, cost: 200, requires: ["internet"], description: "Multijoueur en ligne.", boosts: { satisfaction: 10 } },

  // ---------------- 2000–2010 ----------------
  { id: "dvd", name: "DVD", category: "storage", eraStart: 2000, eraEnd: 2014, cost: 240, requires: ["cdrom"], description: "Stockage optique haute densité.", boosts: { performance: 8, satisfaction: 5 } },
  { id: "wifi", name: "Wi-Fi", category: "network", eraStart: 2003, eraEnd: 2018, cost: 200, requires: ["internet"], description: "Réseau sans fil.", boosts: { satisfaction: 7, battery: -2 } },
  { id: "hdd", name: "Disque dur (HDD)", category: "storage", eraStart: 2002, eraEnd: 2016, cost: 260, requires: ["dvd"], description: "Stockage local étendu.", boosts: { performance: 6, satisfaction: 6 } },
  { id: "mmo", name: "Jeux MMO", category: "network", eraStart: 2004, eraEnd: 2020, cost: 320, requires: ["online_play"], description: "Mondes persistants massifs.", boosts: { satisfaction: 12 } },
  { id: "digital_store", name: "Digital Store", category: "platform", eraStart: 2005, eraEnd: 2025, cost: 300, requires: ["wifi"], description: "Distribution dématérialisée.", boosts: { satisfaction: 9 } },

  // ---------------- 2010–2020 ----------------
  { id: "ssd", name: "SSD", category: "storage", eraStart: 2011, eraEnd: 2030, cost: 360, requires: ["hdd"], description: "Stockage flash ultra-rapide.", boosts: { performance: 14, reliability: 6 } },
  { id: "cloud_gaming_early", name: "Cloud Gaming", category: "network", eraStart: 2013, eraEnd: 2035, cost: 420, requires: ["digital_store"], description: "Streaming de jeux.", boosts: { satisfaction: 10 } },
  { id: "vr_early", name: "VR (early)", category: "display", eraStart: 2014, eraEnd: 2032, cost: 460, requires: ["gpu_3d"], description: "Premiers casques VR.", boosts: { satisfaction: 14 } },
  { id: "oled", name: "OLED", category: "display", eraStart: 2012, eraEnd: 2032, cost: 380, requires: ["color_screen"], description: "Dalles à pixels auto-émissifs.", boosts: { satisfaction: 12, battery: 4 } },
  { id: "ai_basic", name: "IA basique", category: "ai", eraStart: 2015, eraEnd: 2030, cost: 440, requires: ["ssd"], description: "IA de jeu et recommandation.", boosts: { satisfaction: 8, performance: 4 } },

  // ---------------- 2020–2030 ----------------
  { id: "ray_tracing", name: "Ray Tracing", category: "compute", eraStart: 2020, eraEnd: 2040, cost: 560, requires: ["ssd", "gpu_3d"], description: "Éclairage temps réel réaliste.", boosts: { performance: 20, satisfaction: 10 } },
  { id: "ai_advanced", name: "IA avancée", category: "ai", eraStart: 2022, eraEnd: 2042, cost: 620, requires: ["ai_basic"], description: "IA générative et NPC vivants.", boosts: { satisfaction: 16, performance: 8 } },
  { id: "ar", name: "Réalité Augmentée", category: "display", eraStart: 2021, eraEnd: 2045, cost: 600, requires: ["vr_early"], description: "Superposition numérique du réel.", boosts: { satisfaction: 16 } },
  { id: "cloud_streaming", name: "Cloud Streaming", category: "network", eraStart: 2023, eraEnd: 2045, cost: 640, requires: ["cloud_gaming_early"], description: "Streaming 4K faible latence.", boosts: { satisfaction: 14 } },
  { id: "res_8k", name: "8K", category: "display", eraStart: 2024, eraEnd: 2045, cost: 520, requires: ["oled"], description: "Ultra haute définition.", boosts: { satisfaction: 12, performance: 6 } },

  // ---------------- 2030–2050 ----------------
  { id: "neural_interface", name: "Interfaces Neuronales", category: "compute", eraStart: 2032, eraEnd: 2060, cost: 900, requires: ["ai_advanced"], description: "Contrôle par la pensée.", boosts: { satisfaction: 24, performance: 14 } },
  { id: "ultra_vr", name: "Ultra VR", category: "display", eraStart: 2034, eraEnd: 2060, cost: 860, requires: ["ar", "ray_tracing"], description: "Immersion VR totale.", boosts: { satisfaction: 26 } },
  { id: "holography", name: "Holographie", category: "display", eraStart: 2036, eraEnd: 2065, cost: 880, requires: ["res_8k"], description: "Projection volumétrique.", boosts: { satisfaction: 22, performance: 8 } },
  { id: "generative_ai", name: "Generative AI", category: "ai", eraStart: 2035, eraEnd: 2065, cost: 920, requires: ["ai_advanced"], description: "Contenu généré à la volée.", boosts: { satisfaction: 22, performance: 10 } },

  // ---------------- 2050–2100 ----------------
  { id: "quantum", name: "Quantum Computing", category: "compute", eraStart: 2052, eraEnd: 2100, cost: 1400, requires: ["neural_interface"], description: "Calcul quantique grand public.", boosts: { performance: 40, satisfaction: 20 } },
  { id: "full_sim", name: "Mondes full-sim", category: "platform", eraStart: 2058, eraEnd: 2100, cost: 1500, requires: ["generative_ai", "ultra_vr"], description: "Simulation intégrale du monde.", boosts: { satisfaction: 34 } },
  { id: "neural_reality", name: "Neural Reality", category: "display", eraStart: 2062, eraEnd: 2100, cost: 1600, requires: ["neural_interface", "holography"], description: "Réalité injectée au cerveau.", boosts: { satisfaction: 40 } },
  { id: "procedural_universe", name: "Univers procéduraux", category: "platform", eraStart: 2070, eraEnd: 2100, cost: 1800, requires: ["full_sim", "quantum"], description: "Univers infinis auto-générés.", boosts: { satisfaction: 38, performance: 16 } },
];

export const TECH_BY_ID: Record<string, Technology> = Object.fromEntries(
  TECHNOLOGIES.map((t) => [t.id, t]),
);

/** techs that can be researched right now given year + unlocked set */
export function researchableTechs(year: number, unlocked: string[]): Technology[] {
  const have = new Set(unlocked);
  return TECHNOLOGIES.filter(
    (t) =>
      !have.has(t.id) &&
      year >= t.eraStart &&
      t.requires.every((r) => have.has(r)),
  );
}
