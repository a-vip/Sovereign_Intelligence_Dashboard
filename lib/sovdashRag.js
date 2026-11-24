import fs from 'fs';
import path from 'path';
import {
  getEvents,
  getRssItems,
  getAiRegulations,
  getDataCenters,
  getFrontierClusters,
  getVaultDocs
} from './db.js';
import { getStopKillerRobotsSignals } from './researchFunnel.js';
import { geocodeText, decodeHtmlEntities } from './geocoder.js';
import { classifyTechPolicySignal } from './policyClassifier.js';
import { JURISDICTIONS } from './jurisdictions.js';
import { REGULATORY_DIFF_PROFILES, SAGRI_BASE_SCORES } from './governanceIndex.js';
import { FRONTIER_LABS } from './frontierLabs.js';
import { TEMPORAL_MILESTONES } from './temporalMilestones.js';
import {
  ENVIRONMENTAL_JUSTICE_NODES,
  SUPPLY_CHAIN_NODES,
  SUPPLY_CHAIN_ARCS,
  BIOMETRIC_WELFARE_NODES,
  AI_LABOR_NODES
} from './ethicsOverlays.js';
import {
  EMBEDDING_DIM,
  getKnowledgeChunksByIds,
  getKnowledgeChunkStats,
  searchKnowledgeChunksPgVector,
  upsertKnowledgeChunks
} from './sovdashAiDb.js';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'which', 'how', 'when', 'where',
  'who', 'why', 'are', 'was', 'were', 'have', 'has', 'had', 'into', 'about', 'compare', 'over',
  'under', 'between', 'across', 'explain', 'does', 'will', 'can', 'could', 'should', 'would',
  'tell', 'give', 'list', 'show', 'summary', 'summarize', 'their', 'there', 'they', 'been', 'also',
  'recent', 'latest', 'newest', 'related', 'events', 'happened', 'happening', 'news', 'today',
  'please', 'find', 'me', 'any', 'most', 'some', 'many', 'much', 'all', 'around', 'world'
]);

const US_STATE_ABBR = {
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DC: 'Washington D.C.', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho', IL: 'Illinois',
  KY: 'Kentucky', LA: 'Louisiana', MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine',
  MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', NC: 'North Carolina',
  ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NV: 'Nevada', NY: 'New York', NYC: 'New York City', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', TX: 'Texas', UT: 'Utah',
  VA: 'Virginia', VT: 'Vermont', WA: 'Washington', WI: 'Wisconsin', AZ: 'Arizona'
};

const REGION_COUNTRIES = {
  africa: ['south africa', 'kenya', 'nigeria', 'egypt', 'rwanda', 'morocco', 'ghana', 'african union', 'ethiopia'],
  'latin america': ['brazil', 'mexico', 'chile', 'colombia', 'argentina', 'peru', 'costa rica', 'uruguay', 'latam'],
  'middle east': ['uae', 'united arab emirates', 'saudi arabia', 'israel', 'qatar', 'oman', 'egypt', 'jordan'],
  mena: ['uae', 'united arab emirates', 'saudi arabia', 'israel', 'qatar', 'oman', 'egypt', 'morocco'],
  europe: ['european union', 'eu', 'united kingdom', 'france', 'germany', 'spain', 'italy', 'netherlands', 'poland', 'ireland', 'norway', 'finland', 'estonia', 'austria', 'sweden', 'switzerland', 'ukraine'],
  asia: ['china', 'japan', 'south korea', 'india', 'singapore', 'indonesia', 'malaysia', 'vietnam', 'philippines', 'thailand', 'taiwan', 'pakistan', 'kazakhstan', 'uzbekistan', 'bangladesh']
};

const DOMAIN_SYNONYM_GROUPS = [
  ['incident', 'reporting', 'report', 'notification', 'window', 'deadline', 'caloes', 'art 73', 'article 73', '24 hours', '15 days', '72 hours', '10 days', '2 days'],
  ['european union', 'eu', 'ai act', '2024/1689', 'brussels', 'ai office', 'gpai', 'omnibus', '2026/1744'],
  ['california', 'sb 53', 'sb53', 'ab 2013', 'caloes', 'frontier ai', 'us-ca'],
  ['south korea', 'korea', 'ai basic act', '36053', 'msit', 'korea ai safety institute'],
  ['china', 'cac', 'algorithm', 'deep synthesis', 'beijing', 'watermarking'],
  ['united kingdom', 'uk', 'aisi', 'bletchley', 'online safety', 'ofcom', 'ico'],
  ['united states', 'usa', 'u.s.', 'federal', 'caisi', 'nist', 'bis', 'export control', 'semiconductor', 'cisa', 'white house', 'washington'],
  ['compute', 'cluster', 'datacenter', 'data center', 'megawatt', 'mw', 'gw', 'gpu', 'h100', 'epoch', 'peeringdb'],
  ['environmental', 'water', 'aqueduct', 'carbon', 'co2', 'ember', 'emissions', 'cooling', 'grid'],
  ['supply chain', 'lithography', 'euv', 'asml', 'tsmc', 'foundry', 'cowos', 'hbm', 'rare earth', 'minerals'],
  ['censorship', 'ooni', 'ioda', 'shutdown', 'blackout', 'bgp', 'throttling', 'blocking'],
  ['biometric', 'welfare', 'facial recognition', 'surveillance', 'iris', 'policing', 'automated decision'],
  ['labor', 'rlhf', 'annotation', 'labeling', 'moderation', 'workers', 'outsourcing'],
  ['frontier lab', 'anthropic', 'openai', 'deepmind', 'meta', 'xai', 'mistral', 'rsp', 'preparedness', 'metr'],
  ['penalties', 'fine', 'turnover', 'enforcement', 'sanction', 'prohibited', 'banned', 'whistleblower']
];

const GEO_ALIASES = [
  { key: 'united states', terms: ['usa', 'u.s.a.', 'u.s.', 'us', 'united states', 'america', 'american', 'washington', 'white house', 'pentagon', 'cisa', 'nist', 'california', 'silicon valley', 'san francisco', 'new york', 'texas', 'colorado', 'virginia', 'ashburn', 'seattle', 'boston', 'chicago', 'austin', 'florida', 'illinois', 'utah'] },
  { key: 'united kingdom', terms: ['uk', 'u.k.', 'united kingdom', 'britain', 'british', 'london', 'cambridge', 'oxford', 'scotland', 'aisi', 'ofcom', 'ico', 'ncsc'] },
  { key: 'european union', terms: ['eu', 'european union', 'brussels', 'strasbourg', 'eu ai act', 'ai office'] },
  { key: 'south korea', terms: ['south korea', 'korea', 'korean', 'seoul', 'msit', '36053'] },
  { key: 'china', terms: ['china', 'chinese', 'beijing', 'shanghai', 'shenzhen', 'hangzhou', 'cac', 'prc'] },
  { key: 'uae', terms: ['uae', 'united arab emirates', 'abu dhabi', 'dubai'] }
];

