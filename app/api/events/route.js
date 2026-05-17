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
  
  // Expanded high-priority keyword scanner on both source/country and title
  if (t.includes('india') || c.includes('india') || c === 'in') return { lat: 20.5937, lon: 78.9629 };
  if (t.includes('ukraine') || c.includes('ukraine') || c === 'ua') return { lat: 48.3794, lon: 31.1656 };
  if (t.includes('israel') || t.includes('gaza') || t.includes('palestine') || c.includes('israel') || c === 'il' || c === 'ps') return { lat: 31.0461, lon: 34.8516 };
  if (t.includes('lebanon') || c.includes('lebanon') || c === 'lb') return { lat: 33.8547, lon: 35.8623 };
  if (t.includes('taiwan') || c.includes('taiwan')) return { lat: 23.6978, lon: 120.9605 };
  if (t.includes('yemen') || c.includes('yemen') || c === 'ye') return { lat: 15.5527, lon: 48.5164 };
  if (t.includes('syria') || c.includes('syria') || c === 'sy') return { lat: 34.8021, lon: 38.9968 };
  if (t.includes('iran') || c.includes('iran') || c === 'ir') return { lat: 32.4279, lon: 53.6880 };
  if (t.includes('china') || t.includes('beijing') || c.includes('china') || c === 'cn') return { lat: 35.8617, lon: 104.1954 };
  if (t.includes('russia') || t.includes('moscow') || c.includes('russia') || c === 'ru') return { lat: 61.5240, lon: 105.3188 };
  if (t.includes('usa') || t.includes('united states') || t.includes('washington') || c.includes('united states') || c === 'us') return { lat: 37.0902, lon: -95.7129 };
  if (t.includes('united kingdom') || t.includes('london') || t.includes(' britain') || c.includes('united kingdom') || c === 'uk' || c === 'gb') return { lat: 55.3781, lon: -3.4360 };
  if (t.includes('france') || t.includes('paris') || c.includes('france') || c === 'fr') return { lat: 46.2276, lon: 2.2137 };
  if (t.includes('germany') || t.includes('berlin') || c.includes('germany') || c === 'de') return { lat: 51.1657, lon: 10.4515 };
  if (t.includes('japan') || t.includes('tokyo') || c.includes('japan') || c === 'jp') return { lat: 36.2048, lon: 138.2529 };
  if (t.includes('canada') || t.includes('ottawa') || c.includes('canada') || c === 'ca') return { lat: 56.1304, lon: -106.3468 };
  if (t.includes('australia') || t.includes('canberra') || c.includes('australia') || c === 'au') return { lat: -25.2744, lon: 133.7751 };
  if (t.includes('brazil') || c.includes('brazil') || c === 'br') return { lat: -14.2350, lon: -51.9253 };
  if (t.includes('egypt') || t.includes('cairo') || c.includes('egypt') || c === 'eg') return { lat: 26.8206, lon: 30.8025 };
  if (t.includes('turkey') || t.includes('ankara') || c.includes('turkey') || c === 'tr') return { lat: 38.9637, lon: 35.2433 };
  if (t.includes('iraq') || t.includes('baghdad') || c.includes('iraq') || c === 'iq') return { lat: 33.2232, lon: 43.6793 };
  if (t.includes('saudi') || t.includes('riyadh') || c.includes('saudi') || c === 'sa') return { lat: 23.8859, lon: 45.0792 };
  if (t.includes('korea') || t.includes('pyongyang') || t.includes('seoul') || c.includes('korea')) return { lat: 38.0, lon: 127.5 };
  if (t.includes('libya') || c.includes('libya') || c === 'ly') return { lat: 26.3351, lon: 17.2283 };
  if (t.includes('venezuela') || c.includes('venezuela') || c === 've') return { lat: 6.4238, lon: -66.5897 };
  if (t.includes('tunisia') || c.includes('tunisia') || c === 'tn') return { lat: 33.8869, lon: 9.5375 };
  if (t.includes('chad') || c.includes('chad') || c === 'td') return { lat: 15.4542, lon: 18.7322 };
  if (t.includes('congo') || t.includes('drc') || c.includes('congo') || c === 'cd') return { lat: -4.0383, lon: 21.7587 };
  if (t.includes('south africa') || c.includes('south africa') || c === 'za') return { lat: -30.5595, lon: 22.9375 };
  if (t.includes('switzerland') || c.includes('switzerland') || c === 'ch') return { lat: 46.8182, lon: 8.2275 };
  if (t.includes('sweden') || c.includes('sweden') || c === 'se') return { lat: 60.1282, lon: 18.6435 };
  if (t.includes('norway') || c.includes('norway') || c === 'no') return { lat: 60.4720, lon: 8.4689 };
  if (t.includes('italy') || t.includes('rome') || c.includes('italy') || c === 'it') return { lat: 41.8719, lon: 12.5674 };
  if (t.includes('spain') || t.includes('madrid') || c.includes('spain') || c === 'es') return { lat: 40.4637, lon: -3.7492 };
  if (t.includes('mexico') || c.includes('mexico') || c === 'mx') return { lat: 23.6345, lon: -102.5528 };
  if (t.includes('pakistan') || c.includes('pakistan') || c === 'pk') return { lat: 30.3753, lon: 69.3451 };
  if (t.includes('afghanistan') || c.includes('afghanistan') || c === 'af') return { lat: 33.9391, lon: 67.7100 };
  if (t.includes('south china sea')) return { lat: 12.0, lon: 113.0 };
  if (t.includes('europe') || t.includes('eu') || t.includes('brussels')) return { lat: 50.8503, lon: 4.3517 };
  
  const countryCoords = {
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
    iq: { lat: 33.2232, lon: 43.6793 }
  };

  const coords = countryCoords[c];
  if (coords) {
    const jitterLat = (Math.random() - 0.5) * 1.5;
    const jitterLon = (Math.random() - 0.5) * 1.5;
    return {
      lat: coords.lat + jitterLat,
      lon: coords.lon + jitterLon
    };
  }

  // Purely landmass-based fallback coordinates (15 distinct locations)
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
    { lat: -25.2744, lon: 133.7751 }, // Australia (Interior)
    { lat: 61.5240, lon: 105.3188 },  // Northern Asia (Siberia)
    { lat: 15.8700, lon: 100.9925 }   // Southeast Asia (Thailand)
  ];

  // Pick a random landmass base to completely prevent ocean placement
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
