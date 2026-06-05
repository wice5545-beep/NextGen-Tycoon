// ============================================================================
//  StartScreen — shown when there is no active game. New game / continue.
// ============================================================================
"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/store/gameStore";
import { Button } from "@/components/ui";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";

export function StartScreen() {
  const newGame = useGame((s) => s.newGame);
  const loadLocal = useGame((s) => s.loadLocal);
  const [name, setName] = useState("Nova Interactive");
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(typeof window !== "undefined" && !!localStorage.getItem("ngt_save_v1"));
  }, []);

  return (
    <div className="bg-grid relative flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-strong w-full max-w-md rounded-xl2 p-8 text-center shadow-glass"
      >
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand shadow-glow">
          <Gamepad2 size={30} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          NEXT<span className="text-grad">GEN</span> TYCOON
        </h1>
        <p className="mt-1 text-sm text-ink-300">
          Bâtis ton empire du jeu vidéo. 1970 → 2100.
        </p>

        <div className="mt-7 space-y-3 text-left">
          <label className="block text-[11px] uppercase tracking-wider text-ink-500">
            Nom de l'entreprise
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line bg-white/5 px-4 py-3 text-sm outline-none focus:border-brand"
            placeholder="Ma société"
          />
          <Button size="lg" className="w-full" onClick={() => newGame(name)}>
            🚀 Nouvelle partie
          </Button>
          {hasSave && (
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => loadLocal()}
            >
              ⏪ Continuer la partie
            </Button>
          )}
        </div>

        <p className="mt-6 text-[11px] text-ink-500">
          Sauvegarde locale automatique · Cloud Supabase optionnel
        </p>
      </motion.div>
    </div>
  );
}
