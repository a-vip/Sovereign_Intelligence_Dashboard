import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents, getRssItems, getArchivedInfo, isEventArchived } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { getRouteCache, setRouteCache, clearRouteCache } from '@/lib/cache';
import { geocodeText, decodeHtmlEntities, disperseCoLocatedEvents } from '@/lib/geocoder';
import { classifyTechPolicySignal } from '@/lib/policyClassifier';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_EXPIRY = 300000; // 5 minutes server cache
let isDbInitialized = false;

const GDELT_DOC_API =
  'https://api.gdeltproject.org/api/v2/doc/doc?query=(%22artificial%20intelligence%22%20OR%20%22AI%20regulation%22%20OR%20%22EU%20AI%20Act%22%20OR%20%22autonomous%20weapons%22%20OR%20%22cyberattack%22%20OR%20%22ransomware%22%20OR%20%22facial%20recognition%22%20OR%20%22spyware%22%20OR%20%22semiconductor%20export%22)%20sourcelang:english&mode=artlist&maxrecords=100&format=json';

const CURATED_STATIC_MARKERS = [
  {
    id: 'curated-lavender-gaza',
    lat: 31.5017,
    lon: 34.4668,
    name: 'Algorithmic Target Generation ("Lavender" & "Where’s Daddy?") IHL Review',
    location: 'Gaza / Palestinian Territories',
    category: 'Conflict',
    severity: 5,
    tag: 'CRITICAL',
    source: '+972 Magazine / IHL Dossier',
    url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/'
  },
  {
    id: 'curated-red-wolf-hebron',
    lat: 31.7683,
    lon: 35.2137,
    name: 'Automated Biometric Checkpoint & Facial Recognition Network ("Red Wolf")',
    location: 'West Bank / Jerusalem',
    category: 'Surveillance',
    severity: 4,
    tag: 'ALERT',
    source: 'Amnesty International Tech Lab',
    url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/'
  },
  {
    id: 'curated-sipri-stockholm',
    lat: 59.3293,
    lon: 18.0686,
    name: 'SIPRI Global Assessment on Military AI & Autonomous Weapons Proliferation',
    location: 'Stockholm, Sweden',
    category: 'Political',
    severity: 3,
    tag: 'POLICY',
    source: 'SIPRI Stockholm',
    url: 'https://www.sipri.org/research/armament-and-disarmament/emerging-military-and-security-technologies'
  }
];

function generateHashId(url, title) {
  const seed = url || title || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}

function parseEventDate(raw) {
  if (!raw) return 0;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (/^\d{14}$/.test(s)) {
      return new Date(s.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')).getTime() || 0;
    }
    if (/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/i.test(s)) {
      return new Date(s.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/i, '$1-$2-$3T$4:$5:$6Z')).getTime() || 0;
    }
  }
  const d = new Date(raw).getTime();
  return isNaN(d) ? 0 : d;
}

function loadStaticEvents() {
  const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
  try {
    if (fs.existsSync(staticPath)) {
      const data = fs.readFileSync(staticPath, 'utf-8');
      const parsed = JSON.parse(data);
      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return (Array.isArray(parsed) ? parsed : []).filter(e => {
        const d = parseEventDate(e.original_post_time || e.timestamp || e.created_at);
        return d > 0 && d >= cutoff;
      });
    }
  } catch (err) {
    console.error('Error loading static events:', err);
  }
  return [];
}

