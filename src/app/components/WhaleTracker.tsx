'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TradeCard, { Trade } from './TradeCard';
import StatsBar from './StatsBar';
import VolumeChart, { VolumePoint } from './charts/VolumeChart';
import FlowChart, { CoinFlow } from './charts/FlowChart';
import OIChart from './charts/OIChart';

const COINS = [
  'BTC','ETH','SOL','ARB','DOGE','AVAX','MATIC','LINK',
  'BNB','XRP','OP','SUI','APT','INJ','TIA','WIF','PEPE','BONK','JTO','PYTH',
];

const THRESHOLDS = [
  { label: '$50K', value: 50_000 },
  { label: '$100K', value: 100_000 },
  { label: '$500K', value: 500_000 },
  { label: '$1M+', value: 1_000_000 },
];

const MAX_TRADES = 100;
const WS_URL = 'wss://api.hyperliquid.xyz/ws';
const BUCKET_MS = 60_000;
const MAX_BUCKETS = 20;

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface RawTrade {
  coin: string;
  side: 'B' | 'A';
  px: string;
  sz: string;
  time: number;
  hash: string;
}

function bucketKey(ts: number): number {
  return Math.floor(ts / BUCKET_MS) * BUCKET_MS;
}

function bucketLabel(key: number): string {
  return new Date(key).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function WhaleTracker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [threshold, setThreshold] = useState(50_000);
  const [coinFilter, setCoinFilter] = useState('ALL');
  const [status, setStatus] = useState<Status>('connecting');
  const [totalVolume, setTotalVolume] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [biggestTrade, setBiggestTrade] = useState(0);
  const [volumeHistory, setVolumeHistory] = useState<VolumePoint[]>([]);
  const [coinFlows, setCoinFlows] = useState<CoinFlow[]>(() =>
    COINS.map((coin) => ({ coin, longs: 0, shorts: 0, net: 0 }))
  );
  const [activeTab, setActiveTab] = useState<'feed' | 'charts'>('feed');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const thresholdRef = useRef(threshold);
  const bucketMapRef = useRef<Map<number, number>>(new Map());

  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);

  const addVolumeToBucket = useCallback((vol: number) => {
    const key = bucketKey(Date.now());
    const map = bucketMapRef.current;
    map.set(key, (map.get(key) ?? 0) + vol);

    const sorted = Array.from(map.keys()).sort((a, b) => a - b);
    if (sorted.length > MAX_BUCKETS) {
      sorted.slice(0, sorted.length - MAX_BUCKETS).forEach((k) => map.delete(k));
    }

    const now = bucketKey(Date.now());
    const points: VolumePoint[] = [];
    for (let i = MAX_BUCKETS - 1; i >= 0; i--) {
      const k = now - i * BUCKET_MS;
      points.push({ label: bucketLabel(k), volume: map.get(k) ?? 0 });
    }
    setVolumeHistory(points);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
      COINS.forEach((coin) =>
        ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'trades', coin } }))
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.channel !== 'trades' || !Array.isArray(msg.data)) return;

        const incoming: Trade[] = [];
        (msg.data as RawTrade[]).forEach((raw) => {
          const notional = parseFloat(raw.px) * parseFloat(raw.sz);
          if (notional < thresholdRef.current) return;
          incoming.push({
            id: `${raw.hash}-${raw.time}-${Math.random()}`,
            coin: raw.coin,
            side: raw.side,
            px: raw.px,
            sz: raw.sz,
            notional,
            time: raw.time,
          });
        });

        if (incoming.length === 0) return;

        setTrades((prev) => [...incoming, ...prev].slice(0, MAX_TRADES));

        const batchVol = incoming.reduce((acc, t) => acc + t.notional, 0);
        setTotalVolume((v) => v + batchVol);
        setTradeCount((c) => c + incoming.length);
        setBiggestTrade((b) => Math.max(b, ...incoming.map((t) => t.notional)));
        addVolumeToBucket(batchVol);

        setCoinFlows((prev) => {
          const next = prev.map((cf) => ({ ...cf }));
          incoming.forEach((t) => {
            const idx = next.findIndex((cf) => cf.coin === t.coin);
            if (idx === -1) return;
            if (t.side === 'B') next[idx].longs += t.notional;
            else next[idx].shorts += t.notional;
            next[idx].net = next[idx].longs - next[idx].shorts;
          });
          return next;
        });
      } catch { /* malformed */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      reconnectRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, 3000);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus('error');
      ws.close();
    };
  }, [addVolumeToBucket]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const filtered = trades.filter(
    (t) => t.notional >= threshold && (coinFilter === 'ALL' || t.coin === coinFilter)
  );

  const statusDot: Record<Status, string> = {
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-emerald-400 animate-pulse',
    disconnected: 'bg-red-500 animate-pulse',
    error: 'bg-red-500',
  };
  const statusLabel: Record<Status, string> = {
    connecting: 'Connecting...',
    connected: 'Live',
    disconnected: 'Reconnecting...',
    error: 'Error',
  };

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col">
      <header className="border-b border-[#1e1e2e] bg-[#08080f]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-white">🐋 WHALE MOVE</span>
            <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-widest border border-[#2a2a3d] rounded px-2 py-0.5">
              Hyperliquid
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[status]}`} />
            <span className="text-xs text-slate-400 font-mono">{statusLabel[status]}</span>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto w-full px-4 py-4 flex flex-col gap-4 flex-1">
        <StatsBar
          totalVolume={totalVolume}
          tradeCount={tradeCount}
          biggestTrade={biggestTrade}
          activeThreshold={threshold}
        />

        {/* Mobile tab switcher */}
        <div className="flex lg:hidden gap-1 bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'feed' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Live Feed
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'charts' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Charts
          </button>
        </div>

        {/* Filters - show on feed tab (mobile) or always on desktop */}
        <div className={`flex flex-col sm:flex-row gap-3 ${activeTab === 'charts' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center gap-1 bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-1 flex-shrink-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest px-2 hidden sm:inline">Min</span>
            {THRESHOLDS.map((t) => (
              <button
                key={t.value}
                onClick={() => setThreshold(t.value)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  threshold === t.value ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-1 flex-1 overflow-x-auto">
            <button
              onClick={() => setCoinFilter('ALL')}
              className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all flex-shrink-0 ${
                coinFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ALL
            </button>
            {COINS.map((coin) => (
              <button
                key={coin}
                onClick={() => setCoinFilter(coin === coinFilter ? 'ALL' : coin)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all flex-shrink-0 ${
                  coinFilter === coin ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {coin}
              </button>
            ))}
          </div>
        </div>

        {/* Main content: 2-column on desktop */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Trade feed */}
          <div className={`flex flex-col gap-2 flex-1 min-w-0 ${activeTab === 'charts' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">실시간 고래 거래</p>
              <p className="text-[10px] text-slate-600 font-mono">{filtered.length}건</p>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <span className="text-4xl">🐋</span>
                <p className="text-slate-400 text-sm">
                  {status === 'connected' ? '고래 거래 대기 중...' : 'Hyperliquid 연결 중...'}
                </p>
                <p className="text-slate-600 text-xs">${(threshold / 1000).toFixed(0)}K 이상 거래 모니터링 중</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((trade) => (
                  <TradeCard key={trade.id} trade={trade} />
                ))}
              </div>
            )}
          </div>

          {/* Charts panel */}
          <div className={`w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col gap-4 ${activeTab === 'feed' ? 'hidden lg:flex' : 'flex'}`}>
            <VolumeChart data={volumeHistory} />
            <FlowChart flows={coinFlows} />
            <OIChart />
          </div>
        </div>

        <footer className="text-center py-4 border-t border-[#1e1e2e]">
          <p className="text-[10px] text-slate-600 font-mono">
            WHALE MOVE · Hyperliquid DEX Real-time Tracker · Not financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}
