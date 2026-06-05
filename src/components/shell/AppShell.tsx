// ============================================================================
//  AppShell — top-level client wrapper. Boots the loop & autosave, shows the
//  start screen when there's no game, otherwise renders the sidebar + content.
// ============================================================================
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useGame } from "@/store/gameStore";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useAutosave } from "@/hooks/useAutosave";
import { Sidebar, MobileNav } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { StartScreen } from "@/components/shell/StartScreen";
import { Toast } from "@/components/shell/Toast";

export function AppShell({ children }: { children: ReactNode }) {
  const state = useGame((s) => s.state);
  const [mounted, setMounted] = useState(false);

  useGameLoop();
  useAutosave();

  // avoid SSR/hydration mismatch: the game only exists client-side
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-500">
        Chargement…
      </div>
    );
  }

  if (!state) return <StartScreen />;

  return (
    <div className="bg-grid flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-3 pb-24 pt-3 md:px-5 md:pb-6">
        <TopBar />
        <div className="animate-fade-up">{children}</div>
      </main>
      <MobileNav />
      <Toast />
    </div>
  );
}
