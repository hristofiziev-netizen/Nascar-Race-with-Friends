"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/", label: "Standings" },
  { href: "/picks", label: "This Week Picks" },
  { href: "/race", label: "Live / Results" },
  { href: "/rules", label: "Rules" },
];

export function Nav() {
  const p = usePathname();
  return (
    <div className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          NASCAR Friends League
        </Link>
        <nav className="flex flex-wrap gap-2">
          {tabs.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className={clsx(
                "rounded-full px-3 py-1 text-sm",
                p === t.href ? "bg-zinc-100 text-zinc-950" : "text-zinc-200 hover:bg-zinc-900"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
