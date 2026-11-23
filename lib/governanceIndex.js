/**
 * Sovereign Observatory — Regulatory Diff Matrix, SAGRI Readiness Index & Epistemic Parity Engine
 *
 * Pure isomorphic JS module (no Node built-ins) safe for both Server & Client components.
 */

import { JURISDICTIONS, resolveJurisdictionForLocation } from './jurisdictions.js';
import { computeAdmiraltyGrade } from './provenance.js';
import { classifyMitRiskDomain, MIT_RISK_DOMAINS } from './mitRiskTaxonomy.js';

export const DIFF_DIMENSIONS = [
  { key: 'legalStatus', label: 'Statutory Status & Enforceability' },
  { key: 'computeThreshold', label: 'Systemic / Compute Threshold' },
  { key: 'prohibitedPractices', label: 'Prohibited AI Practices' },
  { key: 'preDeploymentTesting', label: 'Pre-Deployment Safety Evaluations' },
  { key: 'transparencyWatermarking', label: 'Transparency & Synthetic Watermarking' },
  { key: 'whistleblowerProtection', label: 'Whistleblower & Retaliation Protections' },
  { key: 'extraterritorialScope', label: 'Extraterritorial Application' },
  { key: 'maxPenalties', label: 'Maximum Statutory Penalties' },
  { key: 'nextMilestone', label: 'Key Active / Upcoming Milestone' }
];

