import { supabaseAdmin } from "@/lib/supabase";

export default async function RacePage() {
  const sb = supabaseAdmin();
  const { data: currentRace } = await sb.from("races").select("*").eq("is_current", true).maybeSingle();
  const raceId = currentRace?.id;

  const { data: results } = raceId
    ? await sb.from("driver_results").select("*").eq("race_id", raceId).order("qual_pos", { ascending: true })
    : { data: [] as any[] };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Live / Results</h1>
        <p className="text-zinc-300">
          This page shows qualifying, running position, and final results for the current race.
        </p>
        {currentRace ? (
          <p className="text-sm text-zinc-400">
            Race: <span className="text-zinc-200">{currentRace.name}</span> · Status:{" "}
            <span className="text-zinc-200">{currentRace.status}</span>
          </p>
        ) : (
          <p className="text-sm text-zinc-400">No current race configured yet.</p>
        )}
      </header>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left">Driver</th>
              <th className="px-4 py-3 text-left">Qual</th>
              <th className="px-4 py-3 text-left">Running</th>
              <th className="px-4 py-3 text-left">Finish</th>
              <th className="px-4 py-3 text-left">Bracket</th>
            </tr>
          </thead>
          <tbody>
            {(results ?? []).map(r => (
              <tr key={r.driver_name} className="border-t border-zinc-800">
                <td className="px-4 py-3 font-medium">{r.driver_name}</td>
                <td className="px-4 py-3">{r.qual_pos ?? "—"}</td>
                <td className="px-4 py-3">{r.running_pos ?? "—"}</td>
                <td className="px-4 py-3">{r.finish_pos ?? "—"}</td>
                <td className="px-4 py-3">{r.bracket ?? "—"}</td>
              </tr>
            ))}
            {!results?.length ? (
              <tr>
                <td className="px-4 py-4 text-zinc-400" colSpan={5}>
                  No results loaded yet. Run the sync endpoint (cron) after setting the NASCAR race id.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
        Admin note: the sync job writes to <code className="text-zinc-100">driver_results</code>. Use Vercel Cron to hit
        <code className="text-zinc-100"> /api/cron/sync</code> periodically.
      </div>
    </div>
  );
}
