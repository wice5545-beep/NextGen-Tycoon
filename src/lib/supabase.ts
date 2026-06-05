// ============================================================================
//  Supabase client (singleton). If env vars are missing, returns null so the
//  game runs in pure-offline local mode (localStorage autosave only).
// ============================================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export function isCloudEnabled(): boolean {
  return getSupabase() !== null;
}
