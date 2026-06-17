import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale Move — Hyperliquid Whale Tracker",
  description: "Real-time whale trade tracker for Hyperliquid DEX. Monitor large trades over $50k in real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050508] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
