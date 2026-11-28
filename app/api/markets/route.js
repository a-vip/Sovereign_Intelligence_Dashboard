import { NextResponse } from 'next/server';

const DEFAULT_SYMBOLS = [
  { ticker: '^GSPC', symbol: 'S&P 500 🇺🇸', name: 'S&P 500', category: 'Indices', fallback: { price: 5824.50, change: 0.42 } },
  { ticker: '^IXIC', symbol: 'NASDAQ 🇺🇸', name: 'NASDAQ Composite', category: 'Indices', fallback: { price: 18480.20, change: 0.78 } },
  { ticker: '^FTSE', symbol: 'FTSE 100 🇬🇧', name: 'FTSE 100', category: 'Indices', fallback: { price: 8292.10, change: -0.15 } },
  { ticker: '000001.SS', symbol: 'Shanghai Comp 🇨🇳', name: 'Shanghai Composite', category: 'Indices', fallback: { price: 3260.45, change: 0.85 } },
  { ticker: '^N225', symbol: 'Nikkei 225 🇯🇵', name: 'Nikkei 225', category: 'Indices', fallback: { price: 39150.00, change: 1.12 } },
  { ticker: 'NVDA', symbol: 'NVIDIA (AI Compute) 🤖', name: 'NVIDIA Corp', category: 'AI', fallback: { price: 138.60, change: 2.34 } },
  { ticker: 'TSM', symbol: 'TSMC (Foundry) 🔬', name: 'Taiwan Semiconductor', category: 'AI', fallback: { price: 194.20, change: 1.65 } },
  { ticker: 'ASML', symbol: 'ASML (EUV Litho) ⚡', name: 'ASML Holding', category: 'AI', fallback: { price: 738.40, change: 0.92 } },
  { ticker: 'MSFT', symbol: 'Microsoft (Cloud AI) ☁️', name: 'Microsoft Corp', category: 'AI', fallback: { price: 428.15, change: 0.54 } },
  { ticker: 'PLTR', symbol: 'Palantir (Defense AI) 🛡️', name: 'Palantir Technologies', category: 'Defense', fallback: { price: 42.85, change: 3.15 } },
  { ticker: 'ITA', symbol: 'US Aerospace & Defense ✈️', name: 'US Aerospace & Defense ETF', category: 'Defense', fallback: { price: 152.30, change: 0.72 } },
  { ticker: 'LMT', symbol: 'Lockheed Martin 🛰️', name: 'Lockheed Martin', category: 'Defense', fallback: { price: 572.40, change: 0.31 } },
  { ticker: 'GC=F', symbol: 'Gold (Comex) 🥇', name: 'Gold Futures', category: 'Macro', fallback: { price: 2735.80, change: 0.56 } },
  { ticker: 'BZ=F', symbol: 'Brent Crude 🛢️', name: 'Brent Crude Oil', category: 'Macro', fallback: { price: 74.20, change: -0.95 } },
  { ticker: 'BTC-USD', symbol: 'Bitcoin USD ₿', name: 'Bitcoin USD', category: 'Crypto', fallback: { price: 68240.00, change: 1.85 } },
  { ticker: 'ETH-USD', symbol: 'Ethereum USD Ξ', name: 'Ethereum USD', category: 'Crypto', fallback: { price: 2640.00, change: 1.12 } },
  { ticker: '^VIX', symbol: 'CBOE Volatility 📊', name: 'CBOE Volatility Index', category: 'Macro', fallback: { price: 18.45, change: -2.40 } }
];

const DEFAULT_BY_TICKER = new Map(DEFAULT_SYMBOLS.map((s) => [s.ticker.toUpperCase(), s]));

// Simple in-memory cache per ticker so both default & custom watchlists share fresh quotes
const tickerQuoteCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

async function fetchYahooQuote(item) {
  const key = item.ticker.toUpperCase();
  const cached = tickerQuoteCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return {
      ...cached.quote,
      symbol: item.symbol || cached.quote.symbol,
      category: item.category || cached.quote.category
    };
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.ticker)}?range=1d&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(5500),
        cache: 'no-store'
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (meta && typeof meta.regularMarketPrice === 'number') {
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose || price;
      const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

      const quote = {
        ticker: key,
        symbol: item.symbol || meta.shortName || meta.longName || key,
        name: item.name || meta.longName || meta.shortName || key,
        category: item.category || 'Custom',
        currency: meta.currency || 'USD',
        exchange: meta.exchangeName || '',
        price: Number(price.toFixed(price >= 1000 ? 0 : 2)),
        change: Number(changePct.toFixed(2)),
        dayHigh: typeof meta.regularMarketDayHigh === 'number' ? Number(meta.regularMarketDayHigh.toFixed(2)) : null,
        dayLow: typeof meta.regularMarketDayLow === 'number' ? Number(meta.regularMarketDayLow.toFixed(2)) : null,
        live: true
      };

      tickerQuoteCache.set(key, { ts: Date.now(), quote });
      return quote;
    }
  } catch (err) {
    console.warn(`Market feed fallback for ${item.ticker}:`, err.message);
  }

  if (item.fallback) {
    return {
      ticker: key,
      symbol: item.symbol,
      name: item.name || item.symbol,
      category: item.category || 'Macro',
      currency: 'USD',
      price: item.fallback.price,
      change: item.fallback.change,
      live: false
    };
  }

  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const extraParam = String(searchParams.get('tickers') || '').trim();
    const extraTickers = extraParam
      ? extraParam
          .split(',')
          .map((t) => t.trim().toUpperCase())
          .filter((t) => t && t.length <= 20 && /^[A-Z0-9^.=/-]+$/.test(t))
          .slice(0, 25)
      : [];

    const requestList = [...DEFAULT_SYMBOLS];
    const seen = new Set(DEFAULT_SYMBOLS.map((s) => s.ticker.toUpperCase()));

    for (const t of extraTickers) {
      if (seen.has(t)) continue;
      seen.add(t);
      const known = DEFAULT_BY_TICKER.get(t);
      requestList.push(
        known || {
          ticker: t,
          symbol: t,
          name: t,
          category: 'Custom'
        }
      );
    }

    const rawQuotes = await Promise.all(requestList.map((item) => fetchYahooQuote(item)));
    const quotes = rawQuotes.filter(Boolean);

    return NextResponse.json(
      {
        quotes,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=90'
        }
      }
    );
  } catch (err) {
    console.error('Market API error:', err);
    return NextResponse.json(
      {
        quotes: DEFAULT_SYMBOLS.map((s) => ({
          ticker: s.ticker,
          symbol: s.symbol,
          name: s.name,
          category: s.category,
          currency: 'USD',
          price: s.fallback.price,
          change: s.fallback.change,
          live: false
        })),
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}
