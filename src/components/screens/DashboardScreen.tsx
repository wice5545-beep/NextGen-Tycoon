// ============================================================================
//  Dashboard — company overview: KPIs, finance chart, market share, products,
//  live activity feed. Mirrors the "Dashboard entreprise" mockup.
// ============================================================================
"use client";

import { useGame } from "@/store/gameStore";
import {
  GlassCard,
  SectionTitle,
  Stat,
  Sparkline,
  Donut,
  ProgressBar,
  Badge,
} from "@/components/ui";
import { money, compact, fmtDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/data/components";
import { Coins, Users, Boxes, Trophy, Cpu, Activity } from "lucide-react";

const PALETTE = ["#7c5cff", "#27d6ff", "#34e0a1", "#ffb24c", "#ff5c7c", "#9b86ff"];

export function DashboardScreen() {
  const s = useGame((st) => st.state)!;

  const cashSeries = s.finance.history.map((h) => h.cash);
  const revenue = s.finance.monthlyRevenue;
  const costs = s.finance.monthlyCosts;
  const net = revenue - costs;

  const playerPower = s.products.filter((p) => p.active).reduce((a, p) => a + p.score * 1.2, 0);
  const shareSegments = [
    { label: s.company.name, value: playerPower, color: PALETTE[0] },
    ...s.competitors
      .filter((c) => c.alive)
      .sort((a, b) => b.productPower - a.productPower)
      .slice(0, 4)
      .map((c, i) => ({ label: c.name, value: c.productPower, color: PALETTE[(i + 1) % PALETTE.length] })),
  ];

  const activeProducts = s.products.filter((p) => p.active);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* hero KPIs */}
      <GlassCard className="lg:col-span-2">
        <SectionTitle right={<Badge tone="brand">{fmtDate(s.clock.year, s.clock.month)}</Badge>}>
          {s.company.name}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Trésorerie" value={money(s.company.cash)} icon={<Coins size={14} />} accent={s.company.cash >= 0 ? "good" : "bad"} />
          <Stat label="Valorisation" value={money(s.company.valuation)} icon={<Trophy size={14} />} accent="cyan" />
          <Stat label="Employés" value={s.employees.length} icon={<Users size={14} />} accent="brand" />
          <Stat label="Produits" value={activeProducts.length} icon={<Boxes size={14} />} accent="brand" />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
            <span>Trésorerie (24 derniers mois)</span>
            <span className={net >= 0 ? "text-good" : "text-bad"}>
              Net mensuel : {money(net)}
            </span>
          </div>
          <Sparkline data={cashSeries.length > 1 ? cashSeries : [0, s.company.cash]} height={70} />
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Revenus / mois" value={money(revenue)} tone="good" />
            <MiniStat label="Coûts / mois" value={money(costs)} tone="bad" />
            <MiniStat label="R&D / mois" value={`${s.research.pointsPerMonth.toFixed(1)} pts`} tone="cyan" />
          </div>
        </div>
      </GlassCard>

      {/* market share donut */}
      <GlassCard delay={0.05}>
        <SectionTitle>Parts de marché</SectionTitle>
        {shareSegments.some((x) => x.value > 0) ? (
          <Donut segments={shareSegments} />
        ) : (
          <p className="text-sm text-ink-500">Lance un produit pour conquérir des parts.</p>
        )}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-ink-500">
            <span>Indice boursier</span>
            <span className="font-semibold text-cyan">{s.stock.index.toFixed(0)}</span>
          </div>
          <Sparkline data={s.stock.index_history} height={36} />
        </div>
      </GlassCard>

      {/* products */}
      <GlassCard className="lg:col-span-2" delay={0.1}>
        <SectionTitle right={<Badge>{activeProducts.length} actifs</Badge>}>
          Produits en marché
        </SectionTitle>
        {activeProducts.length === 0 ? (
          <p className="text-sm text-ink-500">Aucun produit lancé. Va dans « Produits ».</p>
        ) : (
          <div className="space-y-3">
            {activeProducts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: p.design.color + "33" }}>
                  <Cpu size={16} style={{ color: p.design.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <Badge tone="cyan">{CATEGORY_LABELS[p.category]}</Badge>
                  </div>
                  <div className="mt-1"><ProgressBar value={p.score} tone="brand" /></div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{compact(p.unitsSold)}</div>
                  <div className="text-[10px] text-ink-500">unités</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* activity feed */}
      <GlassCard delay={0.15}>
        <SectionTitle right={<Activity size={14} className="text-brand-400" />}>
          Activité
        </SectionTitle>
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {s.log.slice(0, 30).map((l) => (
            <div key={l.id} className="flex gap-2 text-xs">
              <span className="shrink-0 text-ink-500">{fmtDate(l.year, l.month)}</span>
              <span
                className={
                  l.severity === "good"
                    ? "text-good"
                    : l.severity === "bad"
                      ? "text-bad"
                      : l.severity === "warn"
                        ? "text-warn"
                        : "text-ink-300"
                }
              >
                {l.text}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "cyan" }) {
  const tones = { good: "text-good", bad: "text-bad", cyan: "text-cyan" };
  return (
    <div className="rounded-xl bg-white/5 p-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`text-sm font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}
