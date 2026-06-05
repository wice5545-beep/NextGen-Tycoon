// ============================================================================
//  HQ — buildings & employees (RPG). Mirrors the "Siège social" mockup.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge, ProgressBar } from "@/components/ui";
import { BUILDINGS, buildingsSummary, BUILDING_BY_ID } from "@/data/buildings";
import { makeCandidate, TIER_LABEL, TIER_ORDER } from "@/engine/employees";
import { Rng } from "@/engine/rng";
import { money } from "@/lib/format";
import type { Employee, EmployeeTier } from "@/engine/types";
import { cn } from "@/lib/cn";
import { Building2, Users, Cpu, Palette, Briefcase, Sparkles, Zap } from "lucide-react";

export function HQScreen() {
  const s = useGame((st) => st.state)!;
  const build = useGame((st) => st.build);
  const hire = useGame((st) => st.hire);
  const fire = useGame((st) => st.fire);

  const summary = buildingsSummary(s.buildings);

  // generate a stable-ish candidate pool from the current tick
  const [poolSeed, setPoolSeed] = useState(0);
  const candidates = useMemo<Employee[]>(() => {
    const rng = new Rng((s.meta.seed ^ (s.clock.ticks * 7919) ^ (poolSeed * 104729)) >>> 0);
    const tiers: EmployeeTier[] = ["junior", "junior", "confirmed", "senior", "expert"];
    return tiers.map((t) => makeCandidate(rng, t, s.clock.year));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.clock.ticks, poolSeed, s.meta.seed]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* buildings */}
      <GlassCard>
        <SectionTitle right={<Badge tone="cyan">Capacité {s.employees.length}/{summary.staffCap}</Badge>}>
          Bâtiments
        </SectionTitle>
        <div className="space-y-2">
          {BUILDINGS.map((b) => {
            const owned = s.buildings.includes(b.id);
            const reqOk = !b.requires || s.buildings.includes(b.requires);
            const canBuy = !owned && reqOk && s.company.cash >= b.cost;
            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  owned ? "border-good/30 bg-good/5" : reqOk ? "border-line bg-white/5" : "border-line bg-white/3 opacity-60",
                )}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/15">
                  <Building2 size={16} className="text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{b.name}</span>
                    {owned && <Badge tone="good">Construit</Badge>}
                  </div>
                  <p className="truncate text-[11px] text-ink-500">{b.unlocks}</p>
                  <p className="text-[10px] text-ink-500">
                    Staff {b.staffCap} · R&D +{b.rndBonus} · entretien {money(b.upkeep)}/mois
                  </p>
                </div>
                {!owned && (
                  <Button size="sm" disabled={!canBuy} onClick={() => build(b.id)}>
                    {money(b.cost)}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* employees */}
      <div className="space-y-4">
        <GlassCard delay={0.05}>
          <SectionTitle right={<Users size={14} className="text-brand-400" />}>
            Équipe ({s.employees.length})
          </SectionTitle>
          {s.employees.length === 0 ? (
            <p className="text-sm text-ink-500">Aucun employé. Recrute ci-dessous.</p>
          ) : (
            <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
              {s.employees.map((e) => (
                <EmployeeRow key={e.id} e={e} onFire={() => fire(e.id)} />
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard delay={0.1}>
          <SectionTitle right={<Button size="sm" variant="ghost" onClick={() => setPoolSeed((x) => x + 1)}>↻ Renouveler</Button>}>
            Recrutement
          </SectionTitle>
          <div className="space-y-2">
            {candidates.map((c) => {
              const full = s.employees.length >= summary.staffCap;
              const signing = Math.round(c.salary * 0.5);
              return (
                <div key={c.id} className="rounded-xl bg-white/5 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <Badge tone={tierTone(c.tier)}>{TIER_LABEL[c.tier]}</Badge>
                    </div>
                    <Button size="sm" disabled={full || s.company.cash < signing} onClick={() => hire(c)}>
                      {money(signing)}
                    </Button>
                  </div>
                  <StatChips e={c} />
                  <div className="mt-1 text-right text-[10px] text-ink-500">Salaire {money(c.salary)}/mois</div>
                </div>
              );
            })}
          </div>
          {s.employees.length >= summary.staffCap && (
            <p className="mt-2 text-center text-[11px] text-warn">Capacité atteinte — agrandis tes locaux.</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function EmployeeRow({ e, onFire }: { e: Employee; onFire: () => void }) {
  const nextIdx = TIER_ORDER.indexOf(e.tier) + 1;
  return (
    <div className="rounded-xl bg-white/5 p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{e.name}</span>
          <Badge tone={tierTone(e.tier)}>{TIER_LABEL[e.tier]}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onFire}>Licencier</Button>
      </div>
      <StatChips e={e} />
    </div>
  );
}

function StatChips({ e }: { e: Employee }) {
  const chips = [
    { icon: <Cpu size={11} />, v: e.programming },
    { icon: <Palette size={11} />, v: e.design },
    { icon: <Briefcase size={11} />, v: e.management },
    { icon: <Sparkles size={11} />, v: e.creativity },
    { icon: <Zap size={11} />, v: e.speed },
  ];
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-ink-300">
          {c.icon} {c.v}
        </span>
      ))}
    </div>
  );
}

function tierTone(t: EmployeeTier): any {
  return t === "legend" ? "warn" : t === "expert" ? "brand" : t === "senior" ? "cyan" : "neutral";
}
