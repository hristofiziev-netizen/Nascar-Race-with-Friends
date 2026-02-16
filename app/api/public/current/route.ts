import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { canPickDriverForPlayer } from "@/lib/rules";

export async function GET() {
  const sb = supabaseAdmin();

  const { data: race } = await sb.from("races").select("*").eq("is_current", true).maybeSingle();
  if (!race) return NextResponse.json({ drivers: [], locked: false });

  const now = new Date();
  const lock = new Date(race.picks_lock_utc);
  const locked = now >= lock;

  const { data: drivers } = await sb
    .from("driver_results")
    .select("driver_name,qual_pos,bracket,running_pos,finish_pos")
    .eq("race_id", race.id);

  return NextResponse.json({
    race_name: race.name,
    picks_lock_utc: race.picks_lock_utc,
    locked,
    drivers: drivers ?? [],
  });
}