export const REGULATORY_DIFF_PROFILES = [
  {
    slug: 'eu',
    name: 'European Union',
    iso: 'EU',
    postureTag: 'Binding Comprehensive',
    postureColor: '#10b981',
    legalStatus: 'Binding — Regulation (EU) 2024/1689 + Digital Omnibus Reg. (EU) 2026/1744; CoE AI Convention ratified May 2026.',
    computeThreshold: '10^25 FLOP presumption of GPAI systemic risk (Art. 51) + high-impact capability designations.',
    prohibitedPractices: 'Banned (Feb 2025): Subliminal manipulation, social scoring, untargeted facial scraping, workplace/education emotion inference.',
    preDeploymentTesting: 'Mandatory adversarial evaluations, model risk assessments & cybersecurity hardening for systemic-risk GPAI.',
    transparencyWatermarking: 'Mandatory (Aug 2026 Art. 50): Machine-readable provenance marking & deepfake disclosure for synthetic media.',
    whistleblowerProtection: 'Protected under EU Whistleblower Directive (2019/1937) explicitly extended to AI Act infringement reporting.',
    extraterritorialScope: 'Strict market-place reach: applies to any non-EU provider placing AI or output into use inside the EU.',
    maxPenalties: 'Up to EUR 35M or 7% global annual turnover (prohibited AI); EUR 15M or 3% (GPAI / high-risk breaches).',
    nextMilestone: 'Standalone high-risk deadline adjusted via Reg. 2026/1744 to Dec 2, 2027 (embedded products Aug 2, 2028).'
  },
  {
    slug: 'us-ca',
    name: 'California (USA)',
    iso: 'US-CA',
    postureTag: 'Frontier Safety Statute',
    postureColor: '#10b981',
    legalStatus: 'Binding — SB 53 (Transparency in Frontier AI Act) + AB 2013 Training Data Disclosure + CPPA ADMT Rules.',
    computeThreshold: 'Targets large frontier foundation-model developers meeting statutory compute & revenue coverage thresholds.',
    prohibitedPractices: 'Targeted prohibitions on non-consensual synthetic sexual media, election deepfakes, and deceptive automated impersonation.',
    preDeploymentTesting: 'Mandatory public disclosure of frontier safety frameworks, catastrophic-risk protocols, and incident reports to CalOES/AG.',
    transparencyWatermarking: 'SB 942 / AB 2013 require high-level dataset summaries and provenance detection/labeling disclosures.',
    whistleblowerProtection: 'Explicit SB 53 anti-retaliation legal remedies & anonymous internal reporting channels for frontier AI lab staff.',
    extraterritorialScope: 'Applies to covered frontier models made available to California residents regardless of developer incorporation state.',
    maxPenalties: 'Civil penalties enforced by California Attorney General plus injunctive relief & statutory whistleblower damages.',
    nextMilestone: 'Ongoing SB 53 public framework filings & CPPA Automated Decisionmaking compliance cycle (2026–2027).'
  },
  {
    slug: 'kr',
    name: 'South Korea',
    iso: 'KR',
    postureTag: 'Binding Comprehensive',
    postureColor: '#10b981',
    legalStatus: 'Binding — AI Basic Act & Presidential Enforcement Decree No. 36053 (in full effect Jan 22, 2026).',
    computeThreshold: 'Triggered by both cumulative training compute thresholds and "high-impact AI" sector deployment (energy, finance, biometrics).',
    prohibitedPractices: 'Restricts deceptive unlabeled synthetic media and unassessed deployment in enumerated high-impact public domains.',
    preDeploymentTesting: 'Mandatory risk management lifecycle documentation & safety verification via MSIT / Korea AI Safety Institute.',
    transparencyWatermarking: 'Mandatory pre-market Korean-language user notices and explicit generative AI output labeling.',
    whistleblowerProtection: 'General public-interest whistleblower statutes apply; no frontier-lab-specific private right of action.',
    extraterritorialScope: 'Applies to overseas providers exceeding revenue/user thresholds, requiring a designated domestic Korean representative.',
    maxPenalties: 'Corrective administrative orders & statutory fines up to KRW 30M per infraction plus public non-compliance naming.',
    nextMilestone: 'Post-Jan 2026 grace-to-enforcement transition & domestic representative compliance audits under MSIT.'
  },
  {
    slug: 'cn',
    name: 'China',
    iso: 'CN',
    postureTag: 'Binding Algorithmic Regime',
    postureColor: '#10b981',
    legalStatus: 'Binding — CAC Interim Measures for Generative AI, Algorithm Recommendation Regs & Deep Synthesis Provisions.',
    computeThreshold: 'Triggered by any public-facing generative service or algorithm capable of shaping public opinion / social mobilization.',
    prohibitedPractices: 'Strictly bans unlawful biometric extraction, unlicensed deep synthesis, and content violating core socialist/security norms.',
    preDeploymentTesting: 'Mandatory CAC security assessments & public algorithm registry filing PRIOR to commercial public launch.',
    transparencyWatermarking: 'Strict dual explicit + implicit metadata watermarking mandated under Measures for Labeling AI-Generated Synthetic Content.',
    whistleblowerProtection: 'State regulatory hotline reporting without independent corporate whistleblower immunity guarantees.',
    extraterritorialScope: 'Applies to any generative/algorithmic service accessible to users within mainland PRC territory.',
    maxPenalties: 'App store delisting, service suspension, administrative fines under Cybersecurity / Data Security / PIPL statutes.',
    nextMilestone: 'Ongoing CAC filing audits for multimodal agentic services and cross-border chip/compute sufficiency directives.'
  },
  {
    slug: 'gb',
    name: 'United Kingdom',
    iso: 'GB',
    postureTag: 'Evaluation & Sectoral',
    postureColor: '#38bdf8',
    legalStatus: 'Institutional & Sectoral — UK AI Security Institute (AISI) + Online Safety Act + UK GDPR (CoE AI Convention Signatory).',
    computeThreshold: 'Voluntary frontier pre-deployment agreements with top labs; no standalone statutory FLOP threshold enacted yet.',
    prohibitedPractices: 'Online Safety Act criminalizes non-consensual intimate deepfakes & CSAM; ICO restricts intrusive workplace biometrics.',
    preDeploymentTesting: 'World-leading state evaluation capability via UK AISI (cyber, CBRN, autonomy) with mutual cooperation alongside CAISI.',
    transparencyWatermarking: 'Guided via Ofcom Online Safety codes & ICO privacy transparency duties rather than unified statutory Art. 50.',
    whistleblowerProtection: 'Public Interest Disclosure Act (PIDA) general employment protections; targeted AI bill protections proposed.',
    extraterritorialScope: 'Online Safety Act & UK GDPR apply to foreign platforms/processors targeting UK residents.',
    maxPenalties: 'ICO up to GBP 17.5M or 4% global turnover; Ofcom up to GBP 18M or 10% qualifying worldwide revenue.',
    nextMilestone: 'CoE AI Convention ratification alignment & targeted Frontier AI testing statutory proposals.'
  },
  {
    slug: 'us',
    name: 'United States (Federal)',
    iso: 'US',
    postureTag: 'Agency & Export Controls',
    postureColor: '#38bdf8',
    legalStatus: 'Sectoral & National Security — US CAISI/NIST, BIS Export Controls, FTC Enforcement & CISA Security Guidelines.',
    computeThreshold: 'Compute reporting triggers tied to BIS Export Administration Regulations (EAR) semiconductor & IaaS cluster rules.',
    prohibitedPractices: 'FTC Act Section 5 deceptive-AI enforcement, DoD Directive 3000.09 autonomy reviews, TAKE IT DOWN Act deepfake rules.',
    preDeploymentTesting: 'Voluntary Memoranda of Understanding between frontier labs and US CAISI (NIST) alongside METR external testing.',
    transparencyWatermarking: 'NIST provenance standards & agency-specific disclosures without comprehensive federal statutory mandate.',
    whistleblowerProtection: 'Federal securities/contractor statutes; comprehensive federal frontier-AI whistleblower shield still pending.',
    extraterritorialScope: 'Extraterritorial BIS Foreign Direct Product Rule & chip export licensing governs global GPU & lithography flows.',
    maxPenalties: 'BIS criminal/administrative export penalties & multi-million USD FTC consent decrees / algorithmic disgorgement.',
    nextMilestone: 'Ongoing BIS AI diffusion / semiconductor licensing updates and state-vs-federal preemption debates.'
  },
  {
    slug: 'sg',
    name: 'Singapore',
    iso: 'SG',
    postureTag: 'Technical Governance',
    postureColor: '#38bdf8',
    legalStatus: 'Technical Soft-Law + PDPA — IMDA Model AI Governance Frameworks (Agentic & GenAI), AI Verify & sectoral MAS/CSA rules.',
    computeThreshold: 'Risk- and deployment-tier calibrated (agentic tool permissions & human-in-the-loop accountability rather than raw FLOP).',
    prohibitedPractices: 'Sectoral bans on unverified financial impersonation, malicious deepfakes (Online Criminal Harms Act), & unlawful PDPA scraping.',
    preDeploymentTesting: 'Open-source AI Verify & Project Moonshot testing suites for red-teaming, hallucination, and agentic safety.',
    transparencyWatermarking: 'C2PA / Content Provenance Coalition alignment & advisory disclosure guidelines for customer-facing agents.',
    whistleblowerProtection: 'Workplace & sectoral MAS financial-sector escalation channels.',
    extraterritorialScope: 'PDPA & Online Criminal Harms Act extend to foreign operators harming Singapore users.',
    maxPenalties: 'PDPA fines up to 10% of local annual turnover (for organizations exceeding SGD 10M turnover) or SGD 1M.',
    nextMilestone: 'ASEAN Guide on AI Governance harmonization & Agentic AI international testing benchmarks.'
  },
  {
    slug: 'br',
    name: 'Brazil',
    iso: 'BR',
    postureTag: 'Rights-Based Enforcement',
    postureColor: '#10b981',
    legalStatus: 'Active Enforcement + Statute — ANPD LGPD Biometric Orders & Brazilian AI Framework (PL 2338).',
    computeThreshold: 'Risk-impact classification (excessive/high risk) paired with systemic-purpose general AI oversight.',
    prohibitedPractices: 'ANPD preventive suspensions against exploitative facial/iris biometric harvesting & discriminatory automated profiling.',
    preDeploymentTesting: 'Mandated algorithmic impact assessments (AIPD) for high-risk systems affecting fundamental rights.',
    transparencyWatermarking: 'Mandatory explanation/contestability rights (LGPD Art. 20) plus deepfake & election synthetic-media bans (TSE).',
    whistleblowerProtection: 'Administrative petitioning via ANPD, Public Prosecutor (MPF), and civil consumer associations.',
    extraterritorialScope: 'LGPD & PL 2338 cover any foreign controller processing personal data or offering AI services in Brazil.',
    maxPenalties: 'LGPD fines up to 2% of Brazilian revenue capped at BRL 50M per infraction plus preventive data-processing bans.',
    nextMilestone: 'SIA Intersectoral AI System implementation & ANPD biometric training-data enforcement docket.'
  }
];