function fnv1aHash(str, seed = 2166136261) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function tokenizeForRag(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\-\/\.\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[\-\.]+|[\-\.]+$/g, ''))
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export function computeEmbeddingVector(text, dim = EMBEDDING_DIM) {
  const vec = new Float32Array(dim);
  const rawLower = String(text || '').toLowerCase();
  const tokens = tokenizeForRag(rawLower).slice(0, 260);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const h = fnv1aHash(tok, 2166136261);
    const idx = h % dim;
    const sign = (h & 1) === 0 ? 1 : -1;
    const weight = tok.length >= 5 ? 1.35 : 1.0;
    vec[idx] += sign * weight;

    if (tok.length >= 5) {
      for (let j = 0; j <= tok.length - 4; j += 2) {
        const sub = tok.slice(j, j + 4);
        const sh = fnv1aHash(sub, 974123);
        vec[sh % dim] += ((sh & 1) === 0 ? 1 : -1) * 0.35;
      }
    }

    if (i + 1 < tokens.length) {
      const bi = `${tok}_${tokens[i + 1]}`;
      const bh = fnv1aHash(bi, 5582311);
      vec[bh % dim] += ((bh & 1) === 0 ? 1 : -1) * 1.45;
    }
  }

  for (let g = 0; g < DOMAIN_SYNONYM_GROUPS.length; g++) {
    const phrases = DOMAIN_SYNONYM_GROUPS[g];
    let hits = 0;
    for (const p of phrases) {
      if (rawLower.includes(p)) hits++;
    }
    if (hits > 0) {
      const baseIdx = (g * 13 + 7) % dim;
      const secondIdx = (g * 29 + 19) % dim;
      const boost = Math.min(3.5, 1.4 + hits * 0.6);
      vec[baseIdx] += boost;
      vec[secondIdx] += boost * 0.7;
    }
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  const out = new Array(dim);
  if (norm === 0) {
    out[0] = 1;
    for (let i = 1; i < dim; i++) out[i] = 0;
    return out;
  }
  for (let i = 0; i < dim; i++) {
    out[i] = Number((vec[i] / norm).toFixed(6));
  }
  return out;
}

function absolutePermalink(relOrUrl) {
  if (!relOrUrl) return 'https://app.sovdash.com/';
  if (relOrUrl.startsWith('http://') || relOrUrl.startsWith('https://')) return relOrUrl;
  return `https://app.sovdash.com${relOrUrl.startsWith('/') ? '' : '/'}${relOrUrl}`;
}

function normalizeRegJurisdictionLabel(rawJur) {
  const s = String(rawJur || 'Global').replace(/\u00a0/g, ' ').trim();
  if (!s) return 'Global';
  const upperToken = s.split(/[\s,]+/)[0]?.toUpperCase();
  if (US_STATE_ABBR[upperToken]) {
    return `${US_STATE_ABBR[upperToken]}, United States`;
  }
  if (/^(U\.?S\.?|USA|United States)/i.test(s)) return `United States (${s})`;
  if (/^(UK|United Kingdom)/i.test(s)) return `United Kingdom (${s})`;
  return s;
}

