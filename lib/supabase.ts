import { createClient } from "@supabase/supabase-js";
import { mustEnv } from "./env";

export const supabaseAdmin = () =>
  createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

export const supabaseAnon = () =>
  createClient(mustEnv("NEXT_PUBLIC_SUPABASE_URL"), mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
