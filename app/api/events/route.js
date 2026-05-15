import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 30000;
let cache = {};
let dbInitialized = false;

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)%20sourcelang:english&mode=artlist&maxrecords=250&format=json";
const GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo?query=(artificial%20intelligence%20OR%20autonomous%20weapons%20OR%20drone%20OR%20%22military%20ai%22%20OR%20surveillance%20OR%20%22state%20violations%22)&format=GeoJSON&maxpoints=500";

const CAT_KEYWORDS = {
  Conflict: /strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airstrike|explosion|clash|warfare|assault|targeting/i,
  Humanitarian: /humanitarian|refugee|aid|famine|hunger|displacement|crisis|civilian|casualties|victims|rescue|relief/i,
  Disaster: /disaster|earthquake|flood|tsunami|hurricane|wildfire|storm|cyclone|accident/i,
  Economic: /economic|trade|sanction|tariff|oil|energy|market|finance|invest|contract|billion|funding/i,
};

function categorize(text) {
  for (const [cat, re] of Object.entries(CAT_KEYWORDS)) {
    if (re.test(text)) return cat;
  }
  return 'Political';
}

function scoreSeverity(text) {
  const t = text.toLowerCase();
  if (/critical|emergency|urgent|massacre|genocide|nuclear|world war/i.test(t)) return 5;
  if (/severe|major|death|killed|destroyed|outbreak/i.test(t)) return 4;
  if (/alert|warning|clash|violation|threat/i.test(t)) return 3;
  if (/significant|important|update|report/i.test(t)) return 2;
  return 1;
}

function verifyQuality(text) {
  const t = text.toLowerCase();
  let score = 1;
  if (/report|investigation|exclusive|analysis|violation|human rights|ethics/i.test(t)) score += 2;
  if (CAT_KEYWORDS.Conflict.test(t)) score += 1;
  return score;
}

function generateId(url, title) {
  return crypto.createHash('md5').update(url || title || Math.random().toString()).digest('hex');
}

