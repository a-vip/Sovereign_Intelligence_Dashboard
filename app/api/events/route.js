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

function getDeterministicJitter(seedText, maxDegrees = 0.6) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jitterLat = ((hash & 0xFF) / 255.0 - 0.5) * maxDegrees;
  const jitterLon = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * maxDegrees;
  return { lat: jitterLat, lon: jitterLon };
}

function getCountryCoords(country, title = '') {
  const c = (country || '').toLowerCase().trim();
  const t = (title || '').toLowerCase();
  
  let baseCoords = null;
  let resolvedLocation = '';

  // 1. High-Fidelity City & Region Geolocation Scanner
  if (t.includes('gaza') || t.includes('rafah') || t.includes('khan younis')) {
    baseCoords = { lat: 31.35, lon: 34.30 };
    resolvedLocation = 'Gaza Strip';
  } else if (t.includes('jerusalem') || t.includes('ramallah') || t.includes('west bank')) {
    baseCoords = { lat: 31.7683, lon: 35.2137 };
    resolvedLocation = 'Jerusalem / West Bank';
  } else if (t.includes('tel aviv') || t.includes('haifa') || t.includes('ben gurion')) {
    baseCoords = { lat: 32.0853, lon: 34.7818 };
    resolvedLocation = 'Tel Aviv, Israel';
  } else if (t.includes('beirut') || t.includes('sidon') || t.includes('tyre')) {
    baseCoords = { lat: 33.8938, lon: 35.5018 };
    resolvedLocation = 'Beirut, Lebanon';
  } else if (t.includes('damascus') || t.includes('homs') || t.includes('latakia') || t.includes('syria')) {
    baseCoords = { lat: 34.8021, lon: 38.9968 };
    resolvedLocation = 'Damascus, Syria';
  } else if (t.includes('lebanon')) {
    baseCoords = { lat: 33.8547, lon: 35.8623 };
    resolvedLocation = 'Lebanon Region';
  } else if (t.includes('nicosia') || t.includes('limassol') || t.includes('cyprus')) {
    baseCoords = { lat: 35.1856, lon: 33.3823 };
    resolvedLocation = 'Nicosia, Cyprus';
  } else if (t.includes('kiev') || t.includes('kyiv')) {
    baseCoords = { lat: 50.4501, lon: 30.5234 };
    resolvedLocation = 'Kyiv, Ukraine';
  } else if (t.includes('kharkiv') || t.includes('kharkov')) {
    baseCoords = { lat: 49.9935, lon: 36.2304 };
    resolvedLocation = 'Kharkiv, Ukraine';
  } else if (t.includes('odesa') || t.includes('odessa')) {
    baseCoords = { lat: 46.4825, lon: 30.7233 };
    resolvedLocation = 'Odesa, Ukraine';
  } else if (t.includes('lviv')) {
    baseCoords = { lat: 49.8397, lon: 24.0297 };
    resolvedLocation = 'Lviv, Ukraine';
  } else if (t.includes('crimea') || t.includes('sevastopol')) {
    baseCoords = { lat: 44.9521, lon: 34.1024 };
    resolvedLocation = 'Crimea';
  } else if (t.includes('moscow') || t.includes('kremlin') || c === 'ru') {
    baseCoords = { lat: 55.7558, lon: 37.6173 };
    resolvedLocation = 'Moscow, Russia';
  } else if (t.includes('london') || t.includes('uk') || c === 'uk' || c === 'gb') {
    baseCoords = { lat: 51.5074, lon: -0.1278 };
    resolvedLocation = 'London, United Kingdom';
  } else if (t.includes('paris') || c === 'fr') {
    baseCoords = { lat: 48.8566, lon: 2.3522 };
    resolvedLocation = 'Paris, France';
  } else if (t.includes('berlin') || c === 'de') {
    baseCoords = { lat: 51.1657, lon: 10.4515 };
    resolvedLocation = 'Berlin, Germany';
  } else if (t.includes('silicon valley') || t.includes('san francisco') || t.includes('palantir') || t.includes('dhs')) {
    baseCoords = { lat: 37.7749, lon: -122.4194 };
    resolvedLocation = 'Silicon Valley, USA';
  } else if (t.includes('washington') || t.includes('pentagon') || t.includes('fbi') || t.includes('cia')) {
    baseCoords = { lat: 38.9072, lon: -77.0369 };
    resolvedLocation = 'Washington D.C., USA';
  } else if (t.includes('new york') || t.includes('manhattan')) {
    baseCoords = { lat: 40.7128, lon: -74.0060 };
    resolvedLocation = 'New York City, USA';
  } else if (t.includes('tokyo') || t.includes('japan') || c === 'jp') {
    baseCoords = { lat: 35.6762, lon: 139.6503 };
    resolvedLocation = 'Tokyo, Japan';
  } else if (t.includes('beijing') || t.includes('china') || c === 'cn') {
    baseCoords = { lat: 39.9042, lon: 116.4074 };
    resolvedLocation = 'Beijing, China';
  } else if (t.includes('taipei') || t.includes('taiwan')) {
    baseCoords = { lat: 25.0330, lon: 121.5654 };
    resolvedLocation = 'Taipei, Taiwan';
  } else if (t.includes('israel') || t.includes('gaza') || t.includes('palestine') || c === 'il' || c === 'ps') {
    baseCoords = { lat: 31.0461, lon: 34.8516 };
    resolvedLocation = 'Israel/Palestine';
  }

  // 2. Precise Country-Level Classifiers (if specific city not already scanned)
  if (!baseCoords) {
    if (t.includes('japan') || c === 'jp') { baseCoords = { lat: 36.2048, lon: 138.2529 }; resolvedLocation = 'Japan'; }
    else if (t.includes('germany') || c === 'de') { baseCoords = { lat: 51.1657, lon: 10.4515 }; resolvedLocation = 'Germany'; }
    else if (t.includes('france') || c === 'fr') { baseCoords = { lat: 46.2276, lon: 2.2137 }; resolvedLocation = 'France'; }
    else if (t.includes('united kingdom') || t.includes('britain') || c === 'uk' || c === 'gb') { baseCoords = { lat: 55.3781, lon: -3.4360 }; resolvedLocation = 'United Kingdom'; }
    else if (t.includes('canada') || c === 'ca') { baseCoords = { lat: 56.1304, lon: -106.3468 }; resolvedLocation = 'Canada'; }
    else if (t.includes('italy') || c === 'it') { baseCoords = { lat: 41.8719, lon: 12.5674 }; resolvedLocation = 'Italy'; }
    else if (t.includes('spain') || c === 'es') { baseCoords = { lat: 40.4637, lon: -3.7492 }; resolvedLocation = 'Spain'; }
    else if (t.includes('switzerland') || c === 'ch') { baseCoords = { lat: 46.8182, lon: 8.2275 }; resolvedLocation = 'Switzerland'; }
    else if (t.includes('sweden') || c === 'se') { baseCoords = { lat: 60.1282, lon: 18.6435 }; resolvedLocation = 'Sweden'; }
    else if (t.includes('norway') || c === 'no') { baseCoords = { lat: 60.4720, lon: 8.4689 }; resolvedLocation = 'Norway'; }
    else if (t.includes('ukraine') || c === 'ua') { baseCoords = { lat: 48.3794, lon: 31.1656 }; resolvedLocation = 'Ukraine'; }
    else if (t.includes('yemen') || c === 'ye') { baseCoords = { lat: 15.5527, lon: 48.5164 }; resolvedLocation = 'Yemen'; }
    else if (t.includes('iran') || c === 'ir') { baseCoords = { lat: 32.4279, lon: 53.6880 }; resolvedLocation = 'Iran'; }
    else if (t.includes('iraq') || c === 'iq') { baseCoords = { lat: 33.2232, lon: 43.6793 }; resolvedLocation = 'Iraq'; }
    else if (t.includes('saudi') || c === 'sa') { baseCoords = { lat: 23.8859, lon: 45.0792 }; resolvedLocation = 'Saudi Arabia'; }
    else if (t.includes('india') || c === 'in') { baseCoords = { lat: 20.5937, lon: 78.9629 }; resolvedLocation = 'India'; }
    else if (t.includes('australia') || c === 'au') { baseCoords = { lat: -25.2744, lon: 133.7751 }; resolvedLocation = 'Australia'; }
    else if (t.includes('chad') || c === 'td') { baseCoords = { lat: 15.4542, lon: 18.7322 }; resolvedLocation = 'Chad'; }
    else if (t.includes('congo') || t.includes('drc') || c === 'cd') { baseCoords = { lat: -4.0383, lon: 21.7587 }; resolvedLocation = 'Dem. Rep. Congo'; }
    else if (t.includes('libya') || c === 'ly') { baseCoords = { lat: 26.3351, lon: 17.2283 }; resolvedLocation = 'Libya'; }
    else if (t.includes('venezuela') || c === 've') { baseCoords = { lat: 6.4238, lon: -66.5897 }; resolvedLocation = 'Venezuela'; }
    else if (t.includes('egypt') || c === 'eg') { baseCoords = { lat: 26.8206, lon: 30.8025 }; resolvedLocation = 'Egypt'; }
    else if (t.includes('turkey') || c === 'tr') { baseCoords = { lat: 38.9637, lon: 35.2433 }; resolvedLocation = 'Turkey'; }
    else if (t.includes('mexico') || c === 'mx') { baseCoords = { lat: 23.6345, lon: -102.5528 }; resolvedLocation = 'Mexico'; }
    else if (t.includes('pakistan') || c === 'pk') { baseCoords = { lat: 30.3753, lon: 69.3451 }; resolvedLocation = 'Pakistan'; }
    else if (t.includes('afghanistan') || c === 'af') { baseCoords = { lat: 33.9391, lon: 67.7100 }; resolvedLocation = 'Afghanistan'; }
    else if (t.includes('philippines') || c === 'ph') { baseCoords = { lat: 12.8797, lon: 121.7740 }; resolvedLocation = 'Philippines'; }
    else if (t.includes('indonesia') || c === 'id') { baseCoords = { lat: -0.7893, lon: 113.9213 }; resolvedLocation = 'Indonesia'; }
    else if (t.includes('colombia') || c === 'co') { baseCoords = { lat: 4.5709, lon: -72.9566 }; resolvedLocation = 'Colombia'; }
    else if (t.includes('sudan') || c === 'sd') { baseCoords = { lat: 12.8628, lon: 30.2176 }; resolvedLocation = 'Sudan'; }
    else if (t.includes('somalia') || c === 'so') { baseCoords = { lat: 5.1521, lon: 46.1996 }; resolvedLocation = 'Somalia'; }
    else if (t.includes('kenya') || c === 'ke') { baseCoords = { lat: -1.2921, lon: 36.8219 }; resolvedLocation = 'Kenya'; }
    else if (t.includes('nigeria') || c === 'ng') { baseCoords = { lat: 9.0820, lon: 8.6753 }; resolvedLocation = 'Nigeria'; }
    else if (t.includes('south china sea')) { baseCoords = { lat: 12.0, lon: 113.0 }; resolvedLocation = 'South China Sea'; }
    else if (t.includes('europe') || t.includes('eu') || t.includes('brussels')) { baseCoords = { lat: 50.8503, lon: 4.3517 }; resolvedLocation = 'Brussels, EU'; }
  }

  // 3. High-Fidelity US States Classifiers (to distribute US events accurately instead of stacking in Kansas)
  if (!baseCoords) {
    if (t.includes('texas') || t.includes('tx')) { baseCoords = { lat: 31.9686, lon: -99.9018 }; resolvedLocation = 'Texas, USA'; }
    else if (t.includes('california') || t.includes('ca')) { baseCoords = { lat: 36.7783, lon: -119.4179 }; resolvedLocation = 'California, USA'; }
    else if (t.includes('arizona') || t.includes('az')) { baseCoords = { lat: 34.0489, lon: -111.0937 }; resolvedLocation = 'Arizona, USA'; }
    else if (t.includes('georgia') || t.includes('ga')) { baseCoords = { lat: 32.1656, lon: -82.9001 }; resolvedLocation = 'Georgia, USA'; }
    else if (t.includes('new york') || t.includes('ny')) { baseCoords = { lat: 43.2994, lon: -74.2179 }; resolvedLocation = 'New York, USA'; }
    else if (t.includes('washington') || t.includes('dc') || t.includes('d.c.')) { baseCoords = { lat: 38.9072, lon: -77.0369 }; resolvedLocation = 'Washington D.C., USA'; }
    else if (t.includes('florida') || t.includes('fl')) { baseCoords = { lat: 27.6648, lon: -81.5158 }; resolvedLocation = 'Florida, USA'; }
    else if (t.includes('illinois') || t.includes('il')) { baseCoords = { lat: 40.6331, lon: -89.3985 }; resolvedLocation = 'Illinois, USA'; }
    else if (t.includes('pennsylvania') || t.includes('pa')) { baseCoords = { lat: 41.2033, lon: -77.1945 }; resolvedLocation = 'Pennsylvania, USA'; }
    else if (t.includes('ohio') || t.includes('oh')) { baseCoords = { lat: 40.4173, lon: -82.9071 }; resolvedLocation = 'Ohio, USA'; }
    else if (t.includes('michigan') || t.includes('mi')) { baseCoords = { lat: 44.3148, lon: -85.6024 }; resolvedLocation = 'Michigan, USA'; }
    else if (t.includes('north carolina') || t.includes('nc')) { baseCoords = { lat: 35.7596, lon: -79.0193 }; resolvedLocation = 'North Carolina, USA'; }
    else if (t.includes('south carolina') || t.includes('sc')) { baseCoords = { lat: 33.8361, lon: -81.1637 }; resolvedLocation = 'South Carolina, USA'; }
    else if (t.includes('virginia') || t.includes('va')) { baseCoords = { lat: 37.4316, lon: -78.6569 }; resolvedLocation = 'Virginia, USA'; }
    else if (t.includes('maryland') || t.includes('md')) { baseCoords = { lat: 39.0458, lon: -76.6413 }; resolvedLocation = 'Maryland, USA'; }
    else if (t.includes('massachusetts') || t.includes('ma')) { baseCoords = { lat: 42.4072, lon: -71.8157 }; resolvedLocation = 'Massachusetts, USA'; }
    else if (t.includes('colorado') || t.includes('co')) { baseCoords = { lat: 39.5501, lon: -105.7821 }; resolvedLocation = 'Colorado, USA'; }
    else if (t.includes('utah') || t.includes('ut')) { baseCoords = { lat: 39.3210, lon: -111.0937 }; resolvedLocation = 'Utah, USA'; }
    else if (t.includes('oregon') || t.includes('or')) { baseCoords = { lat: 43.8041, lon: -120.5542 }; resolvedLocation = 'Oregon, USA'; }
  }

  // 4. Smart Fallbacks (Only if no specific state or country was matched above!)
  if (!baseCoords) {
    if (t.includes('surveillance') || t.includes('security') || c.includes('wired') || c.includes('eff')) {
      baseCoords = { lat: 37.0902, lon: -95.7129 };
      resolvedLocation = 'United States';
    } else if (c.includes('reliefweb') || c.includes('human rights') || c.includes('hrw')) {
      baseCoords = { lat: 46.8182, lon: 8.2275 };
      resolvedLocation = 'Geneva, Switzerland';
    } else {
      const LANDMASS_COORDS = [
        { lat: 39.8283, lon: -98.5795, name: 'North America' },  // North America
        { lat: 56.1304, lon: -106.3468, name: 'Canada' }, // Canada
        { lat: -14.2350, lon: -51.9253, name: 'Brazil' }, // Brazil
        { lat: 48.3794, lon: 31.1656, name: 'Ukraine' },   // Ukraine
        { lat: 46.2276, lon: 2.2137, name: 'France' },     // France
        { lat: 9.0820, lon: 8.6753, name: 'Nigeria' },      // Nigeria
        { lat: 26.8206, lon: 30.8025, name: 'Egypt' },   // Egypt
        { lat: 32.4279, lon: 53.6880, name: 'Iran' },   // Iran
        { lat: 20.5937, lon: 78.9629, name: 'India' },   // India
        { lat: 35.8617, lon: 104.1954, name: 'China' }   // China
      ];
      // Deterministic landmass selection based on title/country seed to prevent duplicates/jumping coordinates!
      let hash = 0;
      const seedText = title || country || 'signal';
      for (let i = 0; i < seedText.length; i++) {
        hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % LANDMASS_COORDS.length;
      const selected = LANDMASS_COORDS[index];
      baseCoords = { lat: selected.lat, lon: selected.lon };
      resolvedLocation = selected.name;
    }
  }

  // Apply stable, deterministic coordinate jitter to space markers beautifully without stack jumping!
  const jitter = getDeterministicJitter(title || country || 'signal', 0.6);
  return {
    lat: baseCoords.lat + jitter.lat,
    lon: baseCoords.lon + jitter.lon,
    resolvedLocation: resolvedLocation || country || 'Global'
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
          location: coords?.resolvedLocation || source || 'Global',
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
          location: coords?.resolvedLocation || locationName,
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

    // Assign coordinates and high-fidelity location names to database events or fetched articles that lack them
    allEvents.forEach(e => {
      const coords = getCountryCoords(e.location || 'Global', e.title);
      if (coords) {
        if (!e.lat || !e.lon) {
          e.lat = coords.lat;
          e.lon = coords.lon;
        }
        // Override generic/abbreviated source country codes with clean resolved city/region names!
        if (coords.resolvedLocation && (!e.location || e.location === 'Global' || e.location.length <= 3)) {
          e.location = coords.resolvedLocation;
        }
      }
    });

    // Markers
    const curated = CURATED_STATIC_MARKERS.map((m, i) => ({ ...m, id: `curated-${i}`, count: 1 }));
    const dbMarkers = allEvents.filter(e => e.lat && e.lon).map(e => ({
      id: `db-${e.id}`, lat: e.lat, lon: e.lon, name: e.title,
      category: e.category, severity: e.severity, url: e.url, location: e.location, count: 1
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
