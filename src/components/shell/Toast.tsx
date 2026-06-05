// ============================================================================
//  Toast — surfaces action feedback (errors / confirmations) from the store.
// ============================================================================
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useGame } from "@/store/gameStore";
import { cn } from "@/lib/cn";

export function Toast() {
  const toast = useGame((s) => s.lastToast);
  const clear = useGame((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2600);
    return () => clearTimeout(t);
  }, [toast, clear]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className={cn(
            "glass-strong fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm shadow-glass md:bottom-6",
            toast.ok ? "text-good" : "text-bad",
          )}
        >
          {toast.ok ? "✅ " : "⚠️ "}
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
