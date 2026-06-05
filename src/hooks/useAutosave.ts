// ============================================================================
//  useAutosave — periodically pushes the current state to the cloud (if a
//  Supabase session exists). Local autosave already happens on every action.
// ============================================================================
"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/store/gameStore";
import { cloudSave } from "@/lib/cloudSave";
import { isCloudEnabled } from "@/lib/supabase";

const CLOUD_INTERVAL_MS = 60_000; // push to cloud once a minute

export function useAutosave() {
  const lastYear = useRef<number | null>(null);

  useEffect(() => {
    if (!isCloudEnabled()) return;
    const id = setInterval(async () => {
      const s = useGame.getState().state;
      if (!s) return;
      await cloudSave(s, 0, "autosave");
      lastYear.current = s.clock.year;
    }, CLOUD_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
