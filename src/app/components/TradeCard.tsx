'use client';

import { useEffect, useState } from 'react';

export interface Trade {
  id: string;
  coin: string;
  side: 'B' | 'A';
  px: string;
  sz: string;
  notional: number;
  time: number;
}

function fmtUSD(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtPrice(px: string): string {
  const p = parseFloat(px);
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function fmtSize(sz: string, coin: string): string {
  const s = parseFloat(sz);
  if (s >= 1_000_000) return `${(s / 1_000_000).toFixed(2)}M ${coin}`;
  if (s >= 1_000) return `${(s / 1_000).toFixed(2)}K ${coin}`;
  return `${s.toFixed(4)} ${coin}`;
}

function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 5) return 'just now';
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

type Tier = 'mega' | 'whale' | 'medium' | 'small';

function getTier(notional: number): Tier {
  if (notional >= 1_000_000) return 'mega';
  if (notional >= 500_000) return 'whale';
  if (notional >= 100_000) return 'medium';
  return 'small';
}

function MegaCard({ trade, td }: { trade: Trade; td: string }) {
  const isLong = trade.side === 'B';
  return (
    <div className={`animate-slide-in relative rounded-xl border-2 p-5 overflow-hidden
      ${isLong
        ? 'border-emerald-400/70 bg-emerald-950/30 shadow-[0_0_40px_rgba(16,185,129,0.18)]'
        : 'border-red-400/70 bg-red-950/30 shadow-[0_0_40px_rgba(239,68,68,0.18)]'}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-base border
            ${isLong ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' : 'bg-red-500/20 text-red-200 border-red-500/40'}`}>
            {trade.coin.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-2xl font-black text-white">{trade.coin}</span>
              <span className={`text-xs font-black px-3 py-1 rounded-lg border
                ${isLong ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-red-500/20 border-red-400/50 text-red-300'}`}>
                {isLong ? '🚀 LONG' : '🔻 SHORT'}
              </span>
              <span className="text-[10px] font-black bg-yellow-400/15 border border-yellow-400/50 text-yellow-300 px-2.5 py-1 rounded-lg uppercase tracking-widest animate-pulse">
                🐋 MEGA WHALE
              </span>
            </div>
            <p className="text-sm text-slate-400 font-mono">{fmtSize(trade.sz, trade.coin)} @ {fmtPrice(trade.px)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-yellow-300 font-mono">{fmtUSD(trade.notional)}</p>
          <p className="text-xs text-slate-500 mt-1.5">{td}</p>
        </div>
      </div>
    </div>
  );
}

function WhaleCard({ trade, td }: { trade: Trade; td: string }) {
  const isLong = trade.side === 'B';
  return (
    <div className={`animate-slide-in rounded-xl border p-4
      ${isLong
        ? 'border-emerald-500/45 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
        : 'border-red-500/45 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-sm border
            ${isLong ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'}`}>
            {trade.coin.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-lg font-bold text-white">{trade.coin}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
                ${isLong ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-red-500/15 border-red-500/40 text-red-400'}`}>
                {isLong ? 'LONG' : 'SHORT'}
              </span>
              <span className="text-[9px] font-bold bg-orange-400/10 border border-orange-400/35 text-orange-300 px-1.5 py-0.5 rounded uppercase tracking-widest">
                WHALE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">{fmtSize(trade.sz, trade.coin)} @ {fmtPrice(trade.px)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-300 font-mono">{fmtUSD(trade.notional)}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{td}</p>
        </div>
      </div>
    </div>
  );
}

function MediumCard({ trade, td }: { trade: Trade; td: string }) {
  const isLong = trade.side === 'B';
  return (
    <div className={`animate-slide-in rounded-lg border p-3.5
      ${isLong ? 'border-emerald-500/20 bg-emerald-950/12' : 'border-red-500/20 bg-red-950/12'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-[#0d0d14] border border-[#2a2a3d] flex items-center justify-center">
            <span className="text-[11px] font-bold text-slate-300">{trade.coin.slice(0, 3)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-slate-100">{trade.coin}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border
                ${isLong ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {isLong ? 'LONG' : 'SHORT'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">{fmtSize(trade.sz, trade.coin)} @ {fmtPrice(trade.px)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-slate-100 font-mono">{fmtUSD(trade.notional)}</p>
          <p className="text-[10px] text-slate-600">{td}</p>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ trade, td }: { trade: Trade; td: string }) {
  const isLong = trade.side === 'B';
  return (
    <div className="animate-slide-in rounded-lg border border-[#1a1a28] bg-[#080810] px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className={`w-1.5 h-5 rounded-full flex-shrink-0 ${isLong ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-[11px] font-bold text-slate-300">{trade.coin}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
          ${isLong ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {isLong ? 'L' : 'S'}
        </span>
        <span className="text-[10px] text-slate-600 font-mono hidden sm:inline">
          {fmtSize(trade.sz, trade.coin)} @ {fmtPrice(trade.px)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-200 font-mono">{fmtUSD(trade.notional)}</span>
        <span className="text-[10px] text-slate-600 w-14 text-right">{td}</span>
      </div>
    </div>
  );
}

export default function TradeCard({ trade }: { trade: Trade }) {
  const [td, setTd] = useState(() => timeAgo(trade.time));

  useEffect(() => {
    const iv = setInterval(() => setTd(timeAgo(trade.time)), 1000);
    return () => clearInterval(iv);
  }, [trade.time]);

  const tier = getTier(trade.notional);
  if (tier === 'mega') return <MegaCard trade={trade} td={td} />;
  if (tier === 'whale') return <WhaleCard trade={trade} td={td} />;
  if (tier === 'medium') return <MediumCard trade={trade} td={td} />;
  return <SmallCard trade={trade} td={td} />;
}
