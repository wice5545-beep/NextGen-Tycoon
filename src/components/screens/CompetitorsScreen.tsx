// ============================================================================
//  Competitors — AI rivals ranking, share, and acquisitions (HQ required).
//  Mirrors the "Parts de marché" world-map mockup (ranking-focused).
// ============================================================================
"use client";

import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge, ProgressBar } from "@/components/ui";
import { money, pct } from "@/lib/format";
import { acquisitionPrice } from "@/engine/actions";
import { buildingsSummary } from "@/data/buildings";
import { cn } from "@/lib/cn";

const PERSONALITY: Record<string, { label: string; tone: any }> = {
  aggressive: { label: "Agressif", tone: "bad" },
  innovator: { label: "Innovateur", tone: "cyan" },
  budget: { label: "Low-cost", tone: "warn" },
  premium: { label: "Premium", tone: "brand" },
};

export function CompetitorsScreen() {
  const s = useGame((st) => st.state)!;
  const acquire = useGame((st) => st.acquire);

  const canAcquire = buildingsSummary(s.buildings).canAcquire;

  const playerPower = s.products.filter((p) => p.active).reduce((a, p) => a + p.score * 1.2, 0);
  const living = s.competitors.filter((c) => c.alive);
  const dead = s.competitors.filter((c) => !c.alive);

  const ranked = [
    { id: s.company.id, name: s.company.name, power: playerPower, isPlayer: true, share: 0, personality: "premium", reputation: s.company.reputation },
    ...living.map((c) => ({ id: c.id, name: c.name, power: c.productPower, isPlayer: false, share: c.marketShare, personality: c.personality, reputation: c.reputation })),
  ].sort((a, b) => b.power - a.power);

  const maxPower = ranked[0]?.power || 1;

  return (
    <div className="space-y-4">
      <GlassCard>
        <SectionTitle right={<Badge tone="brand">{living.length} actifs</Badge>}>
          Classement du marché
        </SectionTitle>
        <div className="space-y-2">
          {ranked.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3",
                c.isPlayer ? "border border-brand/50 bg-brand/10" : "bg-white/5",
              )}
            >
              <span className="w-6 text-center text-sm font-bold text-ink-500">#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  {c.isPlayer && <Badge tone="brand">Vous</Badge>}
                  {!c.isPlayer && (
                    <Badge tone={PERSONALITY[c.personality]?.tone}>{PERSONALITY[c.personality]?.label}</Badge>
                  )}
                </div>
                <div className="mt-1"><ProgressBar value={(c.power / maxPower) * 100} tone={c.isPlayer ? "brand" : "cyan"} /></div>
              </div>
              <div className="w-16 text-right">
                <div className="text-sm font-semibold">{c.share > 0 ? pct(c.share) : "—"}</div>
                <div className="text-[10px] text-ink-500">part</div>
              </div>
              {!c.isPlayer && canAcquire && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acquire(c.id)}
                  disabled={s.company.cash < acquisitionPrice(s, c.id)}
                >
                  Racheter · {money(acquisitionPrice(s, c.id))}
                </Button>
              )}
            </div>
          ))}
        </div>
        {!canAcquire && (
          <p className="mt-3 text-center text-[11px] text-ink-500">
            🏢 Construis un <span className="text-brand-400">Siège social</span> pour racheter des concurrents.
          </p>
        )}
      </GlassCard>

      {dead.length > 0 && (
        <GlassCard delay={0.05}>
          <SectionTitle>Disparus / rachetés</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {dead.map((c) => (
              <Badge key={c.id} tone="neutral">
                {c.name} {c.acquired ? "🤝" : "💀"}
              </Badge>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
