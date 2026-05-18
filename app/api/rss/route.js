import { NextResponse } from 'next/server';
import { initDb, saveRssItems, getRssItems } from '@/lib/db';
import { scrapeAllRss, RSS_FALLBACK } from '@/lib/rssParser';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await initDb();
    
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // 1. Query database for existing items
    let dbItems = await getRssItems(100);
    let status = 'database';
    
    // 2. Scrape live feeds if forced OR if database is completely empty
    if (forceRefresh || dbItems.length === 0) {
      try {
        const liveItems = await scrapeAllRss();
        if (liveItems.length > 0) {
          await saveRssItems(liveItems);
          dbItems = await getRssItems(100);
          status = forceRefresh ? 'refreshed' : 'live';
        }
      } catch (e) {
        console.error('Failed to scrape live RSS feeds:', e.message);
      }
    }
    
    // 3. Robust self-healing: if STILL empty, return curated high-quality fallbacks
    if (dbItems.length === 0) {
      dbItems = RSS_FALLBACK;
      status = 'curated';
    }
    
    return NextResponse.json({
      success: true,
      status,
      count: dbItems.length,
      items: dbItems
    });
  } catch (error) {
    console.error('RSS API route error:', error);
    return NextResponse.json({ 
      success: false, 
      status: 'error',
      error: error.message,
      items: RSS_FALLBACK 
    }, { status: 500 });
  }
}