export const DEFAULT_SAGRI_WEIGHTS = {
  statutory: 25,
  evaluation: 25,
  treaty: 20,
  compute: 15,
  transparency: 15
};

// Transparent, documented 0-100 baseline pillar scores per jurisdiction slug
export const SAGRI_BASE_SCORES = {
  eu: { statutory: 94, evaluation: 84, treaty: 96, compute: 72, transparency: 88 },
  kr: { statutory: 90, evaluation: 82, treaty: 80, compute: 78, transparency: 84 },
  gb: { statutory: 70, evaluation: 96, treaty: 88, compute: 74, transparency: 86 },
  'us-ca': { statutory: 86, evaluation: 80, treaty: 60, compute: 88, transparency: 90 },
  us: { statutory: 66, evaluation: 88, treaty: 72, compute: 94, transparency: 78 },
  jp: { statutory: 72, evaluation: 82, treaty: 86, compute: 72, transparency: 80 },
  sg: { statutory: 68, evaluation: 88, treaty: 80, compute: 74, transparency: 86 },
  fr: { statutory: 90, evaluation: 80, treaty: 92, compute: 76, transparency: 82 },
  de: { statutory: 90, evaluation: 82, treaty: 92, compute: 70, transparency: 80 },
  ca: { statutory: 64, evaluation: 84, treaty: 82, compute: 66, transparency: 82 },
  br: { statutory: 80, evaluation: 64, treaty: 76, compute: 58, transparency: 78 },
  cn: { statutory: 92, evaluation: 70, treaty: 58, compute: 82, transparency: 54 },
  ch: { statutory: 70, evaluation: 74, treaty: 88, compute: 62, transparency: 80 },
  un: { statutory: 48, evaluation: 74, treaty: 98, compute: 42, transparency: 88 },
  ee: { statutory: 86, evaluation: 78, treaty: 90, compute: 56, transparency: 78 },
  at: { statutory: 84, evaluation: 68, treaty: 92, compute: 52, transparency: 80 },
  se: { statutory: 86, evaluation: 76, treaty: 90, compute: 60, transparency: 84 },
  in: { statutory: 62, evaluation: 60, treaty: 74, compute: 66, transparency: 66 },
  tw: { statutory: 62, evaluation: 64, treaty: 66, compute: 90, transparency: 72 },
  au: { statutory: 60, evaluation: 68, treaty: 76, compute: 62, transparency: 76 },
  'au-continent': { statutory: 46, evaluation: 44, treaty: 84, compute: 36, transparency: 70 },
  cr: { statutory: 58, evaluation: 50, treaty: 88, compute: 38, transparency: 76 },
  il: { statutory: 58, evaluation: 68, treaty: 72, compute: 68, transparency: 56 },
  ae: { statutory: 60, evaluation: 58, treaty: 64, compute: 80, transparency: 54 }
};