async function fetchGdeltTechPolicy() {
  try {
    const docRes = await fetch(GDELT_DOC_API, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!docRes || !docRes.ok) return [];
    const doc = await docRes.json();
    const articles = doc.articles || [];
    const events = [];

    for (const a of articles) {
      const cleanTitle = decodeHtmlEntities(a.title || '');
      if (!cleanTitle) continue;

      const cls = classifyTechPolicySignal(cleanTitle, '', a.domain || '');
      if (!cls.isRelevant) continue;

      const geo = geocodeText(cleanTitle, a.sourcecountry || '', a.domain || '');
      if (!geo.hasExplicitLocation || geo.lat === null || geo.lon === null) continue;

      const parsedMs = parseEventDate(a.seendate);
      const ts = parsedMs > 0 ? new Date(parsedMs).toISOString() : new Date().toISOString();

      events.push({
        id: generateHashId(a.url, cleanTitle),
        title: cleanTitle,
        url: a.url,
        source: a.domain || 'GDELT Wire',
        timestamp: ts,
        original_post_time: ts,
        category: cls.category,
        severity: cls.severity,
        location: geo.name,
        lat: geo.lat,
        lon: geo.lon,
        details: {
          summary: `International ${cls.domainPillar} signal reported via ${a.domain || 'OSINT wire'} (${geo.name}).`,
          domainPillar: cls.domainPillar,
          region: geo.region,
          sourcecountry: a.sourcecountry
        }
      });
    }

    return events;
  } catch (err) {
    console.warn('GDELT Fetch skipped:', err.message);
    return [];
  }
}

