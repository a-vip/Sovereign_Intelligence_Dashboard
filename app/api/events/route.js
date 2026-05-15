import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_EXPIRY = 30000;
let routeCache = {};
let isDbInitialized = false;

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)%20sourcelang:english&mode=artlist&maxrecords=250&format=json";
const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)&format=GeoJSON&maxpoints=500";

const CAT_KEYWORDS = {
  Conflict: /strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airstrike|explosion|clash|warfare|assault|targeting/i,
  Humanitarian: /humanitarian|refugee|aid|famine|hunger|displacement|crisis|civilian|casualties|victims|rescue|relief/i,
  Disaster: /disaster|earthquake|flood|tsunami|hurricane|wildfire|storm|cyclone|accident/i,
  Economic: /economic|trade|sanction|tariff|oil|energy|market|finance|invest|contract|billion|funding/i,
};

function getCategory(text) {
  const t = text || '';
  for (const [cat, re] of Object.entries(CAT_KEYWORDS)) {
    if (re.test(t)) return cat;
  }
  return 'Political';
}

function getSeverity(text) {
  const t = (text || '').toLowerCase();
  if (/critical|emergency|urgent|massacre|genocide|nuclear|world war/i.test(t)) return 5;
  if (/severe|major|death|killed|destroyed|outbreak/i.test(t)) return 4;
  if (/alert|warning|clash|violation|threat/i.test(t)) return 3;
  if (/significant|important|update|report/i.test(t)) return 2;
  return 1;
}

function getQuality(text) {
  const t = (text || '').toLowerCase();
  let q = 1;
  if (/report|investigation|exclusive|analysis|violation|human rights|ethics/i.test(t)) q += 2;
  if (CAT_KEYWORDS.Conflict.test(t)) q += 1;
  return q;
}

function generateHashId(url, title) {
  const seed = url || title || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}

const CURATED_STATIC_MARKERS = [
  { lat: 31.5, lon: 34.5, name: 'IDF Lavender AI targeting system deployment', category: 'Conflict', severity: 5, tag: 'CRITICAL', source: '+972 Magazine', url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/' },
  { lat: 31.8, lon: 35.2, name: 'Red Wolf biometric surveillance network', category: 'Conflict', severity: 4, tag: 'ALERT', source: 'Amnesty International', url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/' },
  { lat: 59.3, lon: 18.0, name: 'SIPRI annual report: global LAWS development surging', category: 'Political', severity: 2, tag: 'NEW', source: 'SIPRI', url: 'https://www.sipri.org/media/press-release/2023/ai-and-autonomous-weapons' }
];

async function fetchGdelt(timespan) {
  let mks = [];
  let evs = [];
  try {
    const [geoRes, docRes] = await Promise.all([
      fetch(GDELT_GEO_API).catch(() => null),
      fetch(GDELT_DOC_API).catch(() => null)
    ]);
    if (geoRes?.ok) {
      const geo = await geoRes.json();
      mks = (geo.features || []).map(f => {
        const p = f.properties || {};
        const n = (p.name || p.html || 'Signal').replace(/<[^>]*>/g, '').slice(0, 150);
        return {
          id: generateHashId(p.url, n),
          lat: f.geometry?.coordinates?.[1],
          lon: f.geometry?.coordinates?.[0],
          name: n,
          category: getCategory(n),
          severity: getSeverity(n),
          url: p.url || null,
          count: p.count || 1
        };
      }).filter(m => m.lat && m.lon);
    }
    if (docRes?.ok) {
      const doc = await docRes.json();
      evs = (doc.articles || []).map(a => {
        let ts = a.seendate || new Date().toISOString();
        if (typeof ts === 'string' && /^\d{14}$/.test(ts)) {
          ts = ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
        }
        return {
          id: generateHashId(a.url, a.title),
          title: a.title || 'Untitled Signal',
          url: a.url,
          source: a.domain || 'OSINT',
          timestamp: ts,
          category: getCategory(a.title),
          severity: getSeverity(a.title),
          quality: getQuality(a.title),
          location: a.sourcecountry || 'Global',
          details: { ...a }
        };
      }).filter(e => e.quality > 1);
    }
  } catch (err) { console.error('GDELT Fetch Err:', err); }
  return { mks, evs };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ts = searchParams.get('timespan') || '24h';
    const now = Date.now();

    if (!isDbInitialized) {
      await initDb();
      isDbInitialized = true;
    }

    if (routeCache[ts] && now - routeCache[ts].time < CACHE_EXPIRY) {
      return NextResponse.json(routeCache[ts].data, { 
        headers: { 'Cache-Control': 'no-store, max-age=0' } 
      });
    }

    const { mks, evs } = await fetchGdelt(ts);
    const dbEventsList = await getEvents(ts);

    // Merge Events
    const eventMap = new Map();
    dbEventsList.forEach(e => eventMap.set(e.id, e));
    evs.forEach(e => eventMap.set(e.id, e));

    const allEvents = Array.from(eventMap.values()).sort((a, b) => {
      const isA = a.source?.includes('Vault') || a.source?.includes('OCHA') || a.source?.includes('HRW');
      const isB = b.source?.includes('Vault') || b.source?.includes('OCHA') || b.source?.includes('HRW');
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Markers
    const curated = CURATED_STATIC_MARKERS.map((m, i) => ({ ...m, id: `curated-${i}`, count: 1 }));
    const dbMarkers = allEvents.filter(e => e.lat && e.lon).map(e => ({
      id: `db-${e.id}`, lat: e.lat, lon: e.lon, name: e.title,
      category: e.category, severity: e.severity, url: e.url, count: 1
    }));

    const finalMarkers = [...mks, ...curated, ...dbMarkers];

    const responseData = {
      markers: finalMarkers.slice(0, 500),
      events: allEvents.slice(0, 150),
      lastUpdated: new Date().toISOString(),
      status: 'success'
    };

    routeCache[ts] = { time: now, data: responseData };
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

    if (!isDbInitialized) { await initDb(); isDbInitialized = true; }

    const formatted = incoming.map(e => ({
      id: e.id || generateHashId(e.url, e.title),
      title: e.title, url: e.url, source: e.source || 'Vault',
      timestamp: e.timestamp || new Date().toISOString(),
      category: e.category || getCategory(e.title),
      severity: e.severity || getSeverity(e.title),
      lat: e.lat || null, lon: e.lon || null,
      details: e.details || {}
    }));

    await saveEvents(formatted);
    routeCache = {}; // Reset cache
    return NextResponse.json({ message: 'Success', count: formatted.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
