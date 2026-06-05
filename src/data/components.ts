// ============================================================================
//  Product component catalogue.
//  Components are gated by tech + era. A product's stats are the sum of its
//  components (clamped), then modified by design & price in products.ts.
// ============================================================================
import type { ComponentDef, ProductCategory } from "@/engine/types";

export const COMPONENTS: ComponentDef[] = [
  // --- CPUs ---
  { id: "c_cpu8", name: "CPU 8-bit", category: "all", requiresTech: "cpu_8bit", cost: 18, era: 1970, stats: { performance: 8 } },
  { id: "c_cpu16", name: "CPU 16-bit", category: "all", requiresTech: "cpu_16bit", cost: 34, era: 1983, stats: { performance: 16 } },
  { id: "c_cpu32", name: "CPU 32-bit", category: "all", requiresTech: "gpu_3d", cost: 60, era: 1994, stats: { performance: 26 } },
  { id: "c_cpu64", name: "CPU 64-bit", category: "all", requiresTech: "hdd", cost: 95, era: 2002, stats: { performance: 38, thermals: -4 } },
  { id: "c_cpu_apu", name: "APU intégré", category: "all", requiresTech: "ssd", cost: 140, era: 2011, stats: { performance: 50, thermals: -2 } },
  { id: "c_cpu_quantum", name: "Cœur quantique", category: "all", requiresTech: "quantum", cost: 600, era: 2052, stats: { performance: 120, thermals: -6 } },

  // --- GPUs ---
  { id: "c_gpu3d", name: "GPU 3D", category: "all", requiresTech: "gpu_3d", cost: 70, era: 1994, stats: { performance: 22, thermals: -6 } },
  { id: "c_gpu_rt", name: "GPU Ray Tracing", category: "all", requiresTech: "ray_tracing", cost: 220, era: 2020, stats: { performance: 60, thermals: -8 } },
  { id: "c_gpu_neural", name: "GPU neuronal", category: "all", requiresTech: "generative_ai", cost: 420, era: 2035, stats: { performance: 90, satisfaction: 8 } },

  // --- Storage ---
  { id: "c_cart", name: "Cartouche", category: "all", requiresTech: "cartridge", cost: 8, era: 1972, stats: { reliability: 8 } },
  { id: "c_cd", name: "Lecteur CD-ROM", category: "all", requiresTech: "cdrom", cost: 24, era: 1991, stats: { performance: 6, satisfaction: 6, reliability: -2 } },
  { id: "c_dvd", name: "Lecteur DVD", category: "all", requiresTech: "dvd", cost: 30, era: 2000, stats: { performance: 8, satisfaction: 5 } },
  { id: "c_hdd", name: "Disque dur", category: "all", requiresTech: "hdd", cost: 40, era: 2002, stats: { performance: 6, satisfaction: 7, reliability: -3 } },
  { id: "c_ssd", name: "SSD NVMe", category: "all", requiresTech: "ssd", cost: 80, era: 2011, stats: { performance: 18, reliability: 8 } },

  // --- Displays (for handheld/vr/phone) ---
  { id: "c_crt", name: "Dalle CRT", category: ["console_home", "pc"], requiresTech: "crt", cost: 14, era: 1970, stats: { satisfaction: 3 } },
  { id: "c_color", name: "Écran couleur", category: ["handheld", "phone"], requiresTech: "color_screen", cost: 26, era: 1985, stats: { satisfaction: 8, battery: -3 } },
  { id: "c_oled", name: "Dalle OLED", category: ["handheld", "phone", "vr_ar"], requiresTech: "oled", cost: 70, era: 2012, stats: { satisfaction: 14, battery: 3 } },
  { id: "c_8k", name: "Panneau 8K", category: "all", requiresTech: "res_8k", cost: 160, era: 2024, stats: { satisfaction: 14, performance: 4, thermals: -3 } },
  { id: "c_holo", name: "Projecteur holo", category: ["vr_ar"], requiresTech: "holography", cost: 320, era: 2036, stats: { satisfaction: 26 } },
  { id: "c_neural_disp", name: "Sortie neuronale", category: ["vr_ar"], requiresTech: "neural_reality", cost: 700, era: 2062, stats: { satisfaction: 44 } },

  // --- Network ---
  { id: "c_wifi", name: "Module Wi-Fi", category: "all", requiresTech: "wifi", cost: 18, era: 2003, stats: { satisfaction: 6, battery: -2 } },
  { id: "c_cloud", name: "Stack Cloud", category: ["cloud"], requiresTech: "cloud_streaming", cost: 120, era: 2023, stats: { satisfaction: 16, performance: 10 } },

  // --- Battery / cooling (handheld/phone/vr) ---
  { id: "c_bat_basic", name: "Batterie standard", category: ["handheld", "phone", "vr_ar"], cost: 12, era: 1985, stats: { battery: 14, thermals: -2 } },
  { id: "c_bat_li", name: "Batterie Li-ion", category: ["handheld", "phone", "vr_ar"], requiresTech: "oled", cost: 28, era: 2012, stats: { battery: 28 } },
  { id: "c_bat_solid", name: "Batterie solid-state", category: ["handheld", "phone", "vr_ar"], requiresTech: "ai_advanced", cost: 90, era: 2030, stats: { battery: 48, thermals: 4 } },
  { id: "c_cool_passive", name: "Refroid. passif", category: "all", cost: 6, era: 1970, stats: { thermals: 6, reliability: 2 } },
  { id: "c_cool_active", name: "Refroid. actif", category: "all", cost: 22, era: 1994, stats: { thermals: 16, reliability: 3 } },
  { id: "c_cool_liquid", name: "Refroid. liquide", category: ["console_home", "pc"], requiresTech: "ssd", cost: 70, era: 2011, stats: { thermals: 30, reliability: 5 } },

  // --- Chassis / build quality ---
  { id: "c_case_plastic", name: "Châssis plastique", category: "all", cost: 6, era: 1970, stats: { reliability: 4 } },
  { id: "c_case_alloy", name: "Châssis alliage", category: "all", requiresTech: "wifi", cost: 30, era: 2005, stats: { reliability: 12, thermals: 4 } },
  { id: "c_case_nano", name: "Châssis nano-carbone", category: "all", requiresTech: "ai_advanced", cost: 110, era: 2030, stats: { reliability: 22, thermals: 8 } },
];

export const COMPONENT_BY_ID: Record<string, ComponentDef> = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c]),
);

export function availableComponents(
  category: ProductCategory,
  year: number,
  unlocked: string[],
): ComponentDef[] {
  const have = new Set(unlocked);
  return COMPONENTS.filter((c) => {
    if (c.era > year) return false;
    if (c.requiresTech && !have.has(c.requiresTech)) return false;
    if (c.category === "all") return true;
    return c.category.includes(category);
  });
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  console_home: "Console salon",
  handheld: "Console portable",
  vr_ar: "Casque VR / AR",
  phone: "Smartphone gaming",
  pc: "PC gaming",
  cloud: "Service cloud gaming",
};
