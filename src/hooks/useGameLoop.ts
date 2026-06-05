// ============================================================================
//  useGameLoop — drives engineTick on an interval based on store.speed.
//  Speed maps to ticks/second: x1=1 month/2s, x2=1 month/1s, x3=1 month/0.4s.
// ============================================================================
"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/store/gameStore";

const INTERVAL_MS: Record<number, number> = { 0: 0, 1: 2000, 2: 1000, 3: 400 };

export function useGameLoop() {
  const speed = useGame((s) => s.speed);
  const tickOnce = useGame((s) => s.tickOnce);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (speed === 0) return;
    const ms = INTERVAL_MS[speed] ?? 1000;
    timer.current = setInterval(() => tickOnce(), ms);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [speed, tickOnce]);
}
