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
  Disaster: /disaster|earthquake|flood|tsunami|hurricane|wildfire|storm|cyclone|accident|tremor|quake|eruption|seismic/i,
  Economic: /economic|trade|sanction|tariff|oil|energy|market|finance|invest|contract|billion|funding|gdp|inflation|rates|commerce/i,
  Surveillance: /surveillance|palantir|ice|nest|dhs|facial recognition|biometric|tracking|border control|police tech|cia|fbi|nsa|monitoring|spying|espionage/i,
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
  
  // 1. Specific Surveillance & US agencies context-mapping (Palantir, ICE, NEST, DHS, FBI, CIA, NSA)
  if (
    t.includes('palantir') || 
    t.includes(' ice ') || 
    t.includes('nest') || 
    t.includes('dhs') || 
    t.includes('nsa') || 
    t.includes('cia') || 
    t.includes('fbi') || 
    t.includes('pentagon') || 
    t.includes('silicon valley') || 
    t.includes('google cloud') || 
    t.includes('microsoft') || 
    t.includes('amazon aws')
  ) {
    return { 
      lat: 37.0902 + (Math.random() - 0.5) * 2.0, 
      lon: -95.7129 + (Math.random() - 0.5) * 2.0 
    };
  }
  
  // 2. Specific geopolitical hotzones & country keyword scanner
  if (t.includes('ukraine') || t.includes('kiev') || t.includes('kyiv') || c === 'ua') return { lat: 48.3794, lon: 31.1656 };
  if (t.includes('israel') || t.includes('gaza') || t.includes('palestine') || t.includes('tel aviv') || t.includes('west bank') || c === 'il' || c === 'ps') return { lat: 31.0461, lon: 34.8516 };
  if (t.includes('taiwan') || t.includes('taipei')) return { lat: 23.6978, lon: 120.9605 };
  if (t.includes('yemen') || t.includes('sanaa') || c === 'ye') return { lat: 15.5527, lon: 48.5164 };
  if (t.includes('syria') || t.includes('damascus') || c === 'sy') return { lat: 34.8021, lon: 38.9968 };
  if (t.includes('iran') || t.includes('tehran') || c === 'ir') return { lat: 32.4279, lon: 53.6880 };
  if (t.includes('lebanon') || t.includes('beirut') || c === 'lb') return { lat: 33.8547, lon: 35.8623 };
  if (t.includes('iraq') || t.includes('baghdad') || c === 'iq') return { lat: 33.2232, lon: 43.6793 };
  if (t.includes('saudi') || t.includes('riyadh') || c === 'sa') return { lat: 23.8859, lon: 45.0792 };
  if (t.includes('korea') || t.includes('seoul') || t.includes('pyongyang') || c === 'kr' || c === 'kp') return { lat: 38.0, lon: 127.5 };
  if (t.includes('china') || t.includes('beijing') || t.includes('shanghai') || c === 'cn') return { lat: 35.8617, lon: 104.1954 };
  if (t.includes('russia') || t.includes('moscow') || t.includes('kremlin') || c === 'ru') return { lat: 61.5240, lon: 105.3188 };
  if (t.includes('india') || t.includes('delhi') || t.includes('mumbai') || c === 'in') return { lat: 20.5937, lon: 78.9629 };
  if (t.includes('chad') || c === 'td') return { lat: 15.4542, lon: 18.7322 };
  if (t.includes('congo') || t.includes('drc') || t.includes('kinshasa') || c === 'cd') return { lat: -4.0383, lon: 21.7587 };
  if (t.includes('libya') || t.includes('tripoli') || c === 'ly') return { lat: 26.3351, lon: 17.2283 };
  if (t.includes('venezuela') || t.includes('caracas') || c === 've') return { lat: 6.4238, lon: -66.5897 };
  if (t.includes('tunisia') || t.includes('tunis') || c === 'tn') return { lat: 33.8869, lon: 9.5375 };
  if (t.includes('south africa') || t.includes('johannesburg') || c === 'za') return { lat: -30.5595, lon: 22.9375 };
  
  // 3. Additional global countries keyword dictionary
  if (t.includes('france') || t.includes('paris') || c === 'fr') return { lat: 46.2276, lon: 2.2137 };
  if (t.includes('germany') || t.includes('berlin') || t.includes('munich') || c === 'de') return { lat: 51.1657, lon: 10.4515 };
  if (t.includes('united kingdom') || t.includes('london') || t.includes('britain') || t.includes('england') || c === 'uk' || c === 'gb') return { lat: 55.3781, lon: -3.4360 };
  if (t.includes('japan') || t.includes('tokyo') || c === 'jp') return { lat: 36.2048, lon: 138.2529 };
  if (t.includes('canada') || t.includes('ottawa') || t.includes('toronto') || c === 'ca') return { lat: 56.1304, lon: -106.3468 };
  if (t.includes('australia') || t.includes('canberra') || t.includes('sydney') || c === 'au') return { lat: -25.2744, lon: 133.7751 };
  if (t.includes('brazil') || t.includes('brasilia') || t.includes('rio') || c === 'br') return { lat: -14.2350, lon: -51.9253 };
  if (t.includes('egypt') || t.includes('cairo') || c === 'eg') return { lat: 26.8206, lon: 30.8025 };
  if (t.includes('turkey') || t.includes('istanbul') || t.includes('ankara') || c === 'tr') return { lat: 38.9637, lon: 35.2433 };
  if (t.includes('mexico') || c === 'mx') return { lat: 23.6345, lon: -102.5528 };
  if (t.includes('pakistan') || t.includes('islamabad') || c === 'pk') return { lat: 30.3753, lon: 69.3451 };
  if (t.includes('afghanistan') || t.includes('kabul') || c === 'af') return { lat: 33.9391, lon: 67.7100 };
  if (t.includes('switzerland') || t.includes('geneva') || c === 'ch') return { lat: 46.8182, lon: 8.2275 };
  if (t.includes('sweden') || t.includes('stockholm') || c === 'se') return { lat: 60.1282, lon: 18.6435 };
  if (t.includes('norway') || t.includes('oslo') || c === 'no') return { lat: 60.4720, lon: 8.4689 };
  if (t.includes('italy') || t.includes('rome') || c === 'it') return { lat: 41.8719, lon: 12.5674 };
  if (t.includes('spain') || t.includes('madrid') || c === 'es') return { lat: 40.4637, lon: -3.7492 };
  if (t.includes('philippines') || t.includes('manila') || c === 'ph') return { lat: 12.8797, lon: 121.7740 };
  if (t.includes('indonesia') || t.includes('jakarta') || c === 'id') return { lat: -0.7893, lon: 113.9213 };
  if (t.includes('colombia') || t.includes('bogota') || c === 'co') return { lat: 4.5709, lon: -72.9566 };
  if (t.includes('sudan') || t.includes('khartoum') || c === 'sd') return { lat: 12.8628, lon: 30.2176 };
  if (t.includes('somalia') || t.includes('mogadishu') || c === 'so') return { lat: 5.1521, lon: 46.1996 };
  if (t.includes('kenya') || t.includes('nairobi') || c === 'ke') return { lat: -1.2921, lon: 36.8219 };
  if (t.includes('nigeria') || t.includes('abuja') || c === 'ng') return { lat: 9.0820, lon: 8.6753 };
  if (t.includes('south china sea')) return { lat: 12.0, lon: 113.0 };
  if (t.includes('europe') || t.includes('eu') || t.includes('brussels')) return { lat: 50.8503, lon: 4.3517 };
  
  // 4. Source & context-aware smart fallback routing
  if (
    t.includes('surveillance') || 
    t.includes('security') || 
    c.includes('wired') || 
    c.includes('eff') || 
    c.includes('techworkers')
  ) {
    // Surveillance & US policy defaults to USA contextually
    return { 
      lat: 37.0902 + (Math.random() - 0.5) * 1.8, 
      lon: -95.7129 + (Math.random() - 0.5) * 1.8 
    };
  }
  if (
    c.includes('reliefweb') || 
    c.includes('human rights') || 
    c.includes('hrw') || 
    t.includes('humanitarian') || 
    t.includes('refugee')
  ) {
    // International human rights/aid defaults to Switzerland/Europe contextually
    return { 
      lat: 46.8182 + (Math.random() - 0.5) * 1.5, 
      lon: 8.2275 + (Math.random() - 0.5) * 1.5 
    };
  }

  // 5. Landmass fallbacks grid (15 locations) if absolutely no match can be made
  const LANDMASS_COORDS = [
    { lat: 39.8283, lon: -98.5795 },  // North America (US Center)
    { lat: 56.1304, lon: -106.3468 }, // Canada
    { lat: -14.2350, lon: -51.9253 }, // South America (Brazil)
    { lat: -35.6751, lon: -71.5430 }, // Chile/Argentina
    { lat: 48.3794, lon: 31.1656 },   // Eastern Europe (Ukraine)
    { lat: 46.2276, lon: 2.2137 },     // Western Europe (France)
    { lat: 9.0820, lon: 8.6753 },      // West Africa (Nigeria)
    { lat: -30.5595, lon: 22.9375 },  // South Africa
    { lat: 26.8206, lon: 30.8025 },   // North Africa (Egypt)
    { lat: 32.4279, lon: 53.6880 },   // Middle East (Iran)
    { lat: 20.5937, lon: 78.9629 },   // South Asia (India)
    { lat: 35.8617, lon: 104.1954 },  // East Asia (China)
    { lat: -25.2744, lon: 133.7751 }, // Australia
    { lat: 61.5240, lon: 105.3188 },  // Northern Asia (Siberia)
    { lat: 15.8700, lon: 100.9925 }   // Southeast Asia (Thailand)
  ];

  const base = LANDMASS_COORDS[Math.floor(Math.random() * LANDMASS_COORDS.length)];
  const jitterLat = (Math.random() - 0.5) * 3.5;
  const jitterLon = (Math.random() - 0.5) * 3.5;
  return {
    lat: base.lat + jitterLat,
    lon: base.lon + jitterLon
  };
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
