"use client";

import { useEffect, useMemo, useState } from "react";
import { canPickDriverForPlayer } from "@/lib/rules";

type DriverRow = {
  driver_name: string;
  qual_pos: number | null;
  running_pos: number | null;
  finish_pos: number | null;
};

type LockInfo = { locked: boolean; picks_lock_utc: string; race_name: string };

function getStoredPasscode() {
  try { return localStorage.getItem("league_passcode") ?? ""; } catch { return ""; }
}

export default function PicksClient() {
  const [passcode, setPasscode] = useState("");
  const [player, setPlayer] = useState("");
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [myPicks, setMyPicks] = useState<string[]>([]);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg: string }>({ kind: "idle", msg: "" });
  const [lockInfo, setLockInfo] = useState<LockInfo>({ locked: false, picks_lock_utc: "", race_name: "" });

  useEffect(() => {
    const stored = getStoredPasscode();
    if (stored) setPasscode(stored);
  }, []);

  async function loadCurrent() {
    const res = await fetch("/api/public/current");
    const j = await res.json();
    setDrivers((j?.drivers ?? []) as DriverRow[]);
    setLockInfo({ locked: !!j?.locked, picks_lock_utc: String(j?.picks_lock_utc ?? ""), race_name: String(j?.race_name ?? "") });
  }

  useEffect(() => { void loadCurrent(); }, []);

  const eligibleDrivers = useMemo(() => {
    if (!player) return drivers;
    return drivers.filter((d) => canPickDriverForPlayer(player, d.driver_name));
  }, [drivers, player]);

  async function loadMyPicks() {
    if (!player || !passcode) return;
    const res = await fetch(`/api/picks?player=${encodeURIComponent(player)}`, {
      headers: { "x-league-passcode": passcode }
    });
    const j = await res.json();
    if (!res.ok) return setStatus({ kind: "err", msg: j?.error ?? "Could not load picks" });
    setMyPicks(j?.picks ?? []);
    setStatus({ kind: "ok", msg: "Loaded picks." });
  }

  async function save() {
    setStatus({ kind: "idle", msg: "" });
    if (!player) return setStatus({ kind: "err", msg: "Enter your name." });
    if (!passcode) return setStatus({ kind: "err", msg: "Enter passcode." });
    if (lockInfo.locked) return setStatus({ kind: "err", msg: "Picks are locked." });

    try { localStorage.setItem("league_passcode", passcode); } catch {}

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "content-type": "application/json", "x-league-passcode": passcode },
      body: JSON.stringify({ player, picks: myPicks }),
    });
    const j = await res.json();
    if (!res.ok) return setStatus({ kind: "err", msg: j?.error ?? "Save failed" });
    setStatus({ kind: "ok", msg: "Saved!" });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm font-medium">Your name</div>
          <input className="w-full rounded-xl border px-3 py-2" value={player} onChange={(e) => setPlayer(e.target.value)} />
        </label>
        <label className="space-y-1">
          <div className="text-sm font-medium">League passcode</div>
          <input className="w-full rounded-xl border px-3 py-2" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
        </label>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
        <div><span className="font-medium">Race:</span> {lockInfo.race_name || "TBD"}</div>
        <div><span className="font-medium">Lock UTC:</span> {lockInfo.picks_lock_utc || "TBD"}</div>
        <div><span className="font-medium">Status:</span> {lockInfo.locked ? "Locked" : "Open"}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={loadMyPicks}>Load my picks</button>
        <button className="rounded-xl border px-4 py-2" onClick={save}>Save</button>
        {status.kind !== "idle" && (
          <span className={status.kind === "ok" ? "text-green-700" : "text-red-700"}>{status.msg}</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Pick drivers (click to toggle)</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {eligibleDrivers.map((d) => {
            const selected = myPicks.includes(d.driver_name);
            return (
              <button
                key={d.driver_name}
                className={"rounded-xl border px-3 py-2 text-left " + (selected ? "bg-black text-white" : "bg-white")}
                onClick={() => setMyPicks((prev) => selected ? prev.filter((x) => x !== d.driver_name) : [...prev, d.driver_name])}
              >
                <div className="font-medium">{d.driver_name}</div>
                <div className={"text-xs " + (selected ? "text-white/80" : "text-gray-500")}>
                  Qual: {d.qual_pos ?? "-"} · Run: {d.running_pos ?? "-"} · Finish: {d.finish_pos ?? "-"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
