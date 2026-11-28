import { NextResponse } from 'next/server';
import { extractSessionPayload } from '@/lib/adminAuth';
import { getUserMarketWatchlist, saveUserMarketWatchlist } from '@/lib/db';

function sanitizeList(rawList) {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set();
  const out = [];
  for (const item of rawList) {
    const ticker = String(typeof item === 'string' ? item : item?.ticker || '').trim().toUpperCase();
    if (!ticker || ticker.length > 20 || !/^[A-Z0-9^.=/-]+$/.test(ticker) || seen.has(ticker)) continue;
    seen.add(ticker);
    out.push({
      ticker,
      name: String(typeof item === 'object' && item?.name ? item.name : ticker).slice(0, 80),
      category: String(typeof item === 'object' && item?.category ? item.category : 'Custom').slice(0, 32)
    });
    if (out.length >= 25) break;
  }
  return out;
}

export async function GET(request) {
  const session = await extractSessionPayload(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Sign in required to load your saved market watchlist.' }, { status: 401 });
  }
  try {
    const items = await getUserMarketWatchlist(session.email);
    return NextResponse.json({ watchlist: items });
  } catch (err) {
    console.error('GET /api/markets/watchlist error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await extractSessionPayload(request);
  if (!session?.email) {
    return NextResponse.json({ error: 'Sign in or create an account to save custom market watchlists.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    let nextItems = [];

    if (Array.isArray(body?.watchlist)) {
      nextItems = sanitizeList(body.watchlist);
    } else if (body?.action === 'add' && body?.ticker) {
      const current = await getUserMarketWatchlist(session.email);
      nextItems = sanitizeList([
        { ticker: body.ticker, name: body.name || body.ticker, category: body.category || 'Custom' },
        ...current
      ]);
    } else if (body?.action === 'remove' && body?.ticker) {
      const target = String(body.ticker).trim().toUpperCase();
      const current = await getUserMarketWatchlist(session.email);
      nextItems = current.filter((x) => String(x.ticker).toUpperCase() !== target);
    } else {
      return NextResponse.json({ error: 'Provide watchlist array or action (add/remove) + ticker.' }, { status: 400 });
    }

    const saved = await saveUserMarketWatchlist(session.email, nextItems);
    return NextResponse.json({ watchlist: saved });
  } catch (err) {
    console.error('POST /api/markets/watchlist error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
