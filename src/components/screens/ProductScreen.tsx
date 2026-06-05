// ============================================================================
//  Product builder — design a console/handheld/VR/phone/PC/cloud product by
//  picking components, price & design. Mirrors "Concevoir une console" mockup.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge, ProgressBar, Gauge } from "@/components/ui";
import { CATEGORY_LABELS, availableComponents, COMPONENT_BY_ID } from "@/data/components";
import { computeStats, computeScore } from "@/engine/products";
import { productDevCost } from "@/engine/engine";
import { money, compact } from "@/lib/format";
import type { ProductCategory, ProductStats } from "@/engine/types";
import { cn } from "@/lib/cn";
import { Cpu, Plus, Check } from "lucide-react";

const CATEGORIES: ProductCategory[] = ["console_home", "handheld", "vr_ar", "phone", "pc", "cloud"];
const COLORS = ["#7c5cff", "#27d6ff", "#34e0a1", "#ffb24c", "#ff5c7c", "#eef2ff", "#161e33"];

const STAT_LABELS: Record<keyof ProductStats, string> = {
  performance: "Performance",
  reliability: "Fiabilité",
  thermals: "Refroidissement",
  battery: "Autonomie",
  satisfaction: "Satisfaction",
};

export function ProductScreen() {
  const s = useGame((st) => st.state)!;
  const createProduct = useGame((st) => st.createProduct);
  const campaign = useGame((st) => st.campaign);

  const [category, setCategory] = useState<ProductCategory>("console_home");
  const [name, setName] = useState("Nova One");
  const [color, setColor] = useState(COLORS[0]);
  const [price, setPrice] = useState(299);
  const [picked, setPicked] = useState<string[]>([]);

  const segUnlocked = s.market.segments[category]?.unlocked;

  const catalogue = useMemo(
    () => availableComponents(category, s.clock.year, s.research.unlocked),
    [category, s.clock.year, s.research.unlocked],
  );

  // reset picks not valid for the category
  const validPicked = picked.filter((id) => catalogue.some((c) => c.id === id));

  const stats = useMemo(
    () => computeStats(validPicked, s.research.unlocked),
    [validPicked, s.research.unlocked],
  );
  const score = computeScore(stats, category);
  const draft = { name, category, componentIds: validPicked, price, design: { color, formFactor: category } };
  const devCost = productDevCost(draft);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit() {
    const r = createProduct(draft);
    if (r.ok) setPicked([]);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* left: configurator */}
      <div className="space-y-4 lg:col-span-2">
        <GlassCard>
          <SectionTitle>Type de produit</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const unlocked = s.market.segments[c]?.unlocked;
              return (
                <button
                  key={c}
                  disabled={!unlocked}
                  onClick={() => { setCategory(c); setPicked([]); }}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs font-medium transition",
                    category === c ? "bg-brand text-white shadow-glow" : "bg-white/5 text-ink-300 hover:bg-white/10",
                    !unlocked && "cursor-not-allowed opacity-40",
                  )}
                >
                  {CATEGORY_LABELS[c]}
                  {!unlocked && " 🔒"}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard delay={0.05}>
          <SectionTitle right={<Badge tone="cyan">{catalogue.length} dispo</Badge>}>
            Composants
          </SectionTitle>
          {catalogue.length === 0 ? (
            <p className="text-sm text-ink-500">Aucun composant disponible — recherche des technologies.</p>
          ) : (
            <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {catalogue.map((c) => {
                const on = validPicked.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2.5 text-left transition",
                      on ? "border-brand bg-brand/15" : "border-line bg-white/3 hover:bg-white/5",
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[11px] text-ink-500">
                        {Object.entries(c.stats)
                          .map(([k, v]) => `${STAT_LABELS[k as keyof ProductStats].slice(0, 4)} ${v! > 0 ? "+" : ""}${v}`)
                          .join(" · ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink-400">{money(c.cost)}</span>
                      <span className={cn("grid h-5 w-5 place-items-center rounded-md", on ? "bg-brand text-white" : "bg-white/8 text-ink-500")}>
                        {on ? <Check size={12} /> : <Plus size={12} />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* right: live preview */}
      <div className="space-y-4">
        <GlassCard delay={0.1}>
          <SectionTitle right={<Badge tone="brand">Score {score}</Badge>}>Aperçu</SectionTitle>
          <div className="mb-4 flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl" style={{ background: color + "33" }}>
              <Cpu size={34} style={{ color }} />
            </div>
            <Gauge value={score} label="Score" />
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-line bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Nom du produit"
          />

          <div className="mb-3">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-ink-500">Couleur</div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("h-7 w-7 rounded-full border-2", color === c ? "border-white" : "border-transparent")}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-ink-500">
              <span>Prix</span>
              <span className="text-ink-100">{money(price)}</span>
            </div>
            <input
              type="range"
              min={49}
              max={1999}
              step={10}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          {/* stats */}
          <div className="space-y-2">
            {(Object.keys(STAT_LABELS) as (keyof ProductStats)[]).map((k) => (
              <div key={k}>
                <div className="mb-0.5 flex justify-between text-[11px]">
                  <span className="text-ink-300">{STAT_LABELS[k]}</span>
                  <span className="text-ink-400">{stats[k]}</span>
                </div>
                <ProgressBar value={stats[k]} tone={k === "battery" ? "good" : "brand"} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.15}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-300">Coût R&D</span>
            <span className="font-semibold">{money(devCost)}</span>
          </div>
          <Button
            size="lg"
            className="mt-3 w-full"
            disabled={!segUnlocked || validPicked.length === 0 || s.company.cash < devCost}
            onClick={submit}
          >
            🚀 Lancer le développement
          </Button>
          <p className="mt-2 text-center text-[11px] text-ink-500">
            Le produit se lance automatiquement à la fin de la R&D.
          </p>
        </GlassCard>

        {/* live products + marketing */}
        {s.products.length > 0 && (
          <GlassCard delay={0.2}>
            <SectionTitle>Mes produits</SectionTitle>
            <div className="space-y-2">
              {s.products.map((p) => (
                <div key={p.id} className="rounded-xl bg-white/5 p-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    {p.active ? (
                      <Badge tone="good">{compact(p.unitsSold)} vendus</Badge>
                    ) : (
                      <Badge tone="warn">R&D {Math.round(p.rndProgress)}%</Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={p.active ? p.hype : p.rndProgress} tone={p.active ? "cyan" : "warn"} />
                    </div>
                    <span className="text-[10px] text-ink-500">{p.active ? `hype ${Math.round(p.hype)}` : "dev"}</span>
                  </div>
                  {p.active && (
                    <div className="mt-2 flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => campaign(p.id, "social", 1)}>📱 Social</Button>
                      <Button size="sm" variant="ghost" onClick={() => campaign(p.id, "influencer", 1)}>⭐ Influence</Button>
                      <Button size="sm" variant="ghost" onClick={() => campaign(p.id, "tv", 1)}>📺 TV</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
