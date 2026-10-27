import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let cachedQuotes = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds cache

const SYMBOLS_CONFIG = [
  { ticker: '^GSPC', symbol: 'S&P 500', name: 'S&P 500', region: 'US', fallbackPrice: 5864, fallbackChg: 0.4 },
  { ticker: '^FTSE', symbol: 'FTSE 100', name: 'FTSE 100', region: 'GB', fallbackPrice: 8358, fallbackChg: 0.2 },
  { ticker: '000001.SS', symbol: 'Shanghai', name: 'Shanghai Comp', region: 'CN', fallbackPrice: 3285, fallbackChg: 0.6 },
  { ticker: '^N225', symbol: 'Nikkei 225', name: 'Nikkei 225', region: 'JP', fallbackPrice: 38910, fallbackChg: -0.3 },
  { ticker: 'NVDA', symbol: 'NVDA', name: 'NVIDIA (AI Compute)', region: 'AI', fallbackPrice: 141.50, fallbackChg: 1.8 },
  { ticker: 'PLTR', symbol: 'PLTR', name: 'Palantir (Defense AI)', region: 'DEF', fallbackPrice: 44.80, fallbackChg: 1.4 },
  { ticker: 'ITA', symbol: 'ITA', name: 'US Aerospace & Def', region: 'DEF', fallbackPrice: 149.20, fallbackChg: 0.5 },
  { ticker: 'GC=F', symbol: 'Gold', name: 'Gold (Comex)', icon: '🥇', fallbackPrice: 2748, fallbackChg: 0.3 },
  { ticker: 'BZ=F', symbol: 'Brent', name: 'Brent Crude', icon: '🛢️', fallbackPrice: 74.90, fallbackChg: -0.6 },
  { ticker: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin USD', icon: '₿', fallbackPrice: 68420, fallbackChg: 1.1 },
  { ticker: '^VIX', symbol: 'VIX', name: 'CBOE Volatility', icon: '📊', fallbackPrice: 18.85, fallbackChg: -1.5 }
];

async function fetchYahooQuote(cfg) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cfg.ticker)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new Error('Missing market meta');
    }
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const chg = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
    const decimals = price > 1000 ? 0 : 2;

    return {
      symbol: cfg.symbol,
      name: cfg.name,
      region: cfg.region || null,
      icon: cfg.icon || null,
      price: parseFloat(price.toFixed(decimals)),
      chg: parseFloat(chg.toFixed(2)),
      isUp: chg >= 0,
      live: true
    };
  } catch {
    return {
      symbol: cfg.symbol,
      name: cfg.name,
      region: cfg.region || null,
      icon: cfg.icon || null,
      price: cfg.fallbackPrice,
      chg: cfg.fallbackChg,
      isUp: cfg.fallbackChg >= 0,
      live: false
    };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('refresh') === 'true';
    const now = Date.now();

    if (!force && cachedQuotes && now - lastFetchTime < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        source: 'Yahoo Finance Macro & Defense Feed (Cached)',
        updatedAt: new Date(lastFetchTime).toISOString(),
        quotes: cachedQuotes
      });
    }

    const quotes = await Promise.all(SYMBOLS_CONFIG.map(fetchYahooQuote));
    cachedQuotes = quotes;
    lastFetchTime = now;

    return NextResponse.json({
      success: true,
      source: 'Yahoo Finance Macro & Defense Feed',
      updatedAt: new Date(now).toISOString(),
      quotes
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
      quotes: SYMBOLS_CONFIG.map(cfg => ({
        symbol: cfg.symbol,
        name: cfg.name,
        region: cfg.region || null,
        icon: cfg.icon || null,
        price: cfg.fallbackPrice,
        chg: cfg.fallbackChg,
        isUp: cfg.fallbackChg >= 0,
        live: false
      }))
    });
  }
}

