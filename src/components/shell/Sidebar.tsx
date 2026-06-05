// ============================================================================
//  Sidebar (desktop) — vertical glass nav matching the inspiration mockups.
// ============================================================================
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/shell/nav";
import { cn } from "@/lib/cn";
import { Gamepad2 } from "lucide-react";

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col gap-2 p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
          <Gamepad2 size={18} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold">
            NEXT<span className="text-grad">GEN</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500">
            Tycoon
          </div>
        </div>
      </div>

      <nav className="glass flex-1 rounded-xl2 p-2">
        {NAV.map((item) => {
          const active = path === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-brand/20 text-white"
                  : "text-ink-300 hover:bg-white/5 hover:text-ink-100",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
              )}
              <Icon size={18} className={active ? "text-brand-400" : ""} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="glass rounded-xl2 p-3 text-[11px] text-ink-500">
        <span className="text-grad font-semibold">v1.0</span> · 1970 → 2100
      </div>
    </aside>
  );
}

// ---- mobile bottom nav ----
export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="safe-b glass-strong fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-1 py-2 md:hidden">
      {NAV.slice(0, 6).map((item) => {
        const active = path === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px]",
              active ? "text-brand-400" : "text-ink-500",
            )}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
