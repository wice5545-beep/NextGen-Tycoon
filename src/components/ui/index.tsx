// ============================================================================
//  UI primitives — glassmorphism design system building blocks.
// ============================================================================
"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// ---------------------------------------------------------------- Card / Glass
export function GlassCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "glass rounded-xl2 shadow-glass p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-300">
        {children}
      </h2>
      {right}
    </div>
  );
}

// ----------------------------------------------------------------------- Stat
export function Stat({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  icon?: ReactNode;
  accent?: "brand" | "cyan" | "good" | "bad";
}) {
  const accentClass =
    accent === "cyan"
      ? "text-cyan"
      : accent === "good"
        ? "text-good"
        : accent === "bad"
          ? "text-bad"
          : "text-brand-400";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-ink-500">
        {icon && <span className={cn("opacity-80", accentClass)}>{icon}</span>}
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-ink-100">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "text-xs font-medium",
              delta >= 0 ? "text-good" : "text-bad",
            )}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- Button
export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-brand text-white shadow-glow hover:bg-brand-600",
    ghost: "bg-white/5 text-ink-100 hover:bg-white/10",
    outline: "border border-line text-ink-100 hover:bg-white/5",
    danger: "bg-bad/90 text-white hover:bg-bad",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------- Badge
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "good" | "bad" | "warn" | "cyan";
}) {
  const tones = {
    neutral: "bg-white/8 text-ink-300",
    brand: "bg-brand/20 text-brand-400",
    good: "bg-good/15 text-good",
    bad: "bg-bad/15 text-bad",
    warn: "bg-warn/15 text-warn",
    cyan: "bg-cyan/15 text-cyan",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// ----------------------------------------------------------------- ProgressBar
export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  showLabel,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "cyan" | "good" | "warn";
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    brand: "from-brand-400 to-brand-600",
    cyan: "from-cyan to-brand-400",
    good: "from-good to-cyan",
    warn: "from-warn to-bad",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", tones[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {showLabel && (
        <span className="w-9 text-right text-[11px] text-ink-300">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- Gauge
export function Gauge({ value, label }: { value: number; label?: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#g)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9b86ff" />
            <stop offset="100%" stopColor="#27d6ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{Math.round(value)}</span>
        {label && <span className="text-[9px] text-ink-500">{label}</span>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Sparkline
export function Sparkline({
  data,
  height = 40,
  tone = "#27d6ff",
}: {
  data: number[];
  height?: number;
  tone?: string;
}) {
  if (data.length < 2) return <div style={{ height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 100;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#34e0a1" : "#ff5c7c"}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------- Donut
export function Donut({
  segments,
  size = 120,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 45;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" style={{ width: size, height: size }} className="-rotate-90">
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc * c}
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="space-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="text-ink-300">{s.label}</span>
            <span className="ml-auto font-medium">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
