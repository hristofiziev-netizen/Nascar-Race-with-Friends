import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Nascar Fun With Friends</h1>
        <p className="text-gray-600">A tiny Next.js + Supabase app.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link className="rounded-2xl bg-white p-5 shadow hover:shadow-md transition" href="/picks">
          <div className="text-xl font-semibold">Picks</div>
          <div className="text-gray-600">Submit & view picks</div>
        </Link>

        <Link className="rounded-2xl bg-white p-5 shadow hover:shadow-md transition" href="/rules">
          <div className="text-xl font-semibold">Rules</div>
          <div className="text-gray-600">League rules</div>
        </Link>
      </div>
    </main>
  );
}
