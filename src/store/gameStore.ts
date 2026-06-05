// ============================================================================
//  Global game store (Zustand + immer).
//  Wraps the pure engine; the engine mutates a draft, React reads snapshots.
//  Handles the game loop speed, local autosave, and exposes all player actions.
// ============================================================================
"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  GameState,
  BuildingId,
  Employee,
  Genre,
  ProductCategory,
  ProductDesign,
} from "@/engine/types";
import { createNewGame } from "@/engine/newgame";
import {
  tick as engineTick,
  startResearch as engStartResearch,
  createProduct as engCreateProduct,
  createGame as engCreateGame,
  ProductDraft,
  GameDraft,
} from "@/engine/engine";
import {
  hireEmployee as engHire,
  fireEmployee as engFire,
  buildBuilding as engBuild,
  acquireCompetitor as engAcquire,
} from "@/engine/actions";
import { startCampaign as engCampaign } from "@/engine/marketing";
import { trade as engTrade } from "@/engine/stock";
import { randomSeed } from "@/engine/rng";

const LS_KEY = "ngt_save_v1";

export type Speed = 0 | 1 | 2 | 3;

interface ActionResult {
  ok: boolean;
  reason?: string;
}

interface GameStore {
  state: GameState | null;
  speed: Speed;
  lastToast: { text: string; ok: boolean } | null;

  // lifecycle
  newGame: (companyName: string, seed?: number) => void;
  loadFromJSON: (json: string) => boolean;
  loadLocal: () => boolean;
  saveLocal: () => void;
  setState: (s: GameState) => void;

  // loop
  setSpeed: (s: Speed) => void;
  tickOnce: () => void;

  // actions
  startResearch: (techId: string) => ActionResult;
  createProduct: (draft: ProductDraft) => ActionResult;
  createGame: (draft: GameDraft) => ActionResult;
  hire: (c: Employee) => ActionResult;
  fire: (id: string) => void;
  build: (id: BuildingId) => ActionResult;
  acquire: (id: string) => ActionResult;
  campaign: (productId: string, channel: any, spendMult: number) => ActionResult;
  trade: (ticker: string, qty: number) => ActionResult;
  clearToast: () => void;
}

/** run an engine mutation against the current state, then persist. */
function withState(
  set: any,
  get: any,
  fn: (s: GameState) => ActionResult | void,
): ActionResult {
  const cur = get().state;
  if (!cur) return { ok: false, reason: "Pas de partie en cours." };
  let result: ActionResult = { ok: true };
  set((store: GameStore) => {
    const r = fn(store.state as GameState);
    if (r) result = r;
    if (r && !r.ok) store.lastToast = { text: r.reason ?? "Action impossible", ok: false };
  });
  if (result.ok) get().saveLocal();
  return result;
}

export const useGame = create<GameStore>()(
  immer((set, get) => ({
    state: null,
    speed: 0,
    lastToast: null,

    newGame: (companyName, seed) => {
      const s = createNewGame({ companyName, seed: seed ?? randomSeed() });
      set((store) => {
        store.state = s;
        store.speed = 1;
      });
      get().saveLocal();
    },

    setState: (s) => set((store) => { store.state = s; }),

    loadFromJSON: (json) => {
      try {
        const s = JSON.parse(json) as GameState;
        if (!s?.meta || !s?.clock) return false;
        set((store) => { store.state = s; });
        return true;
      } catch {
        return false;
      }
    },

    loadLocal: () => {
      if (typeof window === "undefined") return false;
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return false;
      return get().loadFromJSON(raw);
    },

    saveLocal: () => {
      if (typeof window === "undefined") return;
      const s = get().state;
      if (s) window.localStorage.setItem(LS_KEY, JSON.stringify(s));
    },

    setSpeed: (sp) => set((store) => { store.speed = sp; }),

    tickOnce: () => {
      set((store) => {
        if (store.state) engineTick(store.state);
      });
      get().saveLocal();
    },

    startResearch: (techId) =>
      withState(set, get, (s) =>
        engStartResearch(s, techId)
          ? { ok: true }
          : { ok: false, reason: "Recherche impossible." },
      ),

    createProduct: (draft) => withState(set, get, (s) => engCreateProduct(s, draft)),
    createGame: (draft) => withState(set, get, (s) => engCreateGame(s, draft)),
    hire: (c) => withState(set, get, (s) => engHire(s, c)),
    fire: (id) => { withState(set, get, (s) => { engFire(s, id); }); },
    build: (id) => withState(set, get, (s) => engBuild(s, id)),
    acquire: (id) => withState(set, get, (s) => engAcquire(s, id)),

    campaign: (productId, channel, spendMult) =>
      withState(set, get, (s) =>
        engCampaign(s, productId, channel, spendMult)
          ? { ok: true }
          : { ok: false, reason: "Campagne impossible (budget ?)." },
      ),

    trade: (ticker, qty) =>
      withState(set, get, (s) =>
        engTrade(s, ticker, qty)
          ? { ok: true }
          : { ok: false, reason: "Transaction refusée." },
      ),

    clearToast: () => set((store) => { store.lastToast = null; }),
  })),
);
