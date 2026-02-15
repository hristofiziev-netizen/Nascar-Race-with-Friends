import { supabaseAdmin } from "@/lib/supabase";

export default async function StandingsPage() {
  const sb = supabaseAdmin();

  // Current race for display
  const { data: currentRace } = await sb
    .from("races")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  // Standings: sum of finish positions for picked drivers per race; cumulative by season
  const { data: standings, error } = await sb.rpc("season_standings", { season_in: 2026 });

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Standings</h1>
        <p className="text-zinc-300">Database function not ready yet. Run the SQL in /supabase/schema.sql.</p>
        <pre className="rounded-lg bg-zinc-900 p-3 text-xs text-zinc-200">{String(error.message)}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">2026 Standings</h1>
        <p className="text-zinc-300">
          Lowest cumulative points wins. Points = sum of finish positions for your picks.
        </p>
        {currentRace ? (
          <p className="text-sm text-zinc-400">
            Current race: <span className="text-zinc-200">{currentRace.name}</span>
          </p>
        ) : null}
      </header>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Races Played</th>
            </tr>
          </thead>
          <tbody>
            {(standings ?? []).map((r: any, idx: number) => (
              <tr key={r.player_name} className="border-t border-zinc-800">
                <td className="px-4 py-3">{idx + 1}</td>
                <td className="px-4 py-3 font-medium">{r.player_name}</td>
                <td className="px-4 py-3">{r.total_points}</td>
                <td className="px-4 py-3">{r.races_played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
        Tip: share this link with friends. To submit picks, use the group passcode on the Picks page.
      </div>
    </div>
  );
}
