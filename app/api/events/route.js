import { NextResponse } from 'next/server';
import { initDb, saveEvents, getEvents } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

function getCountryCoords(country, title = '') {
  const c = (country || '').toLowerCase().trim();
  const t = (title || '').toLowerCase();
  
  // High-priority extraction from title text
  if (t.includes('india')) return { lat: 20.5937, lon: 78.9629 };
  if (t.includes('ukraine')) return { lat: 48.3794, lon: 31.1656 };
  if (t.includes('israel') || t.includes('gaza') || t.includes('palestine')) return { lat: 31.0461, lon: 34.8516 };
  if (t.includes('lebanon')) return { lat: 33.8547, lon: 35.8623 };
  if (t.includes('chad')) return { lat: 15.4542, lon: 18.7322 };
  if (t.includes('congo') || t.includes('drc')) return { lat: -4.0383, lon: 21.7587 };
  if (t.includes('libya')) return { lat: 26.3351, lon: 17.2283 };
  if (t.includes('venezuela')) return { lat: 6.4238, lon: -66.5897 };
  if (t.includes('tunisia')) return { lat: 33.8869, lon: 9.5375 };
  if (t.includes('taiwan')) return { lat: 23.6978, lon: 120.9605 };
  if (t.includes('yemen')) return { lat: 15.5527, lon: 48.5164 };
  if (t.includes('syria')) return { lat: 34.8021, lon: 38.9968 };
  if (t.includes('iran')) return { lat: 32.4279, lon: 53.6880 };

  const countryCoords = {
    // Country codes
    us: { lat: 37.0902, lon: -95.7129 },
    usa: { lat: 37.0902, lon: -95.7129 },
    in: { lat: 20.5937, lon: 78.9629 },
    nz: { lat: -40.9006, lon: 174.8860 },
    cn: { lat: 35.8617, lon: 104.1954 },
    ru: { lat: 61.5240, lon: 105.3188 },
    uk: { lat: 55.3781, lon: -3.4360 },
    gb: { lat: 55.3781, lon: -3.4360 },
    fr: { lat: 46.2276, lon: 2.2137 },
    de: { lat: 51.1657, lon: 10.4515 },
    jp: { lat: 36.2048, lon: 138.2529 },
    ca: { lat: 56.1304, lon: -106.3468 },
    au: { lat: -25.2744, lon: 133.7751 },
    br: { lat: -14.2350, lon: -51.9253 },
    il: { lat: 31.0461, lon: 34.8516 },
    ps: { lat: 31.9522, lon: 35.2332 },
    lb: { lat: 33.8547, lon: 35.8623 },
    td: { lat: 15.4542, lon: 18.7322 },
    cd: { lat: -4.0383, lon: 21.7587 },
    ly: { lat: 26.3351, lon: 17.2283 },
    ve: { lat: 6.4238, lon: -66.5897 },
    tn: { lat: 33.8869, lon: 9.5375 },
    ch: { lat: 46.8182, lon: 8.2275 },
    ua: { lat: 48.3794, lon: 31.1656 },
    sa: { lat: 23.8859, lon: 45.0792 },
    kw: { lat: 29.3117, lon: 47.4818 },
    ir: { lat: 32.4279, lon: 53.6880 },
    ye: { lat: 15.5527, lon: 48.5164 },
    sy: { lat: 34.8021, lon: 38.9968 },
    za: { lat: -30.5595, lon: 22.9375 },
    tr: { lat: 38.9637, lon: 35.2433 },
    eg: { lat: 26.8206, lon: 30.8025 },
    iq: { lat: 33.2232, lon: 43.6793 },

    // Full names
    'united states': { lat: 37.0902, lon: -95.7129 },
    'india': { lat: 20.5937, lon: 78.9629 },
    'new zealand': { lat: -40.9006, lon: 174.8860 },
    'china': { lat: 35.8617, lon: 104.1954 },
    'russia': { lat: 61.5240, lon: 105.3188 },
    'united kingdom': { lat: 55.3781, lon: -3.4360 },
    'france': { lat: 46.2276, lon: 2.2137 },
    'germany': { lat: 51.1657, lon: 10.4515 },
    'japan': { lat: 36.2048, lon: 138.2529 },
    'canada': { lat: 56.1304, lon: -106.3468 },
    'australia': { lat: -25.2744, lon: 133.7751 },
    'brazil': { lat: -14.2350, lon: -51.9253 },
    'israel': { lat: 31.0461, lon: 34.8516 },
    'palestine': { lat: 31.9522, lon: 35.2332 },
    'lebanon': { lat: 33.8547, lon: 35.8623 },
    'chad': { lat: 15.4542, lon: 18.7322 },
    'democratic republic of congo': { lat: -4.0383, lon: 21.7587 },
    'dr congo': { lat: -4.0383, lon: 21.7587 },
    'libya': { lat: 26.3351, lon: 17.2283 },
    'venezuela': { lat: 6.4238, lon: -66.5897 },
    'tunisia': { lat: 33.8869, lon: 9.5375 },
    'switzerland': { lat: 46.8182, lon: 8.2275 },
    'ukraine': { lat: 48.3794, lon: 31.1656 },
    'saudi arabia': { lat: 23.8859, lon: 45.0792 },
    'kuwait': { lat: 29.3117, lon: 47.4818 },
    'iran': { lat: 32.4279, lon: 53.6880 },
    'yemen': { lat: 15.5527, lon: 48.5164 },
    'syria': { lat: 34.8021, lon: 38.9968 },
    'south africa': { lat: -30.5595, lon: 22.9375 },
    'turkey': { lat: 38.9637, lon: 35.2433 },
    'egypt': { lat: 26.8206, lon: 30.8025 },
    'iraq': { lat: 33.2232, lon: 43.6793 }
  };

  const coords = countryCoords[c];
  if (coords) {
    // Add small random jitter so markers in same country don't overlap completely
    const jitterLat = (Math.random() - 0.5) * 1.5;
    const jitterLon = (Math.random() - 0.5) * 1.5;
    return {
      lat: coords.lat + jitterLat,
      lon: coords.lon + jitterLon
    };
  }

  // Fallback to random global location for unmatched or global events
  const jitterLat = (Math.random() - 0.5) * 75;
  const jitterLon = (Math.random() - 0.5) * 220;
  return { lat: 15 + jitterLat, lon: jitterLon };
}

