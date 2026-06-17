"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TradeCard, { Trade } from "./TradeCard";
import StatsBar from "./StatsBar";

const COINS = [
  "BTC", "ETH", "SOL", "ARB", "DOGE", "AVAX", "MATIC", "LINK",
  "BNB", "XRP", "OP", "SUI", "APT", "INJ", "TIA", "WIF",
  "PEPE", "BONK", "JTO", "PYTH",
];

const THRESHOLDS = [
  { label: "$50K", value: 50_000 },
  { label: "$100K", value: 100_000 },
  { label: "$500K", value: 500_000 },
  { label: "$1M+", value: 1_000_000 },
];

const MAX_TRADES = 100;
const WS_URL = "wss://api.hyperliquid.xyz/ws";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface RawTrade {
  coin: string;
  side: "B" | "A";
  px: string;
  sz: string;
  time: number;
  hash: string;
}

export default function WhaleTracker() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [threshold, setThreshold] = useState(50_000);
  const [coinFilter, setCoinFilter] = useState<string>("ALL");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [totalVolume, setTotalVolume] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [biggestTrade, setBiggestTrade] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const thresholdRef = useRef(threshold);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");

      COINS.forEach((coin) => {
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "trades", coin },
          })
        );
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.channel !== "trades" || !Array.isArray(msg.data)) return;

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

        setTrades((prev) => {
          const merged = [...incoming, ...prev].slice(0, MAX_TRADES);
          return merged;
        });

        setTotalVolume((v) => v + incoming.reduce((acc, t) => acc + t.notional, 0));
        setTradeCount((c) => c + incoming.length);
        setBiggestTrade((b) => {
          const maxNew = Math.max(...incoming.map((t) => t.notional));
          return Math.max(b, maxNew);
        });
      } catch {
        // malformed frame, skip
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("error");
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const filteredTrades =
    coinFilter === "ALL"
      ? trades.filter((t) => t.notional >= threshold)
      : trades.filter((t) => t.notional >= threshold && t.coin === coinFilter);

  const statusDot: Record<ConnectionStatus, string> = {
    connecting: "bg-yellow-400 animate-pulse",
    connected: "bg-emerald-400",
    disconnected: "bg-red-500 animate-pulse",
    error: "bg-red-500",
  };

  const statusLabel: Record<ConnectionStatus, string> = {
    connecting: "Connecting...",
    connected: "Live",
    disconnected: "Reconnecting...",
    error: "Error",
  };

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#08080f] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-none">
                WHALE MOVE
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                Hyperliquid Tracker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[status]}`} />
            <span className="text-xs text-slate-400 font-mono">{statusLabel[status]}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-4 flex flex-col gap-4 flex-1">
        {/* Stats */}
        <StatsBar
          totalVolume={totalVolume}
          tradeCount={tradeCount}
          biggestTrade={biggestTrade}
          activeThreshold={threshold}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Threshold */}
          <div className="flex items-center gap-1 bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest px-2 hidden sm:inline">
              Min
            </span>
            {THRESHOLDS.map((t) => (
              <button
                key={t.value}
                onClick={() => setThreshold(t.value)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-150 ${
                  threshold === t.value
                    ? "bg-violet-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Coin filter */}
          <div className="flex items-center gap-1 flex-wrap bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-1 flex-1 overflow-x-auto">
            <button
              onClick={() => setCoinFilter("ALL")}
              className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all duration-150 flex-shrink-0 ${
                coinFilter === "ALL"
                  ? "bg-slate-700 text-white"
                  : "text-slate-500 hover:text-slate-300 hover:bg-[#1a1a2e]"
              }`}
            >
              ALL
            </button>
            {COINS.map((coin) => (
              <button
                key={coin}
                onClick={() => setCoinFilter(coin === coinFilter ? "ALL" : coin)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all duration-150 flex-shrink-0 ${
                  coinFilter === coin
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:text-slate-300 hover:bg-[#1a1a2e]"
                }`}
              >
                {coin}
              </button>
            ))}
          </div>
        </div>

        {/* Trade feed */}
        <div className="flex flex-col gap-2 flex-1">
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-12 h-12 rounded-full border border-[#1e1e2e] bg-[#0d0d14] flex items-center justify-center">
                <span className="text-2xl">🐋</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">
                  {status === "connected"
                    ? "Waiting for whale trades..."
                    : status === "connecting"
                    ? "Connecting to Hyperliquid..."
                    : "Connection lost. Reconnecting..."}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Monitoring trades above {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(threshold)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredTrades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-4 border-t border-[#1e1e2e]">
          <p className="text-[10px] text-slate-600 font-mono">
            WHALE MOVE &bull; Real-time Hyperliquid DEX whale tracker &bull; Not financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}
