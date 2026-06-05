// ============================================================================
//  Events — world events feed + upcoming/possible events. Mirrors "Événements".
// ============================================================================
"use client";

import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Badge } from "@/components/ui";
import { EVENTS } from "@/engine/events";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const SEV: Record<string, { icon: string; tone: any; ring: string }> = {
  good: { icon: "📈", tone: "good", ring: "border-good/40 bg-good/10" },
  bad: { icon: "💥", tone: "bad", ring: "border-bad/40 bg-bad/10" },
  warn: { icon: "⚠️", tone: "warn", ring: "border-warn/40 bg-warn/10" },
  info: { icon: "🌍", tone: "cyan", ring: "border-cyan/40 bg-cyan/10" },
};

export function EventsScreen() {
  const s = useGame((st) => st.state)!;

  const possible = EVENTS.filter((e) => s.clock.year >= e.eraStart && s.clock.year <= e.eraEnd);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2">
        <SectionTitle right={<Badge tone="brand">{s.events.length}</Badge>}>
          Flux d'événements mondiaux
        </SectionTitle>
        {s.events.length === 0 ? (
          <p className="text-sm text-ink-500">Le monde est calme… pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {s.events.map((e, i) => {
              const sev = SEV[e.severity] ?? SEV.info;
              return (
                <div key={`${e.key}-${i}`} className={cn("flex gap-3 rounded-xl border p-3", sev.ring)}>
                  <span className="text-2xl">{sev.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{e.title}</span>
                      <span className="shrink-0 text-[11px] text-ink-500">{fmtDate(e.year, e.month)}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-300">{e.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard delay={0.05}>
        <SectionTitle>Risques de l'époque</SectionTitle>
        <p className="mb-3 text-[11px] text-ink-500">
          Événements possibles selon l'année {s.clock.year}. Chaque partie est unique (seed #{s.meta.seed.toString(16)}).
        </p>
        <div className="space-y-2">
          {possible.map((e) => {
            const sev = SEV[e.severity] ?? SEV.info;
            const onCooldown = (s.eventCooldowns[e.key] ?? 0) > 0;
            return (
              <div key={e.key} className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                <span className="text-lg">{sev.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{e.title}</div>
                  <div className="text-[10px] text-ink-500">Poids {e.weight}</div>
                </div>
                {onCooldown ? (
                  <Badge tone="neutral">⏳ {s.eventCooldowns[e.key]}m</Badge>
                ) : (
                  <Badge tone={sev.tone}>actif</Badge>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
