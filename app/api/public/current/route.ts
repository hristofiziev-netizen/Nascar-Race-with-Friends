import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase";

export async function GET() {
  try {
    const sb = supabaseAnon();

    const stateRes = await sb.from("current_state").select("race_name,picks_lock_utc,locked").eq("id", 1).maybeSingle();
    const driversRes = await sb.from("drivers").select("driver_name,qual_pos,running_pos,finish_pos").order("driver_name");

    return NextResponse.json({
      race_name: stateRes.data?.race_name ?? "TBD",
      picks_lock_utc: stateRes.data?.picks_lock_utc ?? "",
      locked: !!stateRes.data?.locked,
      drivers: driversRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ race_name: "TBD", picks_lock_utc: "", locked: false, drivers: [] });
  }
}