function getTitleKeywords(title) {
  const stopWords = new Set([
    'a', 'about', 'after', 'against', 'all', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'before',
    'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have',
    'how', 'in', 'into', 'is', 'it', 'its', 'more', 'most', 'new', 'no', 'not', 'of', 'on', 'or', 'other',
    'our', 'out', 'over', 'says', 'should', 'so', 'some', 'than', 'that', 'the', 'their', 'them', 'then',
    'there', 'these', 'they', 'this', 'to', 'under', 'up', 'use', 'using', 'was', 'we', 'were', 'what',
    'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with', 'would', 'amid', 'warns', 'warn', 'first'
  ]);

  return new Set(
    String(title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

function calculateTitleFuzzySimilarity(title1, title2) {
  const words1 = getTitleKeywords(title1);
  const words2 = getTitleKeywords(title2);
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ts = searchParams.get('timespan') || '24h';
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';
    const now = Date.now();

    if (!isDbInitialized) {
      await initDb();
      isDbInitialized = true;
    }

    const cached = getRouteCache(ts);
    if (!forceRefresh && cached && now - cached.time < CACHE_EXPIRY) {
      const archivedInfo = await getArchivedInfo();
      const filteredData = {
        ...cached.data,
        markers: (cached.data.markers || []).filter(m => !isEventArchived(m, archivedInfo)),
        events: (cached.data.events || []).filter(e => !isEventArchived(e, archivedInfo))
      };
      return NextResponse.json(filteredData, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    const [gdeltEvents, rawDbEvents, staticEvents, archivedInfo, dbRss] = await Promise.all([
      fetchGdeltTechPolicy(),
      getEvents(ts),
      Promise.resolve(loadStaticEvents()),
      getArchivedInfo(),
      getRssItems(120).catch(() => [])
    ]);

    const dbEventsList = (rawDbEvents || []).map(e => ({ ...e, fromDb: true }));

    // Curated international AI governance, cyber & LAWS dossiers
    const pinnedDossiers = (getStopKillerRobotsSignals() || [])
      .map(s => ({
        ...s,
        id: s.id || generateHashId(s.url, s.title),
        fromDb: true
      }))
      .filter(e => !isEventArchived(e, archivedInfo));

    // Promote RSS items ONLY if they pass strict Tech Policy classification AND have a verified geographic location
    const rssPromotedEvents = (dbRss || [])
      .filter(r => !isEventArchived(r, archivedInfo))
      .map(r => {
        const cleanTitle = decodeHtmlEntities(r.title || '');
        const cleanSummary = decodeHtmlEntities(r.summary || '');
        const isEdited = r.edited === true || r.edited === 'true';
        const cls = classifyTechPolicySignal(cleanTitle, cleanSummary, r.sid || '');
        if (!isEdited && !cls.isRelevant) return null;

        let lat = r.latitude !== null && r.latitude !== undefined ? parseFloat(r.latitude) : null;
        let lon = r.longitude !== null && r.longitude !== undefined ? parseFloat(r.longitude) : null;
        let location = r.location || '';

        if (!isEdited) {
          const geo = geocodeText(cleanTitle, cleanSummary, r.sid || '');
          if (!geo.hasExplicitLocation || geo.lat === null || geo.lon === null) {
            return null; // Keep unlocated items in RSS reading wire only — never fake-pin them!
          }
          lat = geo.lat;
          lon = geo.lon;
          location = geo.name;
        }

        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return null;

        return {
          id: r.id || generateHashId(r.url, cleanTitle),
          title: cleanTitle,
          url: r.url,
          source: r.source || 'OSINT Feed',
          timestamp: r.published_at || r.created_at || new Date().toISOString(),
          original_post_time: r.published_at || r.created_at || new Date().toISOString(),
          category: isEdited ? r.category : (cls.category || r.category || 'Political'),
          severity: isEdited ? r.severity : (cls.severity || r.severity || 2),
          location,
          lat,
          lon,
          edited: isEdited,
          fromDb: true,
          details: {
            summary: cleanSummary,
            source: r.source,
            sid: r.sid,
            domainPillar: cls.domainPillar,
            type: 'primary_source',
            verificationStatus: 'active'
          }
        };
      })
      .filter(Boolean);

    // Validate & re-geocode all DB / static events so stale non-policy or mis-geocoded rows are eliminated
    const validatedCandidates = [...pinnedDossiers, ...dbEventsList, ...rssPromotedEvents, ...staticEvents, ...gdeltEvents]
      .filter(e => e && !isEventArchived(e, archivedInfo))
      .map(e => {
        const cleanTitle = decodeHtmlEntities(e.title || e.name || '');
        const cleanSummary = decodeHtmlEntities(e.details?.summary || e.summary || e.description || '');
        const isPinned = e.details?.isPinned === true || e.details?.laws_disarmament === true;
        const isManualEvt = String(e.id || '').startsWith('evt-') || isPinned;
        const isEdited = e.edited === true || e.edited === 'true';

        const cls = classifyTechPolicySignal(cleanTitle, cleanSummary, e.details?.sid || '');
        if (!isManualEvt && !isEdited && !cls.isRelevant) {
          return null;
        }

        let lat = e.lat !== null && e.lat !== undefined ? parseFloat(e.lat) : null;
        let lon = e.lon !== null && e.lon !== undefined ? parseFloat(e.lon) : null;
        let location = e.location || '';

        if (!isEdited && !isPinned) {
          const geo = geocodeText(cleanTitle, cleanSummary, e.details?.sid || '');
          if (!geo.hasExplicitLocation || geo.lat === null || geo.lon === null) {
            return null;
          }
          lat = geo.lat;
          lon = geo.lon;
          location = geo.name;
        }

        if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return null;

        return {
          ...e,
          title: cleanTitle,
          category: (isEdited || isPinned) ? (e.category || cls.category) : cls.category,
          severity: (isEdited || isPinned) ? (e.severity || cls.severity) : cls.severity,
          location,
          lat,
          lon,
          details: {
            ...(e.details || {}),
            domainPillar: e.details?.domainPillar || cls.domainPillar,
            summary: cleanSummary.length > 300 ? `${cleanSummary.slice(0, 297)}...` : cleanSummary
          }
        };
      })
      .filter(Boolean);

    // Propagate manual admin edits across matching normalized titles/URLs
    const getNormTitle = t => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 45);
    const getNormUrl = u => (u || '').toLowerCase().split('?')[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

    const editedReferences = new Map();
    validatedCandidates.forEach(e => {
      if (e.edited === true || e.edited === 'true') {
        const tk = getNormTitle(e.title);
        const uk = getNormUrl(e.url);
        if (tk) editedReferences.set(tk, e);
        if (uk) editedReferences.set(uk, e);
      }
    });

    validatedCandidates.forEach(e => {
      const ref = editedReferences.get(getNormTitle(e.title)) || editedReferences.get(getNormUrl(e.url));
      if (ref && ref !== e) {
        e.location = ref.location;
        e.lat = ref.lat;
        e.lon = ref.lon;
        e.category = ref.category;
        e.severity = ref.severity;
        e.edited = true;
      }
    });

    // Sort newest first (keeping manually edited / pinned items well-represented)
    validatedCandidates.sort((a, b) => {
      const ta = parseEventDate(a.original_post_time || a.timestamp);
      const tb = parseEventDate(b.original_post_time || b.timestamp);
      return tb - ta;
    });

    // Deduplicate by URL, normalized title, and 60% Jaccard fuzzy similarity + 21-day recency window
    const deduplicated = [];
    const maxAgeMs = 21 * 24 * 60 * 60 * 1000;

    for (const e of validatedCandidates) {
      const isPinned = e.details?.isPinned === true || e.details?.laws_disarmament === true || e.edited === true;
      const eventTime = parseEventDate(e.original_post_time || e.timestamp || e.created_at);
      if (!isPinned && eventTime > 0 && now - eventTime > maxAgeMs) {
        continue;
      }

      const urlNorm = getNormUrl(e.url);
      const titleNorm = getNormTitle(e.title);

      let dupIdx = -1;
      for (let i = 0; i < deduplicated.length; i++) {
        const acc = deduplicated[i];
        if (urlNorm && urlNorm === getNormUrl(acc.url)) {
          dupIdx = i;
          break;
        }
        if (titleNorm && titleNorm === getNormTitle(acc.title)) {
          dupIdx = i;
          break;
        }
        if (calculateTitleFuzzySimilarity(e.title, acc.title) >= 0.6) {
          dupIdx = i;
          break;
        }
      }

      if (dupIdx !== -1) {
        const acc = deduplicated[dupIdx];
        if ((e.edited || e.details?.isPinned) && !(acc.edited || acc.details?.isPinned)) {
          deduplicated[dupIdx] = e;
        }
        continue;
      }

      deduplicated.push(e);
    }

    // Apply deterministic, land-safe golden-angle dispersion & cap automated hub density (max 4 per city)
    const dispersedEvents = disperseCoLocatedEvents(deduplicated, 4).slice(0, 120);

    // Build cleanly matched markers
    const curatedMarkers = CURATED_STATIC_MARKERS
      .filter(m => !isEventArchived(m, archivedInfo))
      .map(m => ({ ...m, count: 1 }));

    const dbMarkers = dispersedEvents.map(e => ({
      id: `db-${e.id}`,
      lat: e.lat,
      lon: e.lon,
      name: e.title,
      title: e.title,
      category: e.category,
      severity: e.severity,
      url: e.url,
      location: e.location,
      source: e.source,
      timestamp: e.original_post_time || e.timestamp,
      edited: e.edited || false,
      details: e.details,
      count: 1
    }));

    const seenNames = new Set();
    const finalMarkers = [];
    for (const m of [...dbMarkers, ...curatedMarkers]) {
      const nk = getNormTitle(m.name || m.title);
      if (nk && seenNames.has(nk)) continue;
      if (nk) seenNames.add(nk);
      finalMarkers.push(m);
    }

    const responseData = {
      markers: finalMarkers.slice(0, 120),
      events: dispersedEvents,
      lastUpdated: new Date().toISOString(),
      status: 'success'
    };

    setRouteCache(ts, { time: now, data: responseData });
    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err) {
    console.error('API GET ERROR:', err);
    return NextResponse.json({ markers: [], events: [], status: 'error', error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ') || auth.split(' ')[1] !== process.env.DASHBOARD_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const incoming = body.events || [];
    if (incoming.length === 0) return NextResponse.json({ message: 'No events' });

    if (!isDbInitialized) {
      await initDb();
      isDbInitialized = true;
    }

    const formatted = incoming
      .map(e => {
        const cls = classifyTechPolicySignal(e.title || '', e.details?.summary || '', 'vault');
        const geo = geocodeText(e.title || '', e.details?.summary || '', 'vault');
        return {
          id: e.id || generateHashId(e.url, e.title),
          title: e.title,
          url: e.url,
          source: e.source || 'Vault',
          timestamp: e.timestamp || new Date().toISOString(),
          original_post_time: e.original_post_time || e.timestamp || new Date().toISOString(),
          category: e.category || cls.category,
          severity: e.severity || cls.severity,
          location: e.location || (geo.hasExplicitLocation ? geo.name : 'Global'),
          lat: e.lat ?? geo.lat,
          lon: e.lon ?? geo.lon,
          details: e.details || {}
        };
      })
      .filter(e => e.lat !== null && e.lon !== null);

    await saveEvents(formatted);
    clearRouteCache();
    return NextResponse.json({ message: 'Success', count: formatted.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
