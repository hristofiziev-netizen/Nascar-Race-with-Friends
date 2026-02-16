import { NextResponse } from "next/server";
import ... from "../../../../lib/supabase";
import bcrypt from "bcryptjs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function checkPasscode(req: Request) {
  const provided = req.headers.get("x-league-passcode") ?? "";
  const hash = process.env.LEAGUE_PASSCODE_BCRYPT ?? "";
  if (!hash) throw new Error("Missing LEAGUE_PASSCODE_BCRYPT env var");
  const ok = await bcrypt.compare(provided, hash);
  return ok;
}

export async function GET(req: Request) {
  const ok = await checkPasscode(req);
  if (!ok) return bad("Wrong passcode.", 401);

  const url = new URL(req.url);
  const player = (url.searchParams.get("player") ?? "").trim();
  if (!player) return bad("Missing player.");

  const sb = supabaseAdmin();
  const { data: race } = await sb.from("races").select("*").eq("is_current", true).maybeSingle();
  if (!race) return NextResponse.json({ picks: [] });

  const { data: picks } = await sb
    .from("picks")
    .select("driver_name")
    .eq("race_id", race.id)
    .eq("player_name", player);

  // Attach bracket info for client-side rule checks
  const { data: drivers } = await sb.from("driver_results").select("driver_name,bracket").eq("race_id", race.id);

  const bracketByDriver = new Map((drivers ?? []).map(d => [d.driver_name, d.bracket]));
  const enriched = (picks ?? []).map(p => ({ driver_name: p.driver_name, bracket: bracketByDriver.get(p.driver_name) ?? null }));

  return NextResponse.json({ picks: enriched });
}

export async function POST(req: Request) {
  const ok = await checkPasscode(req);
  if (!ok) return bad("Wrong passcode.", 401);

  const sb = supabaseAdmin();
  const { data: race } = await sb.from("races").select("*").eq("is_current", true).maybeSingle();
  if (!race) return bad("No current race configured.");

  const now = new Date();
  const lock = new Date(race.picks_lock_utc);
  if (now >= lock) return bad("Picks are locked for this race.", 403);

  const body = await req.json();
  const player = String(body.player_name ?? "").trim();
  const driver = String(body.driver_name ?? "").trim();
  if (!player || !driver) return bad("Missing player_name or driver_name.");

  // Get existing picks
  const { data: existing } = await sb
    .from("picks")
    .select("driver_name")
    .eq("race_id", race.id)
    .eq("player_name", player);

  const already = (existing ?? []).some(p => p.driver_name === driver);

  if (already) {
    await sb.from("picks").delete().eq("race_id", race.id).eq("player_name", player).eq("driver_name", driver);
  } else {
    // Enforce rules server-side
    if ((existing ?? []).length >= 5) return bad("Max 5 picks.");

    const { data: results } = await sb.from("driver_results").select("driver_name, bracket").eq("race_id", race.id);
    const bracketByDriver = new Map((results ?? []).map(r => [r.driver_name, r.bracket]));
    const bracket = bracketByDriver.get(driver) ?? null;
    if (!bracket) return bad("Qualifying not loaded yet (brackets unknown).");

    const bracketCounts = new Map<number, number>();
    for (const p of existing ?? []) {
      const b = bracketByDriver.get(p.driver_name);
      if (b) bracketCounts.set(b, (bracketCounts.get(b) ?? 0) + 1);
    }
    if ((bracketCounts.get(bracket) ?? 0) >= 2) return bad("Max 2 picks in the same bracket.");

    await sb.from("picks").insert({ race_id: race.id, player_name: player, driver_name: driver });
  }

  // Return updated picks
  const { data: picks } = await sb
    .from("picks")
    .select("driver_name")
    .eq("race_id", race.id)
    .eq("player_name", player);

  const { data: drivers } = await sb.from("driver_results").select("driver_name,bracket").eq("race_id", race.id);
  const bracketByDriver = new Map((drivers ?? []).map(d => [d.driver_name, d.bracket]));
  const enriched = (picks ?? []).map(p => ({ driver_name: p.driver_name, bracket: bracketByDriver.get(p.driver_name) ?? null }));

  return NextResponse.json({ picks: enriched });
}
