/**
 * Sovereign Observatory — Frontier Lab Watch Registry
 *
 * Benchmarks frontier AI developers across safety frameworks, external evaluations
 * (METR, UK AISI, US CAISI), statutory exposure, and open commitment diffs.
 * Pure isomorphic JS (safe for SSR, API routes, and client components).
 */

export const FRONTIER_LABS = [
  {
    slug: 'anthropic',
    name: 'Anthropic',
    hqLocation: 'San Francisco, California, USA',
    jurisdictionSlug: 'us-ca',
    openWeightsPosture: 'Closed API',
    postureColor: '#38bdf8',
    safetyFramework: {
      name: 'Responsible Scaling Policy (RSP)',
      version: 'v2.x (ASL-2 / ASL-3 / ASL-4)',
      url: 'https://www.anthropic.com/responsible-scaling-policy',
      thresholdMechanism: 'Capability-gated AI Safety Levels (CBRN, Cyber, Autonomy)',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: true,
      ukAisiTested: true,
      usCaisiTested: true,
      summary: 'Participated in pre-deployment safety testing with UK AISI, US CAISI, and METR autonomous-horizon audits.'
    },
    statutoryExposure: [
      { label: 'California SB 53', jurisdictionSlug: 'us-ca' },
      { label: 'EU AI Act GPAI', jurisdictionSlug: 'eu' },
      { label: 'UK AISI Accord', jurisdictionSlug: 'gb' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: true,
      externalRedTeaming: true,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2026', note: 'Subject to California SB 53 statutory frontier safety framework and incident reporting duties.' },
      { date: '2025', note: 'Activated ASL-3 deployment & security safeguards on frontier Claude releases.' }
    ],
    epochOrgPatterns: ['anthropic']
  },
  {
    slug: 'openai',
    name: 'OpenAI',
    hqLocation: 'San Francisco, California, USA',
    jurisdictionSlug: 'us-ca',
    openWeightsPosture: 'Hybrid (API Flagships + Open-Weight Line)',
    postureColor: '#10b981',
    safetyFramework: {
      name: 'Preparedness Framework',
      version: 'v2 (Updated Frontier Risk Rubric)',
      url: 'https://openai.com/safety/preparedness/',
      thresholdMechanism: 'Tracked High/Critical risk thresholds across Cyber, CBRN, Self-Improvement',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: true,
      ukAisiTested: true,
      usCaisiTested: true,
      summary: 'Engaged METR for pre-deployment autonomous capability & mid-training monitor audits alongside UK AISI & US CAISI testing.'
    },
    statutoryExposure: [
      { label: 'California SB 53', jurisdictionSlug: 'us-ca' },
      { label: 'EU AI Act GPAI', jurisdictionSlug: 'eu' },
      { label: 'South Korea AI Basic Act', jurisdictionSlug: 'kr' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: true,
      externalRedTeaming: true,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2026', note: 'Embedded external METR evaluations into autonomous software/cyber agent releases (e.g. GPT-5/6 era).' },
      { date: '2025', note: 'Revised Preparedness Framework thresholds clarifying competitive parity clauses.' }
    ],
    epochOrgPatterns: ['openai']
  },
  {
    slug: 'google-deepmind',
    name: 'Google DeepMind',
    hqLocation: 'London, UK / Mountain View, CA',
    jurisdictionSlug: 'gb',
    openWeightsPosture: 'Hybrid (API Gemini + Gemma Open Weights)',
    postureColor: '#10b981',
    safetyFramework: {
      name: 'Frontier Safety Framework (FSF)',
      version: 'FSF 2.0 / 3.0',
      url: 'https://deepmind.google/safety/',
      thresholdMechanism: 'Critical Capability Levels (CCLs) triggering security & deployment mitigations',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: true,
      ukAisiTested: true,
      usCaisiTested: true,
      summary: 'UK-anchored frontier lab partnering directly with UK AISI, US CAISI, and academic red-team evaluators on Gemini generations.'
    },
    statutoryExposure: [
      { label: 'EU AI Act GPAI', jurisdictionSlug: 'eu' },
      { label: 'UK AISI / Online Safety Act', jurisdictionSlug: 'gb' },
      { label: 'California SB 53', jurisdictionSlug: 'us-ca' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: true,
      externalRedTeaming: true,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2026', note: 'Extended Critical Capability Level monitoring across Gemini 4 multimodal & cyber evaluations.' },
      { date: '2025', note: 'Updated FSF to cover deceptive alignment / instrumental reasoning risk scenarios.' }
    ],
    epochOrgPatterns: ['google deepmind', 'deepmind', 'google']
  },
  {
    slug: 'meta',
    name: 'Meta AI (FAIR)',
    hqLocation: 'Menlo Park, California, USA',
    jurisdictionSlug: 'us-ca',
    openWeightsPosture: 'Open Weights (Frontier & Llama Series)',
    postureColor: '#facc15',
    safetyFramework: {
      name: 'Frontier AI Framework',
      version: 'v1 (Withhold Decision Criteria)',
      url: 'https://ai.meta.com/',
      thresholdMechanism: 'Catastrophic vs. Critical risk evaluation prior to open-weight distribution',
      lastUpdated: '2025'
    },
    externalEvaluations: {
      metrTested: false,
      ukAisiTested: true,
      usCaisiTested: true,
      summary: 'Publishes open-weight Llama models while facing heightened EU AI Act & US state scrutiny over irreversible open-weight downstream misuse.'
    },
    statutoryExposure: [
      { label: 'EU AI Act (Open-Weight Exemption Limits)', jurisdictionSlug: 'eu' },
      { label: 'California SB 53', jurisdictionSlug: 'us-ca' },
      { label: 'Brazil ANPD', jurisdictionSlug: 'br' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: false,
      externalRedTeaming: true,
      computeDisclosed: true
    },
    commitmentChangelog: [
      { date: '2025–2026', note: 'Subject to EU AI Act systemic-risk rules where frontier open-weight compute exceeds threshold exemptions.' },
      { date: '2025', note: 'Released Frontier AI Framework detailing criteria for withholding high-risk model weights.' }
    ],
    epochOrgPatterns: ['meta']
  },
  {
    slug: 'xai',
    name: 'xAI',
    hqLocation: 'Palo Alto, CA / Memphis, TN',
    jurisdictionSlug: 'us-ca',
    openWeightsPosture: 'Hybrid (API Grok + Legacy Open Releases)',
    postureColor: '#fb923c',
    safetyFramework: {
      name: 'Frontier AI Risk Management Disclosures',
      version: 'CA SB 53 Filing',
      url: 'https://x.ai/',
      thresholdMechanism: 'Mandatory SB 53 frontier safety reporting & compute cluster disclosures',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: false,
      ukAisiTested: true,
      usCaisiTested: false,
      summary: 'Operates world-leading gigawatt compute cluster (Colossus 1 & 2, Memphis TN); historically limited third-party METR/public pre-deployment reporting.'
    },
    statutoryExposure: [
      { label: 'California SB 53', jurisdictionSlug: 'us-ca' },
      { label: 'EU AI Act / DSA', jurisdictionSlug: 'eu' }
    ],
    transparency: {
      systemCards: false,
      whistleblowerPolicy: false,
      externalRedTeaming: false,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2026', note: 'Scaled Memphis Colossus cluster architecture (~946 MW / >1M H100e tracked by Epoch AI).' },
      { date: '2025', note: 'Signed EU AI Act GPAI Code of Practice Chapter commitments on safety & security.' }
    ],
    epochOrgPatterns: ['xai', 'spacexai']
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    hqLocation: 'Hangzhou, China',
    jurisdictionSlug: 'cn',
    openWeightsPosture: 'Open Weights (MIT / Permissive)',
    postureColor: '#facc15',
    safetyFramework: {
      name: 'PRC CAC Algorithm & GenAI Filing Regime',
      version: 'Statutory Domestic Filing',
      url: 'https://www.deepseek.com/',
      thresholdMechanism: 'Cyberspace Administration of China (CAC) security assessment & algorithm registry',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: false,
      ukAisiTested: false,
      usCaisiTested: true,
      summary: 'No formal UK AISI/METR pre-deployment partnership; post-release evaluations by US CAISI and independent researchers identified lower cyber/jailbreak refusal floors.'
    },
    statutoryExposure: [
      { label: 'China CAC GenAI Measures', jurisdictionSlug: 'cn' },
      { label: 'US BIS Chip Export Controls', jurisdictionSlug: 'us' },
      { label: 'EU GDPR / Data Transfers', jurisdictionSlug: 'eu' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: false,
      externalRedTeaming: false,
      computeDisclosed: true
    },
    commitmentChangelog: [
      { date: '2025–2026', note: 'Tested post-release by international AISIs for automated cyber vulnerability & CBRN uplift.' },
      { date: '2025', note: 'Disclosed hardware efficiency metrics under US semiconductor export constraints.' }
    ],
    epochOrgPatterns: ['deepseek']
  },
  {
    slug: 'mistral',
    name: 'Mistral AI',
    hqLocation: 'Paris, France',
    jurisdictionSlug: 'fr',
    openWeightsPosture: 'Hybrid (API Frontier + Open-Weight Series)',
    postureColor: '#38bdf8',
    safetyFramework: {
      name: 'EU AI Act GPAI Code of Practice Alignment',
      version: 'European AI Office Statutory Regime',
      url: 'https://mistral.ai/',
      thresholdMechanism: 'EU AI Act systemic-risk model evaluations & Art. 50 content provenance',
      lastUpdated: '2026'
    },
    externalEvaluations: {
      metrTested: false,
      ukAisiTested: true,
      usCaisiTested: false,
      summary: 'Anchored in Paris inside full EU AI Act jurisdiction; engages European AI Office and French ANSSI/PEReN evaluations.'
    },
    statutoryExposure: [
      { label: 'EU AI Act GPAI', jurisdictionSlug: 'eu' },
      { label: 'France CNIL / ANSSI', jurisdictionSlug: 'fr' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: false,
      externalRedTeaming: true,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2026', note: 'Entered full EU AI Act Article 50 watermarking & transparency enforcement cycle.' }
    ],
    epochOrgPatterns: ['mistral']
  },
  {
    slug: 'alibaba-qwen',
    name: 'Alibaba (Qwen)',
    hqLocation: 'Hangzhou, China',
    jurisdictionSlug: 'cn',
    openWeightsPosture: 'Hybrid (Alibaba Cloud API + Qwen Open Weights)',
    postureColor: '#facc15',
    safetyFramework: {
      name: 'PRC CAC Algorithm & GenAI Security Registry',
      version: 'Domestic Statutory Compliance',
      url: 'https://qwenlm.github.io/',
      thresholdMechanism: 'CAC public-facing LLM security review & training-data compliance',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: false,
      ukAisiTested: false,
      usCaisiTested: false,
      summary: 'Open-weight Qwen family widely adopted globally; evaluated externally by independent academic benchmarks rather than Western AISI pre-deployment access.'
    },
    statutoryExposure: [
      { label: 'China CAC / MIIT', jurisdictionSlug: 'cn' },
      { label: 'EU AI Act Downstream Use', jurisdictionSlug: 'eu' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: false,
      externalRedTeaming: false,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2025–2026', note: 'Expanded open-weight reasoning and coding model ecosystem across global enterprise developers.' }
    ],
    epochOrgPatterns: ['alibaba', 'qwen']
  },
  {
    slug: 'cohere',
    name: 'Cohere',
    hqLocation: 'Toronto, Canada',
    jurisdictionSlug: 'ca',
    openWeightsPosture: 'Hybrid (Enterprise API + Cohere For AI Open Research)',
    postureColor: '#38bdf8',
    safetyFramework: {
      name: 'Canadian Voluntary AI Code + Enterprise Governance',
      version: 'CAISI Partner Framework',
      url: 'https://cohere.com/',
      thresholdMechanism: 'Canadian AI Safety Institute alignment & EU AI Act Art. 50/53 compliance',
      lastUpdated: '2025–2026'
    },
    externalEvaluations: {
      metrTested: false,
      ukAisiTested: true,
      usCaisiTested: false,
      summary: 'Canadian flagship enterprise model lab aligned with CAISI and signatory to G7 Hiroshima / Canadian Voluntary Code commitments.'
    },
    statutoryExposure: [
      { label: 'Canada CAISI / CoE Signatory', jurisdictionSlug: 'ca' },
      { label: 'EU AI Act GPAI', jurisdictionSlug: 'eu' }
    ],
    transparency: {
      systemCards: true,
      whistleblowerPolicy: false,
      externalRedTeaming: true,
      computeDisclosed: false
    },
    commitmentChangelog: [
      { date: '2025–2026', note: 'Aligned multilingual enterprise deployments with EU AI Act and Canadian CAISI risk evaluation standards.' }
    ],
    epochOrgPatterns: ['cohere']
  }
];

export function getFrontierLabBySlug(slug) {
  const clean = String(slug || '').trim().toLowerCase();
  return FRONTIER_LABS.find((l) => l.slug === clean) || null;
}

export function matchModelsToLab(models = [], lab) {
  if (!Array.isArray(models) || !lab || !Array.isArray(lab.epochOrgPatterns)) return [];
  return models.filter((m) => {
    const org = String(m.organization || '').toLowerCase();
    return lab.epochOrgPatterns.some((pat) => org.includes(pat));
  });
}
