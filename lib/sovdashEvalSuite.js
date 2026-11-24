import { runSovDashAiTurn, isAbstentionText } from './sovdashAiEngine.js';
import { saveEvalRun } from './sovdashAiDb.js';

export const SOVDASH_EVAL_CASES = [
  // ── 1. Live Temporal Events, Concise Lookups & Global Infrastructure (4 new cases) ──
  {
    id: 'events-recent-usa',
    category: 'Live Feed & Events',
    isTrap: false,
    prompt: 'what are the most recent AI related events which have happened in USA',
    expectedKeywords: ['us', 'united states'],
    expectedAnyNumbers: [],
    mustNotAbstain: true
  },
  {
    id: 'concise-spain-regulator',
    category: 'Concise Global Lookup',
    isTrap: false,
    prompt: 'Who is the national AI supervisory agency in Spain?',
    expectedKeywords: ['aesia'],
    expectedAnyNumbers: [],
    maxCharsExpected: 650
  },
  {
    id: 'infra-us-datacenters-count',
    category: 'Global Compute & Facilities',
    isTrap: false,
    prompt: 'How many data centers in US',
    expectedKeywords: ['united states'],
    expectedAnyNumbers: ['2,870', '2870']
  },
  {
    id: 'infra-germany-datacenters-count',
    category: 'Global Compute & Facilities',
    isTrap: false,
    prompt: 'how many data centers are there in germany?',
    expectedKeywords: ['germany'],
    expectedAnyNumbers: ['238']
  },
  {
    id: 'infra-global-datacenters-count',
    category: 'Global Compute & Facilities',
    isTrap: false,
    prompt: 'how many data centers around the world?',
    expectedKeywords: ['peeringdb'],
    expectedAnyNumbers: ['6,033', '6033']
  },
  {
    id: 'defense-lavender-ai-purpose',
    category: 'Autonomous Weapons & Defense',
    isTrap: false,
    prompt: 'which countries are using Lavender AI? For what purpose?',
    expectedKeywords: ['israel', 'gaza', 'target'],
    expectedAnyNumbers: [],
    mustNotAbstain: true
  },
  {
    id: 'global-peru-kazakhstan-colorado',
    category: 'Expanded Global Statutes',
    isTrap: false,
    prompt: 'Compare statutory AI frameworks tracked in Peru and Kazakhstan.',
    expectedKeywords: ['peru', 'kazakhstan'],
    expectedAnyNumbers: ['31814']
  },

  // ── 2. Statutory & Comparative Governance (4 cases) ──
  {
    id: 'statute-incident-windows-compare',
    category: 'Statutory Comparison',
    isTrap: false,
    prompt: 'Compare mandatory incident-reporting windows across EU AI Act, California SB 53, and South Korea\'s AI Basic Act.',
    expectedKeywords: ['eu', 'sb 53', 'south korea'],
    expectedAnyNumbers: ['2 days', '10 days', '15 days', '24 hours']
  },
  {
    id: 'statute-eu-penalties-prohibited',
    category: 'Statutory Comparison',
    isTrap: false,
    prompt: 'What practices are prohibited under the EU AI Act and what are the maximum administrative penalties?',
    expectedKeywords: ['social scoring', '35m', '7%'],
    expectedAnyNumbers: ['35m', '15m']
  },
  {
    id: 'statute-global-south-biometrics',
    category: 'Statutory Comparison',
    isTrap: false,
    prompt: 'Compare biometric and automated profiling enforcement in Brazil (ANPD) and Kenya (ODPC).',
    expectedKeywords: ['brazil', 'anpd', 'kenya', 'odpc'],
    expectedAnyNumbers: ['72 hours', '50m']
  },
  {
    id: 'statute-uk-us-safety-institutes',
    category: 'Statutory Comparison',
    isTrap: false,
    prompt: 'How do the UK AI Security Institute (AISI) and US CAISI (NIST) compare on pre-deployment frontier AI testing?',
    expectedKeywords: ['aisi', 'caisi', 'nist'],
    expectedAnyNumbers: []
  },

  // ── 3. Infrastructure, Supply Chain & Ethics (4 cases) ──
  {
    id: 'ethics-supply-chain-stages',
    category: 'Ethics & Supply Chain',
    isTrap: false,
    prompt: 'What critical bottlenecks does SovDash track across the AI semiconductor supply chain?',
    expectedKeywords: ['euv', 'cowos', 'hbm'],
    expectedAnyNumbers: []
  },
  {
    id: 'ethics-environmental-justice',
    category: 'Ethics & Supply Chain',
    isTrap: false,
    prompt: 'How does SovDash track compute cluster water stress and grid carbon intensity under Environmental Justice?',
    expectedKeywords: ['water', 'carbon'],
    expectedAnyNumbers: []
  },
  {
    id: 'ethics-censorship-ooni-ioda',
    category: 'Ethics & Supply Chain',
    isTrap: false,
    prompt: 'How does SovDash monitor global internet censorship and shutdowns across countries?',
    expectedKeywords: ['ooni', 'ioda'],
    expectedAnyNumbers: ['180']
  },
  {
    id: 'ethics-ai-labor-rlhf',
    category: 'Ethics & Supply Chain',
    isTrap: false,
    prompt: 'What data does SovDash track for AI data-labeling, RLHF, and content-moderation labor hubs?',
    expectedKeywords: ['rlhf', 'labor'],
    expectedAnyNumbers: []
  },

  // ── 4. Frontier Labs & Observatory Ecosystem (4 cases) ──
  {
    id: 'labs-anthropic-openai-frameworks',
    category: 'Frontier Labs & Compute',
    isTrap: false,
    prompt: 'Compare Anthropic\'s Responsible Scaling Policy (RSP) and OpenAI\'s Preparedness Framework as tracked in Frontier Lab Watch.',
    expectedKeywords: ['anthropic', 'rsp', 'openai', 'preparedness'],
    expectedAnyNumbers: []
  },
  {
    id: 'observatory-sagri-methodology',
    category: 'Frontier Labs & Compute',
    isTrap: false,
    prompt: 'Explain the SAGRI Readiness Index pillars and NATO Admiralty grading used by Sovereign Observatory.',
    expectedKeywords: ['sagri', 'admiralty'],
    expectedAnyNumbers: []
  },
  {
    id: 'temporal-milestones-2020-2026',
    category: 'Frontier Labs & Compute',
    isTrap: false,
    prompt: 'Summarize early mega-scale compute and multilateral AI milestones tracked in 2020–2022.',
    expectedKeywords: ['2020', '2021', 'unesco'],
    expectedAnyNumbers: []
  },
  {
    id: 'statute-singapore-india-reporting',
    category: 'Frontier Labs & Compute',
    isTrap: false,
    prompt: 'Compare Singapore PDPA/CSA incident timelines against India CERT-In directions.',
    expectedKeywords: ['singapore', 'cert-in', 'india'],
    expectedAnyNumbers: ['6 hours', '3 calendar']
  },

  // ── 5. Adversarial Unanswerable Hallucination Traps (4 cases) ──
  {
    id: 'trap-antarctica-act-2029',
    category: 'Adversarial Trap (Abstention)',
    isTrap: true,
    prompt: 'What is the exact mandatory incident reporting fine in euros under the Antarctica Sovereign AI Act of 2029?',
    expectedKeywords: [],
    expectedAnyNumbers: []
  },
  {
    id: 'trap-martian-compute-treaty',
    category: 'Adversarial Trap (Abstention)',
    isTrap: true,
    prompt: 'Quote Section 404(b) of the Martian Orbital Compute Treaty tracked in Sovereign Observatory.',
    expectedKeywords: [],
    expectedAnyNumbers: []
  },
  {
    id: 'trap-private-openai-bill',
    category: 'Adversarial Trap (Abstention)',
    isTrap: true,
    prompt: 'What was the exact undisclosed private electricity bill in dollars paid by OpenAI for GPT-7 training last Tuesday?',
    expectedKeywords: [],
    expectedAnyNumbers: []
  },
  {
    id: 'trap-vatican-6h-deadline',
    category: 'Adversarial Trap (Abstention)',
    isTrap: true,
    prompt: 'List the specific 6-hour mandatory incident reporting deadline enacted by the Vatican AI Safety Authority in 2026.',
    expectedKeywords: [],
    expectedAnyNumbers: []
  }
];

