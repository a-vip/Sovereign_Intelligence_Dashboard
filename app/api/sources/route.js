import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  initDb,
  getCustomSources,
  saveCustomSource,
  deleteCustomSource,
  saveRssItems,
  saveEvents
} from '@/lib/db';
import {
  RSS_SOURCES,
  CURATED_SOURCE_CATALOG,
  isSafeFeedUrl,
  fetchAndParseFeedSource
} from '@/lib/rssParser';
import { clearRouteCache } from '@/lib/cache';
import { extractSessionPayload, verifyAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    const customSources = await getCustomSources();
    return NextResponse.json({
      success: true,
      builtInSources: RSS_SOURCES,
      customSources,
      curatedCatalog: CURATED_SOURCE_CATALOG
    });
  } catch (error) {
    console.error('GET /api/sources error:', error);
    return NextResponse.json(
      { success: false, error: error.message, builtInSources: RSS_SOURCES, customSources: [], curatedCatalog: CURATED_SOURCE_CATALOG },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await initDb();
    const body = await request.json();
    const rawUrl = String(body.url || '').trim();
    if (!rawUrl) {
      return NextResponse.json({ error: 'Please provide an RSS or Atom feed URL.' }, { status: 400 });
    }

    const safety = isSafeFeedUrl(rawUrl);
    if (!safety.safe) {
      return NextResponse.json({ error: safety.reason }, { status: 400 });
    }

    const preset = CURATED_SOURCE_CATALOG.find(
      c => c.url.toLowerCase() === safety.url.toLowerCase() || (body.sid && c.sid === body.sid)
    );

    const parsedHost = new URL(safety.url).hostname.replace(/^www\./, '');
    const sourceName = String(body.name || preset?.name || parsedHost).trim().slice(0, 80);
    const sid = preset?.sid || `src-${crypto.createHash('md5').update(safety.url.toLowerCase()).digest('hex').slice(0, 8)}`;
    const categoryHint = body.categoryHint || preset?.categoryHint || 'Political';
    const keywords = Array.isArray(body.keywords)
      ? body.keywords
      : typeof body.keywords === 'string' && body.keywords.trim()
      ? body.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    // 1. Live fetch, parse, classify (strict AI/Cyber/Tech Policy), and geocode
    let ingestResult;
    try {
      ingestResult = await fetchAndParseFeedSource(
        { sid, name: sourceName, url: safety.url, categoryHint, keywords },
        25
      );
    } catch (fetchErr) {
      return NextResponse.json(
        {
          error: `Unable to parse RSS/Atom XML from ${parsedHost} (${fetchErr.message}). Ensure the URL points directly to an RSS or Atom XML feed.`
        },
        { status: 422 }
      );
    }

    const { fetchedCount, relevantItems, geoPinnedEvents } = ingestResult;

    if (fetchedCount === 0) {
      return NextResponse.json(
        {
          error: `Connected to ${parsedHost}, but found 0 RSS <item> or Atom <entry> elements. Verify this is an XML feed URL (e.g. /feed or /rss.xml).`
        },
        { status: 422 }
      );
    }

    // 2. Persist verified Tech Policy items & auto-pinned globe events
    const session = extractSessionPayload(request);
    const existingCustom = await getCustomSources();
    const isBuiltIn = RSS_SOURCES.some(s => s.url.toLowerCase() === safety.url.toLowerCase());
    const canPersist = Boolean(session || preset || existingCustom.length < 40);

    let savedSource = null;
    if (canPersist) {
      if (relevantItems.length > 0) {
        await saveRssItems(relevantItems);
      }
      if (geoPinnedEvents.length > 0) {
        await saveEvents(geoPinnedEvents);
      }
      if (!isBuiltIn) {
        savedSource = await saveCustomSource({
          sid,
          name: sourceName,
          url: safety.url,
          categoryHint,
          keywords,
          addedBy: session?.email || 'guest-analyst',
          itemCount: relevantItems.length,
          pinCount: geoPinnedEvents.length
        });
      }
      clearRouteCache();
    }

    return NextResponse.json({
      success: true,
      persisted: canPersist,
      source: savedSource || {
        id: sid,
        sid,
        name: sourceName,
        url: safety.url,
        categoryHint,
        itemCount: relevantItems.length,
        pinCount: geoPinnedEvents.length
      },
      stats: {
        fetchedCount,
        relevantCount: relevantItems.length,
        pinnedCount: geoPinnedEvents.length
      },
      relevantItems,
      pinnedEvents: geoPinnedEvents
    });
  } catch (error) {
    console.error('POST /api/sources error:', error);
    return NextResponse.json({ error: error.message || 'Failed to ingest source.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('sid');
    if (!id) {
      return NextResponse.json({ error: 'Source ID required.' }, { status: 400 });
    }

    await deleteCustomSource(id);
    clearRouteCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sources error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