function parseTimestampMs(raw) {
  if (!raw) return 0;
  const s = String(raw).trim();
  if (/^\d{14}$/.test(s)) {
    return new Date(s.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')).getTime() || 0;
  }
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function formatIsoDateShort(raw) {
  const ms = parseTimestampMs(raw);
  if (!ms) return 'Recent';
  const d = new Date(ms);
  const ageHrs = Math.round((Date.now() - ms) / 3600000);
  const datePart = d.toISOString().slice(0, 10);
  if (ageHrs >= 0 && ageHrs < 48) return `${datePart} (${ageHrs <= 1 ? 'just now' : `${ageHrs}h ago`})`;
  if (ageHrs >= 48 && ageHrs < 720) return `${datePart} (${Math.floor(ageHrs / 24)}d ago)`;
  return datePart;
}

function slugifyId(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

// 90s in-memory cache of unified live observatory records (signals + curated dossiers + static + rss + regs + datacenters)
let liveEcosystemCache = { ts: 0, data: null };

async function getUnifiedLiveDatasets() {
  if (liveEcosystemCache.data && Date.now() - liveEcosystemCache.ts < 90000) {
    return liveEcosystemCache.data;
  }

  const [dbEvents, rssItems, aiRegs, frontierClusters, dataCenters, vaultDocs] = await Promise.all([
    getEvents('all').catch(() => []),
    getRssItems(400).catch(() => []),
    getAiRegulations().catch(() => []),
    getFrontierClusters(300).catch(() => []),
    getDataCenters().catch(() => []),
    getVaultDocs().catch(() => [])
  ]);

  let staticEvents = [];
  try {
    const staticPath = path.join(process.cwd(), 'public', 'data', 'events.json');
    if (fs.existsSync(staticPath)) {
      const parsed = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
      if (Array.isArray(parsed)) staticEvents = parsed;
    }
  } catch {}

  const curated = getStopKillerRobotsSignals() || [];

  // Normalize & deduplicate ALL events + RSS/paper wire items chronologically
  const eventMap = new Map();
  const ingestEventItem = (raw, origin) => {
    const title = decodeHtmlEntities(raw?.title || raw?.name || '').trim();
    if (!title) return;
    const summary = decodeHtmlEntities(raw?.details?.summary || raw?.summary || raw?.description || '').trim();
    const url = raw?.url || '';
    const normKey = url ? url.toLowerCase().split('?')[0].replace(/\/$/, '') : title.toLowerCase().slice(0, 80);
    if (eventMap.has(normKey)) return;

    const geo = !raw?.location || /global|unknown/i.test(raw.location)
      ? geocodeText(title, summary, raw?.sid || raw?.details?.sid || '')
      : { name: raw.location, lat: raw.lat ?? raw.latitude ?? null, lon: raw.lon ?? raw.longitude ?? null, region: raw?.details?.region || 'Global' };

    const location = geo?.name || raw?.location || 'Global';
    const lat = raw?.lat ?? raw?.latitude ?? geo?.lat ?? null;
    const lon = raw?.lon ?? raw?.longitude ?? geo?.lon ?? null;
    const tsRaw = raw?.original_post_time || raw?.timestamp || raw?.published_at || raw?.created_at || new Date().toISOString();
    const tsMs = parseTimestampMs(tsRaw);
    const cls = classifyTechPolicySignal(title, summary, raw?.sid || '');

    eventMap.set(normKey, {
      id: raw?.id || slugifyId(title),
      origin,
      title,
      summary,
      url: url || (raw?.id ? absolutePermalink(`/signal/${encodeURIComponent(raw.id)}`) : 'https://app.sovdash.com/'),
      permalink: raw?.id && origin !== 'rss' ? absolutePermalink(`/signal/${encodeURIComponent(raw.id)}`) : (url || 'https://app.sovdash.com/'),
      location,
      lat: lat != null && !Number.isNaN(Number(lat)) ? Number(lat) : null,
      lon: lon != null && !Number.isNaN(Number(lon)) ? Number(lon) : null,
      category: raw?.category || cls.category || 'Policy',
      severity: Number(raw?.severity) || cls.severity || 2,
      domainPillar: raw?.details?.domainPillar || cls.domainPillar || 'AI Policy',
      source: raw?.details?.source || raw?.source || 'OSINT Wire',
      timestamp: tsRaw,
      tsMs
    });
  };

  for (const e of dbEvents || []) ingestEventItem(e, 'signal');
  for (const e of curated || []) ingestEventItem(e, 'curated');
  for (const e of staticEvents || []) ingestEventItem(e, 'static');
  for (const r of rssItems || []) ingestEventItem(r, 'rss');

  const unifiedEvents = Array.from(eventMap.values()).sort((a, b) => (b.tsMs || 0) - (a.tsMs || 0));

  const payload = {
    unifiedEvents,
    aiRegs: aiRegs || [],
    frontierClusters: frontierClusters || [],
    dataCenters: dataCenters || [],
    vaultDocs: vaultDocs || []
  };
  liveEcosystemCache = { ts: Date.now(), data: payload };
  return payload;
}

export async function buildFullEcosystemChunks() {
  const chunks = [];
  const { unifiedEvents, aiRegs, frontierClusters, dataCenters, vaultDocs } = await getUnifiedLiveDatasets();

  // 1. All 60 Curated Jurisdictions + Statutory Diff Profiles + Live Reg/Signal Counts
  for (const j of JURISDICTIONS) {
    const diff = REGULATORY_DIFF_PROFILES.find((d) => d.slug === j.slug);
    const sagri = SAGRI_BASE_SCORES[j.slug];
    const instruments = (j.flagshipInstruments || [])
      .map((inst) => `${inst.name} [${inst.status}, ${inst.effectiveDate}]: ${inst.summary}`)
      .join(' | ');
    const diffSection = diff
      ? [
          `Statutory Status: ${diff.legalStatus}`,
          `Compute Threshold: ${diff.computeThreshold}`,
          `Mandatory Incident-Reporting Window: ${diff.incidentReportingWindow}`,
          `Prohibited Practices: ${diff.prohibitedPractices}`,
          `Pre-Deployment Testing: ${diff.preDeploymentTesting}`,
          `Transparency & Watermarking: ${diff.transparencyWatermarking}`,
          `Whistleblower Protections: ${diff.whistleblowerProtection}`,
          `Extraterritorial Scope: ${diff.extraterritorialScope}`,
          `Max Penalties: ${diff.maxPenalties}`,
          `Next Milestone: ${diff.nextMilestone}`
        ].join('\n')
      : '';
    const sagriText = sagri
      ? `SAGRI Pillars — Statutory: ${sagri.statutory}, Evaluation: ${sagri.evaluation}, Treaty: ${sagri.treaty}, Compute: ${sagri.compute}, Transparency: ${sagri.transparency}.`
      : '';

    const content = `${j.name} (${j.iso}, Region: ${j.region}, Capital: ${j.capital}). Posture: ${j.posture}. Regulator: ${j.regulator}. Treaty: ${j.treatyStatus}. ${sagriText} Flagship Instruments: ${instruments}. ${diffSection}`;
    chunks.push({
      id: `jur:${j.slug}`,
      sourceType: 'jurisdiction',
      sourceId: j.slug,
      title: `${j.name} AI Governance & Statutory Profile`,
      location: j.capital || j.name,
      jurisdictionSlug: j.slug,
      url: diff?.officialUrl || absolutePermalink(`/jurisdiction/${j.slug}`),
      permalink: absolutePermalink(`/jurisdiction/${j.slug}`),
      content,
      metadata: { iso: j.iso, region: j.region, posture: j.posture, lat: j.lat, lon: j.lon },
      embedding: computeEmbeddingVector(`${j.name} ${j.iso} ${j.matchPatterns.join(' ')} ${content}`)
    });
  }

  // 2. Dynamic Jurisdiction Rollups across ALL 115 statutory jurisdictions in `ai_regulations`
  const regByJur = new Map();
  for (const r of aiRegs) {
    const label = normalizeRegJurisdictionLabel(r.jurisdiction);
    if (!regByJur.has(label)) regByJur.set(label, []);
    regByJur.get(label).push(r);
  }
  for (const [jurLabel, items] of regByJur.entries()) {
    const sampleTitles = items.slice(0, 12).map((x) => `${x.title} (${x.status || 'Tracked'})`).join('; ');
    const content = `AI Regulation Registry Summary for ${jurLabel}: ${items.length} statutory & policy instruments tracked in Sovereign Observatory. Examples: ${sampleTitles}.`;
    chunks.push({
      id: `jur-reg-rollup:${slugifyId(jurLabel)}`,
      sourceType: 'regulation',
      sourceId: slugifyId(jurLabel),
      title: `AI Legislation Registry · ${jurLabel} (${items.length} Instruments)`,
      location: jurLabel,
      jurisdictionSlug: null,
      url: items[0]?.url || 'https://app.sovdash.com/compare',
      permalink: 'https://app.sovdash.com/compare',
      content,
      metadata: { count: items.length, jurLabel },
      embedding: computeEmbeddingVector(`${jurLabel} regulation law bill statute ${sampleTitles}`)
    });
  }

  // Individual 472 statutes
  for (const r of aiRegs.slice(0, 520)) {
    const normJur = normalizeRegJurisdictionLabel(r.jurisdiction);
    const id = `reg:${r.id || slugifyId(r.title)}`;
    const content = `AI Regulation (${normJur}, Status: ${r.status || 'Tracked'}, Focus: ${r.area || r.focus_area || 'Governance'}, Effective: ${r.date || r.effective_date || 'N/A'}): ${r.title}. ${r.description || r.summary || ''} Source: ${r.source || 'AI Regulation Registry'}.`;
    chunks.push({
      id,
      sourceType: 'regulation',
      sourceId: String(r.id || ''),
      title: r.title || 'AI Regulation',
      location: normJur,
      jurisdictionSlug: null,
      url: r.url || 'https://app.sovdash.com/compare',
      permalink: 'https://app.sovdash.com/compare',
      content,
      metadata: { status: r.status || '', jurisdiction: normJur, lat: r.lat, lon: r.lon },
      embedding: computeEmbeddingVector(`${r.title} ${normJur} ${content}`)
    });
  }

  // 3. Global Observatory Inventory Summary + Country Data Center Rollups (covering all 6,033 facilities)
  const dcByCountry = new Map();
  for (const dc of dataCenters) {
    const country = String(dc.country || 'Unknown').trim();
    if (!dcByCountry.has(country)) dcByCountry.set(country, []);
    dcByCountry.get(country).push(dc);
  }
  for (const [country, list] of dcByCountry.entries()) {
    const cities = Array.from(new Set(list.map((d) => d.city).filter(Boolean))).slice(0, 10);
    const operators = Array.from(new Set(list.map((d) => d.operator || d.owner).filter(Boolean))).slice(0, 10);
    const sample = list[0];
    const content = `Data Center Infrastructure in ${country}: ${list.length} verified PeeringDB / interconnection facilities tracked. Key cities: ${cities.join(', ') || country}. Major operators: ${operators.join(', ') || 'Various network providers'}. Sample facility: ${sample?.name || 'Verified Hub'} (${sample?.city || country}).`;
    chunks.push({
      id: `dc-country:${slugifyId(country)}`,
      sourceType: 'datacenter',
      sourceId: slugifyId(country),
      title: `Data Centers in ${country} (${list.length} Facilities)`,
      location: country,
      jurisdictionSlug: null,
      url: 'https://app.sovdash.com/compute',
      permalink: 'https://app.sovdash.com/compute',
      content,
      metadata: { count: list.length, country, lat: sample?.lat, lon: sample?.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  // Frontier clusters (96) + Top individual data centers (150)
  for (const c of frontierClusters.slice(0, 200)) {
    const content = `Frontier Compute Cluster: ${c.name} (Owner: ${c.owner || 'Undisclosed'}, Country: ${c.country || 'Global'}, Address: ${c.address || 'N/A'}). Power: ${c.powerMw || 0} MW, H100 Equivalents: ${c.h100Equivalents || 0}, CapEx: $${c.capexBillions || 0}B, Accelerators: ${c.chipTypes || 'Undisclosed'}.`;
    chunks.push({
      id: `compute:${c.id}`,
      sourceType: 'compute',
      sourceId: String(c.id),
      title: `Compute Cluster · ${c.name}`,
      location: c.address || c.country || 'Global',
      jurisdictionSlug: c.jurisdictionSlug || null,
      url: c.sourceUrl || 'https://app.sovdash.com/compute',
      permalink: 'https://app.sovdash.com/compute',
      content,
      metadata: { powerMw: c.powerMw || 0, owner: c.owner || '', lat: c.lat, lon: c.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  for (const dc of dataCenters.slice(0, 150)) {
    const content = `Data Center Facility: ${dc.name || dc.title} (${dc.country || 'Global'}, City: ${dc.city || dc.address || 'Verified'}, Operator: ${dc.operator || dc.owner || 'Network Operator'}). Purpose: ${dc.facilityPurpose || dc.purpose || 'Colocation & Interconnection'}. Networks/IX: ${dc.netCount || 0}.`;
    chunks.push({
      id: `dc:${dc.id || slugifyId(dc.name)}`,
      sourceType: 'datacenter',
      sourceId: String(dc.id || ''),
      title: `Data Center · ${dc.name || dc.title}`,
      location: `${dc.city || ''} ${dc.country || ''}`.trim() || 'Global',
      jurisdictionSlug: null,
      url: dc.url || 'https://www.peeringdb.com/',
      permalink: 'https://app.sovdash.com/compute',
      content,
      metadata: { lat: dc.lat, lon: dc.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 4. Frontier Labs Watch (9 labs)
  for (const lab of FRONTIER_LABS) {
    const exposure = (lab.statutoryExposure || []).map((s) => s.label).join(', ');
    const changelog = (lab.commitmentChangelog || []).map((c) => `${c.date}: ${c.note}`).join(' | ');
    const content = `${lab.name} (HQ: ${lab.hqLocation}, Posture: ${lab.openWeightsPosture}). Safety Framework: ${lab.safetyFramework?.name} ${lab.safetyFramework?.version} (${lab.safetyFramework?.thresholdMechanism}). External Evals: ${lab.externalEvaluations?.summary}. Statutory Exposure: ${exposure}. Commitment History: ${changelog}`;
    chunks.push({
      id: `lab:${lab.slug}`,
      sourceType: 'lab',
      sourceId: lab.slug,
      title: `${lab.name} — ${lab.safetyFramework?.name || 'Frontier Safety Framework'}`,
      location: lab.hqLocation || 'Global',
      jurisdictionSlug: lab.jurisdictionSlug || null,
      url: lab.safetyFramework?.url || 'https://app.sovdash.com/labs',
      permalink: 'https://app.sovdash.com/labs',
      content,
      metadata: { openWeightsPosture: lab.openWeightsPosture },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 5. Temporal Milestones (2020-2026) + Overview
  chunks.push({
    id: 'milestone:overview-2020-2026',
    sourceType: 'milestone',
    sourceId: 'overview-2020-2026',
    title: 'Longitudinal AI Compute & Governance Milestones Overview (2020–2026)',
    location: 'Global Timeline (2020–2026)',
    jurisdictionSlug: null,
    url: 'https://app.sovdash.com/',
    permalink: 'https://app.sovdash.com/',
    content: `Early 2020–2022 mega-scale compute & multilateral milestones tracked in SovDash Temporal Replay (${TEMPORAL_MILESTONES.length} total milestones): ` +
      TEMPORAL_MILESTONES.filter((m) => String(m.date || '') <= '2023-12')
        .slice(0, 14)
        .map((m) => `${m.date} [${m.track.toUpperCase()}] ${m.title} (${m.location}, Source: ${m.source}): ${m.summary}`)
        .join(' | '),
    metadata: { track: 'overview' },
    embedding: computeEmbeddingVector('2020 2021 2022 early mega-scale compute UNESCO recommendation milestones timeline temporal replay')
  });

  for (const m of TEMPORAL_MILESTONES) {
    const content = `[${m.date}] (${m.track.toUpperCase()}) ${m.title} — ${m.location} (${m.country}). Source: ${m.source}. ${m.summary}${m.powerMw ? ` Compute Capacity: ${m.powerMw} MW.` : ''}`;
    chunks.push({
      id: `milestone:${m.id}`,
      sourceType: 'milestone',
      sourceId: m.id,
      title: `${m.date}: ${m.title}`,
      location: m.location || m.country || 'Global',
      jurisdictionSlug: null,
      url: m.url || 'https://app.sovdash.com/',
      permalink: 'https://app.sovdash.com/',
      content,
      metadata: { date: m.date, track: m.track, lat: m.lat, lon: m.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 6. Ethics Overlays (Environmental, Supply Chain, Biometrics, Labor, Censorship)
  for (const node of ENVIRONMENTAL_JUSTICE_NODES.slice(0, 60)) {
    const content = `Environmental Justice Hotspot (${node.country || 'Global'}): ${node.name}. Grid Carbon Intensity: ${node.carbonIntensity ?? 'N/A'} gCO2/kWh. Water Stress: ${node.waterStress || 'Elevated'}. Power: ${node.powerLoadMw || 'N/A'} MW. ${node.summary || node.description || ''}`;
    chunks.push({
      id: `ethics-env:${node.id}`,
      sourceType: 'ethics',
      sourceId: node.id,
      title: `Environmental Justice · ${node.name}`,
      location: node.country || node.name,
      jurisdictionSlug: null,
      url: node.url || 'https://app.sovdash.com/compute',
      permalink: 'https://app.sovdash.com/',
      content,
      metadata: { layer: 'environmental', lat: node.lat, lon: node.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  chunks.push({
    id: 'ethics:supply-chain-7stage-overview',
    sourceType: 'ethics',
    sourceId: 'supply-chain-overview',
    title: '7-Stage Global AI Semiconductor Supply Chain Chokepoints Overview',
    location: 'Global Corridors (65 Nodes / 50 Arcs)',
    jurisdictionSlug: null,
    url: 'https://app.sovdash.com/compute',
    permalink: 'https://app.sovdash.com/compute',
    content: 'SovDash tracks 65 supply-chain nodes and 50 directed arcs across 7 critical AI hardware stages: (1) Critical Minerals extraction (lithium/gallium/rare earths in Australia/DRC/China), (2) Chemical Refining & Silicon/Gallium purification, (3) EUV Lithography Tooling (ASML Veldhoven High-NA EUV & Lam/Tokyo Electron etch chokepoints), (4) Logic & HBM Memory Wafer Fabs (TSMC Hsinchu 2nm/3nm N3/N2, Samsung Pyeongtaek, SK hynix Icheon HBM3E/HBM4), (5) CoWoS Advanced 2.5D Packaging & Interposer Assembly (TSMC Zhunan/Chiayi), (6) Hyperscale Server Rack Integration, and (7) E-Waste & Hardware Recycling corridors.',
    metadata: { layer: 'supply_chain', arcsTotal: SUPPLY_CHAIN_ARCS.length },
    embedding: computeEmbeddingVector('7-stage AI semiconductor supply chain critical bottlenecks EUV ASML TSMC CoWoS HBM lithography wafer foundry packaging minerals')
  });

  for (const node of SUPPLY_CHAIN_NODES.slice(0, 70)) {
    const content = `AI Semiconductor Supply Chain Stage ${node.stage || ''}: ${node.name} (${node.country || 'Global'}). Role: ${node.role || node.category || 'Critical Bottleneck'}. Chokepoint Share: ${node.marketShare || node.summary || ''}`;
    chunks.push({
      id: `ethics-supply:${node.id}`,
      sourceType: 'ethics',
      sourceId: node.id,
      title: `AI Supply Chain · ${node.name}`,
      location: node.country || node.name,
      jurisdictionSlug: null,
      url: node.url || 'https://app.sovdash.com/compute',
      permalink: 'https://app.sovdash.com/',
      content,
      metadata: { layer: 'supply_chain', lat: node.lat, lon: node.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  for (const node of BIOMETRIC_WELFARE_NODES.slice(0, 50)) {
    const content = `Algorithmic Welfare & Biometrics (${node.country || 'Global'}): ${node.name}. Category: ${node.category || 'Public-Sector Automation'}. ${node.summary || node.description || ''}`;
    chunks.push({
      id: `ethics-bio:${node.id}`,
      sourceType: 'ethics',
      sourceId: node.id,
      title: `Biometrics & Welfare · ${node.name}`,
      location: node.country || 'Global',
      jurisdictionSlug: null,
      url: node.url || 'https://app.sovdash.com/',
      permalink: 'https://app.sovdash.com/',
      content,
      metadata: { layer: 'biometric_welfare', lat: node.lat, lon: node.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  for (const node of AI_LABOR_NODES.slice(0, 40)) {
    const content = `AI Labor, RLHF & Content Moderation Hub (${node.country || 'Global'}): ${node.name}. ${node.summary || node.description || ''}`;
    chunks.push({
      id: `ethics-labor:${node.id}`,
      sourceType: 'ethics',
      sourceId: node.id,
      title: `AI Labor & RLHF · ${node.name}`,
      location: node.country || 'Global',
      jurisdictionSlug: null,
      url: node.url || 'https://app.sovdash.com/',
      permalink: 'https://app.sovdash.com/',
      content,
      metadata: { layer: 'ai_labor', lat: node.lat, lon: node.lon },
      embedding: computeEmbeddingVector(content)
    });
  }

  chunks.push({
    id: 'ethics:censorship-ooni-ioda-overview',
    sourceType: 'ethics',
    sourceId: 'censorship-overview',
    title: 'Global Internet Censorship & Shutdown Monitoring (OONI + Georgia Tech IODA)',
    location: '180+ Country Coordinates Worldwide',
    jurisdictionSlug: null,
    url: 'https://api.ooni.io/',
    permalink: 'https://app.sovdash.com/',
    content: 'SovDash fuses live Open Observatory of Network Interference (OONI) Web Connectivity measurements, OONI Signal/Telegram/WhatsApp/Tor circumvention probes, and Georgia Tech IODA BGP/Active Probing outage alerts across 180+ countries to track state internet blackouts, social-platform throttling, and AI filtering regimes in real time.',
    metadata: { layer: 'censorship' },
    embedding: computeEmbeddingVector('OONI IODA global internet censorship shutdowns BGP throttling Signal Telegram WhatsApp Tor blackout monitoring 180 countries')
  });

  // 7. Unified Live Events, Curated LAWS Dossiers & RSS/Academic Papers (up to 450 items!)
  for (const ev of unifiedEvents.slice(0, 450)) {
    const dateStr = formatIsoDateShort(ev.timestamp);
    const content = `[${dateStr}] Signal [SEV-${ev.severity} · ${ev.category} · ${ev.domainPillar}] in ${ev.location} (Source: ${ev.source}): ${ev.title}. ${ev.summary}`;
    chunks.push({
      id: `${ev.origin === 'rss' ? 'rss' : 'sig'}:${ev.id}`,
      sourceType: ev.origin === 'rss' ? 'paper_rss' : 'signal',
      sourceId: String(ev.id),
      title: ev.title,
      location: ev.location,
      jurisdictionSlug: null,
      url: ev.url,
      permalink: ev.permalink,
      content,
      metadata: { severity: ev.severity, category: ev.category, timestamp: ev.timestamp, dateStr, lat: ev.lat, lon: ev.lon },
      embedding: computeEmbeddingVector(`${ev.title} ${ev.location} ${ev.source} ${ev.summary}`)
    });
  }

  // 8. Methodology + Observatory Global Inventory Summary + Vault Research Docs
  chunks.push({
    id: 'vault:sovdash-observatory-methodology',
    sourceType: 'vault',
    sourceId: 'methodology-core',
    title: 'Sovereign Observatory Methodology, Provenance & Global Dataset Inventory',
    location: 'Global / Research Architecture',
    jurisdictionSlug: null,
    url: 'https://app.sovdash.com/methodology',
    permalink: 'https://app.sovdash.com/methodology',
    content: `Sovereign Observatory (app.sovdash.com) indexes ${JURISDICTIONS.length} major national/sub-national jurisdictions (with ${regByJur.size} regional/state legislative registries covering ${aiRegs.length} normalized AI regulations), ${dataCenters.length} global PeeringDB data centers, ${frontierClusters.length} Epoch AI frontier compute clusters, ${unifiedEvents.length} deduplicated live intelligence events & research papers, 9 frontier AI labs, OONI/IODA censorship across 180+ countries, and 7-stage semiconductor supply chains using NATO Admiralty Reliability Grading (A1 primary statutory to D4 unverified), MIT AI Risk 7-Domain taxonomy, and the 5-pillar SAGRI Readiness Index.`,
    metadata: { route: '/methodology' },
    embedding: computeEmbeddingVector('Sovereign Observatory methodology Admiralty A1 MIT AI Risk 7-Domain SAGRI readiness index dataset counts inventory jurisdictions datacenters')
  });

  for (const doc of vaultDocs.slice(0, 60)) {
    const content = `Vault Research Dossier (${doc.category || 'Research'}): ${doc.title}. ${(doc.preview || doc.content || '').slice(0, 1800)}`;
    chunks.push({
      id: `vault:${doc.id}`,
      sourceType: 'vault',
      sourceId: String(doc.id),
      title: doc.title || 'Vault Brief',
      location: 'Sovereign Vault',
      jurisdictionSlug: null,
      url: 'https://app.sovdash.com/whitepaper',
      permalink: 'https://app.sovdash.com/whitepaper',
      content,
      metadata: { category: doc.category || 'Research' },
      embedding: computeEmbeddingVector(content)
    });
  }

  const deduped = new Map();
  for (const c of chunks) {
    if (c?.id && !deduped.has(c.id)) deduped.set(c.id, c);
  }
  return Array.from(deduped.values());
}

export async function syncKnowledgeIndex({ force = false } = {}) {
  const started = Date.now();
  if (!force) {
    const stats = await getKnowledgeChunkStats();
    if (stats.total >= 80) {
      return { skipped: true, totalChunks: stats.total, byType: stats.byType, hasPgVector: stats.hasPgVector, durationMs: Date.now() - started };
    }
  }
  const chunks = await buildFullEcosystemChunks();
  const res = await upsertKnowledgeChunks(chunks);
  const stats = await getKnowledgeChunkStats();
  return {
    skipped: false,
    upserted: res.upserted,
    totalChunks: stats.total || res.upserted,
    byType: stats.byType,
    hasPgVector: res.hasPgVector,
    durationMs: Date.now() - started
  };
}

function resolveGeographyTargets(queryText) {
  const lower = String(queryText || '').toLowerCase();
  const terms = new Set();
  const slugs = new Set();

  for (const j of JURISDICTIONS) {
    const hit =
      lower.includes(j.name.toLowerCase()) ||
      (j.matchPatterns || []).some((p) => {
        const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${esc}\\b`, 'i').test(lower);
      });
    if (hit) {
      slugs.add(j.slug);
      terms.add(j.name.toLowerCase().replace(/\s*\(.*?\)/g, ''));
      for (const p of (j.matchPatterns || []).slice(0, 12)) terms.add(p.toLowerCase());
    }
  }

  for (const g of GEO_ALIASES) {
    if (g.terms.some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower))) {
      terms.add(g.key);
      for (const t of g.terms) terms.add(t);
      if (g.key === 'united states') slugs.add('us');
      if (g.key === 'united kingdom') slugs.add('gb');
      if (g.key === 'european union') slugs.add('eu');
      if (g.key === 'south korea') slugs.add('kr');
      if (g.key === 'china') slugs.add('cn');
      if (g.key === 'uae') slugs.add('ae');
    }
  }

  for (const [regionKey, countries] of Object.entries(REGION_COUNTRIES)) {
    if (new RegExp(`\\b${regionKey}\\b`, 'i').test(lower)) {
      for (const c of countries) {
        terms.add(c);
        const jur = JURISDICTIONS.find((j) => j.name.toLowerCase().startsWith(c) || (j.matchPatterns || []).includes(c));
        if (jur) slugs.add(jur.slug);
      }
    }
  }

  return { slugs: Array.from(slugs), terms: Array.from(terms) };
}

/**
 * Multi-stage query planner classifying intent, geography, temporal recency needs, and follow-up continuity.
 */
export function analyzeQueryPlan(query, history = []) {
  const cleanQuery = String(query || '').trim();
  const wordCount = cleanQuery.split(/\s+/).filter(Boolean).length;
  let effectiveQuery = cleanQuery;

  // Carry geography/topic from prior turn if short follow-up like "what about in Spain?"
  if (history.length > 0 && wordCount <= 9 && /\b(what about|how about|and in|and for|there|that|those|it)\b/i.test(cleanQuery)) {
    const prevUser = [...history].reverse().find((h) => h.role === 'user')?.content || '';
    if (prevUser) effectiveQuery = `${prevUser} ${cleanQuery}`;
  }

  const geo = resolveGeographyTargets(effectiveQuery);
  const asksEvents = /\b(recent|latest|newest|happened|happening|event|events|signal|signals|news|today|this week|this month|feed|updates|incidents|articles|papers)\b/i.test(cleanQuery);
  const asksMilestones = /\b(milestone|milestones|timeline|2020|2021|2022|early)\b/i.test(cleanQuery);
  const asksInfra = !asksMilestones && /\b(data center|datacenter|data-center|facilities|peeringdb|clusters in|how many .*data center)\b/i.test(cleanQuery);
  const asksCompare = /\b(compare|contrast|difference|differences|versus|vs\.?|across|which countries)\b/i.test(cleanQuery) || geo.slugs.length >= 2;
  const asksReg = /\b(law|act|bill|statute|regulation|regulator|authority|banned|prohibited|penalty|penalties|reporting|compliance|policy|framework)\b/i.test(cleanQuery);

  let intent = 'comparative_analysis';
  if (asksEvents && !asksCompare) intent = 'temporal_events';
  else if (asksInfra && !asksCompare) intent = 'datacenter_infra';
  else if (!asksCompare && wordCount <= 14 && /^(who|what|when|where|which|is|does|how many)\b/i.test(cleanQuery) && !/\b(explain|summarize|all|bottlenecks|pillars|compare|how does sovdash)\b/i.test(cleanQuery)) {
    intent = 'concise_fact';
  } else if (asksReg && !asksCompare) {
    intent = 'regulation_lookup';
  }

  return {
    originalQuery: cleanQuery,
    effectiveQuery,
    intent,
    wordCount,
    asksEvents,
    asksInfra,
    asksCompare,
    asksReg,
    geoSlugs: geo.slugs,
    geoTerms: geo.terms
  };
}

function textMatchesGeoTerms(text, geoTerms) {
  if (!geoTerms || geoTerms.length === 0) return true;
  const lower = String(text || '').toLowerCase();
  return geoTerms.some((t) => {
    if (t.length <= 3) {
      return new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower);
    }
    return lower.includes(t);
  });
}

function reconstructOpenAlexAbstract(inverted) {
  if (!inverted || typeof inverted !== 'object') return '';
  const words = [];
  for (const [token, positions] of Object.entries(inverted)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) words[pos] = token;
  }
  return words.filter(Boolean).join(' ').slice(0, 700);
}

function scoreCandidateOverlap(text, queryTokens) {
  const lower = String(text || '').toLowerCase();
  if (!lower || queryTokens.length === 0) return 0;
  let hits = 0;
  for (const t of queryTokens) {
    if (lower.includes(t)) hits += 1;
  }
  return hits / Math.max(1, queryTokens.length);
}

export async function fetchOpenWebAugmentation(query, maxItems = 3) {
  const queryTokens = tokenizeForRag(query).slice(0, 10);
  if (queryTokens.length === 0) return [];
  const qEncoded = encodeURIComponent(query.slice(0, 180));
  const candidates = [];

  await Promise.allSettled([
    (async () => {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${qEncoded}&srlimit=3&format=json&origin=*`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (!res.ok) return;
      const json = await res.json();
      for (const hit of json?.query?.search || []) {
        const snippet = String(hit.snippet || '').replace(/<[^>]+>/g, '');
        candidates.push({
          id: `web:wiki:${hit.pageid}`,
          sourceType: 'external_web',
          sourceLabel: 'Wikipedia Open Reference',
          title: hit.title,
          location: 'Open Reference',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(hit.title || '').replace(/\s+/g, '_'))}`,
          permalink: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(hit.title || '').replace(/\s+/g, '_'))}`,
          content: snippet,
          overlap: scoreCandidateOverlap(`${hit.title} ${snippet}`, queryTokens)
        });
      }
    })(),
    (async () => {
      const res = await fetch(
        `https://api.openalex.org/works?search=${qEncoded}&per-page=3&sort=relevance_score:desc`,
        { signal: AbortSignal.timeout(3800) }
      );
      if (!res.ok) return;
      const json = await res.json();
      for (const work of json?.results || []) {
        const abs = reconstructOpenAlexAbstract(work.abstract_inverted_index);
        const url = work.doi ? `https://doi.org/${work.doi.replace(/^https?:\/\/doi\.org\//i, '')}` : work.id;
        candidates.push({
          id: `web:oa:${work.id?.split('/').pop() || Math.random().toString(36).slice(2)}`,
          sourceType: 'external_web',
          sourceLabel: `OpenAlex Peer-Reviewed (${work.publication_year || 'Scholarly'})`,
          title: work.title || 'Scholarly Work',
          location: 'Academic Literature',
          url,
          permalink: url,
          content: abs || `${work.title} (${work.publication_year || ''})`,
          overlap: scoreCandidateOverlap(`${work.title} ${abs}`, queryTokens)
        });
      }
    })()
  ]);

  return candidates
    .filter((c) => c.title && c.overlap >= 0.25 && c.content.length >= 25)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, maxItems);
}

export async function retrieveHybridEvidence(query, { topK = 14, allowWebAugmentation = true, history = [] } = {}) {
  const retrievalSteps = [];
  const plan = analyzeQueryPlan(query, history);
  const safeTopK = Math.min(20, Math.max(4, Number(topK) || 14));
  const queryVec = computeEmbeddingVector(plan.effectiveQuery);
  const queryTokens = tokenizeForRag(plan.effectiveQuery);

  const stats = await getKnowledgeChunkStats();
  if (stats.total < 80) {
    await syncKnowledgeIndex({ force: true });
  }

  // Parallel Multi-Store Query:
  // A) Neon pgvector cosine + FTS
  // B) Guaranteed named jurisdictions & architectural chunks
  // C) Live chronological events/RSS/laws/data-center direct query
  const guaranteedIds = plan.geoSlugs.map((s) => `jur:${s}`);
  if (/\b(milestone|timeline|2020|2021|2022|early)\b/i.test(plan.effectiveQuery)) guaranteedIds.push('milestone:overview-2020-2026');
  if (/\b(supply chain|bottleneck|euv|cowos|hbm)\b/i.test(plan.effectiveQuery)) guaranteedIds.push('ethics:supply-chain-7stage-overview');
  if (/\b(anthropic|openai|rsp|preparedness)\b/i.test(plan.effectiveQuery)) guaranteedIds.push('lab:anthropic', 'lab:openai');
  if (/\b(sagri|admiralty|methodology|pillars)\b/i.test(plan.effectiveQuery)) guaranteedIds.push('vault:sovdash-observatory-methodology');
  if (/\b(water stress|carbon intensity|environmental justice)\b/i.test(plan.effectiveQuery)) {
    guaranteedIds.push(
      'ethics-env:env-memphis-colossus',
      'ethics-env:env-phoenix-water',
      'ethics-env:env-epoch-global'
    );
  }

  const t0 = Date.now();
  const [pgRaw, guaranteedRows, datasets] = await Promise.all([
    searchKnowledgeChunksPgVector(queryVec, plan.effectiveQuery, Math.max(56, safeTopK * 4)),
    guaranteedIds.length > 0 ? getKnowledgeChunksByIds(guaranteedIds) : Promise.resolve([]),
    getUnifiedLiveDatasets()
  ]);
  retrievalSteps.push({
    step: `Scanned ${stats.total} vector records, ${datasets.unifiedEvents.length} live events/papers, ${datasets.aiRegs.length} statutes & ${datasets.dataCenters.length} data centers`,
    ms: Date.now() - t0
  });

  // Live direct matching over unified chronological events (crucial for "recent AI events in USA", etc.)
  const liveEventChunks = [];
  const evFilterStart = Date.now();
  const nonGeoTokens = queryTokens.filter((t) => !plan.geoTerms.includes(t) && t.length >= 4);
  const matchingEvents = datasets.unifiedEvents.filter((ev) => {
    const hay = `${ev.location} ${ev.title} ${ev.summary}`;
    const geoOk = textMatchesGeoTerms(hay, plan.geoTerms);
    if (!geoOk) return false;
    if (plan.asksEvents) return true;
    const topicHits = nonGeoTokens.filter((tok) => hay.toLowerCase().includes(tok)).length;
    return topicHits >= Math.min(2, nonGeoTokens.length);
  });

  for (const ev of matchingEvents.slice(0, plan.asksEvents ? 12 : 4)) {
    const dateStr = formatIsoDateShort(ev.timestamp);
    liveEventChunks.push({
      id: `live-ev:${ev.id}`,
      sourceType: ev.origin === 'rss' ? 'paper_rss' : 'signal',
      sourceId: String(ev.id),
      title: ev.title,
      location: ev.location,
      jurisdictionSlug: plan.geoSlugs[0] || null,
      url: ev.url,
      permalink: ev.permalink,
      content: `[${dateStr}] ${ev.title} — Location: ${ev.location}. Source: ${ev.source} (${ev.domainPillar}, SEV-${ev.severity}). ${ev.summary}`,
      metadata: { timestamp: ev.timestamp, dateStr, tsMs: ev.tsMs, lat: ev.lat, lon: ev.lon },
      vecScore: plan.asksEvents ? 0.88 : 0.45,
      lexRankDb: plan.asksEvents ? 1 : 25,
      isLiveRecencyMatch: plan.asksEvents
    });
  }
  if (liveEventChunks.length > 0) {
    retrievalSteps.push({
      step: `Filtered ${matchingEvents.length} matching live events${plan.asksEvents ? ' sorted newest-first' : ''}`,
      ms: Date.now() - evFilterStart
    });
  }

  // Live direct matching over 472 statutes & 6,033 data centers when geography or topic mentions them
  const liveInfraAndRegChunks = [];
  if (plan.geoTerms.length > 0 || plan.asksInfra || plan.asksReg) {
    const matchingRegs = datasets.aiRegs.filter((r) => {
      const hay = `${normalizeRegJurisdictionLabel(r.jurisdiction)} ${r.title} ${r.description || ''}`;
      if (plan.geoTerms.length > 0 && !textMatchesGeoTerms(hay, plan.geoTerms)) return false;
      return plan.asksReg || plan.geoTerms.length > 0;
    });
    if (matchingRegs.length > 0 && (plan.asksReg || plan.geoSlugs.length > 0)) {
      const topRegs = matchingRegs.slice(0, 4);
      for (const r of topRegs) {
        const nj = normalizeRegJurisdictionLabel(r.jurisdiction);
        liveInfraAndRegChunks.push({
          id: `live-reg:${r.id || slugifyId(r.title)}`,
          sourceType: 'regulation',
          sourceId: String(r.id || ''),
          title: `${r.title} (${nj})`,
          location: nj,
          jurisdictionSlug: plan.geoSlugs[0] || null,
          url: r.url || 'https://app.sovdash.com/compare',
          permalink: 'https://app.sovdash.com/compare',
          content: `AI Statute (${nj}, Status: ${r.status || 'Tracked'}, Effective: ${r.date || 'N/A'}): ${r.title}. ${r.description || ''}`,
          metadata: { lat: r.lat, lon: r.lon },
          vecScore: 0.78,
          lexRankDb: 2
        });
      }
    }

    if (plan.asksInfra) {
      const matchingDcs = datasets.dataCenters.filter((dc) => {
        const hay = `${dc.country || ''} ${dc.city || ''} ${dc.name || ''} ${dc.operator || ''}`;
        return plan.geoTerms.length === 0 || textMatchesGeoTerms(hay, plan.geoTerms);
      });
      if (matchingDcs.length > 0) {
        const cities = Array.from(new Set(matchingDcs.map((d) => d.city).filter(Boolean))).slice(0, 8);
        const ops = Array.from(new Set(matchingDcs.map((d) => d.operator || d.owner).filter(Boolean))).slice(0, 8);
        const s0 = matchingDcs[0];
        liveInfraAndRegChunks.push({
          id: `live-dc-agg:${slugifyId(plan.geoTerms[0] || 'global')}`,
          sourceType: 'datacenter',
          sourceId: 'live-dc-count',
          title: `Live Data Center Facility Count${plan.geoSlugs[0] ? ` (${plan.geoSlugs[0].toUpperCase()})` : ''}: ${matchingDcs.length} Facilities`,
          location: s0?.country || 'Global',
          jurisdictionSlug: plan.geoSlugs[0] || null,
          url: 'https://app.sovdash.com/compute',
          permalink: 'https://app.sovdash.com/compute',
          content: `SovDash PeeringDB & Compute Registry contains ${matchingDcs.length} matching data center facilities${plan.geoTerms[0] ? ` for ${plan.geoTerms[0]}` : ''}. Top cities: ${cities.join(', ') || 'Multiple'}. Operators include: ${ops.join(', ') || 'Multiple operators'}.`,
          metadata: { count: matchingDcs.length, lat: s0?.lat, lon: s0?.lon },
          vecScore: 0.9,
          lexRankDb: 1
        });
      }
    }
  }

  // Merge all candidates uniquely, preserving newest live events + guaranteed jurisdictions
  const combinedMap = new Map();
  const pushUnique = (item) => {
    if (!item?.id) return;
    if (!combinedMap.has(item.id)) combinedMap.set(item.id, item);
  };
  for (const x of liveEventChunks) pushUnique(x);
  for (const x of liveInfraAndRegChunks) pushUnique(x);
  for (const x of guaranteedRows) pushUnique(x);
  for (const x of pgRaw) pushUnique(x);

  const rawCandidates = Array.from(combinedMap.values());

  const lexScored = rawCandidates.map((c) => {
    const hayTitle = String(c.title || '').toLowerCase();
    const hayBody = String(c.content || '').toLowerCase();
    let lexHits = 0;
    for (const tok of queryTokens) {
      if (hayTitle.includes(tok)) lexHits += 2.2;
      else if (hayBody.includes(tok)) lexHits += 1.0;
    }
    const entityMatch = c.jurisdictionSlug && plan.geoSlugs.includes(c.jurisdictionSlug) ? 1 : 0;
    return { ...c, lexScoreLocal: lexHits, entityMatch };
  });

  const byVec = [...lexScored].sort((a, b) => (b.vecScore || 0) - (a.vecScore || 0));
  const byLex = [...lexScored].sort((a, b) => (b.lexScoreLocal + b.entityMatch * 3) - (a.lexScoreLocal + a.entityMatch * 3));
  const vecRankMap = new Map(byVec.map((c, idx) => [c.id, idx + 1]));
  const lexRankMap = new Map(byLex.map((c, idx) => [c.id, idx + 1]));

  const rrfRanked = lexScored.map((c) => {
    const vRank = vecRankMap.get(c.id) || 200;
    const lRank = lexRankMap.get(c.id) || 200;
    const dbRank = c.lexRankDb && c.lexRankDb < 200 ? c.lexRankDb : 200;
    let rrf = 1 / (60 + vRank) + 1 / (60 + lRank) + 0.5 / (60 + dbRank);

    if (plan.intent === 'temporal_events' && c.isLiveRecencyMatch) {
      rrf += 0.09; // Prioritize chronological live feed matches for recency queries
    }
    if (plan.intent === 'datacenter_infra' && (c.sourceType === 'datacenter' || c.sourceType === 'compute')) {
      rrf += 0.06;
    }
    if (c.sourceType === 'jurisdiction' && c.entityMatch) rrf += 0.04;
    if (/\b(milestone|timeline|replay|2020|2021|2022|early)\b/i.test(plan.effectiveQuery) && c.sourceType === 'milestone') rrf += 0.06;
    if (/\b(sagri|admiralty|methodology|pillars)\b/i.test(plan.effectiveQuery) && c.id === 'vault:sovdash-observatory-methodology') rrf += 0.08;
    if (/\b(supply chain|bottleneck|euv|cowos|hbm|lithography|wafer)\b/i.test(plan.effectiveQuery) && c.metadata?.layer === 'supply_chain') rrf += 0.05;
    if (/\b(water|carbon|co2|environmental|grid|emission)\b/i.test(plan.effectiveQuery) && c.metadata?.layer === 'environmental') rrf += 0.06;
    if (/\b(rlhf|labor|labeling|moderation|worker)\b/i.test(plan.effectiveQuery) && c.metadata?.layer === 'ai_labor') rrf += 0.04;
    if (/\b(anthropic|openai|rsp|preparedness|frontier lab|safety framework)\b/i.test(plan.effectiveQuery) && c.sourceType === 'lab') rrf += 0.045;

    return {
      ...c,
      score: Number(rrf.toFixed(5)),
      overlapRatio: queryTokens.length ? Math.min(1, c.lexScoreLocal / Math.max(1, queryTokens.length)) : (c.isLiveRecencyMatch ? 0.85 : 0)
    };
  }).sort((a, b) => b.score - a.score);

  const selected = [];
  const usedIds = new Set();

  // Guarantee top live chronological events first when asking for recent events
  if (plan.intent === 'temporal_events') {
    for (const evChunk of liveEventChunks.slice(0, 8)) {
      const scored = rrfRanked.find((x) => x.id === evChunk.id);
      if (scored && !usedIds.has(scored.id)) {
        selected.push(scored);
        usedIds.add(scored.id);
      }
    }
  }

  // Guarantee every explicitly mentioned jurisdiction chunk
  for (const slug of plan.geoSlugs) {
    const primaryJur = rrfRanked.find((c) => c.jurisdictionSlug === slug && c.sourceType === 'jurisdiction' && !usedIds.has(c.id))
      || rrfRanked.find((c) => c.jurisdictionSlug === slug && !usedIds.has(c.id));
    if (primaryJur && selected.length < safeTopK) {
      selected.push(primaryJur);
      usedIds.add(primaryJur.id);
    }
  }

  for (const cand of rrfRanked) {
    if (selected.length >= safeTopK) break;
    if (!usedIds.has(cand.id)) {
      selected.push(cand);
      usedIds.add(cand.id);
    }
  }

  const maxOverlap = selected.reduce((m, c) => Math.max(m, c.overlapRatio || 0), 0);
  const maxVec = selected.reduce((m, c) => Math.max(m, c.vecScore || 0), 0);

  let externalWeb = [];
  if (allowWebAugmentation && !plan.asksEvents && (maxOverlap < 0.45 || maxVec < 0.35 || /\b(paper|study|scholar|academic|wikipedia|literature|history)\b/i.test(plan.effectiveQuery))) {
    const webT0 = Date.now();
    externalWeb = await fetchOpenWebAugmentation(plan.effectiveQuery, 3).catch(() => []);
    if (externalWeb.length > 0) {
      retrievalSteps.push({ step: `Supplemented with ${externalWeb.length} open scholarly reference(s)`, ms: Date.now() - webT0 });
    }
  }

  return {
    plan,
    retrievalSteps,
    internalChunks: selected,
    externalWebChunks: externalWeb,
    diagnostics: {
      indexedTotal: stats.total,
      hasPgVector: stats.hasPgVector,
      mentionedJurisdictions: plan.geoSlugs,
      intent: plan.intent,
      liveEventMatches: liveEventChunks.length,
      maxOverlap: Number(maxOverlap.toFixed(3)),
      maxVectorSimilarity: Number(maxVec.toFixed(3)),
      webAugmentedCount: externalWeb.length
    }
  };
}
