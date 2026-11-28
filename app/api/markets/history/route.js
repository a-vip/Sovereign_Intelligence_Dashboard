import { NextResponse } from 'next/server';

const RANGE_MAP = {
  '1D': { yfRange: '1d', yfInterval: '5m' },
  '5D': { yfRange: '5d', yfInterval: '15m' },
  '1M': { yfRange: '1mo', yfInterval: '1d' },
  '3M': { yfRange: '3mo', yfInterval: '1d' },
  '6M': { yfRange: '6mo', yfInterval: '1d' },
  '1Y': { yfRange: '1y', yfInterval: '1d' },
  '5Y': { yfRange: '5y', yfInterval: '1wk' }
};

const historyCache = new Map();
const CACHE_TTL_MS = 120 * 1000;

function sanitizeTicker(raw) {
  const clean = String(raw || '').trim().toUpperCase();
  if (!clean || clean.length > 20 || !/^[A-Z0-9^.=/-]+$/.test(clean)) return null;
  return clean;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = sanitizeTicker(searchParams.get('ticker'));
    const rangeKey = String(searchParams.get('range') || '1M').trim().toUpperCase();
    const spec = RANGE_MAP[rangeKey] || RANGE_MAP['1M'];

    if (!ticker) {
      return NextResponse.json({ error: 'Invalid or missing ticker symbol.' }, { status: 400 });
    }

    const cacheKey = `${ticker}:${rangeKey}`;
    const cached = historyCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${spec.yfRange}&interval=${spec.yfInterval}&includePrePost=false`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(7500),
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Market history feed returned HTTP ${res.status}`, ticker, range: rangeKey, candles: [] },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      return NextResponse.json(
        { error: 'No historical series returned for this symbol.', ticker, range: rangeKey, candles: [] },
        { status: 404 }
      );
    }

    const meta = result.meta || {};
    const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const t = Number(timestamps[i]);
      const c = Number(closes[i]);
      if (!Number.isFinite(t) || !Number.isFinite(c) || c <= 0) continue;
      const o = Number.isFinite(Number(opens[i])) && Number(opens[i]) > 0 ? Number(opens[i]) : c;
      const h = Number.isFinite(Number(highs[i])) && Number(highs[i]) > 0 ? Number(highs[i]) : Math.max(o, c);
      const l = Number.isFinite(Number(lows[i])) && Number(lows[i]) > 0 ? Number(lows[i]) : Math.min(o, c);
      const v = Number.isFinite(Number(volumes[i])) && Number(volumes[i]) >= 0 ? Number(volumes[i]) : 0;
      candles.push({
        t: t * 1000,
        o: Number(o.toFixed(4)),
        h: Number(Math.max(h, o, c).toFixed(4)),
        l: Number(Math.min(l, o, c).toFixed(4)),
        c: Number(c.toFixed(4)),
        v: Math.round(v)
      });
    }

    if (candles.length === 0) {
      return NextResponse.json(
        { error: 'No valid candles available for selected timeframe.', ticker, range: rangeKey, candles: [] },
        { status: 200 }
      );
    }

    const firstOpen = candles[0].o;
    const lastClose = Number.isFinite(Number(meta.regularMarketPrice))
      ? Number(meta.regularMarketPrice)
      : candles[candles.length - 1].c;
    const baseRef = rangeKey === '1D' && Number.isFinite(Number(meta.chartPreviousClose || meta.previousClose))
      ? Number(meta.chartPreviousClose || meta.previousClose)
      : firstOpen;
    const changeAbs = lastClose - baseRef;
    const changePct = baseRef > 0 ? (changeAbs / baseRef) * 100 : 0;

    let periodHigh = -Infinity;
    let periodLow = Infinity;
    for (const pt of candles) {
      if (pt.h > periodHigh) periodHigh = pt.h;
      if (pt.l < periodLow) periodLow = pt.l;
    }

    const payload = {
      ticker,
      name: meta.longName || meta.shortName || ticker,
      currency: meta.currency || 'USD',
      exchangeName: meta.exchangeName || meta.fullExchangeName || '',
      instrumentType: meta.instrumentType || '',
      marketState: meta.marketState || '',
      fiftyTwoWeekHigh: Number.isFinite(Number(meta.fiftyTwoWeekHigh)) ? Number(Number(meta.fiftyTwoWeekHigh).toFixed(4)) : null,
      fiftyTwoWeekLow: Number.isFinite(Number(meta.fiftyTwoWeekLow)) ? Number(Number(meta.fiftyTwoWeekLow).toFixed(4)) : null,
      regularMarketDayHigh: Number.isFinite(Number(meta.regularMarketDayHigh)) ? Number(Number(meta.regularMarketDayHigh).toFixed(4)) : null,
      regularMarketDayLow: Number.isFinite(Number(meta.regularMarketDayLow)) ? Number(Number(meta.regularMarketDayLow).toFixed(4)) : null,
      regularMarketVolume: Number.isFinite(Number(meta.regularMarketVolume)) ? Math.round(Number(meta.regularMarketVolume)) : null,
      range: rangeKey,
      interval: spec.yfInterval,
      currentPrice: Number(lastClose.toFixed(4)),
      previousClose: Number(baseRef.toFixed(4)),
      changeAbs: Number(changeAbs.toFixed(4)),
      changePct: Number(changePct.toFixed(2)),
      periodHigh: Number(periodHigh.toFixed(4)),
      periodLow: Number(periodLow.toFixed(4)),
      candles,
      timestamp: new Date().toISOString()
    };

    // Keep cache bounded
    if (historyCache.size > 140) {
      const oldestKey = historyCache.keys().next().value;
      if (oldestKey) historyCache.delete(oldestKey);
    }
    historyCache.set(cacheKey, { ts: Date.now(), data: payload });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=90, stale-while-revalidate=180'
      }
    });
  } catch (err) {
    console.error('GET /api/markets/history error:', err);
    return NextResponse.json({ error: err.message || 'History lookup failed.' }, { status: 500 });
  }
}
