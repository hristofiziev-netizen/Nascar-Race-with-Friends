import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nascar Race with Friends",
  description: "Private picks league",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
