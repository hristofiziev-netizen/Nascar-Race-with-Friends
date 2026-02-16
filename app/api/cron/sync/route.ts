import { NextResponse } from "next/server";
import { mustGetEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const secret = mustGetEnv("SYNC_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  await sb.from("sync_log").insert({ ran_at: new Date().toISOString() }).catch(() => null);

  return NextResponse.json({ ok: true });
}
