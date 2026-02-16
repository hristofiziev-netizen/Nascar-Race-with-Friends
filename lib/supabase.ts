import { createClient } from "@supabase/supabase-js";
import { mustGetEnv } from "./env";

export function supabaseAdmin() {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseAnon() {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}
