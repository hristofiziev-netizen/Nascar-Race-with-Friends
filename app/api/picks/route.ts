import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { mustGetEnv } from "@/lib/env";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function requirePasscode(req: Request) {
  const passcode = req.headers.get("x-league-passcode") ?? "";
  const hash = mustGetEnv("LEAGUE_PASSCODE_BCRYPT");
  if (!passcode) return { ok: false as const, error: "Missing passcode header (x-league-passcode)" };
  if (!bcrypt.compareSync(passcode, hash)) return { ok: false as const, error: "Invalid passcode" };
  return { ok: true as const };
}

export async function GET(req: Request) {
  const auth = requirePasscode(req);
  if (!auth.ok) return bad(auth.error, 401);

  const { searchParams } = new URL(req.url);
  const player = (searchParams.get("player") ?? "").trim();
  if (!player) return bad("Missing player");

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("picks").select("player,picks").eq("player", player).maybeSingle();
  if (error) return bad(error.message, 500);

  return NextResponse.json({ picks: data?.picks ?? [] });
}

export async function POST(req: Request) {
  const auth = requirePasscode(req);
  if (!auth.ok) return bad(auth.error, 401);

  const body = (await req.json().catch(() => null)) as null | { player?: string; picks?: unknown };
  const player = (body?.player ?? "").toString().trim();
  const picks = Array.isArray(body?.picks) ? body?.picks.map(String) : [];

  if (!player) return bad("Player is required");
  if (picks.length === 0) return bad("Pick at least one driver");

  const sb = supabaseAdmin();
  const { error } = await sb.from("picks").upsert({ player, picks }, { onConflict: "player" });
  if (error) return bad(error.message, 500);

  return NextResponse.json({ ok: true });
}
