interface StatsBarProps {
  totalVolume: number;
  tradeCount: number;
  biggestTrade: number;
  activeThreshold: number;
}

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export default function StatsBar({
  totalVolume,
  tradeCount,
  biggestTrade,
  activeThreshold,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
          Total Volume Tracked
        </p>
        <p className="text-xl font-bold text-emerald-400 font-mono">
          {formatUSD(totalVolume)}
        </p>
      </div>

      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
          Whale Trades
        </p>
        <p className="text-xl font-bold text-slate-200 font-mono">
          {tradeCount.toLocaleString()}
        </p>
      </div>

      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
          Biggest Trade
        </p>
        <p className="text-xl font-bold text-yellow-400 font-mono">
          {biggestTrade > 0 ? formatUSD(biggestTrade) : "—"}
        </p>
      </div>

      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
          Min Threshold
        </p>
        <p className="text-xl font-bold text-violet-400 font-mono">
          {formatUSD(activeThreshold)}
        </p>
      </div>
    </div>
  );
}
