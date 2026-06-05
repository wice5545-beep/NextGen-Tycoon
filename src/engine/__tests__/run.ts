// ============================================================================
//  Engine self-test — runs a full 1970→2100 simulation headlessly and asserts
//  determinism + invariants. Run with: npm test
// ============================================================================
import { createNewGame } from "@/engine/newgame";
import { tick, startResearch, createProduct, createGame } from "@/engine/engine";
import { researchableTechs } from "@/data/technologies";
import { availableComponents } from "@/data/components";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("❌ FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("✅", msg);
  }
}

function simulate(seed: number, months: number) {
  const s = createNewGame({ companyName: "Test Co", seed });
  for (let i = 0; i < months; i++) {
    // auto-research whenever idle
    if (!s.research.current) {
      const avail = researchableTechs(s.clock.year, s.research.unlocked);
      if (avail.length) startResearch(s, avail[0].id);
    }
    tick(s);
  }
  return s;
}

console.log("\n=== NextGen Tycoon engine test ===\n");

// 1. Determinism: same seed => identical end state
const a = simulate(12345, 360);
const b = simulate(12345, 360);
assert(
  JSON.stringify(a.company) === JSON.stringify(b.company),
  "Déterminisme : même seed → même entreprise",
);
assert(
  a.stock.index === b.stock.index,
  "Déterminisme : même seed → même indice boursier",
);

// 2. Different seeds => different runs
const c = simulate(99999, 360);
assert(
  JSON.stringify(a.company) !== JSON.stringify(c.company),
  "Unicité : seed différent → partie différente",
);

// 3. Timeline progresses correctly (30 years = 360 months from 1970)
assert(a.clock.year === 2000, `Timeline atteint l'an 2000 (got ${a.clock.year})`);

// 4. Tech unlocks over time
assert(a.research.unlocked.length > 5, `Recherche progresse (${a.research.unlocked.length} tech)`);

// 5. Segments come online (phone unlocked by 2008)
const long = simulate(2024, 12 * 50); // 50 years => 2020
assert(long.market.segments.phone.unlocked, "Segment smartphone débloqué après 2008");
assert(long.market.segments.vr_ar.unlocked, "Segment VR/AR débloqué après 2014");

// 6. Competitors stay persistent & some die / shares sum sane
const aliveShare = long.competitors
  .filter((x) => x.alive)
  .reduce((acc, x) => acc + x.marketShare, 0);
assert(aliveShare > 0 && aliveShare <= 1.0001, `Parts de marché cohérentes (${aliveShare.toFixed(3)})`);

// 7. Build & sell a product end-to-end
{
  const s = createNewGame({ companyName: "Builder", seed: 7 });
  s.company.cash = 5_000_000;
  // unlock a couple of base techs by year so components exist
  for (let i = 0; i < 24; i++) {
    if (!s.research.current) {
      const av = researchableTechs(s.clock.year, s.research.unlocked);
      if (av.length) startResearch(s, av[0].id);
    }
    tick(s);
  }
  const comps = availableComponents("console_home", s.clock.year, s.research.unlocked)
    .slice(0, 4)
    .map((x) => x.id);
  const res = createProduct(s, {
    name: "Nova One",
    category: "console_home",
    componentIds: comps,
    price: 299,
    design: { color: "#7c5cff", formFactor: "tower" },
  });
  assert(res.ok, `Produit créé (${res.reason ?? "ok"})`);
  for (let i = 0; i < 36; i++) tick(s);
  const prod = s.products[0];
  assert(prod.active, "Produit lancé après R&D");
  assert(prod.unitsSold > 0, `Produit vendu (${prod.unitsSold} unités)`);
}

// 8. Create a game end-to-end
{
  const s = createNewGame({ companyName: "Studio", seed: 42 });
  s.company.cash = 3_000_000;
  const res = createGame(s, {
    title: "Echoes of Eclipse",
    genre: "rpg",
    platformId: null,
    budget: 800_000,
    marketing: 200_000,
  });
  assert(res.ok, `Jeu créé (${res.reason ?? "ok"})`);
  for (let i = 0; i < 24; i++) tick(s);
  assert(s.games[0].shipped, "Jeu sorti après dev");
  assert(s.games[0].reviewScore > 0, `Jeu noté (${s.games[0].reviewScore}/100)`);
}

// 9. Save/load round trip preserves determinism
{
  const s1 = simulate(555, 120);
  const json = JSON.stringify(s1);
  const s2 = JSON.parse(json);
  tick(s1);
  tick(s2);
  assert(
    JSON.stringify(s1.stock.index) === JSON.stringify(s2.stock.index),
    "Save/load : détermination conservée après rechargement",
  );
}

console.log("\n=== done ===\n");
