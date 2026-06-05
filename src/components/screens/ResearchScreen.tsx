// ============================================================================
//  Research screen — R&D tree gated by era. Mirrors the "Recherche" mockup.
// ============================================================================
"use client";

import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge, ProgressBar } from "@/components/ui";
import { TECHNOLOGIES, TECH_BY_ID, researchableTechs } from "@/data/technologies";
import { cn } from "@/lib/cn";
import { Lock, Check, FlaskConical } from "lucide-react";

const ERAS: [number, number, string][] = [
  [1970, 1980, "1970s"],
  [1980, 1990, "1980s"],
  [1990, 2000, "1990s"],
  [2000, 2010, "2000s"],
  [2010, 2020, "2010s"],
  [2020, 2030, "2020s"],
  [2030, 2050, "2030-50"],
  [2050, 2100, "2050+"],
];

export function ResearchScreen() {
  const s = useGame((st) => st.state)!;
  const startResearch = useGame((st) => st.startResearch);

  const unlocked = new Set(s.research.unlocked);
  const available = new Set(researchableTechs(s.clock.year, s.research.unlocked).map((t) => t.id));
  const current = s.research.current ? TECH_BY_ID[s.research.current] : null;

  return (
    <div className="space-y-4">
      {/* current research banner */}
      <GlassCard>
        <SectionTitle right={<Badge tone="cyan">{s.research.pointsPerMonth.toFixed(1)} pts/mois</Badge>}>
          Recherche en cours
        </SectionTitle>
        {current ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{current.name}</span>
              <span className="text-xs text-ink-500">
                {Math.round(s.research.progress)} / {current.cost} pts
              </span>
            </div>
            <ProgressBar value={s.research.progress} max={current.cost} tone="cyan" showLabel />
          </div>
        ) : (
          <p className="text-sm text-ink-500">
            Aucune recherche active — sélectionne une technologie disponible ci-dessous.
          </p>
        )}
      </GlassCard>

      {/* tech tree by era */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {ERAS.map(([start, end, label]) => {
          const techs = TECHNOLOGIES.filter((t) => t.eraStart >= start && t.eraStart < end);
          if (techs.length === 0) return null;
          const eraReached = s.clock.year >= start;
          return (
            <GlassCard key={label} className={cn(!eraReached && "opacity-60")}>
              <SectionTitle right={<Badge tone={eraReached ? "brand" : "neutral"}>{label}</Badge>}>
                Époque {label}
              </SectionTitle>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {techs.map((t) => {
                  const isDone = unlocked.has(t.id);
                  const isAvail = available.has(t.id);
                  const reqs = t.requires.map((r) => TECH_BY_ID[r]?.name).filter(Boolean);
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "rounded-xl border p-3 transition",
                        isDone
                          ? "border-good/40 bg-good/10"
                          : isAvail
                            ? "border-brand/40 bg-brand/10"
                            : "border-line bg-white/3",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            {isDone ? (
                              <Check size={13} className="text-good" />
                            ) : isAvail ? (
                              <FlaskConical size={13} className="text-brand-400" />
                            ) : (
                              <Lock size={13} className="text-ink-500" />
                            )}
                            <span className="truncate">{t.name}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-500">{t.description}</p>
                          {reqs.length > 0 && !isDone && (
                            <p className="mt-1 text-[10px] text-ink-500">Requis : {reqs.join(", ")}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-ink-400">{t.cost} pts</span>
                      </div>
                      {!isDone && isAvail && !current && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => startResearch(t.id)}
                        >
                          Rechercher
                        </Button>
                      )}
                      {isDone && <div className="mt-2 text-center text-[11px] text-good">Débloqué ✓</div>}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
