import { NextResponse } from 'next/server';

// Curated global directory for instant offline/rate-limit-safe ticker discovery
const POPULAR_DIRECTORY = [
  { ticker: '^GSPC', name: 'S&P 500 Index', exchange: 'SNP', type: 'INDEX', category: 'Indices' },
  { ticker: '^IXIC', name: 'NASDAQ Composite', exchange: 'NASDAQ', type: 'INDEX', category: 'Indices' },
  { ticker: '^DJI', name: 'Dow Jones Industrial Avg', exchange: 'DJI', type: 'INDEX', category: 'Indices' },
  { ticker: '^FTSE', name: 'FTSE 100 Index', exchange: 'FTSE', type: 'INDEX', category: 'Indices' },
  { ticker: '^GDAXI', name: 'DAX Performance Index', exchange: 'XETRA', type: 'INDEX', category: 'Indices' },
  { ticker: '^N225', name: 'Nikkei 225', exchange: 'OSA', type: 'INDEX', category: 'Indices' },
  { ticker: '000001.SS', name: 'Shanghai Composite', exchange: 'SHH', type: 'INDEX', category: 'Indices' },
  { ticker: '^HSI', name: 'Hang Seng Index', exchange: 'HKG', type: 'INDEX', category: 'Indices' },
  { ticker: 'NVDA', name: 'NVIDIA Corp (AI Compute)', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'MSFT', name: 'Microsoft Corp', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'GOOGL', name: 'Alphabet Inc (Google)', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'AAPL', name: 'Apple Inc', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'AMZN', name: 'Amazon.com Inc', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'META', name: 'Meta Platforms Inc', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'TSM', name: 'TSMC (Taiwan Semiconductor)', exchange: 'NYSE', type: 'EQUITY', category: 'AI' },
  { ticker: 'ASML', name: 'ASML Holding NV (Lithography)', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'AVGO', name: 'Broadcom Inc', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'ARM', name: 'Arm Holdings plc', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'TSLA', name: 'Tesla Inc', exchange: 'NASDAQ', type: 'EQUITY', category: 'AI' },
  { ticker: 'PLTR', name: 'Palantir Technologies', exchange: 'NASDAQ', type: 'EQUITY', category: 'Defense' },
  { ticker: 'ITA', name: 'US Aerospace & Defense ETF', exchange: 'CBOE', type: 'ETF', category: 'Defense' },
  { ticker: 'LMT', name: 'Lockheed Martin Corp', exchange: 'NYSE', type: 'EQUITY', category: 'Defense' },
  { ticker: 'RTX', name: 'RTX Corp (Raytheon)', exchange: 'NYSE', type: 'EQUITY', category: 'Defense' },
  { ticker: 'BA', name: 'Boeing Co', exchange: 'NYSE', type: 'EQUITY', category: 'Defense' },
  { ticker: 'RHM.DE', name: 'Rheinmetall AG', exchange: 'XETRA', type: 'EQUITY', category: 'Defense' },
  { ticker: 'BA.L', name: 'BAE Systems plc', exchange: 'LSE', type: 'EQUITY', category: 'Defense' },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings', exchange: 'NASDAQ', type: 'EQUITY', category: 'Defense' },
  { ticker: 'PANW', name: 'Palo Alto Networks', exchange: 'NASDAQ', type: 'EQUITY', category: 'Defense' },
  { ticker: 'GC=F', name: 'Gold Futures (Comex)', exchange: 'COMEX', type: 'FUTURE', category: 'Macro' },
  { ticker: 'SI=F', name: 'Silver Futures', exchange: 'COMEX', type: 'FUTURE', category: 'Macro' },
  { ticker: 'BZ=F', name: 'Brent Crude Oil', exchange: 'NYM', type: 'FUTURE', category: 'Macro' },
  { ticker: 'CL=F', name: 'WTI Crude Oil', exchange: 'NYM', type: 'FUTURE', category: 'Macro' },
  { ticker: 'NG=F', name: 'Natural Gas Futures', exchange: 'NYM', type: 'FUTURE', category: 'Macro' },
  { ticker: 'HG=F', name: 'Copper Futures', exchange: 'COMEX', type: 'FUTURE', category: 'Macro' },
  { ticker: '^VIX', name: 'CBOE Volatility Index (VIX)', exchange: 'CBOE', type: 'INDEX', category: 'Macro' },
  { ticker: '^TNX', name: 'US 10-Year Treasury Yield', exchange: 'CBOE', type: 'INDEX', category: 'Macro' },
  { ticker: 'DX-Y.NYB', name: 'US Dollar Index (DXY)', exchange: 'ICE', type: 'INDEX', category: 'FX' },
  { ticker: 'EURUSD=X', name: 'EUR / USD Spot', exchange: 'CCY', type: 'CURRENCY', category: 'FX' },
  { ticker: 'GBPUSD=X', name: 'GBP / USD Spot', exchange: 'CCY', type: 'CURRENCY', category: 'FX' },
  { ticker: 'USDJPY=X', name: 'USD / JPY Spot', exchange: 'CCY', type: 'CURRENCY', category: 'FX' },
  { ticker: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CCC', type: 'CRYPTOCURRENCY', category: 'Crypto' },
  { ticker: 'ETH-USD', name: 'Ethereum USD', exchange: 'CCC', type: 'CRYPTOCURRENCY', category: 'Crypto' },
  { ticker: 'SOL-USD', name: 'Solana USD', exchange: 'CCC', type: 'CRYPTOCURRENCY', category: 'Crypto' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSEARCA', type: 'ETF', category: 'Indices' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq-100)', exchange: 'NASDAQ', type: 'ETF', category: 'Indices' },
  { ticker: 'SOXX', name: 'iShares Semiconductor ETF', exchange: 'NASDAQ', type: 'ETF', category: 'AI' },
  { ticker: 'URA', name: 'Global X Uranium ETF', exchange: 'NYSEARCA', type: 'ETF', category: 'Macro' }
];

function classifyType(quoteType, ticker) {
  const qt = String(quoteType || '').toUpperCase();
  if (qt === 'CRYPTOCURRENCY' || /-USD$/i.test(ticker)) return 'Crypto';
  if (qt === 'CURRENCY' || /=X$/i.test(ticker)) return 'FX';
  if (qt === 'FUTURE' || /=F$/i.test(ticker)) return 'Macro';
  if (qt === 'INDEX' || ticker.startsWith('^')) return 'Indices';
  return 'Custom';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({ results: POPULAR_DIRECTORY.slice(0, 12) });
    }

    const qLower = q.toLowerCase();
    const localMatches = POPULAR_DIRECTORY.filter(
      (item) =>
        item.ticker.toLowerCase().includes(qLower) ||
        item.name.toLowerCase().includes(qLower) ||
        item.category.toLowerCase().includes(qLower)
    );

    let remoteResults = [];
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&enableFuzzyQuery=true`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(4500),
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        const quotes = Array.isArray(json?.quotes) ? json.quotes : [];
        remoteResults = quotes
          .filter((item) => item?.symbol && /^[A-Z0-9^.=/-]{1,20}$/i.test(item.symbol))
          .map((item) => {
            const ticker = String(item.symbol).toUpperCase();
            return {
              ticker,
              name: item.shortname || item.longname || ticker,
              exchange: item.exchDisp || item.exchange || '',
              type: item.quoteType || 'EQUITY',
              category: classifyType(item.quoteType, ticker)
            };
          });
      }
    } catch {
      // Fall back smoothly to local directory matches
    }

    const seen = new Set();
    const merged = [];
    for (const item of [...localMatches, ...remoteResults]) {
      if (seen.has(item.ticker)) continue;
      seen.add(item.ticker);
      merged.push(item);
      if (merged.length >= 10) break;
    }

    return NextResponse.json({ results: merged });
  } catch (err) {
    console.error('GET /api/markets/search error:', err);
    return NextResponse.json({ results: [], error: err.message }, { status: 500 });
  }
}
