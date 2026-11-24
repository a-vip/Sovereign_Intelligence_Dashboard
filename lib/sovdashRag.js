import {
  getEvents,
  getRssItems,
  getAiRegulations,
  getDataCenters,
  getFrontierClusters,
  getVaultDocs
} from './db.js';
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
  cosineSimilarityArrays,
  getKnowledgeChunksByIds,
  getKnowledgeChunkStats,
  searchKnowledgeChunksPgVector,
  upsertKnowledgeChunks
} from './sovdashAiDb.js';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'which', 'how', 'when', 'where',
  'who', 'why', 'are', 'was', 'were', 'have', 'has', 'had', 'into', 'about', 'compare', 'over',
  'under', 'between', 'across', 'explain', 'does', 'will', 'can', 'could', 'should', 'would',
  'tell', 'give', 'list', 'show', 'summary', 'summarize', 'their', 'there', 'they', 'been', 'also'
]);

// Canonical domain concept clusters mapped into shared semantic dimensions for deterministic 256-d pgvector alignment
const DOMAIN_SYNONYM_GROUPS = [
  ['incident', 'reporting', 'report', 'notification', 'window', 'deadline', 'caloes', 'art 73', 'article 73', '24 hours', '15 days', '72 hours', '10 days', '2 days'],
  ['european union', 'eu', 'ai act', '2024/1689', 'brussels', 'ai office', 'gpai', 'omnibus', '2026/1744'],
  ['california', 'sb 53', 'sb53', 'ab 2013', 'caloes', 'frontier ai', 'us-ca'],
  ['south korea', 'korea', 'ai basic act', '36053', 'msit', 'korea ai safety institute'],
  ['china', 'cac', 'algorithm', 'deep synthesis', 'beijing', 'watermarking'],
  ['united kingdom', 'uk', 'aisi', 'bletchley', 'online safety', 'ofcom', 'ico'],
  ['united states', 'federal', 'caisi', 'nist', 'bis', 'export control', 'semiconductor', 'cisa'],
  ['compute', 'cluster', 'datacenter', 'data center', 'megawatt', 'mw', 'gw', 'gpu', 'h100', 'epoch', 'peeringdb'],
  ['environmental', 'water', 'aqueduct', 'carbon', 'co2', 'ember', 'emissions', 'cooling', 'grid'],
  ['supply chain', 'lithography', 'euv', 'asml', 'tsmc', 'foundry', 'cowos', 'hbm', 'rare earth', 'minerals'],
  ['censorship', 'ooni', 'ioda', 'shutdown', 'blackout', 'bgp', 'throttling', 'blocking'],
  ['biometric', 'welfare', 'facial recognition', 'surveillance', 'iris', 'policing', 'automated decision'],
  ['labor', 'rlhf', 'annotation', 'labeling', 'moderation', 'workers', 'outsourcing'],
  ['frontier lab', 'anthropic', 'openai', 'deepmind', 'meta', 'xai', 'mistral', 'rsp', 'preparedness', 'metr'],
  ['penalties', 'fine', 'turnover', 'enforcement', 'sanction', 'prohibited', 'banned', 'whistleblower']
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

/**
 * Deterministic, zero-cost L2-normalized 256-dim semantic + lexical feature-hashing vector.
 * Stored as native `vector(256)` inside Neon PostgreSQL `pgvector`.
 */
export function computeEmbeddingVector(text, dim = EMBEDDING_DIM) {
  const vec = new Float32Array(dim);
  const rawLower = String(text || '').toLowerCase();
  const tokens = tokenizeForRag(rawLower).slice(0, 260);

  // 1. Unigram weighted signed projection
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const h = fnv1aHash(tok, 2166136261);
    const idx = h % dim;
    const sign = (h & 1) === 0 ? 1 : -1;
    const weight = tok.length >= 5 ? 1.35 : 1.0;
    vec[idx] += sign * weight;

    // Char trigram smoothing for morphological variants (report/reporting/reported, korea/korean)
    if (tok.length >= 5) {
      for (let j = 0; j <= tok.length - 4; j += 2) {
        const sub = tok.slice(j, j + 4);
        const sh = fnv1aHash(sub, 974123);
        vec[sh % dim] += ((sh & 1) === 0 ? 1 : -1) * 0.35;
      }
    }

    // 2. Bigram phrase feature
    if (i + 1 < tokens.length) {
      const bi = `${tok}_${tokens[i + 1]}`;
      const bh = fnv1aHash(bi, 5582311);
      vec[bh % dim] += ((bh & 1) === 0 ? 1 : -1) * 1.45;
    }
  }

  // 3. Domain concept-cluster projection for semantic recall across statutory aliases
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

export async function buildFullEcosystemChunks() {
  const chunks = [];

  // 1. Jurisdictions + Regulatory Diff Profiles (highest statutory authority)
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
      metadata: { iso: j.iso, region: j.region, posture: j.posture },
      embedding: computeEmbeddingVector(`${j.name} ${j.iso} ${j.regulator} ${content}`)
    });
  }

  // 2. Frontier Labs Watch
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

  // 3. Temporal Milestones (2020-2026+) + Consolidated Timeline Overview
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
      metadata: { date: m.date, track: m.track },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 4. Ethics & Society Overlays (Env Justice, Supply Chain, Biometrics, AI Labor, Censorship overview)
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
      metadata: { layer: 'environmental' },
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
      metadata: { layer: 'supply_chain', arcsTotal: SUPPLY_CHAIN_ARCS.length },
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
      metadata: { layer: 'biometric_welfare' },
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
      metadata: { layer: 'ai_labor' },
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

  // 5. Methodology & Observatory Architecture reference chunk
  chunks.push({
    id: 'vault:sovdash-observatory-methodology',
    sourceType: 'vault',
    sourceId: 'methodology-core',
    title: 'Sovereign Observatory Methodology, Provenance & NATO Admiralty Grading',
    location: 'Global / Research Architecture',
    jurisdictionSlug: null,
    url: 'https://app.sovdash.com/methodology',
    permalink: 'https://app.sovdash.com/methodology',
    content: 'Sovereign Observatory (app.sovdash.com) indexes AI governance statutes, compute clusters, frontier safety evaluations, cybersecurity incidents, and OSINT wires using NATO Admiralty Reliability Grading (A1 primary statutory to D4 unverified), MIT AI Risk 7-Domain taxonomy, SHA-256 content integrity on signal dossiers (/signal/[id]), 38-jurisdiction SAGRI Readiness Index, and 7-stage semiconductor supply-chain graphs.',
    metadata: { route: '/methodology' },
    embedding: computeEmbeddingVector('Sovereign Observatory methodology Admiralty A1 MIT AI Risk 7-Domain SAGRI readiness index provenance citation lock')
  });

  // 6. Live Postgres Datasets (AI Regulations, Frontier Clusters, Data Centers, Events, RSS/Papers, Vault Docs)
  const [aiRegs, frontierClusters, dataCenters, liveEvents, rssItems, vaultDocs] = await Promise.all([
    getAiRegulations().catch(() => []),
    getFrontierClusters(200).catch(() => []),
    getDataCenters().catch(() => []),
    getEvents('90d').catch(() => []),
    getRssItems(140).catch(() => []),
    getVaultDocs().catch(() => [])
  ]);

  // 6a. AI Regulations Registry (all ~470+ items)
  for (const r of (aiRegs || []).slice(0, 520)) {
    const id = `reg:${r.id || r.title?.slice(0, 40)}`;
    const content = `AI Regulation (${r.jurisdiction || 'Global'}, Status: ${r.status || 'Tracked'}, Focus: ${r.focus_area || r.category || 'Governance'}, Effective: ${r.effective_date || r.year || 'N/A'}): ${r.title}. ${r.summary || r.description || ''} Source: ${r.source || 'AI Regulation Registry'}.`;
    chunks.push({
      id,
      sourceType: 'regulation',
      sourceId: String(r.id || ''),
      title: r.title || 'AI Regulation',
      location: r.jurisdiction || 'Global',
      jurisdictionSlug: null,
      url: r.url || 'https://app.sovdash.com/compare',
      permalink: 'https://app.sovdash.com/compare',
      content,
      metadata: { status: r.status || '', jurisdiction: r.jurisdiction || '' },
      embedding: computeEmbeddingVector(`${r.title} ${r.jurisdiction} ${content}`)
    });
  }

  // 6b. Epoch AI Frontier Compute Clusters
  for (const c of (frontierClusters || []).slice(0, 200)) {
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
      metadata: { powerMw: c.powerMw || 0, owner: c.owner || '' },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 6c. PeeringDB & Infrastructure Data Centers (top 120 concise records)
  for (const dc of (dataCenters || []).slice(0, 120)) {
    const content = `Data Center Facility: ${dc.name || dc.title} (Country: ${dc.country || 'Global'}, City/Address: ${dc.city || dc.address || dc.location || 'Verified Coordinates'}, Operator/Owner: ${dc.owner || dc.operator || 'Network Operator'}). Purpose: ${dc.facilityPurpose || dc.purpose || 'Interconnection & Compute Colocation'}. Networks/IX: ${dc.netCount || 0} ASNs.`;
    chunks.push({
      id: `dc:${dc.id || dc.name?.slice(0, 40)}`,
      sourceType: 'datacenter',
      sourceId: String(dc.id || ''),
      title: `Data Center · ${dc.name || dc.title}`,
      location: `${dc.city || ''} ${dc.country || ''}`.trim() || 'Global',
      jurisdictionSlug: null,
      url: dc.url || 'https://www.peeringdb.com/',
      permalink: 'https://app.sovdash.com/compute',
      content,
      metadata: { kind: 'datacenter' },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 6d. Published Signals / OSINT Events
  for (const ev of (liveEvents || []).slice(0, 260)) {
    const id = `sig:${ev.id}`;
    const summary = ev.details?.summary || ev.summary || ev.title || '';
    const src = ev.details?.source || ev.source || 'OSINT Wire';
    const content = `Tracked Signal [SEV-${ev.severity || 2} · ${ev.category || 'Policy'}] (${ev.location || 'Global'}, Source: ${src}, Published: ${ev.timestamp || ev.original_post_time || 'Recent'}): ${ev.title}. ${summary}`;
    chunks.push({
      id,
      sourceType: 'signal',
      sourceId: String(ev.id),
      title: ev.title || 'Tracked Signal',
      location: ev.location || 'Global',
      jurisdictionSlug: null,
      url: ev.url || absolutePermalink(`/signal/${encodeURIComponent(ev.id)}`),
      permalink: absolutePermalink(`/signal/${encodeURIComponent(ev.id)}`),
      content,
      metadata: { severity: ev.severity || 2, category: ev.category || 'Policy', source: src },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 6e. Academic Papers & Live RSS Wire
  for (const item of (rssItems || []).slice(0, 140)) {
    const id = `rss:${item.id}`;
    const content = `Research / Feed Wire (${item.source || 'Verified Wire'}, ${item.location || 'Global'}, Category: ${item.category || 'Policy'}): ${item.title}. ${item.details?.summary || item.summary || ''}`;
    chunks.push({
      id,
      sourceType: 'paper_rss',
      sourceId: String(item.id),
      title: item.title || 'Research Wire Item',
      location: item.location || 'Global',
      jurisdictionSlug: null,
      url: item.url || 'https://app.sovdash.com/',
      permalink: 'https://app.sovdash.com/',
      content,
      metadata: { source: item.source || '' },
      embedding: computeEmbeddingVector(content)
    });
  }

  // 6f. Vault Research Docs
  for (const doc of (vaultDocs || []).slice(0, 60)) {
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

  // Deduplicate by id just in case
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

// Reconstruct abstract text from OpenAlex abstract_inverted_index (same zero-key technique as AskAvi)
function reconstructOpenAlexAbstract(inverted) {
  if (!inverted || typeof inverted !== 'object') return '';
  const words = [];
  for (const [token, positions] of Object.entries(inverted)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) {
      words[pos] = token;
    }
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

/**
 * Zero-key external scholarly & open knowledge gap-fill (Wikipedia + OpenAlex + Crossref).
 * Strictly tagged as external_web so users always distinguish internal SovDash DB vs open scholarly web.
 */
export async function fetchOpenWebAugmentation(query, maxItems = 3) {
  const queryTokens = tokenizeForRag(query).slice(0, 10);
  if (queryTokens.length === 0) return [];

  const qEncoded = encodeURIComponent(query.slice(0, 180));
  const candidates = [];

  await Promise.allSettled([
    (async () => {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${qEncoded}&srlimit=3&format=json&origin=*`,
        { signal: AbortSignal.timeout(3800) }
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
        { signal: AbortSignal.timeout(4000) }
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

// Detect explicit jurisdiction or entity mentions so comparative multi-jurisdiction questions
// guarantee at least 1 chunk per named jurisdiction in the top-K context window.
const ENTITY_DETECTORS = [
  { slug: 'eu', patterns: [/\beu\b/i, /european union/i, /ai act/i, /2024\/1689/i, /art(?:icle)?\s*73/i] },
  { slug: 'us-ca', patterns: [/california/i, /\bsb\s*53\b/i, /caloes/i, /\bab\s*2013\b/i] },
  { slug: 'kr', patterns: [/south korea/i, /\bkorea\b/i, /ai basic act/i, /36053/i, /\bmsit\b/i] },
  { slug: 'cn', patterns: [/\bchina\b/i, /\bcac\b/i, /beijing/i, /deep synthesis/i] },
  { slug: 'gb', patterns: [/united kingdom/i, /\buk\b/i, /\baisi\b/i, /ofcom/i] },
  { slug: 'us', patterns: [/united states/i, /\bcaisi\b/i, /\bnist\b/i, /federal/i] },
  { slug: 'sg', patterns: [/singapore/i, /\bimda\b/i, /\bpdpc\b/i] },
  { slug: 'br', patterns: [/brazil/i, /\banpd\b/i, /pl\s*2338/i] },
  { slug: 'in', patterns: [/\bindia\b/i, /dpdp/i, /cert-in/i] },
  { slug: 'za', patterns: [/south africa/i, /popia/i] },
  { slug: 'ke', patterns: [/\bkenya\b/i, /\bodpc\b/i] },
  { slug: 'id', patterns: [/indonesia/i, /uu\s*pdp/i, /komdigi/i] }
];

export async function retrieveHybridEvidence(query, { topK = 12, allowWebAugmentation = true } = {}) {
  const cleanQuery = String(query || '').trim();
  const safeTopK = Math.min(20, Math.max(4, Number(topK) || 12));
  const queryVec = computeEmbeddingVector(cleanQuery);
  const queryTokens = tokenizeForRag(cleanQuery);

  // Lazy auto-index if pgvector table is unpopulated
  const stats = await getKnowledgeChunkStats();
  if (stats.total < 40) {
    await syncKnowledgeIndex({ force: true });
  }

  const mentionedSlugs = ENTITY_DETECTORS
    .filter((d) => d.patterns.some((p) => p.test(cleanQuery)))
    .map((d) => d.slug);

  const rawCandidates = await searchKnowledgeChunksPgVector(queryVec, cleanQuery, Math.max(48, safeTopK * 4));
  // Guarantee every explicitly named jurisdiction + architectural overview chunk is in the candidate pool
  const guaranteedIds = mentionedSlugs.map((s) => `jur:${s}`);
  if (/\b(milestone|timeline|2020|2021|2022|early)\b/i.test(cleanQuery)) guaranteedIds.push('milestone:overview-2020-2026');
  if (/\b(supply chain|bottleneck|euv|cowos|hbm)\b/i.test(cleanQuery)) guaranteedIds.push('ethics:supply-chain-7stage-overview');
  if (/\b(anthropic|openai|rsp|preparedness)\b/i.test(cleanQuery)) guaranteedIds.push('lab:anthropic', 'lab:openai');

  const existingIdSet = new Set(rawCandidates.map((c) => c.id));
  const missingGuaranteed = guaranteedIds.filter((id) => !existingIdSet.has(id));
  if (missingGuaranteed.length > 0) {
    const fetchedGuaranteed = await getKnowledgeChunksByIds(missingGuaranteed);
    rawCandidates.unshift(...fetchedGuaranteed);
  }

  // Also rank lexically across returned candidates for Reciprocal Rank Fusion (RRF)
  const lexScored = rawCandidates.map((c) => {
    const hayTitle = String(c.title || '').toLowerCase();
    const hayBody = String(c.content || '').toLowerCase();
    let lexHits = 0;
    let titleHits = 0;
    for (const tok of queryTokens) {
      if (hayTitle.includes(tok)) {
        lexHits += 2.2;
        titleHits += 1;
      } else if (hayBody.includes(tok)) {
        lexHits += 1.0;
      }
    }
    const entityMatch = c.jurisdictionSlug && mentionedSlugs.includes(c.jurisdictionSlug) ? 1 : 0;
    return {
      ...c,
      lexScoreLocal: lexHits,
      titleHits,
      entityMatch
    };
  });

  const byVec = [...lexScored].sort((a, b) => (b.vecScore || 0) - (a.vecScore || 0));
  const byLex = [...lexScored].sort((a, b) => (b.lexScoreLocal + b.entityMatch * 3) - (a.lexScoreLocal + a.entityMatch * 3));
  const vecRankMap = new Map(byVec.map((c, idx) => [c.id, idx + 1]));
  const lexRankMap = new Map(byLex.map((c, idx) => [c.id, idx + 1]));

  const rrfRanked = lexScored.map((c) => {
    const vRank = vecRankMap.get(c.id) || 200;
    const lRank = lexRankMap.get(c.id) || 200;
    const dbRank = c.lexRankDb && c.lexRankDb < 200 ? c.lexRankDb : 200;
    // RRF k=60 + targeted jurisdiction authority & title precision bonus
    let rrf = 1 / (60 + vRank) + 1 / (60 + lRank) + 0.5 / (60 + dbRank);
    if (c.sourceType === 'jurisdiction' && c.entityMatch) rrf += 0.035;
    else if (c.entityMatch) rrf += 0.015;
    if (c.sourceType === 'jurisdiction' && mentionedSlugs.length > 0 && c.jurisdictionSlug && mentionedSlugs.includes(c.jurisdictionSlug)) {
      rrf += 0.02;
    }
    // Intent-specific sourceType boosts for architectural/overview queries
    if (/\b(milestone|timeline|replay|2020|2021|2022|early)\b/i.test(cleanQuery) && c.sourceType === 'milestone') {
      rrf += 0.045;
    }
    if (/\b(supply chain|bottleneck|euv|cowos|hbm|lithography|wafer)\b/i.test(cleanQuery) && c.metadata?.layer === 'supply_chain') {
      rrf += 0.04;
    }
    if (/\b(water|carbon|co2|environmental|grid|emission)\b/i.test(cleanQuery) && c.metadata?.layer === 'environmental') {
      rrf += 0.04;
    }
    if (/\b(rlhf|labor|labeling|moderation|worker)\b/i.test(cleanQuery) && c.metadata?.layer === 'ai_labor') {
      rrf += 0.04;
    }
    if (/\b(anthropic|openai|rsp|preparedness|frontier lab|safety framework)\b/i.test(cleanQuery) && c.sourceType === 'lab') {
      rrf += 0.045;
    }
    if ((c.lexScoreLocal || 0) === 0 && (c.vecScore || 0) < 0.28) {
      rrf *= 0.4;
    }
    return {
      ...c,
      score: Number(rrf.toFixed(5)),
      overlapRatio: queryTokens.length ? Math.min(1, c.lexScoreLocal / Math.max(1, queryTokens.length)) : 0
    };
  }).sort((a, b) => b.score - a.score);

  // Guarantee multi-jurisdiction representation for comparative prompts
  const selected = [];
  const usedIds = new Set();

  for (const slug of mentionedSlugs) {
    const primaryJur = rrfRanked.find((c) => c.jurisdictionSlug === slug && c.sourceType === 'jurisdiction' && !usedIds.has(c.id))
      || rrfRanked.find((c) => c.jurisdictionSlug === slug && !usedIds.has(c.id));
    if (primaryJur) {
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
  if (allowWebAugmentation && (maxOverlap < 0.45 || maxVec < 0.35 || /\b(paper|study|scholar|academic|wikipedia|literature|latest|history)\b/i.test(cleanQuery))) {
    externalWeb = await fetchOpenWebAugmentation(cleanQuery, 3).catch(() => []);
  }

  return {
    internalChunks: selected,
    externalWebChunks: externalWeb,
    diagnostics: {
      indexedTotal: stats.total,
      hasPgVector: stats.hasPgVector,
      mentionedJurisdictions: mentionedSlugs,
      maxOverlap: Number(maxOverlap.toFixed(3)),
      maxVectorSimilarity: Number(maxVec.toFixed(3)),
      webAugmentedCount: externalWeb.length
    }
  };
}
