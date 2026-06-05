// ============================================================================
//  Marketing & hype — campaigns build a pre-launch hype curve that decays.
// ============================================================================
import type { Campaign, GameState } from "@/engine/types";
import { clamp } from "@/engine/economy";
import { pushLog } from "@/engine/products";

export const CHANNELS: Record<
  Campaign["channel"],
  { label: string; baseCost: number; power: number; months: number }
> = {
  social: { label: "Réseaux sociaux", baseCost: 20_000, power: 8, months: 3 },
  tv: { label: "TV", baseCost: 80_000, power: 18, months: 2 },
  influencer: { label: "Influenceurs", baseCost: 45_000, power: 14, months: 3 },
  event: { label: "Événement", baseCost: 120_000, power: 26, months: 1 },
  teaser: { label: "Teasing", baseCost: 15_000, power: 6, months: 4 },
};

/** Launch a campaign for a product (in dev or live). Returns ok. */
export function startCampaign(
  state: GameState,
  productId: string,
  channel: Campaign["channel"],
  spendMult: number,
): boolean {
  const def = CHANNELS[channel];
  const spend = Math.round(def.baseCost * spendMult);
  if (state.company.cash < spend) return false;
  state.company.cash -= spend;
  const power = def.power * spendMult;
  state.campaigns.push({
    id: `camp_${state.logCounter}_${productId}`,
    productId,
    channel,
    spend,
    monthsLeft: def.months,
    power,
  });
  const p = state.products.find((x) => x.id === productId);
  if (p) pushLog(state, `📢 Campagne ${def.label} pour ${p.name}`, "info");
  return true;
}

/** Monthly: campaigns push hype up; expired ones are removed; hype decays. */
export function tickMarketing(state: GameState): void {
  const remaining: Campaign[] = [];
  for (const c of state.campaigns) {
    const p = state.products.find((x) => x.id === c.productId);
    if (p) p.hype = clamp(p.hype + c.power, 0, 100);
    c.monthsLeft -= 1;
    if (c.monthsLeft > 0) remaining.push(c);
  }
  state.campaigns = remaining;
}