export function computeSagriScores(weights = DEFAULT_SAGRI_WEIGHTS, liveMetricsBySlug = {}) {
  const wStat = Math.max(0, Number(weights.statutory) || 0);
  const wEval = Math.max(0, Number(weights.evaluation) || 0);
  const wTreaty = Math.max(0, Number(weights.treaty) || 0);
  const wComp = Math.max(0, Number(weights.compute) || 0);
  const wTrans = Math.max(0, Number(weights.transparency) || 0);
  const sum = wStat + wEval + wTreaty + wComp + wTrans || 100;

  return JURISDICTIONS.map((j) => {
    const base = SAGRI_BASE_SCORES[j.slug] || {
      statutory: 55,
      evaluation: 55,
      treaty: 60,
      compute: 50,
      transparency: 60
    };
    const live = liveMetricsBySlug[j.slug] || { signalCount: 0, regulationCount: 0, powerMw: 0 };

    // Bounded empirical telemetry bonus (+0..4 pts) rewarding observable live regulatory/compute coverage
    const empiricalBonus = Math.min(
      4,
      (live.regulationCount > 0 ? 1.5 : 0) +
        (live.signalCount > 0 ? 1.5 : 0) +
        (live.powerMw > 0 ? 1 : 0)
    );

    const rawWeighted =
      (base.statutory * wStat +
        base.evaluation * wEval +
        base.treaty * wTreaty +
        base.compute * wComp +
        base.transparency * wTrans) /
      sum;

    const score = Math.min(100, Math.round((rawWeighted + empiricalBonus * 0.5) * 10) / 10);

    let tier = 'Tier 3 — Emerging / Sectoral';
    let tierColor = '#facc15';
    if (score >= 78) {
      tier = 'Tier 1 — Comprehensive Leader';
      tierColor = '#10b981';
    } else if (score >= 65) {
      tier = 'Tier 2 — Active Institutional';
      tierColor = '#38bdf8';
    }

    return {
      slug: j.slug,
      iso: j.iso,
      name: j.name,
      region: j.region,
      posture: j.posture,
      score,
      tier,
      tierColor,
      pillars: base,
      live
    };
  }).sort((a, b) => b.score - a.score);
}

