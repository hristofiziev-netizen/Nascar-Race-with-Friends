export default function RulesPage() {
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Rules</h1>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Passcode required.</li>
        <li>Picks lock at the configured lock time.</li>
      </ul>
    </main>
  );
}
