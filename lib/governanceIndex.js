/**
 * Sovereign Observatory — Regulatory Diff Matrix, SAGRI Readiness Index & Epistemic Parity Engine
 *
 * Pure isomorphic JS module (no Node built-ins) safe for both Server & Client components.
 */

import { JURISDICTIONS, eventMatchesJurisdiction, resolveJurisdictionForLocation } from './jurisdictions.js';
import { computeAdmiraltyGrade } from './provenance.js';
import { classifyMitRiskDomain, MIT_RISK_DOMAINS } from './mitRiskTaxonomy.js';

export const DIFF_DIMENSIONS = [
  { key: 'legalStatus', label: 'Statutory Status & Enforceability' },
  { key: 'computeThreshold', label: 'Systemic / Compute Threshold' },
  { key: 'incidentReportingWindow', label: 'Mandatory Incident-Reporting Window' },
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
    officialUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    legalStatus: 'Binding — Regulation (EU) 2024/1689 + Digital Omnibus Reg. (EU) 2026/1744; CoE AI Convention ratified May 2026.',
    computeThreshold: '10^25 FLOP presumption of GPAI systemic risk (Art. 51) + high-impact capability designations.',
    incidentReportingWindow: 'Art. 73 tiered high-risk serious-incident clock: <=2 days (widespread infringement or critical infrastructure disruption), <=10 days (death of a person), <=15 days (standard serious incident); plus Art. 55(1)(c) reporting to EU AI Office without undue delay for systemic-risk GPAI.',
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
    officialUrl: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53',
    legalStatus: 'Binding — SB 53 (Transparency in Frontier AI Act) + AB 2013 Training Data Disclosure + CPPA ADMT Rules.',
    computeThreshold: 'Targets large frontier foundation-model developers meeting statutory compute & revenue coverage thresholds.',
    incidentReportingWindow: 'SB 53 statutory clock to CalOES: within 15 days of discovering a critical safety incident, or within 24 hours if the incident poses an imminent risk of death or serious physical injury.',
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
    officialUrl: 'https://www.law.go.kr/',
    legalStatus: 'Binding — AI Basic Act & Presidential Enforcement Decree No. 36053 (in full effect Jan 22, 2026).',
    computeThreshold: 'Triggered by both cumulative training compute thresholds and "high-impact AI" sector deployment (energy, finance, biometrics).',
    incidentReportingWindow: 'Mandates safety-incident & risk-management reporting and documentation to MSIT / Korea AI Safety Institute with statutory fact-finding & corrective-order triggers; specific hour/day reporting windows are set via MSIT ministerial guidelines and Enforcement Decree No. 36053 rather than a single fixed EU-style 2/10/15-day statutory table.',
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
    officialUrl: 'https://www.cac.gov.cn/',
    legalStatus: 'Binding — CAC Interim Measures for Generative AI, Algorithm Recommendation Regs & Deep Synthesis Provisions.',
    computeThreshold: 'Triggered by any public-facing generative service or algorithm capable of shaping public opinion / social mobilization.',
    incidentReportingWindow: 'Prompt reporting to Cyberspace Administration of China (CAC) and sectoral cyber regulators alongside immediate illegal-content mitigation, supplemented by Cybersecurity Law / Critical Information Infrastructure rapid-reporting duties.',
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
    officialUrl: 'https://www.aisi.gov.uk/',
    legalStatus: 'Institutional & Sectoral — UK AI Security Institute (AISI) + Online Safety Act + UK GDPR (CoE AI Convention Signatory).',
    computeThreshold: 'Voluntary frontier pre-deployment agreements with top labs; no standalone statutory FLOP threshold enacted yet.',
    incidentReportingWindow: 'Sectoral clocks rather than unified AI statute: UK GDPR 72-hour ICO personal-data breach notice, Ofcom Online Safety risk/incident duties, and voluntary AISI frontier safety disclosures.',
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
    officialUrl: 'https://www.nist.gov/aisi',
    legalStatus: 'Sectoral & National Security — US CAISI/NIST, BIS Export Controls, FTC Enforcement & CISA Security Guidelines.',
    computeThreshold: 'Compute reporting triggers tied to BIS Export Administration Regulations (EAR) semiconductor & IaaS cluster rules.',
    incidentReportingWindow: 'No comprehensive federal frontier-AI incident clock yet; CISA CIRCIA cyber-incident rules (72-hour covered cyber / 24-hour ransom payment), sector agencies (FDA/NHTSA), and voluntary US CAISI disclosures apply.',
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
    officialUrl: 'https://www.imda.gov.sg/',
    legalStatus: 'Technical Soft-Law + PDPA — IMDA Model AI Governance Frameworks (Agentic & GenAI), AI Verify & sectoral MAS/CSA rules.',
    computeThreshold: 'Risk- and deployment-tier calibrated (agentic tool permissions & human-in-the-loop accountability rather than raw FLOP).',
    incidentReportingWindow: 'PDPA mandatory data-breach notification to PDPC within 3 calendar days of assessing notifiability, paired with CSA Cybersecurity Act 2-hour/24-hour CII incident reporting and MAS financial operational-risk notices.',
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
    officialUrl: 'https://www.gov.br/anpd/pt-br',
    legalStatus: 'Active Enforcement + Statute — ANPD LGPD Biometric Orders & Brazilian AI Framework (PL 2338).',
    computeThreshold: 'Risk-impact classification (excessive/high risk) paired with systemic-purpose general AI oversight.',
    incidentReportingWindow: 'ANPD LGPD Resolution CD/ANPD No. 15 requires notification of relevant security incidents within 3 business days, alongside proposed PL 2338 serious-AI-incident reporting duties to the SIA intersectoral system.',
    prohibitedPractices: 'ANPD preventive suspensions against exploitative facial/iris biometric harvesting & discriminatory automated profiling.',
    preDeploymentTesting: 'Mandated algorithmic impact assessments (AIPD) for high-risk systems affecting fundamental rights.',
    transparencyWatermarking: 'Mandatory explanation/contestability rights (LGPD Art. 20) plus deepfake & election synthetic-media bans (TSE).',
    whistleblowerProtection: 'Administrative petitioning via ANPD, Public Prosecutor (MPF), and civil consumer associations.',
    extraterritorialScope: 'LGPD & PL 2338 cover any foreign controller processing personal data or offering AI services in Brazil.',
    maxPenalties: 'LGPD fines up to 2% of Brazilian revenue capped at BRL 50M per infraction plus preventive data-processing bans.',
    nextMilestone: 'SIA Intersectoral AI System implementation & ANPD biometric training-data enforcement docket.'
  },
  {
    slug: 'in',
    name: 'India',
    iso: 'IN',
    postureTag: 'Digital Public Infra + IT Rules',
    postureColor: '#38bdf8',
    officialUrl: 'https://www.meity.gov.in/',
    legalStatus: 'Binding — Digital Personal Data Protection (DPDP) Act + IT Act / IT Rules Advisories + IndiaAI Safety Institute.',
    computeThreshold: 'Risk- and platform-scale obligations (Significant Social Media Intermediaries & sovereign GPU cluster subsidies).',
    incidentReportingWindow: 'CERT-In Cyber Security Directions mandate reporting specified cyber/AI-related security incidents within 6 hours of noticing or being brought to notice; IT Rules impose 24–36 hour synthetic deepfake takedown clocks.',
    prohibitedPractices: 'Strict prohibitions on non-consensual synthetic deepfakes, misinformation manipulation, and unlawful DPDP automated profiling.',
    preDeploymentTesting: 'Indigenous multilingual safety benchmarking via IndiaAI Safety Institute & MeitY cybersecurity audits (CERT-In).',
    transparencyWatermarking: 'Mandatory IT Rules misinformation/deepfake takedown timelines (24–36h) & provenance watermarking trials.',
    whistleblowerProtection: 'Whistle Blowers Protection Act (public sector) and corporate governance mechanisms.',
    extraterritorialScope: 'DPDP Act applies to foreign entities profiling or offering goods/services to individuals in India.',
    maxPenalties: 'DPDP Act statutory fines up to INR 250 Crore (~USD 30M) per contravention plus IT Act safe-harbor revocation.',
    nextMilestone: 'DPDP Rules full operationalization & IndiaAI 38,000+ GPU national compute governance rollout.'
  },
  {
    slug: 'za',
    name: 'South Africa',
    iso: 'ZA',
    postureTag: 'Constitutional & POPIA',
    postureColor: '#10b981',
    officialUrl: 'https://inforegulator.org.za/',
    legalStatus: 'Statutory + Framework — Protection of Personal Information Act (POPIA Section 71) + National AI Policy Framework.',
    computeThreshold: 'Decision-impact trigger: prohibits solely automated legal/significant profiling without human review.',
    incidentReportingWindow: 'POPIA Section 22 mandates notification of security compromises involving personal/biometric AI data to the Information Regulator and affected subjects as soon as reasonably possible after discovery.',
    prohibitedPractices: 'POPIA Sec. 71 bans binding sole-automated adverse profiling; constitutional courts restrict bulk warrantless surveillance.',
    preDeploymentTesting: 'Impact assessments required under POPIA for special personal/biometric information processing.',
    transparencyWatermarking: 'Statutory data-subject right to contest automated logic & inspect underlying processing categories.',
    whistleblowerProtection: 'Protected Disclosures Act safeguards covering algorithmic & public procurement misconduct.',
    extraterritorialScope: 'POPIA binds foreign responsible parties using automated/non-automated means domiciled or processing in South Africa.',
    maxPenalties: 'Information Regulator administrative fines up to ZAR 10M, civil damages, and up to 10 years imprisonment.',
    nextMilestone: 'AU Continental AI Strategy harmonization & DCDT statutory AI legislation drafting.'
  },
  {
    slug: 'ke',
    name: 'Kenya',
    iso: 'KE',
    postureTag: 'Biometric Sovereignty Lead',
    postureColor: '#10b981',
    officialUrl: 'https://www.odpc.go.ke/',
    legalStatus: 'Binding — Data Protection Act (Sec. 35 Automated Decisions) + Active ODPC Enforcement + National AI Strategy (2025–2030).',
    computeThreshold: 'Trigger centered on biometric sensitivity, cross-border data transfers, and public-service algorithmic impact.',
    incidentReportingWindow: 'Kenya Data Protection Act Section 43 requires notification of personal/biometric data breaches to the Office of the Data Protection Commissioner (ODPC) without delay and within 72 hours of becoming aware.',
    prohibitedPractices: 'Active ODPC & High Court bans on unconsented biometric iris/facial scanning & exploitative predatory lending algorithms.',
    preDeploymentTesting: 'Mandatory Data Protection Impact Assessments (DPIA) submitted to ODPC before high-risk automated rollouts.',
    transparencyWatermarking: 'Explicit explanation and human-intervention rights under Data Protection Act Section 35.',
    whistleblowerProtection: 'Public Officer Ethics & Data Protection complaint protections via ODPC enforcement docket.',
    extraterritorialScope: 'Applies to non-Kenyan controllers/processors handling personal data of data subjects physically located in Kenya.',
    maxPenalties: 'ODPC fines up to KES 5M or 1% of annual turnover plus immediate processing suspension orders.',
    nextMilestone: 'National AI Strategy implementation across sovereign data centers and East African Community alignment.'
  },
  {
    slug: 'id',
    name: 'Indonesia',
    iso: 'ID',
    postureTag: 'Statutory PDP & ASEAN Lead',
    postureColor: '#10b981',
    officialUrl: 'https://www.komdigi.go.id/',
    legalStatus: 'Binding + Soft-Law — Personal Data Protection Law (UU PDP No. 27/2022) + Komdigi AI Ethics Circular + ASEAN Guide.',
    computeThreshold: 'High-impact automated profiling triggers under UU PDP + planned sector risk thresholds in Presidential AI Decree.',
    incidentReportingWindow: 'UU PDP No. 27/2022 Art. 46 mandates written notification within 3x24 hours (72 hours) to affected data subjects and the PDP supervisory authority upon personal data/automated-processing failure.',
    prohibitedPractices: 'Criminalizes unlawful biometric/personal data extraction, unauthorized synthetic manipulation, and election deepfakes.',
    preDeploymentTesting: 'Mandatory Data Protection Impact Assessment (DPIA) under UU PDP for large-scale AI/automated decision processing.',
    transparencyWatermarking: 'Komdigi AI Ethics Circular requires synthetic output traceability, accountability officers & human control.',
    whistleblowerProtection: 'Electronic Information & Transactions / PDP administrative reporting channels.',
    extraterritorialScope: 'UU PDP applies extraterritorially to foreign controllers whose AI/data processing impacts Indonesian citizens.',
    maxPenalties: 'Administrative fines up to 2% of annual revenue under UU PDP plus criminal liability for unlawful data fraud.',
    nextMilestone: 'Enactment of Indonesia Presidential Regulation on National AI Strategy & independent PDP Supervisory Agency launch.'
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
  ae: { statutory: 60, evaluation: 58, treaty: 64, compute: 80, transparency: 54 },
  za: { statutory: 72, evaluation: 58, treaty: 78, compute: 52, transparency: 76 },
  ke: { statutory: 74, evaluation: 54, treaty: 76, compute: 46, transparency: 74 },
  ng: { statutory: 64, evaluation: 52, treaty: 72, compute: 44, transparency: 68 },
  eg: { statutory: 56, evaluation: 48, treaty: 66, compute: 46, transparency: 56 },
  rw: { statutory: 62, evaluation: 56, treaty: 76, compute: 40, transparency: 70 },
  sa: { statutory: 64, evaluation: 60, treaty: 62, compute: 84, transparency: 50 },
  id: { statutory: 72, evaluation: 56, treaty: 74, compute: 58, transparency: 70 },
  my: { statutory: 58, evaluation: 60, treaty: 76, compute: 74, transparency: 68 },
  vn: { statutory: 76, evaluation: 52, treaty: 60, compute: 56, transparency: 52 },
  ph: { statutory: 60, evaluation: 50, treaty: 72, compute: 44, transparency: 66 },
  cl: { statutory: 70, evaluation: 64, treaty: 86, compute: 54, transparency: 78 },
  co: { statutory: 66, evaluation: 56, treaty: 82, compute: 44, transparency: 74 },
  mx: { statutory: 54, evaluation: 52, treaty: 76, compute: 52, transparency: 64 },
  ua: { statutory: 64, evaluation: 70, treaty: 82, compute: 52, transparency: 72 }
};

export function buildLiveMetricsBySlug({ events = [], clusters = [], regulations = [] } = {}) {
  const liveMetricsBySlug = {};
  for (const j of JURISDICTIONS) {
    const signalCount = (events || []).filter((ev) => eventMatchesJurisdiction(ev, j)).length;
    const regulationCount = (regulations || []).filter((r) => {
      const hay = `${r.jurisdiction || ''} ${r.title || ''}`.toLowerCase();
      return (
        hay.includes(j.name.toLowerCase()) ||
        (j.matchPatterns || []).some((pat) => new RegExp(`\\b${pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay))
      );
    }).length;
    const powerMw = (clusters || [])
      .filter((c) => c.jurisdictionSlug === j.slug)
      .reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0);

    liveMetricsBySlug[j.slug] = { signalCount, regulationCount, powerMw };
  }
  return liveMetricsBySlug;
}

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