function parseLocalRadarDossiers() {
  const dossierDir = "C:\\AI_Workspace\\Obsidian\\Avi\\Automated_Intel_Dossiers\\🗞️_Daily_Radar";
  const events = [];
  
  try {
    if (!fs.existsSync(dossierDir)) return events;
    const files = fs.readdirSync(dossierDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = path.join(dossierDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      
      const sections = raw.split(/#### 🔴 /);
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        const title = lines[0].trim();
        
        let source = 'OSINT';
        let published = new Date().toISOString();
        let link = '';
        let summary = '';
        
        for (const line of lines) {
          const l = line.trim();
          if (l.startsWith('* **Source:**')) {
            source = l.replace(/^\*\s*\*\*Source:\*\*\s*/i, '').trim();
          } else if (l.startsWith('* **Published:**')) {
            published = l.replace(/^\*\s*\*\*Published:\*\*\s*/i, '').trim();
          } else if (l.startsWith('* **Link:**')) {
            const match = l.match(/\((https?:\/\/[^\s)]+)\)/);
            if (match) link = match[1];
            else link = l.replace(/^\*\s*\*\*Link:\*\*\s*/i, '').trim();
          } else if (l.startsWith('* **Brief Summary:**')) {
            summary = l.replace(/^\*\s*\*\*Brief Summary:\*\*\s*/i, '').trim();
          }
        }
        
        const coords = getCountryCoords(source || 'Global', title);
        
        events.push({
          id: generateHashId(link, title),
          title,
          url: link,
          source: source || 'OSINT',
          timestamp: published,
          category: getCategory(title),
          severity: getSeverity(title),
          quality: getQuality(title),
          location: source || 'Global',
          lat: coords ? coords.lat : null,
          lon: coords ? coords.lon : null,
          details: { summary }
        });
      }
    }
  } catch (err) {
    console.error('Error parsing local radar dossiers:', err);
  }
  return events;
}

function loadStaticEvents() {
  const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
  try {
    if (fs.existsSync(staticPath)) {
      const data = fs.readFileSync(staticPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading static events:', err);
  }
  return [];
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
        const locationName = a.sourcecountry || 'Global';
        const coords = getCountryCoords(locationName, a.title);
        return {
          id: generateHashId(a.url, a.title),
          title: a.title || 'Untitled Signal',
          url: a.url,
          source: a.domain || 'OSINT',
          timestamp: ts,
          category: getCategory(a.title),
          severity: getSeverity(a.title),
          quality: getQuality(a.title),
          location: locationName,
          lat: coords ? coords.lat : null,
          lon: coords ? coords.lon : null,
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
    const staticEvents = loadStaticEvents();

    let finalEventsList = [...dbEventsList, ...staticEvents];
    if (finalEventsList.length === 0 && evs.length === 0) {
      console.log('No online, database, or static events found. Trying local dossiers...');
      finalEventsList = parseLocalRadarDossiers();
    }

    // Merge Events
    const eventMap = new Map();
    finalEventsList.forEach(e => eventMap.set(e.id, e));
    evs.forEach(e => eventMap.set(e.id, e));

    const allEvents = Array.from(eventMap.values()).sort((a, b) => {
      const isA = a.source?.includes('Vault') || a.source?.includes('OCHA') || a.source?.includes('HRW');
      const isB = b.source?.includes('Vault') || b.source?.includes('OCHA') || b.source?.includes('HRW');
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Assign coordinates to database events or fetched articles that lack them
    allEvents.forEach(e => {
      if (!e.lat || !e.lon) {
        const coords = getCountryCoords(e.location || 'Global', e.title);
        if (coords) {
          e.lat = coords.lat;
          e.lon = coords.lon;
        }
      }
    });

    // Markers
    const curated = CURATED_STATIC_MARKERS.map((m, i) => ({ ...m, id: `curated-${i}`, count: 1 }));
    const dbMarkers = allEvents.filter(e => e.lat && e.lon).map(e => ({
      id: `db-${e.id}`, lat: e.lat, lon: e.lon, name: e.title,
      category: e.category, severity: e.severity, url: e.url, count: 1
    }));

    const finalMarkers = [...mks, ...curated, ...dbMarkers];

    const responseData = {
      markers: finalMarkers.slice(0, 1000),
      events: allEvents.slice(0, 1000),
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
