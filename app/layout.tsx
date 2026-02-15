import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "NASCAR Friends League",
  description: "Weekly NASCAR picks league — standings, picks, and live results.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-zinc-400">
          Built for your private group. Anyone with the link can view. Picks require the group passcode.
        </footer>
      </body>
    </html>
  );
}
