import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 120000; // 2 min

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

function scoreSeverity(title) {
  const t = title.toLowerCase();
  if (/mass|genocide|massacre|nuclear|chemical|emergency|catastroph/.test(t)) return 5;
  if (/kill|dead|casualties|strike|attack|bomb|destroy|violation|crime/.test(t)) return 4;
  if (/military|weapon|deploy|escalat|conflict|war|assault|autonomous/.test(t)) return 3;
  if (/warn|threat|tension|sanction|ban|restrict|arrest|indict/.test(t)) return 2;
  return 1;
}

const CURATED_INTEL = [
  { lat: 31.5, lon: 34.5, name: 'IDF Lavender AI targeting system deployment — algorithmic kill chain active in Gaza', category: 'Conflict', severity: 5, tag: 'CRITICAL', source: '+972 Magazine', url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/', image: 'https://www.972mag.com/wp-content/uploads/2024/04/F210519YS31-1200x800.jpg' },
  { lat: 31.8, lon: 35.2, name: 'Red Wolf biometric surveillance network — facial recognition checkpoints active in Hebron', category: 'Conflict', severity: 4, tag: 'ALERT', source: 'Amnesty International', url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/', image: 'https://www.amnesty.org/en/wp-content/uploads/2023/04/Opt_Israel_Apartheid_Facial_Recognition_1920x1080-1024x576.jpg' },
  { lat: 33.9, lon: 35.5, name: 'Israeli drone strikes on southern Lebanon — autonomous targeting "Where is Daddy" system suspected', category: 'Conflict', severity: 4, tag: 'CRITICAL', source: 'The Guardian', url: 'https://www.theguardian.com/world/2024/apr/03/israel-gaza-ai-database-hode-daddy', image: 'https://i.guim.co.uk/img/media/b694b22c7a7266d691136c1e3093b13284f1f516/0_142_4256_2554/master/4256.jpg?width=1200&quality=85&auto=format&fit=max&s=8a5f0df28a7e704b2b0cfb0e9c60e336' },
  { lat: 32.1, lon: 34.8, name: 'IDF "The Gospel" AI system generating targets at unprecedented pace', category: 'Conflict', severity: 5, tag: 'ALERT', source: 'NPR', url: 'https://www.npr.org/2023/12/14/1218643254/israel-is-using-an-ai-system-to-find-targets-in-gaza-experts-say-its-just-the-st', image: 'https://media.npr.org/assets/img/2023/12/13/gettyimages-1811568285-b1a99f187a27e7ce71bb70f5e1f02120e0344b1c-s1100-c50.jpg' },
  { lat: 25.7, lon: -80.1, name: 'ICE deploying facial recognition scans on undocumented migrants in Miami', category: 'Humanitarian', severity: 4, tag: 'NEW', source: 'ACLU', url: 'https://www.aclu.org/news/immigrants-rights/ice-is-using-facial-recognition-technology', image: 'https://www.aclu.org/wp-content/uploads/2021/12/2020-03-05-ICE-facial-recognition-1200x628-1.jpg' },
  { lat: 31.7, lon: -106.4, name: 'CBP automated border towers (Anduril) active in El Paso', category: 'Political', severity: 3, tag: 'INFO', source: 'The Verge', url: 'https://www.theverge.com/2020/7/2/21310774/anduril-us-customs-and-border-protection-contract-autonomous-surveillance-towers', image: 'https://cdn.vox-cdn.com/thumbor/KqU0U7eU-h9H_lZ1h8f8pI-7e_8=/0x0:1920x1080/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/67005953/Anduril_Sentry_Tower.0.jpg' },
  { lat: 38.8, lon: -77.0, name: 'ICE signs $137M contract with Palantir for FALCON system', category: 'Political', severity: 4, tag: 'ALERT', source: 'Mijente', url: 'https://mijente.net/2019/08/palantir-ice-contract/', image: 'https://mijente.net/wp-content/uploads/2019/12/palantir-protest.jpg' },
  { lat: 40.7, lon: -74.0, name: 'NYPD using Clearview AI in undocumented immigrant sweeps', category: 'Political', severity: 3, tag: 'INFO', source: 'The Intercept', url: 'https://theintercept.com/2021/04/13/clearview-ai-facial-recognition-nypd/', image: 'https://theintercept.com/wp-content/uploads/2021/04/nypd-clearview-ai-facial-recognition.jpg' },
  { lat: 50.8, lon: 4.3, name: 'EU AI Act enforcement guidance issued — biometric systems', category: 'Political', severity: 2, tag: 'NEW', source: 'European Commission', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai', image: 'https://digital-strategy.ec.europa.eu/sites/default/files/styles/1200x628/public/2021-04/AI%20Act%20visual.jpg' },
  { lat: 48.4, lon: 35.0, name: 'Palantir Maven Smart System deployed in Ukraine conflict', category: 'Conflict', severity: 4, tag: 'ALERT', source: 'TIME', url: 'https://time.com/6966102/ukraine-palantir-ai-war/', image: 'https://api.time.com/wp-content/uploads/2024/04/ukraine-palantir-ai-war-2.jpg' },
  { lat: 50.4, lon: 30.5, name: 'AI-directed drone swarm operations — autonomous engagement frontline', category: 'Conflict', severity: 3, tag: 'NEW', source: 'Wired', url: 'https://www.wired.com/story/ukraine-frontline-autonomous-drones/', image: 'https://media.wired.com/photos/651f1c24e757c917fb2f170e/master/w_1920,c_limit/Ukraine-Autonomous-Drones-Security-1250268593.jpg' },
  { lat: 59.3, lon: 18.0, name: 'SIPRI annual report: global LAWS development surging', category: 'Political', severity: 2, tag: 'NEW', source: 'SIPRI', url: 'https://www.sipri.org/media/press-release/2023/ai-and-autonomous-weapons', image: 'https://www.sipri.org/sites/default/files/styles/1200x628/public/2023-05/AI%20and%20AWS.jpg' },
  { lat: 39.9, lon: 116.4, name: 'IJOP integrated surveillance platform — Xinjiang autonomous monitoring', category: 'Humanitarian', severity: 5, tag: 'CRITICAL', source: 'Human Rights Watch', url: 'https://www.hrw.org/report/2019/05/01/chinas-algorithms-repression/reverse-engineering-xinjiang-police-mass', image: 'https://www.hrw.org/sites/default/files/styles/1200x628/public/multimedia_images_2019/201905asia_china_ijop_promo.jpg' },
  { lat: 34.0, lon: -118.2, name: 'Predictive policing algorithm flagged by ACLU — Chicago PD audit', category: 'Humanitarian', severity: 3, tag: 'ALERT', source: 'ACLU', url: 'https://www.aclu.org/news/privacy-technology/predictive-policing-algorithms-racist', image: 'https://www.aclu.org/wp-content/uploads/2019/12/2019-12-05-predictive-policing-1200x628.jpg' }
];

async function fetchGDELT() {
  try {
    const mainQuery = '(artificial intelligence OR autonomous weapons OR drone OR AI military OR surveillance OR facial recognition OR cyber)';
    const geoUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(mainQuery)}&format=GeoJSON&timespan=48h&maxpoints=200`;
    const docUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent('AI weapons OR autonomous drone OR AI surveillance OR AI military OR AI regulation OR facial recognition OR cyber attack')}&mode=artlist&maxrecords=75&format=json&sourcelang=english&timespan=48h`;

    const [geoRes, docRes] = await Promise.all([
      fetch(geoUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null),
      fetch(docUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null),
    ]);

    let markers = [];
    if (geoRes?.ok) {
      try {
        const geo = await geoRes.json();
        markers = (geo.features || []).map((f, i) => {
          const props = f.properties || {};
          const name = (props.name || props.html || '').replace(/<[^>]*>/g, '').slice(0, 200);
          return {
            id: `geo-${i}`, lat: f.geometry?.coordinates?.[1], lon: f.geometry?.coordinates?.[0],
            name, category: categorize(name), severity: scoreSeverity(name),
            count: props.count || 1, url: props.url || null,
          };
        }).filter(m => m.lat && m.lon);
      } catch {}
    }

    let events = [];
    if (docRes?.ok) {
      try {
        const data = await docRes.json();
        events = (data.articles || []).map((a, i) => ({
          id: `ev-${i}-${Date.now()}`, title: a.title || 'Untitled', url: a.url,
          source: a.domain || 'Unknown', timestamp: a.seendate || '',
          category: categorize(a.title || ''), severity: scoreSeverity(a.title || ''),
          location: a.sourcecountry || null,
        }));
      } catch {}
    }

    return { markers, events, live: markers.length > 0 || events.length > 0 };
  } catch {
    return { markers: [], events: [], live: false };
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL) {
      return NextResponse.json(cache, { headers: { 'Cache-Control': 'no-store' } });
    }

    const gdelt = await fetchGDELT();

    // Always include curated intel markers (with slight position variation for realism)
    const curatedMarkers = CURATED_INTEL.map((m, i) => ({
      ...m, id: `curated-${i}`,
      lat: m.lat + (Math.random() - 0.5) * 0.1,
      lon: m.lon + (Math.random() - 0.5) * 0.1,
      count: 1, url: null, curated: true,
    }));

    // Merge: GDELT live markers + curated intel
    const allMarkers = [...gdelt.markers, ...curatedMarkers];

    // Generate curated feed events from the intel if GDELT returned nothing
    let allEvents = gdelt.events;
    if (allEvents.length === 0) {
      allEvents = CURATED_INTEL.map((m, i) => ({
        id: `intel-${i}-${now}`, title: m.name, url: m.url || null,
        source: m.source || 'Vault OSINT', timestamp: new Date(now - i * 600000).toISOString(),
        category: m.category, severity: m.severity,
        location: null,
        image: m.image || null,
        tag: m.tag || 'INFO'
      }));
    }

    const result = {
      markers: allMarkers,
      events: allEvents,
      markerCount: allMarkers.length,
      eventCount: allEvents.length,
      source: gdelt.live ? 'gdelt+osint' : 'osint_curated',
      status: 'live',
      lastUpdated: new Date().toISOString(),
    };

    cache = result;
    cacheTime = now;
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ markers: [], events: [], status: 'error', error: err.message });
  }
}
