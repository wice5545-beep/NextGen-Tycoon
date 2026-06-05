// ============================================================================
//  TopBar — date, speed controls, cash & key KPIs. Matches the mockups' header.
// ============================================================================
"use client";

import { useGame, type Speed } from "@/store/gameStore";
import { fmtDate, money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Pause, Play, FastForward, Coins, Star, TrendingUp } from "lucide-react";

const SPEEDS: { v: Speed; label: string; icon: React.ReactNode }[] = [
  { v: 0, label: "Pause", icon: <Pause size={14} /> },
  { v: 1, label: "x1", icon: <Play size={14} /> },
  { v: 2, label: "x2", icon: <FastForward size={14} /> },
  { v: 3, label: "x3", icon: <FastForward size={14} /> },
];

export function TopBar() {
  const state = useGame((s) => s.state);
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  if (!state) return null;

  return (
    <header className="glass sticky top-0 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-xl2 px-4 py-3">
      {/* date + clock */}
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold tabular-nums">
          {fmtDate(state.clock.year, state.clock.month)}
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
          {SPEEDS.map((s) => (
            <button
              key={s.v}
              onClick={() => setSpeed(s.v)}
              title={s.label}
              className={cn(
                "flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium transition",
                speed === s.v
                  ? "bg-brand text-white shadow-glow"
                  : "text-ink-300 hover:bg-white/5",
              )}
            >
              {s.icon}
              {s.v > 0 && <span>{s.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-4">
        <Kpi icon={<Coins size={15} />} label="Trésorerie" value={money(state.company.cash)} tone={state.company.cash >= 0 ? "good" : "bad"} />
        <Kpi icon={<TrendingUp size={15} />} label="Valorisation" value={money(state.company.valuation)} tone="cyan" />
        <Kpi icon={<Star size={15} />} label="Réputation" value={`${Math.round(state.company.reputation)}`} tone="brand" />
      </div>
    </header>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "good" | "bad" | "cyan" | "brand";
}) {
  const tones = {
    good: "text-good",
    bad: "text-bad",
    cyan: "text-cyan",
    brand: "text-brand-400",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn("opacity-80", tones[tone])}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
        <div className={cn("text-sm font-semibold tabular-nums", tones[tone])}>{value}</div>
      </div>
    </div>
  );
}
