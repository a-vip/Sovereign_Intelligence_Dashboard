import { NextResponse } from 'next/server';
import { initDb, saveRssItems, getRssItems, getArchivedInfo, isEventArchived } from '@/lib/db';
import { scrapeAllRss, RSS_FALLBACK } from '@/lib/rssParser';
import { decodeHtmlEntities, geocodeText } from '@/lib/geocoder';
import { classifyTechPolicySignal } from '@/lib/policyClassifier';

export const dynamic = 'force-dynamic';

const LEGACY_PUBLISHER_FALLBACKS = new Set([
  'Middle East Bureau',
  'Global Node',
  'Stanford / Silicon Valley',
  'San Francisco Tech Center',
  'London Research Centre',
  'UN Global Headquarters',
  'Global / OSINT'
]);

export async function GET(request) {
  try {
    await initDb();

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // 1. Query database for existing items
    let dbItems = await getRssItems(140);
    let status = 'database';

    // 2. Scrape live feeds if forced OR if database is empty
    if (forceRefresh || dbItems.length === 0) {
      try {
        const liveItems = await scrapeAllRss();
        if (liveItems.length > 0) {
          await saveRssItems(liveItems);
          dbItems = await getRssItems(140);
          status = forceRefresh ? 'refreshed' : 'live';
        }
      } catch (e) {
        console.error('Failed to scrape live RSS feeds:', e.message);
      }
    }

    // 3. Robust self-healing fallback
    if (dbItems.length === 0) {
      dbItems = RSS_FALLBACK;
      status = 'curated';
    }

    const archivedInfo = await getArchivedInfo();
    const filteredItems = dbItems
      .filter(item => {
        if (isEventArchived(item, archivedInfo)) return false;
        if (item.edited === true || item.edited === 'true') return true;
        const cls = classifyTechPolicySignal(item.title || '', item.summary || '', item.sid || '');
        return cls.isRelevant;
      })
      .map(item => {
        const cleanTitle = decodeHtmlEntities(item.title || '');
        const cleanSummary = decodeHtmlEntities(item.summary || '');
        const cls = classifyTechPolicySignal(cleanTitle, cleanSummary, item.sid || '');

        let location = item.location;
        let latitude = item.latitude;
        let longitude = item.longitude;

        // Re-evaluate any legacy publisher-HQ fallback or missing location on unedited items
        if (!item.edited) {
          const geo = geocodeText(cleanTitle, cleanSummary, item.sid || '');
          if (geo.hasExplicitLocation && geo.lat !== null && geo.lon !== null) {
            location = geo.name;
            latitude = geo.lat;
            longitude = geo.lon;
          } else if (LEGACY_PUBLISHER_FALLBACKS.has(location) || !geo.hasExplicitLocation) {
            location = 'Global / Multilateral';
            latitude = null;
            longitude = null;
          }
        }

        return {
          ...item,
          title: cleanTitle,
          summary: cleanSummary,
          category: item.edited ? item.category : (cls.category || item.category || 'Political'),
          severity: item.edited ? item.severity : (cls.severity || item.severity || 2),
          domainPillar: cls.domainPillar,
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
