"use client";

import { useEffect, useState } from "react";

export interface Trade {
  id: string;
  coin: string;
  side: "B" | "A";
  px: string;
  sz: string;
  notional: number;
  time: number;
}

interface TradeCardProps {
  trade: Trade;
}

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPrice(price: string): string {
  const p = parseFloat(price);
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function formatSize(sz: string, coin: string): string {
  const s = parseFloat(sz);
  if (s >= 1_000_000) return `${(s / 1_000_000).toFixed(2)}M ${coin}`;
  if (s >= 1_000) return `${(s / 1_000).toFixed(2)}K ${coin}`;
  return `${s.toFixed(4)} ${coin}`;
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getSizeClass(notional: number): string {
  if (notional >= 1_000_000) return "mega";
  if (notional >= 500_000) return "large";
  if (notional >= 100_000) return "medium";
  return "small";
}

export default function TradeCard({ trade }: TradeCardProps) {
  const [timeDisplay, setTimeDisplay] = useState(() => timeAgo(trade.time));
  const isLong = trade.side === "B";
  const sizeClass = getSizeClass(trade.notional);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDisplay(timeAgo(trade.time));
    }, 1000);
    return () => clearInterval(interval);
  }, [trade.time]);

  const borderColor = isLong ? "border-emerald-500/30" : "border-red-500/30";
  const bgColor = isLong ? "bg-emerald-950/20" : "bg-red-950/20";
  const sideColor = isLong ? "text-emerald-400" : "text-red-400";
  const sideBg = isLong ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30";
  const glowClass = isLong ? "shadow-emerald-900/20" : "shadow-red-900/20";

  const notionalColor =
    sizeClass === "mega"
      ? "text-yellow-300"
      : sizeClass === "large"
      ? "text-orange-400"
      : sizeClass === "medium"
      ? "text-slate-100"
      : "text-slate-300";

  return (
    <div
      className={`animate-slide-in relative rounded-lg border ${borderColor} ${bgColor} p-4 shadow-lg ${glowClass} hover:border-opacity-60 transition-all duration-200`}
    >
      {sizeClass === "mega" && (
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 px-1.5 py-0.5 rounded uppercase tracking-widest">
            MEGA
          </span>
        </div>
      )}
      {sizeClass === "large" && (
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold bg-orange-400/10 border border-orange-400/30 text-orange-300 px-1.5 py-0.5 rounded uppercase tracking-widest">
            LARGE
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0d0d14] border border-[#2a2a3d] flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300">
              {trade.coin.slice(0, 3)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-100">
                {trade.coin}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sideBg} ${sideColor} uppercase tracking-wider`}
              >
                {isLong ? "LONG" : "SHORT"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {formatSize(trade.sz, trade.coin)} @ {formatPrice(trade.px)}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-bold font-mono ${notionalColor}`}>
            {formatUSD(trade.notional)}
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">{timeDisplay}</p>
        </div>
      </div>
    </div>
  );
}
