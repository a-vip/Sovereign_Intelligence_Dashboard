import { NextResponse } from 'next/server';
import { initDb, saveRssItems, getRssItems, getArchivedInfo, isEventArchived } from '@/lib/db';
import { scrapeAllRss, RSS_FALLBACK } from '@/lib/rssParser';
import { decodeHtmlEntities, geocodeText } from '@/lib/geocoder';

export const dynamic = 'force-dynamic';

const RSS_NOISE_BLOCKLIST = /\b(cricket|football|soccer|baseball|rugby|tennis|olympics|stadium|batting|bowler|innings|ballon d'or|ballon d’or|harry kane|bayern munich|champions league|world cup|fifa|uefa|nba|nfl|celebrity|hollywood|bollywood|pop star|concert|album|actors|actress|theatre|box office|super bowl|ipl match|championship|premier league|tournament|cricket match|striker|goalkeeper)\b/i;

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
    
    const archivedInfo = await getArchivedInfo();
    const filteredItems = dbItems
      .filter(item => {
        if (isEventArchived(item, archivedInfo)) return false;
        const text = `${item.title || ''} ${item.summary || ''}`;
        if (RSS_NOISE_BLOCKLIST.test(text)) return false;
        return true;
      })
      .map(item => {
        const cleanTitle = decodeHtmlEntities(item.title || '');
        const cleanSummary = decodeHtmlEntities(item.summary || '');
        let location = item.location;
        let latitude = item.latitude;
        let longitude = item.longitude;

        // Self-heal items that were previously assigned to "Middle East Bureau" when their headline mentions another country
        if (!item.edited && (location === 'Middle East Bureau' || location === 'Global Node')) {
          const reGeo = geocodeText(cleanTitle, cleanSummary, item.sid);
          if (reGeo && reGeo.name !== 'Middle East Bureau') {
            location = reGeo.name;
            latitude = reGeo.lat;
            longitude = reGeo.lon;
          }
        }

        return {
          ...item,
          title: cleanTitle,
          summary: cleanSummary,
          location,
          latitude,
          longitude
        };
      });

    return NextResponse.json({
      success: true,
      status,
      count: filteredItems.length,
      items: filteredItems
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
