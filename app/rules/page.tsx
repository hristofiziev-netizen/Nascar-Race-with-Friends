export default function RulesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Rules</h1>
      <ul className="list-disc space-y-2 pl-6 text-zinc-200">
        <li>Max <b>5</b> picks per person per race.</li>
        <li>Qualifying brackets are based on qualifying position:</li>
        <ul className="list-disc pl-6 text-zinc-300">
          <li>1–8</li>
          <li>9–16</li>
          <li>17–24</li>
          <li>25+</li>
        </ul>
        <li>Max <b>2</b> picks per bracket.</li>
        <li>Picks lock <b>15 minutes before green flag</b>.</li>
        <li>Points = sum of the finish positions of your picked drivers. Lowest season total wins.</li>
      </ul>
    </div>
  );
}
