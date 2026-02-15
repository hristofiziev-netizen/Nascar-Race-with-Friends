import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bracketFromQualPos } from "@/lib/rules";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return unauthorized();

  const sb = supabaseAdmin();
  const { data: race } = await sb.from("races").select("*").eq("is_current", true).maybeSingle();
  if (!race) return NextResponse.json({ ok: false, error: "No current race configured." }, { status: 400 });

  // NASCAR unofficial-but-commonly-used live feed endpoint pattern (updates during races).
  // Example: https://cf.nascar.com/live/feeds/series_1/5273/live_feed.json
  const url = `https://cf.nascar.com/live/feeds/series_1/${race.race_id_external}/live_feed.json`;

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ ok: false, error: `Fetch failed ${r.status}`, details: text.slice(0, 300) }, { status: 502 });
  }

  const data: any = await r.json();

  // NOTE: The exact JSON shape can change; this mapper is defensive.
  // We look for arrays that resemble:
  // - qualifying order / starting lineup
  // - running order / race results
  const entries: any[] =
    data?.vehicle?.length ? data.vehicle :
    data?.vehicles?.length ? data.vehicles :
    data?.leaderboard?.length ? data.leaderboard :
    data?.liveFeed?.vehicles?.length ? data.liveFeed.vehicles :
    [];

  if (!entries.length) {
    return NextResponse.json({ ok: false, error: "No vehicles found in feed (shape changed?)." }, { status: 500 });
  }

  // Map drivers
  const rows = entries.map((v: any) => {
    const driver_name =
      v?.driver?.full_name ??
      v?.driver?.name ??
      v?.driver_name ??
      v?.name ??
      v?.full_name ??
      "Unknown";

    const car_number = String(v?.vehicle_number ?? v?.car_number ?? v?.number ?? "");
    const qual_pos = Number(v?.qualifying_position ?? v?.qual_pos ?? v?.start_position ?? v?.starting_position ?? NaN);
    const running_pos = Number(v?.running_position ?? v?.position ?? v?.running_pos ?? NaN);
    const finish_pos = Number(v?.finish_position ?? v?.finish_pos ?? v?.official_finish ?? NaN);

    const qp = Number.isFinite(qual_pos) ? qual_pos : null;
    const bracket = qp ? bracketFromQualPos(qp) : null;

    return {
      race_id: race.id,
      driver_name,
      car_number: car_number || null,
      qual_pos: qp,
      running_pos: Number.isFinite(running_pos) ? running_pos : null,
      finish_pos: Number.isFinite(finish_pos) ? finish_pos : null,
      bracket,
    };
  });

  // Upsert
  const { error } = await sb.from("driver_results").upsert(rows, { onConflict: "race_id,driver_name" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length, source: url });
}
