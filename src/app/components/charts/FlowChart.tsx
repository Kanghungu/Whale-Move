'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

export interface CoinFlow {
  coin: string;
  longs: number;
  shorts: number;
  net: number;
}

function fmt(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
}

export default function FlowChart({ flows }: { flows: CoinFlow[] }) {
  const sorted = [...flows]
    .filter((p) => p.longs + p.shorts > 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 12);

  if (sorted.length === 0) {
    return (
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-center min-h-[220px]">
        <p className="text-xs text-slate-500">고래 데이터 수집 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Whale Flow (롱 vs 숏)</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Long</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />Short</span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <XAxis dataKey="coin" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
            <ReferenceLine y={0} stroke="#2a2a3d" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '11px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: any, name: any) => {
                const n = typeof v === 'number' ? v : 0;
                return [`${n >= 0 ? '+' : ''}${fmt(n)}`, name === 'net' ? 'Net Flow' : String(name)];
              }) as any}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="net" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {sorted.map((entry, i) => (
                <Cell key={i} fill={entry.net >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
