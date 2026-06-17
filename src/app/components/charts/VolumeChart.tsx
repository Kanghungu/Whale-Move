'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface VolumePoint {
  label: string;
  volume: number;
}

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function VolumeChart({ data }: { data: VolumePoint[] }) {
  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-3">
        Whale Volume / Min
      </p>
      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmt}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '11px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: any) => [fmt(typeof v === 'number' ? v : 0), 'Volume']) as any}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} fill="url(#volGrad)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
