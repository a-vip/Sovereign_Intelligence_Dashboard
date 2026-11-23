/**
 * Sovereign Observatory — Epoch AI Frontier Compute & Models Sync Engine
 *
 * Fetches and parses Epoch AI open datasets:
 *  - Frontier AI Data Centers (https://epoch.ai/data/data_centers/data_centers.csv)
 *  - Notable & Frontier AI Models (https://epoch.ai/data/notable_ai_models.csv)
 */

import { geocodeText } from './geocoder.js';
import { resolveJurisdictionForLocation } from './jurisdictions.js';

const EPOCH_DATA_CENTERS_CSV = 'https://epoch.ai/data/data_centers/data_centers.csv';
const EPOCH_NOTABLE_MODELS_CSV = 'https://epoch.ai/data/notable_ai_models.csv';

/**
 * Character-by-character RFC 4180 CSV parser handling quoted commas,
 * escaped quotes (""), and embedded newlines inside quoted fields.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      if (s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => String(h || '').trim());
  const records = [];
  for (let r = 1; r < rows.length; r++) {
    const vals = rows[r];
    if (!vals || vals.length === 0 || (vals.length === 1 && vals[0] === '')) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = vals[c] !== undefined ? String(vals[c]).trim() : '';
    }
    records.push(obj);
  }
  return records;
}

const COMPUTE_CORRIDOR_COORDS = [
  { patterns: ['memphis', 'tennessee'], lat: 35.075, lon: -90.145, label: 'Memphis, Tennessee, USA' },
  { patterns: ['abilene', 'texas'], lat: 32.4487, lon: -99.7331, label: 'Abilene, Texas, USA' },
  { patterns: ['midlothian', 'fort worth', 'dallas', 'red oak'], lat: 32.4824, lon: -96.9945, label: 'Dallas–Fort Worth, Texas, USA' },
  { patterns: ['shreveport', 'richland parish', 'louisiana'], lat: 32.45, lon: -91.75, label: 'Richland Parish, Louisiana, USA' },
  { patterns: ['new albany', 'columbus', 'ohio'], lat: 40.0812, lon: -82.8088, label: 'New Albany, Ohio, USA' },
  { patterns: ['altoona', 'des moines', 'waukee', 'west des moines', 'iowa'], lat: 41.6444, lon: -93.4646, label: 'Des Moines Corridor, Iowa, USA' },
  { patterns: ['council bluffs', 'omaha', 'nebraska'], lat: 41.225, lon: -95.85, label: 'Council Bluffs, Iowa, USA' },
  { patterns: ['mount pleasant', 'racine', 'wisconsin'], lat: 42.707, lon: -87.878, label: 'Mount Pleasant, Wisconsin, USA' },
  { patterns: ['cheyenne', 'wyoming'], lat: 41.14, lon: -104.8202, label: 'Cheyenne, Wyoming, USA' },
  { patterns: ['boardman', 'prineville', 'the dalles', 'oregon'], lat: 45.8399, lon: -119.7006, label: 'Columbia Basin, Oregon, USA' },
  { patterns: ['quincy', 'wenatchee', 'washington state'], lat: 47.2343, lon: -119.8526, label: 'Quincy, Washington, USA' },
  { patterns: ['mesa', 'goodyear', 'phoenix', 'arizona'], lat: 33.3062, lon: -111.635, label: 'Phoenix–Mesa Corridor, Arizona, USA' },
  { patterns: ['pryor', 'mayes county', 'oklahoma'], lat: 36.3084, lon: -95.3169, label: 'Pryor Creek, Oklahoma, USA' },
  { patterns: ['ellendale', 'north dakota'], lat: 46.0027, lon: -98.5268, label: 'Ellendale, North Dakota, USA' },
  { patterns: ['ashburn', 'loudoun', 'manassas', 'leesburg', 'virginia'], lat: 39.0438, lon: -77.4874, label: 'Northern Virginia, USA' },
  { patterns: ['fort wayne', 'new carlisle', 'indiana'], lat: 41.0793, lon: -85.1394, label: 'Indiana AI Corridor, USA' },
  { patterns: ['kansas city', 'st. charles', 'missouri'], lat: 39.0997, lon: -94.5786, label: 'Kansas City, Missouri, USA' },
  { patterns: ['reno', 'tahoe', 'storeys', 'nevada', 'las vegas'], lat: 39.5296, lon: -119.8138, label: 'Reno–Tahoe, Nevada, USA' },
  { patterns: ['santa clara', 'san jose', 'california'], lat: 37.3541, lon: -121.9552, label: 'Silicon Valley, California, USA' },
  { patterns: ['eagle mountain', 'utah', 'salt lake'], lat: 40.3141, lon: -112.0069, label: 'Salt Lake Corridor, Utah, USA' },
  { patterns: ['abu dhabi', 'uae', 'united arab emirates'], lat: 24.4539, lon: 54.3773, label: 'Abu Dhabi, UAE' },
  { patterns: ['riyadh', 'neom', 'saudi arabia'], lat: 24.7136, lon: 46.6753, label: 'Riyadh, Saudi Arabia' },
  { patterns: ['dublin', 'grange castle', 'ireland'], lat: 53.33, lon: -6.44, label: 'Dublin, Ireland' },
  { patterns: ['london', 'blyth', 'slough', 'united kingdom'], lat: 51.51, lon: -0.59, label: 'London–Thames Corridor, UK' },
  { patterns: ['paris', 'essonne', 'france'], lat: 48.63, lon: 2.33, label: 'Paris Cluster, France' },
  { patterns: ['frankfurt', 'hanau', 'germany'], lat: 50.1109, lon: 8.6821, label: 'Frankfurt, Germany' },
  { patterns: ['milan', 'lombardy', 'italy'], lat: 45.4642, lon: 9.19, label: 'Milan, Italy' },
  { patterns: ['stockholm', 'gävle', 'gavle', 'sweden'], lat: 60.6749, lon: 17.1413, label: 'Gävle–Stockholm, Sweden' },
  { patterns: ['tokyo', 'chiba', 'japan'], lat: 35.6762, lon: 139.6503, label: 'Tokyo–Chiba, Japan' },
  { patterns: ['seoul', 'hwaseong', 'south korea'], lat: 37.2, lon: 127.0, label: 'Seoul Capital Area, South Korea' },
  { patterns: ['taiwan', 'hsinchu', 'changhua'], lat: 24.8138, lon: 120.9675, label: 'Hsinchu, Taiwan' },
  { patterns: ['singapore'], lat: 1.3521, lon: 103.8198, label: 'Singapore' },
  { patterns: ['mumbai', 'hyderabad', 'jamnagar', 'india'], lat: 19.076, lon: 72.8777, label: 'Western/Southern India Cluster' },
  { patterns: ['johor', 'malaysia'], lat: 1.4927, lon: 103.7414, label: 'Johor–Singapore Corridor, Malaysia' },
  { patterns: ['beijing', 'langfang', 'zhangjiakou', 'china'], lat: 39.52, lon: 116.7, label: 'Beijing–Langfang, China' },
  { patterns: ['shanghai', 'suzhou', 'hangzhou'], lat: 31.2304, lon: 121.4737, label: 'Yangtze Delta, China' },
  { patterns: ['shenzhen', 'guangzhou'], lat: 22.5431, lon: 114.0579, label: 'Greater Bay Area, China' },
  { patterns: ['são paulo', 'sao paulo', 'brazil'], lat: -23.5505, lon: -46.6333, label: 'São Paulo, Brazil' },
  { patterns: ['sydney', 'melbourne', 'australia'], lat: -33.8688, lon: 151.2093, label: 'Sydney, Australia' }
];

function cleanEpochTag(val) {
  return String(val || '')
    .replace(/#(confident|likely|speculative|uncertain)/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^,\s*|,\s*$/g, '')
    .trim();
}

function slugifyId(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function extractFirstUrl(markdownText) {
  const match = String(markdownText || '').match(/https?:\/\/[^\s)\]]+/i);
  return match ? match[0].replace(/[.,;]+$/, '') : '';
}

function resolveClusterLocation(name, address, country) {
  const combined = `${address || ''} ${name || ''} ${country || ''}`.toLowerCase();
  for (const hub of COMPUTE_CORRIDOR_COORDS) {
    if (hub.patterns.some((p) => combined.includes(p))) {
      return { lat: hub.lat, lon: hub.lon, label: hub.label };
    }
  }
  const geo = geocodeText(address || name || '', country || '', '');
  if (geo.hasExplicitLocation && geo.lat !== null && geo.lon !== null) {
    return { lat: geo.lat, lon: geo.lon, label: geo.name };
  }
  return { lat: null, lon: null, label: country || address || 'Unknown' };
}

function resolveClusterJurisdiction(address, country) {
  const addrLower = String(address || '').toLowerCase();
  if (/\b(california|santa clara|san jose|sacramento|san francisco|los angeles)\b/i.test(addrLower)) {
    return 'us-ca';
  }
  const jur = resolveJurisdictionForLocation(`${address || ''} ${country || ''}`);
  return jur ? jur.slug : null;
}

export async function fetchEpochFrontierClusters(limit = 160) {
  const res = await fetch(EPOCH_DATA_CENTERS_CSV, {
    headers: { 'User-Agent': 'SovereignObservatory/2.5 (+https://app.sovdash.com)' },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Epoch Data Centers CSV returned HTTP ${res.status}`);
  }
  const csvText = await res.text();
  const rows = parseCsv(csvText);

  const clusters = [];
  const seenIds = new Set();

  for (const r of rows) {
    const name = String(r.Name || r.Project || '').trim();
    if (!name) continue;

    const powerMw = parseFloat(r['Current power (MW)']) || 0;
    const h100Eq = parseFloat(r['Current H100 equivalents']) || 0;
    const capexB = parseFloat(r['Current total capital cost (2025 USD billions)']) || 0;
    const owner = cleanEpochTag(r.Owner || r.Project || 'Undisclosed');
    const users = cleanEpochTag(r.Users || '');
    const chipTypes = cleanEpochTag(r['Current chip types'] || r['All chip types'] || '');
    const country = cleanEpochTag(r.Country || '');
    const address = cleanEpochTag(r.Address || '');

    const baseId = `epoch-dc-${slugifyId(name) || clusters.length}`;
    if (seenIds.has(baseId)) continue;
    seenIds.add(baseId);

    const coords = resolveClusterLocation(name, address, country);
    const jurisdictionSlug = resolveClusterJurisdiction(address, country);

    clusters.push({
      id: baseId,
      name,
      owner,
      users,
      country: country || 'Global',
      address: address || coords.label || country || 'Undisclosed',
      jurisdictionSlug,
      lat: coords.lat,
      lon: coords.lon,
      h100Equivalents: Math.round(h100Eq),
      powerMw: Math.round(powerMw * 10) / 10,
      capexBillions: Math.round(capexB * 100) / 100,
      chipTypes,
      sourceUrl: extractFirstUrl(r['Selected Sources']) || 'https://epoch.ai/data/data-centers'
    });
  }

  clusters.sort((a, b) => (b.powerMw - a.powerMw) || (b.h100Equivalents - a.h100Equivalents));
  return clusters.slice(0, limit);
}

export async function fetchEpochFrontierModels(limit = 140) {
  const res = await fetch(EPOCH_NOTABLE_MODELS_CSV, {
    headers: { 'User-Agent': 'SovereignObservatory/2.5 (+https://app.sovdash.com)' },
    signal: AbortSignal.timeout(12000),
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Epoch Notable Models CSV returned HTTP ${res.status}`);
  }
  const csvText = await res.text();
  const rows = parseCsv(csvText);

  const models = [];
  const seenIds = new Set();

  for (const r of rows) {
    const model = String(r.Model || '').trim();
    if (!model) continue;

    const pubDate = String(r['Publication date'] || '').trim();
    const flopNum = parseFloat(r['Training compute (FLOP)']) || 0;
    const frontierFlag = /^(checked|true|yes|1)$/i.test(String(r['Frontier model'] || '').trim());
    const isRecent = pubDate >= '2025-01-01';
    const isHighCompute = flopNum >= 1e24;

    if (!frontierFlag && !isRecent && !isHighCompute) continue;

    const id = `epoch-model-${slugifyId(model) || models.length}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const openWeights = /^(true|yes|open|checked)$/i.test(String(r['Open model weights?'] || '').trim()) ||
      /open weights/i.test(String(r['Model accessibility'] || ''));

    models.push({
      id,
      model,
      organization: String(r.Organization || 'Unknown').trim(),
      publicationDate: pubDate || 'Unknown',
      country: String(r['Country (of organization)'] || '').trim(),
      domain: String(r.Domain || '').trim(),
      trainingComputeFlop: r['Training compute (FLOP)'] || '',
      parameters: r.Parameters || '',
      trainingHardware: r['Training hardware'] || '',
      accessibility: r['Model accessibility'] || '',
      openWeights,
      isFrontier: frontierFlag,
      link: r.Link || 'https://epoch.ai/data/ai-models'
    });
  }

  models.sort((a, b) => String(b.publicationDate).localeCompare(String(a.publicationDate)));
  return models.slice(0, limit);
}

export function computeGovernanceCoverage(clusters = []) {
  const buckets = {
    bindingComprehensive: {
      label: 'Binding Comprehensive Statute (EU, South Korea, China, Brazil)',
      powerMw: 0,
      h100e: 0,
      clusters: 0,
      color: '#10b981'
    },
    frontierSafety: {
      label: 'Sub-National Frontier Safety Statute (California SB 53)',
      powerMw: 0,
      h100e: 0,
      clusters: 0,
      color: '#38bdf8'
    },
    sectoralOrVoluntary: {
      label: 'Sectoral / Voluntary / Export-Controlled (US Fed, UK, UAE, Global)',
      powerMw: 0,
      h100e: 0,
      clusters: 0,
      color: '#facc15'
    }
  };

  let totalPowerMw = 0;
  let totalH100e = 0;

  for (const c of clusters) {
    const mw = Number(c.powerMw) || 0;
    const h100 = Number(c.h100Equivalents) || 0;
    totalPowerMw += mw;
    totalH100e += h100;

    if (c.jurisdictionSlug === 'us-ca') {
      buckets.frontierSafety.powerMw += mw;
      buckets.frontierSafety.h100e += h100;
      buckets.frontierSafety.clusters += 1;
    } else if (['eu', 'fr', 'de', 'se', 'ee', 'at', 'kr', 'cn', 'br'].includes(c.jurisdictionSlug)) {
      buckets.bindingComprehensive.powerMw += mw;
      buckets.bindingComprehensive.h100e += h100;
      buckets.bindingComprehensive.clusters += 1;
    } else {
      buckets.sectoralOrVoluntary.powerMw += mw;
      buckets.sectoralOrVoluntary.h100e += h100;
      buckets.sectoralOrVoluntary.clusters += 1;
    }
  }

  return {
    totalClusters: clusters.length,
    totalPowerGw: Math.round((totalPowerMw / 1000) * 100) / 100,
    totalH100Millions: Math.round((totalH100e / 1e6) * 100) / 100,
    buckets: Object.values(buckets).map((b) => ({
      ...b,
      powerGw: Math.round((b.powerMw / 1000) * 100) / 100,
      sharePct: totalPowerMw > 0 ? Math.round((b.powerMw / totalPowerMw) * 1000) / 10 : 0
    }))
  };
}
