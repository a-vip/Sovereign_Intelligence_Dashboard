import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 30000;
let routeCache = {};
let isDbReady = false;

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

function createId(u, t) {
  const seed = u || t || Math.random().toString();
  return crypto.createHash('md5').update(seed).digest('hex');
}

const CURATED_MARKERS_SOURCE = [
  { lat: 31.5, lon: 34.5, name: 'IDF Lavender AI targeting system deployment', category: 'Conflict', severity: 5, tag: 'CRITICAL', source: '+972 Magazine', url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/' },
  { lat: 31.8, lon: 35.2, name: 'Red Wolf biometric surveillance network', category: 'Conflict', severity: 4, tag: 'ALERT', source: 'Amnesty International', url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/' },
  { lat: 59.3, lon: 18.0, name: 'SIPRI annual report: global LAWS development surging', category: 'Political', severity: 2, tag: 'NEW', source: 'SIPRI', url: 'https://www.sipri.org/media/press-release/2023/ai-and-autonomous-weapons' }
];

async function fetchGdeltData(timespan) {
  let gdeltMarkers = [];
  let gdeltEvents = [];
  
  try {
    const [geoRes, docRes] = await Promise.all([
      fetch(GDELT_GEO_API).catch(() => null),
      fetch(GDELT_DOC_API).catch(() => null)
    ]);

    if (geoRes && geoRes.ok) {
      const geo = await geoRes.json();
      const features = geo.features || [];
      gdeltMarkers = features.map(f => {
        const p = f.properties || {};
        const name = (p.name || p.html || 'Signal').replace(/<[^>]*>/g, '').slice(0, 150);
        return {
          id: createId(p.url, name),
          lat: f.geometry?.coordinates?.[1],
          lon: f.geometry?.coordinates?.[0],
          name: name,
          category: getCategory(name),
          severity: getSeverity(name),
          url: p.url || null,
          count: p.count || 1
        };
      }).filter(m => m.lat && m.lon);
    }

    if (docRes && docRes.ok) {
      const doc = await docRes.json();
      const articles = doc.articles || [];
      gdeltEvents = articles.map(a => {
        let ts = a.seendate || new Date().toISOString();
        if (typeof ts === 'string' && /^\d{14}$/.test(ts)) {
          ts = ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
        }
        return {
          id: createId(a.url, a.title),
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
  } catch (err) {
    console.error('GDELT Error:', err);
  }
  
  return { gdeltMarkers, gdeltEvents };
}

export async function GET(req) {
  try {
    const urlObj = new URL(req.url);
    const ts = urlObj.searchParams.get('timespan') || '24h';
    const currentTime = Date.now();

    if (!isDbReady) {
      await initDb();
      isDbReady = true;
    }

    if (routeCache[ts] && currentTime - routeCache[ts].time < CACHE_TTL) {
      return NextResponse.json(routeCache[ts].data);
    }

    const { gdeltMarkers, gdeltEvents } = await fetchGdeltData(ts);
    const dbEvents = await getEvents(ts);

    // Merge and Deduplicate
    const finalEventMap = new Map();
    dbEvents.forEach(e => finalEventMap.set(e.id, e));
    gdeltEvents.forEach(e => finalEventMap.set(e.id, e));

    const allEventsList = Array.from(finalEventMap.values()).sort((a, b) => {
      const isA = a.source?.includes('Vault') || a.source?.includes('OCHA') || a.source?.includes('HRW');
      const isB = b.source?.includes('Vault') || b.source?.includes('OCHA') || b.source?.includes('HRW');
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Markers
    const curatedList = CURATED_MARKERS_SOURCE.map((m, i) => ({ ...m, id: `curated-${i}`, count: 1 }));
    const dbMarkersList = allEventsList.filter(e => e.lat && e.lon).map(e => ({
      id: `db-${e.id}`, lat: e.lat, lon: e.lon, name: e.title,
      category: e.category, severity: e.severity, url: e.url, count: 1
    }));

    const finalMarkers = [...gdeltMarkers, ...curatedList, ...dbMarkersList];

    const finalResult = {
      markers: finalMarkers.slice(0, 500),
      events: allEventsList.slice(0, 150),
      lastUpdated: new Date().toISOString()
    };

    routeCache[ts] = { time: currentTime, data: finalResult };
    return NextResponse.json(finalResult);

  } catch (err) {
    console.error('GET API Error:', err);
    return NextResponse.json({ markers: [], events: [], status: 'error', error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ') || auth.split(' ')[1] !== process.env.DASHBOARD_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const incomingEvents = body.events || [];
    if (incomingEvents.length === 0) return NextResponse.json({ message: 'No events' });

    if (!isDbReady) { await initDb(); isDbReady = true; }

    const mapped = incomingEvents.map(e => ({
      id: e.id || createId(e.url, e.title),
      title: e.title, url: e.url, source: e.source || 'Vault',
      timestamp: e.timestamp || new Date().toISOString(),
      category: e.category || getCategory(e.title),
      severity: e.severity || getSeverity(e.title),
      lat: e.lat || null, lon: e.lon || null,
      details: e.details || {}
    }));

    await saveEvents(mapped);
    routeCache = {}; 
    return NextResponse.json({ message: 'Success', count: mapped.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
