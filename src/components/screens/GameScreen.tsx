// ============================================================================
//  Game creator — develop a video game (genre, platform, budget, marketing).
//  Mirrors the "Développement d'un jeu" mockup.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge, ProgressBar, Gauge } from "@/components/ui";
import { GENRES } from "@/data/genres";
import { teamQualityFor } from "@/engine/games";
import { money, compact } from "@/lib/format";
import type { Genre } from "@/engine/types";
import { cn } from "@/lib/cn";

export function GameScreen() {
  const s = useGame((st) => st.state)!;
  const createGame = useGame((st) => st.createGame);

  const [title, setTitle] = useState("Echoes of Eclipse");
  const [genre, setGenre] = useState<Genre>("rpg");
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [budget, setBudget] = useState(500_000);
  const [marketing, setMarketing] = useState(150_000);

  const teamQuality = useMemo(() => teamQualityFor(s, genre), [s, genre]);
  const total = budget + marketing;

  // projected review (rough mirror of engine formula, for the preview gauge)
  const genreDef = GENRES.find((g) => g.id === genre)!;
  const expected = genreDef.baseDevMonths * 60_000;
  const budgetFit = Math.max(0.4, Math.min(1.4, budget / expected));
  const projected = Math.round(Math.min(100, teamQuality * 0.8 + budgetFit * 12 + marketing / 8));

  const platforms = s.products.filter((p) => p.active);

  function submit() {
    createGame({ title, genre, platformId, budget, marketing });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <GlassCard>
          <SectionTitle>Nouveau jeu</SectionTitle>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full rounded-xl border border-line bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand"
            placeholder="Titre du jeu"
          />

          <div className="mb-1 text-[11px] uppercase tracking-wider text-ink-500">Genre</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const hot = s.clock.year >= g.hotFrom;
              return (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs font-medium transition",
                    genre === g.id ? "bg-brand text-white shadow-glow" : "bg-white/5 text-ink-300 hover:bg-white/10",
                  )}
                >
                  {g.name} {hot ? "🔥" : ""}
                </button>
              );
            })}
          </div>

          <div className="mb-1 text-[11px] uppercase tracking-wider text-ink-500">Plateforme cible</div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setPlatformId(null)}
              className={cn("rounded-xl px-3 py-2 text-xs font-medium", platformId === null ? "bg-brand text-white" : "bg-white/5 text-ink-300")}
            >
              Multi / PC
            </button>
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatformId(p.id)}
                className={cn("rounded-xl px-3 py-2 text-xs font-medium", platformId === p.id ? "bg-brand text-white" : "bg-white/5 text-ink-300")}
              >
                {p.name}
              </button>
            ))}
          </div>

          <Slider label="Budget de développement" value={budget} min={50_000} max={5_000_000} step={50_000} onChange={setBudget} />
          <Slider label="Budget marketing" value={marketing} min={0} max={2_000_000} step={25_000} onChange={setMarketing} />
        </GlassCard>

        {/* games list */}
        <GlassCard delay={0.1}>
          <SectionTitle right={<Badge>{s.games.length}</Badge>}>Catalogue</SectionTitle>
          {s.games.length === 0 ? (
            <p className="text-sm text-ink-500">Aucun jeu encore. Lance ta première production !</p>
          ) : (
            <div className="space-y-2">
              {s.games.slice().reverse().map((g) => (
                <div key={g.id} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{g.title}</span>
                      <Badge tone="brand"> {GENRES.find((x) => x.id === g.genre)?.name}</Badge>
                    </div>
                    {g.shipped ? (
                      <Badge tone={g.reviewScore >= 80 ? "good" : g.reviewScore >= 50 ? "cyan" : "bad"}>
                        {g.reviewScore}/100
                      </Badge>
                    ) : (
                      <Badge tone="warn">En dev</Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    {g.shipped ? (
                      <div className="flex justify-between text-xs text-ink-500">
                        <span>Sorti en {g.releaseYear}</span>
                        <span className="text-good">{compact(g.unitsSold)} ventes</span>
                      </div>
                    ) : (
                      <ProgressBar value={g.devMonthsDone} max={g.devMonthsTotal} tone="warn" showLabel />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* preview */}
      <div className="space-y-4">
        <GlassCard delay={0.05}>
          <SectionTitle>Prévision</SectionTitle>
          <div className="flex items-center justify-around">
            <Gauge value={projected} label="Note est." />
            <Gauge value={teamQuality} label="Équipe" />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Budget total" value={money(total)} />
            <Row label="Durée estimée" value={`~${genreDef.baseDevMonths} mois`} />
            <Row label="Popularité genre" value={s.clock.year >= genreDef.hotFrom ? "Élevée 🔥" : "Modérée"} />
          </div>
          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={s.company.cash < total || s.employees.length === 0}
            onClick={submit}
          >
            🎬 Lancer la production
          </Button>
          {s.employees.length === 0 && (
            <p className="mt-2 text-center text-[11px] text-warn">Embauche des employés au Siège d'abord.</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; }) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-ink-500">
        <span>{label}</span>
        <span className="text-ink-100">{money(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-300">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
