// ============================================================================
//  Cloud save — persists the full GameState to Supabase `save_states` with
//  monotonic versioning + multi-device sync. Degrades gracefully offline.
// ============================================================================
import type { GameState } from "@/engine/types";
import { getSupabase } from "@/lib/supabase";

export interface CloudSaveMeta {
  id: string;
  slot: number;
  version: number;
  label: string | null;
  game_year: number | null;
  updated_at: string;
}

/** Upsert a new version of a save slot. Returns the new version or null. */
export async function cloudSave(
  state: GameState,
  slot = 0,
  label?: string,
): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  // next version = max(existing)+1
  const { data: latest } = await sb
    .from("save_states")
    .select("version")
    .eq("player_id", user.id)
    .eq("slot", slot)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = (latest?.version ?? 0) + 1;

  const { error } = await sb.from("save_states").insert({
    player_id: user.id,
    slot,
    version,
    label: label ?? null,
    game_year: state.clock.year,
    state,
  });
  if (error) {
    console.warn("cloudSave failed", error.message);
    return null;
  }
  return version;
}

/** Fetch the most recent save for a slot. */
export async function cloudLoad(slot = 0): Promise<GameState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from("save_states")
    .select("state")
    .eq("player_id", user.id)
    .eq("slot", slot)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.state as GameState;
}

/** List all save versions (for the versioning UI). */
export async function cloudList(): Promise<CloudSaveMeta[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb
    .from("save_states")
    .select("id,slot,version,label,game_year,updated_at")
    .eq("player_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  return (data as CloudSaveMeta[]) ?? [];
}

// --- auth helpers ---
export async function signInWithEmail(email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.auth.signInWithOtp({ email });
  return !error;
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

export async function currentUserEmail(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.email ?? null;
}
