'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface CoinData {
  name: string;
  openInterestUsd: number;
  dayVolume: number;
  funding: number;
  markPx: number;
  prevDayPx: number;
}

function fmt(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9'];

export default function OIChart() {
  const [data, setData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/market');
        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json.slice(0, 12));
          setLastUpdated(new Date());
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-center min-h-[320px]">
        <p className="text-xs text-slate-500 animate-pulse">시장 데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Open Interest (전체 시장)</p>
        {lastUpdated && (
          <p className="text-[9px] text-slate-600 font-mono">
            {lastUpdated.toLocaleTimeString()} 기준
          </p>
        )}
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '11px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: any) => [fmt(typeof v === 'number' ? v : 0), 'Open Interest']) as any}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="openInterestUsd" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 border-t border-[#1e1e2e] pt-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Funding Rate</p>
        <div className="grid grid-cols-3 gap-1">
          {data.slice(0, 9).map((coin) => {
            const positive = coin.funding >= 0;
            const change = coin.prevDayPx > 0 ? ((coin.markPx - coin.prevDayPx) / coin.prevDayPx) * 100 : 0;
            return (
              <div key={coin.name} className="flex flex-col bg-[#0a0a12] rounded p-1.5 gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300">{coin.name}</span>
                  <span className={`text-[9px] font-mono ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {positive ? '+' : ''}{coin.funding.toFixed(4)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