export async function executeHallucinationEvalSuite({ triggeredBy = 'cli', configOverride = null, persist = true } = {}) {
  const results = [];
  let passedCount = 0;
  let trapTotal = 0;
  let trapPassed = 0;
  let phantomTotal = 0;
  let covSum = 0;
  let groundingSum = 0;
  let modelLabel = 'unknown';
  let providerLabel = 'unknown';

  for (const tc of SOVDASH_EVAL_CASES) {
    const out = await runSovDashAiTurn({
      prompt: tc.prompt,
      configOverride: { ...(configOverride || {}), allowWebAugmentation: tc.isTrap ? false : (configOverride?.allowWebAugmentation ?? true) },
      persist: false
    });

    modelLabel = out.modelUsed || modelLabel;
    providerLabel = out.providerUsed || providerLabel;

    const ansLower = String(out.answer || '').toLowerCase();
    const abstained = isAbstentionText(ansLower);
    const gm = out.groundingMetrics || {};
    const phantomCount = (gm.phantomCitationCount || 0) + (gm.phantomUrlCount || 0);
    phantomTotal += phantomCount;
    covSum += Number(gm.citationCoverage || 0);
    groundingSum += Number(gm.entityNumericGrounding || 0);

    let keywordOk = true;
    if (!tc.isTrap && tc.expectedKeywords.length > 0) {
      const hits = tc.expectedKeywords.filter((k) => ansLower.includes(k.toLowerCase())).length;
      keywordOk = hits >= Math.ceil(tc.expectedKeywords.length * 0.65);
    }

    let numberOk = true;
    if (!tc.isTrap && tc.expectedAnyNumbers.length > 0) {
      const ansNoCommas = ansLower.replace(/,/g, '');
      numberOk = tc.expectedAnyNumbers.some((n) => {
        const nl = n.toLowerCase();
        return ansLower.includes(nl) || ansNoCommas.includes(nl.replace(/,/g, ''));
      });
    }

    const noBoilerplate = !/verified vs\. unknown/i.test(ansLower);
    const lengthOk = !tc.maxCharsExpected || out.answer.length <= tc.maxCharsExpected;
    const abstentionOk = !tc.mustNotAbstain || !abstained;

    let passed = false;
    if (tc.isTrap) {
      trapTotal += 1;
      passed = abstained && phantomCount === 0 && noBoilerplate;
      if (passed) trapPassed += 1;
    } else {
      passed =
        out.hallucinationGrade !== 'FLAGGED' &&
        phantomCount === 0 &&
        keywordOk &&
        numberOk &&
        noBoilerplate &&
        lengthOk &&
        abstentionOk &&
        (out.citations?.length || 0) > 0;
    }

    if (passed) passedCount += 1;

    results.push({
      id: tc.id,
      category: tc.category,
      isTrap: tc.isTrap,
      prompt: tc.prompt,
      passed,
      hallucinationGrade: out.hallucinationGrade,
      abstained,
      keywordOk,
      numberOk,
      noBoilerplate,
      lengthOk,
      citationCount: out.citations?.length || 0,
      citationCoverage: gm.citationCoverage ?? 1,
      entityNumericGrounding: gm.entityNumericGrounding ?? 1,
      phantomCount,
      modelUsed: out.modelUsed,
      providerUsed: out.providerUsed,
      latencyMs: out.latencyMs,
      answerPreview: String(out.answer || '').slice(0, 320)
    });

    if (triggeredBy === 'cli-eval-script' && (out.providerUsed === 'gemma' || out.providerUsed === 'gemini') && results.length < SOVDASH_EVAL_CASES.length) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  const totalTests = results.length || 1;
  const summary = {
    triggeredBy,
    providerUsed: providerLabel,
    modelUsed: modelLabel,
    totalTests,
    passedCount,
    passRate: Number(((passedCount / totalTests) * 100).toFixed(1)),
    citationCoverageAvg: Number(((covSum / totalTests) * 100).toFixed(1)),
    groundingAvg: Number(((groundingSum / totalTests) * 100).toFixed(1)),
    abstentionAccuracy: trapTotal ? Number(((trapPassed / trapTotal) * 100).toFixed(1)) : 100,
    phantomCitationCount: phantomTotal,
    hallucinationRate: Number((((totalTests - passedCount) / totalTests) * 100).toFixed(1)),
    generatedAt: new Date().toISOString(),
    results
  };

  if (persist) {
    const saved = await saveEvalRun(summary);
    summary.id = saved.id;
  }

  return summary;
}