const CURATED_INTEL = [
  { lat: 31.5, lon: 34.5, name: 'IDF Lavender AI targeting system deployment — algorithmic kill chain active in Gaza', category: 'Conflict', severity: 5, tag: 'CRITICAL', source: '+972 Magazine', url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/', image: 'https://www.972mag.com/wp-content/uploads/2024/04/F210519YS31-1200x800.jpg' },
  { lat: 31.8, lon: 35.2, name: 'Red Wolf biometric surveillance network — facial recognition checkpoints active in Hebron', category: 'Conflict', severity: 4, tag: 'ALERT', source: 'Amnesty International', url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/', image: 'https://www.amnesty.org/en/wp-content/uploads/2023/04/Opt_Israel_Apartheid_Facial_Recognition_1920x1080-1024x576.jpg' },
  { lat: 33.9, lon: 35.5, name: 'Israeli drone strikes on southern Lebanon — autonomous targeting "Where is Daddy" system suspected', category: 'Conflict', severity: 4, tag: 'CRITICAL', source: 'The Guardian', url: 'https://www.theguardian.com/world/2024/apr/03/israel-gaza-ai-database-hode-daddy', image: 'https://i.guim.co.uk/img/media/b694b22c7a7266d691136c1e3093b13284f1f516/0_142_4256_2554/master/4256.jpg?width=1200&quality=85&auto=format&fit=max&s=8a5f0df28a7e704b2b0cfb0e9c60e336' },
  { lat: 59.3, lon: 18.0, name: 'SIPRI annual report: global LAWS development surging', category: 'Political', severity: 2, tag: 'NEW', source: 'SIPRI', url: 'https://www.sipri.org/media/press-release/2023/ai-and-autonomous-weapons', image: 'https://www.sipri.org/sites/default/files/styles/1200x628/public/2023-05/AI%20and%20AWS.jpg' },
  { lat: 39.9, lon: 116.4, name: 'IJOP integrated surveillance platform — Xinjiang autonomous monitoring', category: 'Humanitarian', severity: 5, tag: 'CRITICAL', source: 'Human Rights Watch', url: 'https://www.hrw.org/report/2019/05/01/chinas-algorithms-repression/reverse-engineering-xinjiang-police-mass', image: 'https://www.hrw.org/sites/default/files/styles/1200x628/public/multimedia_images_2019/201905asia_china_ijop_promo.jpg' },
  { lat: 34.0, lon: -118.2, name: 'Predictive policing algorithm flagged by ACLU — Chicago PD audit', category: 'Humanitarian', severity: 3, tag: 'ALERT', source: 'ACLU', url: 'https://www.aclu.org/news/privacy-technology/predictive-policing-algorithms-racist', image: 'https://www.aclu.org/wp-content/uploads/2019/12/2019-12-05-predictive-policing-1200x628.jpg' }
];

async function fetchGDELT(timespan) {
  let markers = [];
  let events = [];
  
  try {
    const [geoRes, docRes] = await Promise.all([
      fetch(GDELT_GEO_API).catch(() => null),
      fetch(GDELT_DOC_API).catch(() => null)
    ]);

    if (geoRes?.ok) {
      const geo = await geoRes.json();
      markers = (geo.features || []).map(f => {
        const p = f.properties || {};
        const name = (p.name || p.html || 'Signal').replace(/<[^>]*>/g, '').slice(0, 150);
        return {
          id: generateId(p.url, name),
          lat: f.geometry?.coordinates?.[1],
          lon: f.geometry?.coordinates?.[0],
          name: name,
          category: categorize(name),
          severity: scoreSeverity(name),
          url: p.url || null,
          count: p.count || 1
        };
      }).filter(m => m.lat && m.lon);
    }

    if (docRes?.ok) {
      const doc = await docRes.json();
      events = (doc.articles || []).map(a => {
        let ts = a.seendate || new Date().toISOString();
        if (typeof ts === 'string' && /^\d{14}$/.test(ts)) {
          ts = ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
        }
        return {
          id: generateId(a.url, a.title),
          title: a.title || 'Untitled Signal',
          url: a.url,
          source: a.domain || 'OSINT',
          timestamp: ts,
          category: categorize(a.title || ''),
          severity: scoreSeverity(a.title || ''),
          quality: verifyQuality(a.title || ''),
          location: a.sourcecountry || 'Global',
          details: { ...a }
        };
      }).filter(e => e.quality > 1);
    }
  } catch (err) {
    console.error('GDELT Fetch Error:', err);
  }
  
  return { markers, events };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timespan = searchParams.get('timespan') || '24h';
    const now = Date.now();

    if (!dbInitialized) {
      await initDb();
      dbInitialized = true;
    }

    if (cache[timespan] && now - cache[timespan].time < CACHE_TTL) {
      return NextResponse.json(cache[timespan].data);
    }

    const gdelt = await fetchGDELT(timespan);
    const dbEvents = await getEvents(timespan);

    // Deduplicate and merge events
    const eventMap = new Map();
    dbEvents.forEach(e => eventMap.set(e.id, e));
    gdelt.events.forEach(e => eventMap.set(e.id, e));

    const allEvents = Array.from(eventMap.values()).sort((a, b) => {
      const isA = a.source?.includes('Vault') || a.source?.includes('OCHA') || a.source?.includes('HRW');
      const isB = b.source?.includes('Vault') || b.source?.includes('OCHA') || b.source?.includes('HRW');
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Create markers for map (Curated + GDELT + DB Events with coords)
    const curatedMarkers = CURATED_INTEL.map((m, i) => ({ ...m, id: `curated-${i}`, count: 1 }));
    const dbMarkers = allEvents.filter(e => e.lat && e.lon).map(e => ({
      id: `db-${e.id}`, lat: e.lat, lon: e.lon, name: e.title,
      category: e.category, severity: e.severity, url: e.url, count: 1
    }));

    const allMarkers = [...gdelt.markers, ...curatedMarkers, ...dbMarkers];

    const result = {
      markers: allMarkers.slice(0, 500),
      events: allEvents.slice(0, 150),
      lastUpdated: new Date().toISOString()
    };

    cache[timespan] = { time: now, data: result };
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ markers: [], events: [], status: 'error', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.DASHBOARD_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const events = data.events || [];
    if (events.length === 0) return NextResponse.json({ message: 'No data' });

    if (!dbInitialized) { await initDb(); dbInitialized = true; }

    const formatted = events.map(e => ({
      id: e.id || generateId(e.url, e.title),
      title: e.title, url: e.url, source: e.source || 'Vault',
      timestamp: e.timestamp || new Date().toISOString(),
      category: e.category || categorize(e.title),
      severity: e.severity || scoreSeverity(e.title),
      lat: e.lat || null, lon: e.lon || null,
      details: e.details || {}
    }));

    await saveEvents(formatted);
    cache = {}; // Reset cache
    return NextResponse.json({ message: 'Success', count: formatted.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
