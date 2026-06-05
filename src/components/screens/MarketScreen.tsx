// ============================================================================
//  Market / Bourse — index, equities, tech & crypto with buy/sell. Mirrors the
//  "Bourse" mockup.
// ============================================================================
"use client";

import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge, Sparkline, Stat } from "@/components/ui";
import { money, fmtNum } from "@/lib/format";
import type { StockKind } from "@/engine/types";
import { cn } from "@/lib/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

const KIND_LABEL: Record<StockKind, string> = { equity: "Action", tech: "Tech", crypto: "Crypto" };

export function MarketScreen() {
  const s = useGame((st) => st.state)!;
  const trade = useGame((st) => st.trade);

  const portfolioValue = s.stock.stocks.reduce((a, x) => a + x.shares * x.price, 0);
  const indexUp = s.stock.index_history.length > 1 && s.stock.index >= s.stock.index_history[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <SectionTitle right={<Badge tone={indexUp ? "good" : "bad"}>{indexUp ? "▲" : "▼"} NGT-Index</Badge>}>
            Indice du marché
          </SectionTitle>
          <div className="flex items-end gap-4">
            <div className="text-3xl font-bold tabular-nums">{s.stock.index.toFixed(0)}</div>
            <div className="flex-1"><Sparkline data={s.stock.index_history} height={60} /></div>
          </div>
        </GlassCard>
        <GlassCard delay={0.05}>
          <SectionTitle>Portefeuille</SectionTitle>
          <Stat label="Valeur titres" value={money(portfolioValue)} accent="cyan" icon={<TrendingUp size={14} />} />
          <div className="mt-3"><Stat label="Liquidités" value={money(s.company.cash)} accent={s.company.cash >= 0 ? "good" : "bad"} /></div>
        </GlassCard>
      </div>

      <GlassCard delay={0.1}>
        <SectionTitle right={<Badge>{s.stock.stocks.length} actifs</Badge>}>Cotations</SectionTitle>
        <div className="space-y-2">
          {s.stock.stocks.map((st2) => {
            const prev = st2.history.length > 1 ? st2.history[st2.history.length - 2] : st2.price;
            const change = ((st2.price - prev) / (prev || 1)) * 100;
            const up = change >= 0;
            return (
              <div key={st2.ticker} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <div className="w-24 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{st2.ticker}</span>
                    <Badge tone={st2.kind === "crypto" ? "warn" : st2.kind === "tech" ? "cyan" : "brand"}>
                      {KIND_LABEL[st2.kind]}
                    </Badge>
                  </div>
                  <div className="truncate text-[11px] text-ink-500">{st2.name}</div>
                </div>

                <div className="hidden flex-1 sm:block">
                  <Sparkline data={st2.history} height={28} />
                </div>

                <div className="w-20 text-right">
                  <div className="text-sm font-semibold tabular-nums">{money(st2.price)}</div>
                  <div className={cn("flex items-center justify-end gap-0.5 text-[11px]", up ? "text-good" : "text-bad")}>
                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button size="sm" onClick={() => trade(st2.ticker, 100)}>Acheter</Button>
                  <Button size="sm" variant="ghost" disabled={st2.shares < 100} onClick={() => trade(st2.ticker, -100)}>Vendre</Button>
                </div>

                <div className="w-16 text-right text-[11px] text-ink-500">
                  {st2.shares > 0 ? `${fmtNum(st2.shares)} titres` : "—"}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-500">Échanges par lots de 100 titres.</p>
      </GlassCard>
    </div>
  );
}
