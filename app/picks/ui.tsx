"use client";

import { useEffect, useMemo, useState } from "react";
import { canPickDriverForPlayer } from "../../lib/rules";


type DriverRow = {
  driver_name: string;
  qual_pos: number | null;
  bracket: number | null;
  running_pos: number | null;
  finish_pos: number | null;
};

function getStoredPasscode() {
  try { return localStorage.getItem("league_passcode") ?? ""; } catch { return ""; }
}

export default function PicksClient() {
  const [passcode, setPasscode] = useState("");
  const [player, setPlayer] = useState("");
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [myPicks, setMyPicks] = useState<{ driver_name: string; bracket: number | null }[]>([]);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; msg?: string }>({ kind: "idle" });
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; picks_lock_utc?: string; race_name?: string }>({ locked: false });

  useEffect(() => {
    const stored = getStoredPasscode();
    if (stored) setPasscode(stored);
  }, []);

  async function load() {
    setStatus({ kind: "idle" });
    const res = await fetch("/api/public/current");
    const j = await res.json();
    setDrivers(j.drivers ?? []);
    setLockInfo({ locked: !!j.locked, picks_lock_utc: j.picks_lock_utc, race_name: j.race_name });

    if (player && passcode) {
      const pr = await fetch(`/api/picks?player=${encodeURIComponent(player)}`, {
        headers: { "x-league-passcode": passcode },
      });
      const pj = await pr.json();
      setMyPicks(pj.picks ?? []);
    }
  }

  useEffect(() => { load(); }, []); // initial

  const grouped = useMemo(() => {
    const g: Record<string, DriverRow[]> = { "1-8": [], "9-16": [], "17-24": [], "25+": [] };
    for (const d of drivers) {
      if (!d.bracket) continue;
      if (d.bracket === 1) g["1-8"].push(d);
      else if (d.bracket === 2) g["9-16"].push(d);
      else if (d.bracket === 3) g["17-24"].push(d);
      else g["25+"].push(d);
    }
    return g;
  }, [drivers]);

  function persistPasscode(v: string) {
    setPasscode(v);
    try { localStorage.setItem("league_passcode", v); } catch {}
  }

  async function togglePick(driver: DriverRow) {
    setStatus({ kind: "idle" });
    if (lockInfo.locked) {
      setStatus({ kind: "err", msg: "Picks are locked for this race." });
      return;
    }
    if (!player.trim()) {
      setStatus({ kind: "err", msg: "Enter your name first." });
      return;
    }
    if (!passcode.trim()) {
      setStatus({ kind: "err", msg: "Enter the group passcode." });
      return;
    }

    const already = myPicks.some(p => p.driver_name === driver.driver_name);
    if (!already) {
      const check = canPickDriverForPlayer({ currentPicks: myPicks, bracket: driver.bracket });
      if (!check.ok) {
        setStatus({ kind: "err", msg: check.reason });
        return;
      }
    }

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "content-type": "application/json", "x-league-passcode": passcode },
      body: JSON.stringify({ player_name: player.trim(), driver_name: driver.driver_name }),
    });

    const j = await res.json();
    if (!res.ok) {
      setStatus({ kind: "err", msg: j.error ?? "Failed." });
      return;
    }
    setMyPicks(j.picks ?? []);
    setStatus({ kind: "ok", msg: already ? "Removed pick." : "Added pick." });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">This Week Picks</h1>
        <p className="text-zinc-300">
          Max 5 picks per person. Max 2 picks per bracket (1–8, 9–16, 17–24, 25+).
        </p>
        <p className="text-sm text-zinc-400">
          {lockInfo.race_name ? <>Race: <span className="text-zinc-200">{lockInfo.race_name}</span> · </> : null}
          Picks lock <span className="text-zinc-200">15 minutes before green flag</span>.
          {lockInfo.picks_lock_utc ? <> (lock time: <span className="text-zinc-200">{new Date(lockInfo.picks_lock_utc).toLocaleString()}</span>)</> : null}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm text-zinc-300">Your name</div>
          <input
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            placeholder="Scott"
          />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm text-zinc-300">Group passcode</div>
          <input
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
            value={passcode}
            onChange={(e) => persistPasscode(e.target.value)}
            placeholder="••••••"
          />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm text-zinc-300">Your picks ({myPicks.length}/5)</div>
          <div className="mt-2 text-sm text-zinc-200">
            {myPicks.length ? myPicks.map(p => p.driver_name).join(", ") : <span className="text-zinc-500">None yet</span>}
          </div>
          <button
            onClick={load}
            className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {status.kind !== "idle" ? (
        <div className={status.kind === "ok" ? "text-emerald-300" : "text-red-300"}>
          {status.msg}
        </div>
      ) : null}

      {Object.entries(grouped).map(([label, list]) => (
        <div key={label} className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-zinc-900/60 px-4 py-3 font-medium">{label} Qualifiers</div>
          <div className="divide-y divide-zinc-800">
            {list
              .sort((a,b) => (a.qual_pos ?? 999) - (b.qual_pos ?? 999))
              .map(d => {
                const picked = myPicks.some(p => p.driver_name === d.driver_name);
                return (
                  <button
                    key={d.driver_name}
                    onClick={() => togglePick(d)}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{d.driver_name}</div>
                      <div className="text-xs text-zinc-400">Qual: {d.qual_pos ?? "—"}</div>
                    </div>
                    <div className={picked ? "rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-zinc-950" : "rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"}>
                      {picked ? "Picked" : "Pick"}
                    </div>
                  </button>
                );
              })}
            {!list.length ? <div className="px-4 py-4 text-sm text-zinc-400">Qualifying not loaded yet.</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
