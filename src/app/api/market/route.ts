import { NextResponse } from 'next/server';

const TARGET_COINS = [
  'BTC','ETH','SOL','ARB','DOGE','AVAX','MATIC','LINK',
  'BNB','XRP','OP','SUI','APT','INJ','TIA','WIF','PEPE','BONK','JTO','PYTH',
];

export async function GET() {
  try {
    const res = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      cache: 'no-store',
    });

    const [meta, assetCtxs] = await res.json();

    const coins = (meta.universe as { name: string }[])
      .map((coin, i) => {
        const ctx = assetCtxs[i] as Record<string, string>;
        const markPx = parseFloat(ctx.markPx ?? ctx.midPx ?? '0');
        const openInterest = parseFloat(ctx.openInterest ?? '0');
        return {
          name: coin.name,
          openInterestUsd: openInterest * markPx,
          openInterest,
          dayVolume: parseFloat(ctx.dayNtlVlm ?? '0'),
          funding: parseFloat(ctx.funding ?? '0') * 100,
          markPx,
          prevDayPx: parseFloat(ctx.prevDayPx ?? '0'),
        };
      })
      .filter((c) => TARGET_COINS.includes(c.name))
      .sort((a, b) => b.openInterestUsd - a.openInterestUsd);

    return NextResponse.json(coins);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