const GLOBAL_NORTH_SLUGS = new Set([
  'eu', 'gb', 'us', 'us-ca', 'ca', 'jp', 'kr', 'au', 'ch', 'ee', 'at', 'se', 'fr', 'de', 'il'
]);

const GLOBAL_SOUTH_KEYWORDS = /\b(india|new delhi|bengaluru|mumbai|brazil|brasília|são paulo|china|beijing|shenzhen|shanghai|hangzhou|taiwan|taipei|hsinchu|singapore|malaysia|indonesia|vietnam|thailand|philippines|africa|african union|ethiopia|addis ababa|kenya|nairobi|nigeria|lagos|south africa|ghana|rwanda|egypt|costa rica|san josé|mexico|chile|colombia|argentina|peru|uae|abu dhabi|saudi arabia|riyadh|global south|myanmar|sudan|gaza|palestinian|serbia|ukraine)\b/i;

export function computeEpistemicParity(signals = [], clusters = []) {
  const geoSplit = {
    globalNorth: { name: 'Global North Rule-Making Hubs', signals: 0, powerMw: 0 },
    globalSouth: { name: 'Global South & Emerging Jurisdictions', signals: 0, powerMw: 0 },
    multilateral: { name: 'Multilateral / Non-Territorial', signals: 0, powerMw: 0 }
  };

  const admiraltyBuckets = {
    A: { name: 'A — Primary Statutory / Institutional', count: 0, color: '#10b981' },
    B: { name: 'B — Peer-Reviewed / Civil Society', count: 0, color: '#38bdf8' },
    C: { name: 'C — Specialist Journalism', count: 0, color: '#facc15' },
    D: { name: 'D — Custom / Unverified Feed', count: 0, color: '#94a3b8' }
  };

  const mitCounts = {};
  for (const d of MIT_RISK_DOMAINS) {
    mitCounts[d.code] = { code: d.code, name: `${d.code}: ${d.shortLabel}`, count: 0, color: d.color };
  }

  for (const sig of signals) {
    const loc = String(sig.location || '');
    const title = String(sig.title || sig.name || '');
    const summary = String(sig.details?.summary || sig.summary || '');
    const haystack = `${loc} ${title}`;

    const jur = resolveJurisdictionForLocation(loc || title);
    if (jur?.slug === 'un' || /global|multilateral|geneva/i.test(loc)) {
      geoSplit.multilateral.signals += 1;
    } else if (GLOBAL_SOUTH_KEYWORDS.test(haystack) || (jur && !GLOBAL_NORTH_SLUGS.has(jur.slug))) {
      geoSplit.globalSouth.signals += 1;
    } else {
      geoSplit.globalNorth.signals += 1;
    }

    const adm = computeAdmiraltyGrade(sig);
    if (admiraltyBuckets[adm.sourceGrade]) {
      admiraltyBuckets[adm.sourceGrade].count += 1;
    }

    const mit = sig.details?.mitRisk || sig.mitRisk || classifyMitRiskDomain(title, summary, sig.details?.domainPillar || '');
    if (mit?.code && mitCounts[mit.code]) {
      mitCounts[mit.code].count += 1;
    }
  }

  for (const cl of clusters) {
    const mw = Number(cl.powerMw) || 0;
    const country = `${cl.country || ''} ${cl.address || ''}`;
    if (GLOBAL_SOUTH_KEYWORDS.test(country) || (cl.jurisdictionSlug && !GLOBAL_NORTH_SLUGS.has(cl.jurisdictionSlug))) {
      geoSplit.globalSouth.powerMw += mw;
    } else {
      geoSplit.globalNorth.powerMw += mw;
    }
  }

  const totalSignals = Math.max(1, signals.length);
  const totalMw = Math.max(1, geoSplit.globalNorth.powerMw + geoSplit.globalSouth.powerMw + geoSplit.multilateral.powerMw);

  const regionalParity = Object.values(geoSplit).map((g) => ({
    name: g.name,
    signals: g.signals,
    signalSharePct: Math.round((g.signals / totalSignals) * 1000) / 10,
    powerGw: Math.round((g.powerMw / 1000) * 100) / 100,
    computeSharePct: Math.round((g.powerMw / totalMw) * 1000) / 10
  }));

  return {
    totalSignals: signals.length,
    totalClusters: clusters.length,
    regionalParity,
    admiraltyDistribution: Object.values(admiraltyBuckets),
    mitRiskDistribution: Object.values(mitCounts).sort((a, b) => b.count - a.count)
  };
}
