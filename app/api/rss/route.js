import { NextResponse } from 'next/server';
import { initDb, saveRssItems, saveEvents, getRssItems, getArchivedInfo, isEventArchived } from '@/lib/db';
import { scrapeAllRss, fetchFederalRegisterAiSignals, RSS_FALLBACK, RSS_SOURCES } from '@/lib/rssParser';
import { clearRouteCache } from '@/lib/cache';
import { decodeHtmlEntities, geocodeText } from '@/lib/geocoder';
import { classifyTechPolicySignal } from '@/lib/policyClassifier';

export const dynamic = 'force-dynamic';

const STALE_REFRESH_MS = 45 * 60 * 1000; // Auto-refresh live feeds whenever DB is >45 min stale
let lastLiveScrapeAt = 0;
let inFlightScrape = null;

const ACADEMIC_SIDS = new Set(
  RSS_SOURCES.filter((s) => s.isAcademic).map((s) => s.id)
);

const LEGACY_PUBLISHER_FALLBACKS = new Set([
  'Middle East Bureau',
  'Global Node',
  'Stanford / Silicon Valley',
  'San Francisco Tech Center',
  'London Research Centre',
  'UN Global Headquarters',
  'Global / OSINT'
]);

async function runLiveIngestPass() {
  const [liveItems, fedRegSignals] = await Promise.all([
    scrapeAllRss(),
    fetchFederalRegisterAiSignals(15).catch(() => [])
  ]);

  if (liveItems.length > 0) {
    await saveRssItems(liveItems);
    const geoEvents = liveItems
      .filter((item) => item.hasExplicitLocation && item.latitude !== null && item.longitude !== null)
      .map((item) => ({
        id: `rss-${item.id}`,
        title: item.title,
        category: item.category || 'Political',
        severity: item.severity || 2,
        location: item.location,
        lat: item.latitude,
        lon: item.longitude,
        timestamp: item.published_at,
        original_post_time: item.published_at,
        url: item.url,
        source: item.source,
        details: {
          summary: item.summary || `Verified ${item.domainPillar || 'AI policy'} signal from ${item.source}.`,
          source: item.source,
          sid: item.sid,
          domainPillar: item.domainPillar,
          mitRisk: item.mitRisk,
          isAcademic: Boolean(item.isAcademic),
          isRssAutoPin: true,
          verificationStatus: 'active'
        }
      }));
    const toSave = [...geoEvents, ...fedRegSignals];
    if (toSave.length > 0) {
      await saveEvents(toSave).catch((err) => console.warn('RSS geo-event save skipped:', err.message));
      clearRouteCache();
    }
  } else if (fedRegSignals.length > 0) {
    await saveEvents(fedRegSignals).catch(() => {});
    clearRouteCache();
  }
  lastLiveScrapeAt = Date.now();
  return liveItems.length;
}

export async function GET(request) {
  try {
    await initDb();

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // 1. Query database for existing items (increased window for richer breaking news + academic papers)
    let dbItems = await getRssItems(240);
    let status = 'database';

    // Determine whether database feed is stale (>45 min since newest ingest/publish)
    const now = Date.now();
    let newestTs = 0;
    for (const row of dbItems.slice(0, 20)) {
      const t = Math.max(
        row.created_at ? new Date(row.created_at).getTime() || 0 : 0,
        row.published_at ? new Date(row.published_at).getTime() || 0 : 0
      );
      if (t > newestTs) newestTs = t;
    }
    const isStale = dbItems.length === 0 || (now - newestTs > STALE_REFRESH_MS && now - lastLiveScrapeAt > STALE_REFRESH_MS);

    // 2. Scrape live feeds if forced, empty, or stale (>45 min) — deduplicated & time-bounded
    if (forceRefresh || isStale) {
      try {
        if (!inFlightScrape) {
          inFlightScrape = runLiveIngestPass().finally(() => {
            inFlightScrape = null;
          });
        }
        const scrapedCount = await Promise.race([
          inFlightScrape,
          new Promise((resolve) => setTimeout(() => resolve(-1), 9500))
        ]);
        if (scrapedCount > 0) {
          dbItems = await getRssItems(240);
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

        const isAcademic = Boolean(
          item.isAcademic ||
          ACADEMIC_SIDS.has(item.sid) ||
          String(item.sid || '').startsWith('arxiv') ||
          /(arxiv|nature|mit news|techpolicy\.press|citizen lab|oxford internet|georgetown cset|ieee spectrum|algorithmwatch|future of life|digichina|chinai|icrc|nist)/i.test(String(item.source || ''))
        );

        return {
          ...item,
          title: cleanTitle,
          summary: cleanSummary,
          category: item.edited ? item.category : (cls.category || item.category || 'Political'),
          severity: item.edited ? item.severity : (cls.severity || item.severity || 2),
          domainPillar: cls.domainPillar,
          isAcademic,
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
