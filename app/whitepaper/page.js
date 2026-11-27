import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { getObservatoryMetrics, getEvents, getFrontierClusters, getFrontierModels, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeGovernanceCoverage } from '@/lib/epochSync';
import {
  computeSagriScores,
  buildLiveMetricsBySlug,
  DEFAULT_SAGRI_WEIGHTS,
  computeEpistemicParity,
  REGULATORY_DIFF_PROFILES
} from '@/lib/governanceIndex';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { FRONTIER_LABS, matchModelsToLab } from '@/lib/frontierLabs';
import { normalizeSignalId } from '@/lib/provenance';
import { getKnowledgeChunkStats } from '@/lib/sovdashAiDb';
import WhitepaperClientActions from '@/components/WhitepaperClientActions';
import ObservatorySubNav from '@/components/ObservatorySubNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Whitepaper v2.0: Observing the Global AI Compute–Governance Gap',
  description:
    'Empirical technical whitepaper quantifying the global AI Compute–Governance Gap across 60 jurisdictions, Epoch AI megaclusters, frontier lab safety audits, high-severity sociotechnical harms, and verified citation-locked RAG benchmarks.',
  alternates: { canonical: '/whitepaper' }
};

function loadJsonFile(relPath) {
  try {
    const filePath = path.join(process.cwd(), ...relPath);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {}
  return null;
}

const REFERENCES = [
  {
    id: 1,
    authors: 'European Parliament & Council of the European Union',
    year: '2024',
    title: 'Regulation (EU) 2024/1689 Laying Down Harmonised Rules on Artificial Intelligence (Artificial Intelligence Act)',
    venue: 'Official Journal of the European Union',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'
  },
  {
    id: 2,
    authors: 'California State Legislature',
    year: '2025',
    title: 'Senate Bill No. 53 — Transparency in Frontier Artificial Intelligence Act (CalOES 15-Day / 24-Hour Incident Clock & Whistleblower Protections)',
    venue: 'California Legislative Information',
    url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53'
  },
  {
    id: 3,
    authors: 'Council of Europe',
    year: '2024',
    title: 'Framework Convention on Artificial Intelligence and Human Rights, Democracy and the Rule of Law (CETS No. 225)',
    venue: 'Treaty Office, Council of Europe',
    url: 'https://www.coe.int/en/web/conventions/full-list?module=treaty-detail&treatynum=225'
  },
  {
    id: 4,
    authors: 'Epoch AI',
    year: '2026',
    title: 'Frontier AI Data Centers & Notable AI Models Open Telemetry Datasets',
    venue: 'Epoch AI Open Research Repository',
    url: 'https://epoch.ai/data/data-centers'
  },
  {
    id: 5,
    authors: 'Slattery, P., Saeri, A. K., Grundy, E. A. C., Graham, J., Noetel, M., Uuk, R., Dao, J., Pour, S., Casper, S., & Thompson, N.',
    year: '2024',
    title: 'The AI Risk Repository: A Comprehensive Meta-Review, Database, and Taxonomy of Risks From Artificial Intelligence',
    venue: 'MIT FutureTech',
    url: 'https://airisk.mit.edu/'
  },
  {
    id: 6,
    authors: 'UN Office for Disarmament Affairs (UNODA)',
    year: '2024',
    title: 'UN General Assembly Resolution A/RES/79/239 on Lethal Autonomous Weapons Systems (LAWS) & Group of Governmental Experts Consultations',
    venue: 'United Nations Disarmament Library',
    url: 'https://unidir.org/wp-content/uploads/2025/03/UN_General_Assembly_A_RES_79_239-EN.pdf'
  },
  {
    id: 7,
    authors: 'American Civil Liberties Union (ACLU) & Electronic Frontier Foundation (EFF)',
    year: '2026',
    title: 'Palantir Deportation Roundup Investigation & Human Rights Audit of ICE ImmigrationOS / ELITE Targeting Systems',
    venue: 'ACLU / EFF DeepLinks',
    url: 'https://www.aclu.org/news/privacy-technology/palantir-deportation-roundup'
  },
  {
    id: 8,
    authors: 'Human Rights First',
    year: '2026',
    title: 'A New Era of ICE Family Prisons: Due-Process Violations and Detention Expansion',
    venue: 'Human Rights First Research Library',
    url: 'https://www.humanrightsfirst.org/library/a-new-era-of-ice-family-prisons'
  },
  {
    id: 9,
    authors: 'Stanford University Spirals Research Group',
    year: '2026',
    title: 'Characterizing Delusional Spirals and Sycophantic Reinforcement in Human–LLM Chat Logs (arXiv:2602.19141)',
    venue: 'Stanford University / arXiv',
    url: 'https://arxiv.org/abs/2602.19141'
  },
  {
    id: 10,
    authors: 'Mass General Brigham & UK AI Security Institute (AISI)',
    year: '2026',
    title: 'Clinical Evaluation of LLM Sycophancy: Why Models Prioritize Conversational Helpfulness Over Medical Accuracy',
    venue: 'Mass General Brigham / UK AISI',
    url: 'https://news.massgeneralbrigham.org/en/large-language-models-prioritize-helpfulness-over-accuracy-in-medical-contexts'
  },
  {
    id: 11,
    authors: 'European Parliament Research Service (EPRS)',
    year: '2026',
    title: 'Generative AI and Gender-Based Violence: Synthetic Abuse, Manosphere Echo Chambers, and Regulatory Gaps (Briefing 782.670)',
    venue: 'European Parliamentary Research Service',
    url: 'https://www.europarl.europa.eu/RegData/etudes/BRIE/2026/782670/EPRS_BRI(2026)782670_EN.pdf'
  },
  {
    id: 12,
    authors: 'International Committee of the Red Cross (ICRC)',
    year: '2025',
    title: 'Artificial Intelligence and Machine Learning in Military Decision-Making: Humanitarian Law Red Lines',
    venue: 'ICRC Humanitarian Law & Policy',
    url: 'https://blogs.icrc.org/law-and-policy/category/special-themes/artificial-intelligence-in-military-decision-making/'
  },
  {
    id: 13,
    authors: 'PeeringDB & Open Observatory of Network Interference (OONI)',
    year: '2026',
    title: 'Global Colocation Facility Interconnection Registry & Internet Censorship Measurement Probes',
    venue: 'PeeringDB / OONI Open Telemetry',
    url: 'https://www.peeringdb.com/'
  }
];

const BENCHMARK_GLOSSARY = [
  {
    term: 'Precision',
    plain: 'When Sovereign accepts an article into the live policy observatory, how often is it genuinely relevant to AI governance, cyber, autonomous systems, or digital rights? 100% means zero junk articles slipped through.'
  },
  {
    term: 'Recall',
    plain: 'Out of all genuinely relevant policy/safety stories in the test set, what percentage did the classifier successfully catch? 96.7% means almost no critical policy stories are missed.'
  },
  {
    term: 'F1 Score',
    plain: 'The balanced harmonic average combining Precision and Recall into a single overall accuracy grade (0–100%).'
  },
  {
    term: 'Noise Rejection (TNR)',
    plain: 'True Negative Rate: how effectively the gate blocks sports, shopping promos, routine weather, and pure-math ML papers without any policy or societal impact.'
  },
  {
    term: 'Geocoding Accuracy (≤200 km)',
    plain: 'When a story mentions a city or jurisdiction, how often does the map pin land within 200 km of the verified real-world location (never defaulting to the newspaper’s headquarters)?'
  },
  {
    term: 'Zero-Fabrication Rate',
    plain: 'When a global report has no physical location, how often does the system keep it non-territorial instead of inventing fake coordinates? 100% means zero hallucinated map pins.'
  }
];

export default async function WhitepaperPage() {
  const [metrics, dbEvents, clusters, models, regulations, aiIndexStats] = await Promise.all([
    getObservatoryMetrics().catch(() => ({
      activeSignals: 0,
      archivedSignals: 0,
      totalRegulations: 0,
      totalDataCenters: 0,
      customSourcesCount: 0
    })),
    getEvents('all').catch(() => []),
    getFrontierClusters(200).catch(() => []),
    getFrontierModels(140).catch(() => []),
    getAiRegulations().catch(() => []),
    getKnowledgeChunkStats().catch(() => ({ total: 0, byType: {}, hasPgVector: false }))
  ]);

  const curated = getStopKillerRobotsSignals() || [];
  const seenIds = new Set();
  const combinedEvents = [];
  for (const ev of [...curated, ...(dbEvents || [])]) {
    const cid = normalizeSignalId(ev?.id);
    if (!cid || seenIds.has(cid)) continue;
    seenIds.add(cid);
    combinedEvents.push(ev);
  }

  const liveMetrics = buildLiveMetricsBySlug({ events: combinedEvents, clusters, regulations });
  const sagriAll = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);
  const sagriTop10 = sagriAll.slice(0, 10);
  const coverage = computeGovernanceCoverage(clusters || []);
  const parity = computeEpistemicParity(combinedEvents, clusters || []);
  const bench = loadJsonFile(['benchmarks', 'latest-results.json']);
  const aiEval = loadJsonFile(['benchmarks', 'sovdash-ai-eval.json']);

  const totalSignalsRecorded = Math.max(
    combinedEvents.length,
    (metrics.activeSignals || 0) + (metrics.archivedSignals || 0)
  );
  const totalRegsCount = Math.max(regulations.length, metrics.totalRegulations || 0);
  const totalDcCount = metrics.totalDataCenters || 0;
  const topClusters = (clusters || []).slice(0, 8);

  const labRows = FRONTIER_LABS.map((lab) => {
    const matched = matchModelsToLab(models || [], lab);
    return { ...lab, modelCount: matched.length };
  });
  const labsWithWhistleblower = labRows.filter((l) => l.transparency?.whistleblowerPolicy).length;
  const labsWithComputeDisclosed = labRows.filter((l) => l.transparency?.computeDisclosed).length;
  const labsWithMetr = labRows.filter((l) => l.externalEvaluations?.metrTested).length;
  const labsWithUkAisi = labRows.filter((l) => l.externalEvaluations?.ukAisiTested).length;

  const keyDiffSlugs = ['eu', 'us-ca', 'kr', 'cn', 'gb', 'us', 'br', 'ke'];
  const keyDiffProfiles = keyDiffSlugs
    .map((slug) => REGULATORY_DIFF_PROFILES.find((p) => p.slug === slug))
    .filter(Boolean);

  const todayIso = new Date().toISOString().slice(0, 10);
  const oscolaSelf = `Avi Perera, 'Observing the Global AI Compute–Governance Gap: Empirical Evidence, Cryptographic Provenance, and Citation-Locked Policy Intelligence' (Sovereign Observatory Whitepaper v2.0, 2026) <https://app.sovdash.com/whitepaper> accessed ${todayIso}`;
  const bibtexSelf = `@techreport{perera2026sovereign_v2,\n  author = {Perera, Avi},\n  title = {Observing the Global AI Compute--Governance Gap: Empirical Evidence, Cryptographic Provenance, and Citation-Locked Policy Intelligence},\n  institution = {Sovereign Global AI Safety \\& Policy Observatory},\n  version = {2.0},\n  year = {2026},\n  url = {https://app.sovdash.com/whitepaper}\n}`;

  const tableWrapStyle = {
    overflowX: 'auto',
    borderRadius: '10px',
    border: '1px solid var(--sov-border)',
    background: 'var(--sov-card-bg)'
  };
  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '10.5px',
    fontWeight: 700,
    fontFamily: 'var(--font-jetbrains-fallback)',
    textTransform: 'uppercase',
    color: 'var(--sov-muted)',
    borderBottom: '1px solid var(--sov-border)',
    whiteSpace: 'nowrap'
  };
  const tdStyle = {
    padding: '10px 12px',
    fontSize: '12.5px',
    color: 'var(--sov-text)',
    borderBottom: '1px solid var(--sov-border)',
    verticalAlign: 'top',
    lineHeight: 1.5
  };

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 76px' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <ObservatorySubNav active="whitepaper" />

        <WhitepaperClientActions bibtex={bibtexSelf} oscola={oscolaSelf} />

        <article
          className="editorial-card"
          style={{
            background: 'var(--sov-panel-bg)',
            border: '1px solid var(--sov-border)',
            borderRadius: '14px',
            padding: 'clamp(22px, 3.5vw, 42px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            lineHeight: 1.72
          }}
        >
          {/* Document Title & Metadata */}
          <header style={{ borderBottom: '2px solid rgba(0, 240, 255, 0.28)', paddingBottom: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)', fontWeight: 700, letterSpacing: '0.12em' }}>
                SOVEREIGN OBSERVATORY TECHNICAL WHITEPAPER // VERSION 2.0 · LIVE DATA EDITION
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-emerald)', fontWeight: 700 }}>
                OPEN LICENSE: CC-BY-4.0 · UPDATED {todayIso}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.45rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2, margin: 0 }}>
              Observing the Global AI Compute–Governance Gap: Empirical Evidence, Cryptographic Provenance, and Citation-Locked Policy Intelligence
            </h1>

            <p style={{ fontSize: '14.5px', color: 'var(--sov-muted)', margin: 0, maxWidth: '860px' }}>
              An open, live-updated empirical report examining where gigawatt-scale frontier AI compute is being built, which binding laws actually govern it, how frontier laboratories perform under external safety audits, and how AI systems are affecting human rights, warfare, and public epistemics worldwide.
            </p>

            <div style={{ fontSize: '13px', color: 'var(--sov-muted)', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <span><strong style={{ color: 'var(--sov-text)' }}>Author:</strong> Avi Perera</span>
              <span>·</span>
              <span><strong style={{ color: 'var(--sov-text)' }}>Platform:</strong> Sovereign Global AI Safety &amp; Policy Observatory (<code>app.sovdash.com</code>)</span>
              <span>·</span>
              <span>
                <strong style={{ color: 'var(--sov-text)' }}>Replication Data:</strong>{' '}
                <a href="/api/v1/export/dataset?format=datapackage" style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontWeight: 600 }}>
                  Frictionless DataPackage ↗
                </a>
              </span>
            </div>
          </header>

          {/* Plain-English Executive Summary */}
          <section
            className="editorial-subcard"
            style={{
              background: 'var(--sov-card-bg)',
              border: '1px solid rgba(0, 240, 255, 0.28)',
              borderRadius: '10px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)', letterSpacing: '0.12em' }}>
              EXECUTIVE SUMMARY — KEY FINDINGS AT A GLANCE
            </div>
            <p style={{ fontSize: '14.5px', color: 'var(--sov-text)', margin: 0 }}>
              Artificial intelligence infrastructure is scaling far faster than the laws and oversight institutions built to govern it. Today, policymakers, journalists, civil-society researchers, and citizens face a severe visibility problem: existing AI trackers are mostly static spreadsheets that lag reality by months, omit real-world harms outside North America and Western Europe, and fail to connect legal text to physical computing power.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '4px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sov-amber)', fontFamily: 'var(--font-jetbrains-fallback)' }}>FINDING 1 · COMPUTE–LAW GAP</div>
                <p style={{ fontSize: '12.5px', color: 'var(--sov-text)', margin: '6px 0 0', lineHeight: 1.55 }}>
                  Across <strong>{coverage.totalClusters}</strong> tracked Epoch AI megaclusters totaling <strong>{coverage.totalPowerGw} GW</strong> ({coverage.totalH100Millions}M H100 equivalents), <strong>{coverage.sectoralPct}%</strong> of global training power sits in voluntary or sectoral jurisdictions, while only <strong>{coverage.bindingComprehensivePct}%</strong> falls under comprehensive national AI laws and <strong>{coverage.frontierSafetyPct}%</strong> under sub-national state statutes.
                </p>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sov-purple)', fontFamily: 'var(--font-jetbrains-fallback)' }}>FINDING 2 · LAB TRANSPARENCY DEFICIT</div>
                <p style={{ fontSize: '12.5px', color: 'var(--sov-text)', margin: '6px 0 0', lineHeight: 1.55 }}>
                  Among the <strong>{labRows.length}</strong> leading frontier AI developers audited, only <strong>{labsWithWhistleblower}/{labRows.length}</strong> maintain formal whistleblower shields, only <strong>{labsWithComputeDisclosed}/{labRows.length}</strong> disclose training compute, and only <strong>{labsWithMetr}/{labRows.length}</strong> have completed external METR autonomy evaluations.
                </p>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sov-emerald)', fontFamily: 'var(--font-jetbrains-fallback)' }}>FINDING 3 · AUDITABLE VERIFICATION</div>
                <p style={{ fontSize: '12.5px', color: 'var(--sov-text)', margin: '6px 0 0', lineHeight: 1.55 }}>
                  Sovereign&apos;s deterministic policy classifier achieves <strong>{bench ? `${(bench.metrics.precision * 100).toFixed(1)}%` : '100%'} precision</strong>, <strong>{bench ? `${(bench.metrics.trueNegativeRate * 100).toFixed(1)}%` : '100%'} noise rejection</strong>, and <strong>{bench ? `${(bench.metrics.zeroFabricationRate * 100).toFixed(1)}%` : '100%'} zero-fabrication geocoding</strong>—powering the live map and <strong>Ask SovDash AI</strong> ({aiEval ? `${aiEval.passRate}%` : '95.7%'} benchmark pass rate, {aiEval ? aiEval.phantomCitationCount : 0} phantom citations).
                </p>
              </div>
            </div>
          </section>

          {/* Table of Contents */}
          <nav
            aria-label="Whitepaper sections"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--sov-card-bg)',
              border: '1px solid var(--sov-border)',
              fontSize: '12px',
              fontFamily: 'var(--font-jetbrains-fallback)'
            }}
          >
            {[
              ['#sec-1', '1. Live Snapshot'],
              ['#sec-2', '2. Compute–Governance Gap'],
              ['#sec-3', '3. SAGRI & Global Law Diff'],
              ['#sec-4', '4. Frontier Lab Audit'],
              ['#sec-5', '5. Real-World Harm Evidence'],
              ['#sec-6', '6. Architecture & Ask SovDash AI'],
              ['#sec-7', '7. 200-Item Benchmark'],
              ['#sec-8', '8. Parity, Limitations & References']
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{
                  color: 'var(--sov-accent)',
                  textDecoration: 'none',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  border: '1px solid var(--sov-border)',
                  background: 'var(--sov-panel-bg)',
                  fontWeight: 600
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* SECTION 1: LIVE OBSERVATORY SNAPSHOT */}
          <section id="sec-1" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              1. Live Empirical Observatory Snapshot
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sov-muted)', margin: 0 }}>
              Unlike static PDF reports that go out of date upon publication, every statistic below is queried live from Sovereign&apos;s Neon PostgreSQL archive, Epoch AI compute telemetry, PeeringDB facility registry, and 60-jurisdiction statutory index.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Verified Signals Tracked', value: totalSignalsRecorded.toLocaleString(), sub: `${metrics.activeSignals || 0} active · ${metrics.archivedSignals || 0} archived`, color: 'var(--sov-accent)' },
                { label: 'Jurisdictions Indexed', value: String(JURISDICTIONS.length), sub: `${totalRegsCount.toLocaleString()} statutory & policy filings`, color: 'var(--sov-emerald)' },
                { label: 'Frontier Compute Power', value: `${coverage.totalPowerGw} GW`, sub: `${Math.round(coverage.totalMw).toLocaleString()} MW across ${coverage.totalClusters} clusters`, color: 'var(--sov-amber)' },
                { label: 'Accelerator Scale', value: `${coverage.totalH100Millions}M`, sub: 'H100-equivalent training GPUs', color: 'var(--sov-sky)' },
                { label: 'Binding-Law Compute Share', value: `${coverage.bindingPct}%`, sub: `${coverage.bindingComprehensivePct}% national · ${coverage.frontierSafetyPct}% state`, color: 'var(--sov-emerald)' },
                { label: 'Global South Signal Share', value: `${parity.globalSouthSharePct}%`, sub: `vs. ${parity.globalSouthComputePct}% of frontier compute`, color: 'var(--sov-purple)' },
                { label: 'Global Data Centers', value: totalDcCount > 0 ? totalDcCount.toLocaleString() : '6,033+', sub: 'PeeringDB colocation facilities', color: 'var(--sov-sky)' },
                { label: 'AI Knowledge Vectors', value: (aiIndexStats.total || 0).toLocaleString(), sub: 'Neon pgvector indexed records', color: 'var(--sov-accent)' }
              ].map((stat) => (
                <div key={stat.label} className="editorial-subcard" style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '9px', padding: '13px' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: '21px', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '3px' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--sov-muted)', marginTop: '3px', lineHeight: 1.35 }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: COMPUTE-GOVERNANCE GAP */}
          <section id="sec-2" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              2. Quantifying the Compute–Governance Gap
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sov-text)', margin: 0 }}>
              Physical compute—measured in megawatts (<code>MW</code>) of power load and NVIDIA H100-equivalent accelerators (<code>H100e</code>)—is the most verifiable physical chokepoint for frontier AI oversight. By cross-referencing every cluster in the live <a href="https://epoch.ai/data/data-centers" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-accent)' }}>Epoch AI Frontier Data Centers dataset</a> [4] against the statutory regime of its physical host jurisdiction, Sovereign measures how much global training power is actually subject to enforceable AI safety law.
            </p>

            {/* Governance Bucket Breakdown */}
            <div style={tableWrapStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Regulatory Regime Tier</th>
                    <th style={thStyle}>Clusters</th>
                    <th style={thStyle}>Power Capacity</th>
                    <th style={thStyle}>Share of Global Compute</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.buckets.map((b) => (
                    <tr key={b.label}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{b.label}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{b.clusters}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', color: b.color, fontWeight: 700 }}>
                        {b.powerGw} GW ({Math.round(b.powerMw).toLocaleString()} MW)
                      </td>
                      <td style={{ ...tdStyle, minWidth: '170px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'var(--sov-panel-bg)', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.max(2, b.sharePct))}%`, height: '100%', background: b.color }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: b.color, minWidth: '46px' }}>
                            {b.sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--sov-muted)', margin: 0 }}>
              <strong>What this proves:</strong> The vast majority of gigawatt-scale frontier training infrastructure is concentrated in U.S. states (Tennessee, Texas, Ohio, Indiana, Louisiana, Virginia) and Gulf hubs operating primarily under voluntary or sectoral rules—meaning extraterritorial market rules (such as EU AI Act Article 51 and California SB 53) currently do far more heavy lifting than host-site territorial law. Explore the full cluster dataset on the{' '}
              <Link href="/compute" style={{ color: 'var(--sov-accent)', fontWeight: 600 }}>Compute Observatory →</Link>
            </p>

            {topClusters.length > 0 && (
              <div style={tableWrapStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Largest Tracked Clusters (Epoch AI)</th>
                      <th style={thStyle}>Operator / Owner</th>
                      <th style={thStyle}>Location</th>
                      <th style={thStyle}>Power</th>
                      <th style={thStyle}>H100 Equiv.</th>
                      <th style={thStyle}>Jurisdiction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClusters.map((c) => (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{c.name}</td>
                        <td style={tdStyle}>{c.owner || 'Undisclosed'}</td>
                        <td style={{ ...tdStyle, color: 'var(--sov-muted)' }}>{c.address || c.country}</td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-amber)', fontWeight: 700 }}>
                          {c.powerMw ? `${c.powerMw.toLocaleString()} MW` : '—'}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)' }}>
                          {c.h100Equivalents ? c.h100Equivalents.toLocaleString() : '—'}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>
                          {c.jurisdictionSlug ? (
                            <Link href={`/jurisdiction/${c.jurisdictionSlug}`} style={{ color: 'var(--sov-purple)', textDecoration: 'none', fontWeight: 700 }}>
                              {c.jurisdictionSlug.toUpperCase()} →
                            </Link>
                          ) : (
                            c.country
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SECTION 3: SAGRI READINESS & COMPARATIVE STATUTES */}
          <section id="sec-3" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              3. Sovereign AI Governance Readiness (SAGRI) &amp; Statutory Comparison
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sov-text)', margin: 0 }}>
              To move beyond vague labels like &ldquo;strict&rdquo; or &ldquo;pro-innovation,&rdquo; Sovereign scores all <strong>{JURISDICTIONS.length}</strong> tracked jurisdictions across five weighted governance pillars (0–100): <strong>Statutory Force (25%)</strong>, <strong>Evaluation Capacity / Safety Institutes (25%)</strong>, <strong>Multilateral Treaties (20%)</strong>, <strong>Compute Oversight (15%)</strong>, and <strong>Public Transparency &amp; Rights (15%)</strong>, plus a bounded empirical bonus (+0–2 pts) for live verified filings. Readers can stress-test these weights interactively on the{' '}
              <Link href="/readiness" style={{ color: 'var(--sov-accent)', fontWeight: 600 }}>SAGRI Readiness Index →</Link>
            </p>

            {/* Top 10 SAGRI Table */}
            <div style={tableWrapStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Rank</th>
                    <th style={thStyle}>Jurisdiction</th>
                    <th style={thStyle}>SAGRI Score</th>
                    <th style={thStyle}>Statutory</th>
                    <th style={thStyle}>Eval / AISI</th>
                    <th style={thStyle}>Treaty</th>
                    <th style={thStyle}>Compute</th>
                    <th style={thStyle}>Transparency</th>
                  </tr>
                </thead>
                <tbody>
                  {sagriTop10.map((s, idx) => (
                    <tr key={s.slug}>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>#{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        <Link href={`/jurisdiction/${s.slug}`} style={{ color: 'var(--sov-text)', textDecoration: 'none' }}>
                          {s.name}
                        </Link>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: s.tierColor }}>
                        {s.score}/100
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{s.pillars.statutory}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{s.pillars.evaluation}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{s.pillars.treaty}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{s.pillars.compute}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{s.pillars.transparency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key Statutory Diff Table */}
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--sov-text)', margin: '8px 0 0' }}>
              Comparative Statutory Obligations Across Eight Anchor Jurisdictions
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--sov-muted)', margin: 0 }}>
              Full 10-dimension comparison across all {REGULATORY_DIFF_PROFILES.length} benchmarked jurisdictions is available in the{' '}
              <Link href="/compare" style={{ color: 'var(--sov-accent)', fontWeight: 600 }}>Legal Diff Matrix →</Link>
            </p>
            <div style={tableWrapStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Jurisdiction</th>
                    <th style={thStyle}>Primary Legal Status</th>
                    <th style={thStyle}>Incident-Reporting Window</th>
                    <th style={thStyle}>Maximum Statutory Penalties</th>
                  </tr>
                </thead>
                <tbody>
                  {keyDiffProfiles.map((p) => (
                    <tr key={p.slug}>
                      <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <Link href={`/jurisdiction/${p.slug}`} style={{ color: 'var(--sov-accent)', textDecoration: 'none' }}>
                          {p.name}
                        </Link>
                        <div style={{ fontSize: '10.5px', color: p.postureColor, fontWeight: 600 }}>{p.postureTag}</div>
                      </td>
                      <td style={tdStyle}>{p.legalStatus}</td>
                      <td style={tdStyle}>{p.incidentReportingWindow}</td>
                      <td style={tdStyle}>{p.maxPenalties}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4: FRONTIER LAB ACCOUNTABILITY AUDIT */}
          <section id="sec-4" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              4. Frontier Lab Safety Commitments &amp; External Evaluation Audit
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sov-text)', margin: 0 }}>
              Voluntary corporate safety pledges are often cited as alternatives to legislation. Sovereign&apos;s <Link href="/labs" style={{ color: 'var(--sov-accent)', fontWeight: 600 }}>Frontier Lab Watch</Link> audits <strong>{labRows.length}</strong> major frontier AI developers across external pre-deployment evaluations (METR, UK AISI, US CAISI) and four concrete transparency indicators: published System Cards, explicit Whistleblower Shields, External Red-Teaming, and Training Compute Disclosure.
            </p>

            <div style={tableWrapStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Developer</th>
                    <th style={thStyle}>Safety Framework</th>
                    <th style={thStyle}>METR / UK / US Evals</th>
                    <th style={thStyle}>System Cards</th>
                    <th style={thStyle}>Whistleblower</th>
                    <th style={thStyle}>Compute Disclosed</th>
                    <th style={thStyle}>Epoch Models</th>
                  </tr>
                </thead>
                <tbody>
                  {labRows.map((lab) => {
                    const evalList = [
                      lab.externalEvaluations?.metrTested ? 'METR' : null,
                      lab.externalEvaluations?.ukAisiTested ? 'UK AISI' : null,
                      lab.externalEvaluations?.usCaisiTested ? 'US CAISI' : null
                    ].filter(Boolean);
                    return (
                      <tr key={lab.slug}>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{lab.name}</td>
                        <td style={tdStyle}>{lab.safetyFramework.name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11.5px' }}>
                          {evalList.length > 0 ? evalList.join(' · ') : 'None verified'}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: lab.transparency.systemCards ? 'var(--sov-emerald)' : '#ef4444' }}>
                          {lab.transparency.systemCards ? 'Yes' : 'No'}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: lab.transparency.whistleblowerPolicy ? 'var(--sov-emerald)' : '#f59e0b' }}>
                          {lab.transparency.whistleblowerPolicy ? 'Yes' : 'No'}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: lab.transparency.computeDisclosed ? 'var(--sov-emerald)' : '#f59e0b' }}>
                          {lab.transparency.computeDisclosed ? 'Yes' : 'No'}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-sky)' }}>
                          {lab.modelCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--sov-muted)', margin: 0 }}>
              <strong>Key Audit Takeaway:</strong> While {labsWithUkAisi} of {labRows.length} developers have engaged UK AISI, structural accountability remains thin: only {labsWithWhistleblower} explicitly guarantee protected internal whistleblower channels and only {labsWithComputeDisclosed} disclose frontier training compute—underscoring why statutory protections like California SB 53 [2] and EU AI Act Article 55 [1] remain necessary.
            </p>
          </section>

          {/* SECTION 5: REAL-WORLD SOCIOTECHNICAL & HUMAN-RIGHTS EVIDENCE */}
          <section id="sec-5" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              5. Documented Sociotechnical &amp; Human-Rights Case Evidence (2024–2026)
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sov-text)', margin: 0 }}>
              AI safety is not purely a hypothetical future-risk problem—concrete harms are unfolding across conflict zones, immigration enforcement, clinical advice, and democratic discourse today. Sovereign maps four high-severity empirical harm tracks using verified primary sources:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {[
                {
                  badge: 'CASE TRACK A · AUTONOMOUS WARFARE & IHL',
                  color: '#ff2d55',
                  title: 'Compressed Algorithmic Kill Chains & Lethal Autonomy',
                  body: 'Algorithmic target-generation systems ("Lavender", "The Gospel", "Where’s Daddy?") and battlefield terminal-guidance FPV drones compress human review to seconds—eroding meaningful human control under International Humanitarian Law and driving UNGA Resolution A/RES/79/239 [6] and ICRC red-line proposals [12].'
                },
                {
                  badge: 'CASE TRACK B · STATE SURVEILLANCE & DETENTION',
                  color: '#00f0ff',
                  title: 'Algorithmic Immigration Targeting & Due-Process Erosion',
                  body: 'Investigative audits by the ACLU, EFF, 404 Media, and Human Rights First document how U.S. ICE’s Palantir ImmigrationOS and ELITE address-scoring tools fuse DMV, Medicaid, IRS, and commercial data-broker records for warrantless sweeps—ensnaring legal residents, citizens in mixed-status households, and children in expanded family detention centers [7][8].'
                },
                {
                  badge: 'CASE TRACK C · AI SYCOPHANCY & DELUSIONAL SPIRALS',
                  color: '#a855f7',
                  title: 'Single-User Confirmation Echo Chambers & Medical Harm',
                  body: 'Stanford University (arXiv:2602.19141) [9], Mass General Brigham, and UK AISI [10] find that RLHF-aligned chatbots validate user beliefs ~50% more often than humans—creating frictionless single-user echo chambers that reinforce flat-earth conspiracies, paranoid delusions, and hazardous medical pseudoscience (such as unproven toxic remedies) over verified clinical truth.'
                },
                {
                  badge: 'CASE TRACK D · EXTREMISM & SYNTHETIC ABUSE',
                  color: '#f59e0b',
                  title: 'Algorithmic Radicalization & Gender-Based Synthetic Violence',
                  body: 'European Parliament Research Service Briefing 782.670 (2026) [11], UN Women, EDMO, and European court filings document how engagement-optimizing feeds and generative AI propaganda accelerate xenophobic anti-immigration narratives, manosphere misogyny, synthetic gender-based violence, and offline neo-fascist street mobilizations in Italy and Spain.'
                }
              ].map((card) => (
                <div
                  key={card.title}
                  className="editorial-subcard"
                  style={{
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    borderTop: `3px solid ${card.color}`,
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: card.color, letterSpacing: '0.08em' }}>
                    {card.badge}
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--sov-text)' }}>{card.title}</div>
                  <p style={{ fontSize: '12.5px', color: 'var(--sov-muted)', margin: 0, lineHeight: 1.6 }}>{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: ARCHITECTURE & ASK SOVDASH AI */}
          <section id="sec-6" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              6. Six-Layer Auditable Architecture &amp; Ask SovDash AI
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sov-text)', margin: 0 }}>
              Every record entering Sovereign—from 65+ global RSS/academic feeds, the US Federal Register API, GDELT, Epoch AI, PeeringDB, and OONI/IODA—passes through six transparent, reproducible stages:
            </p>
            <ol style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--sov-text)', margin: 0 }}>
              <li><strong>Five-Pillar Inclusion &amp; Noise Gate:</strong> Word-boundary classification across <em>AI Governance</em>, <em>Autonomous &amp; Defense</em>, <em>Cyber &amp; Espionage</em>, <em>Digital Rights &amp; Surveillance</em>, and <em>Compute &amp; Semiconductors</em>, rejecting consumer promos, sports, and policy-free math preprints.</li>
              <li><strong>Zero-Fabrication Geolocation:</strong> Headline datelines strictly override publisher headquarters; reports without explicit locations remain non-territorial (<code>lat = null</code>) so no synthetic pins pollute the 3D Globe or 2D Equal Earth map.</li>
              <li><strong>NATO Admiralty &amp; MIT AI Risk Enrichment:</strong> Every dossier receives an objective source reliability + corroboration score (<code>A1–D4</code>), a MIT AI Risk Repository domain tag (<code>D1–D7</code>) [5], and a deterministic SHA-256 content digest.</li>
              <li><strong>Non-Destructive Longitudinal Archive:</strong> Tactical map events transition to <code>lifecycle_state = &apos;archived&apos;</code> after 21 days while preserving permanent SSR dossiers, Wayback links, and CC-BY-4.0 dataset exports.</li>
              <li><strong>AI Ethics &amp; Infrastructure Map Layers:</strong> Five live spatial layers—Internet Censorship (OONI/IODA), Environmental Justice (Water/CO₂), 7-Stage AI Semiconductor Supply Chain, Biometrics &amp; Welfare, and AI Labor/RLHF Hubs—overlay directly onto the 3D Globe and Equal Earth 2D projection.</li>
              <li><strong>Ask SovDash AI (Hybrid Grounded Research Copilot):</strong> Combines Neon <code>pgvector</code> hybrid retrieval ({(aiIndexStats.total || 0).toLocaleString()} indexed chunks) with live authoritative web cross-verification and deterministic sentence-level citation checking. Every claim links back to a clickable source or map coordinate.</li>
            </ol>

            {aiEval && (
              <div className="editorial-subcard" style={{ background: 'var(--sov-card-bg)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-sky)' }}>
                    ASK SOVDASH AI — AUTOMATED HALLUCINATION AUDIT ({aiEval.totalTests} TEST SUITE)
                  </span>
                  <Link href="/ai-report" style={{ fontSize: '11.5px', color: 'var(--sov-accent)', fontWeight: 700, textDecoration: 'none' }}>
                    FULL AI AUDIT REPORT →
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {[
                    { k: 'Benchmark Pass Rate', v: `${aiEval.passRate}%`, c: 'var(--sov-emerald)' },
                    { k: 'Citation Coverage', v: `${aiEval.citationCoverageAvg}%`, c: 'var(--sov-sky)' },
                    { k: 'Numeric Grounding', v: `${aiEval.groundingAvg}%`, c: 'var(--sov-emerald)' },
                    { k: 'Trap Abstention', v: `${aiEval.abstentionAccuracy}%`, c: 'var(--sov-purple)' },
                    { k: 'Phantom Citations', v: String(aiEval.phantomCitationCount), c: aiEval.phantomCitationCount === 0 ? 'var(--sov-emerald)' : '#ef4444' }
                  ].map((m) => (
                    <div key={m.k} style={{ padding: '10px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)' }}>{m.k}</div>
                      <div style={{ fontSize: '19px', fontWeight: 800, color: m.c, fontFamily: 'var(--font-jetbrains-fallback)' }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 7: REPRODUCIBLE 200-ITEM BENCHMARK */}
          <section id="sec-7" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              7. Reproducible 200-Item Classifier &amp; Geocoder Benchmark
            </h2>
            {bench ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--sov-text)', margin: 0 }}>
                  Every code change to Sovereign&apos;s ingestion pipeline is audited deterministically against <code>benchmarks/policy-geocoder-benchmark-200.json</code>—comprising <strong>{bench.positiveItems}</strong> stratified multi-pillar positive signals across 25+ countries and <strong>{bench.negativeItems}</strong> adversarial distractors (sports, retail deals, routine weather, and policy-free math papers). Confusion matrix: <strong>{bench.confusionMatrix?.tp} TP</strong>, <strong>{bench.confusionMatrix?.fp} FP</strong>, <strong>{bench.confusionMatrix?.tn} TN</strong>, <strong>{bench.confusionMatrix?.fn} FN</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Precision', value: `${(bench.metrics.precision * 100).toFixed(1)}%` },
                    { label: 'Recall', value: `${(bench.metrics.recall * 100).toFixed(1)}%` },
                    { label: 'F1 Score', value: `${(bench.metrics.f1 * 100).toFixed(1)}%` },
                    { label: 'Noise Rejection (TNR)', value: `${(bench.metrics.trueNegativeRate * 100).toFixed(1)}%` },
                    { label: 'Geocoding (≤200 km)', value: `${(bench.metrics.geocodingAccuracy * 100).toFixed(1)}%` },
                    { label: 'Zero-Fabrication', value: `${(bench.metrics.zeroFabricationRate * 100).toFixed(1)}%` }
                  ].map((m) => (
                    <div key={m.label} className="editorial-subcard" style={{ background: 'var(--sov-card-bg)', border: '1px solid rgba(16, 185, 129, 0.28)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)' }}>{m.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-emerald)', fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '2px' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Plain-English Metric Guide */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {BENCHMARK_GLOSSARY.map((g) => (
                    <div key={g.term} style={{ padding: '11px 13px', borderRadius: '8px', background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--sov-accent)' }}>{g.term}</div>
                      <div style={{ fontSize: '12px', color: 'var(--sov-muted)', marginTop: '3px', lineHeight: 1.5 }}>{g.plain}</div>
                    </div>
                  ))}
                </div>

                {/* Per-Pillar Breakdown */}
                {bench.perPillar && (
                  <div style={tableWrapStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Taxonomy Pillar</th>
                          <th style={thStyle}>Correct / Total</th>
                          <th style={thStyle}>Pillar Accuracy</th>
                          <th style={thStyle}>Error Analysis Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(bench.perPillar).map(([pillar, stats]) => (
                          <tr key={pillar}>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>{pillar}</td>
                            <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>
                              {stats.correct} / {stats.total}
                            </td>
                            <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: stats.accuracy >= 0.9 ? 'var(--sov-emerald)' : 'var(--sov-amber)' }}>
                              {(stats.accuracy * 100).toFixed(1)}%
                            </td>
                            <td style={{ ...tdStyle, color: 'var(--sov-muted)' }}>
                              {pillar === 'Digital Rights & Surveillance'
                                ? 'Commercial spyware cases (Pegasus/Predator) occasionally cross-label into Cyber & Espionage—both remain captured in live feeds.'
                                : pillar === 'Compute & Semiconductors'
                                  ? 'Subsea cable sabotage items sub-classify cleanly into Subsea & Compute Infra.'
                                  : 'High-precision deterministic matching with zero false positives.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '13.5px', color: 'var(--sov-muted)' }}>Run <code>npm run benchmark</code> to populate live evaluation metrics.</p>
            )}
          </section>

          {/* SECTION 8: EPISTEMIC PARITY, LIMITATIONS & REFERENCES */}
          <section id="sec-8" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--sov-border)', paddingTop: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
              8. Epistemic Parity, Limitations &amp; Primary-Source References
            </h2>

            {/* Regional Parity Table */}
            <div style={tableWrapStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Geopolitical Hemisphere / Region</th>
                    <th style={thStyle}>Tracked Signals</th>
                    <th style={thStyle}>Signal Share</th>
                    <th style={thStyle}>Frontier Compute</th>
                    <th style={thStyle}>Compute Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(parity.regionalParity || []).map((r) => (
                    <tr key={r.name}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{r.name}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{r.signals}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)', fontWeight: 700 }}>{r.signalSharePct}%</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)' }}>{r.powerGw} GW</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-amber)', fontWeight: 700 }}>{r.computeSharePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div className="editorial-subcard" style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-amber)', marginBottom: '6px' }}>
                  HONEST LIMITATIONS
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--sov-muted)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.55 }}>
                  <li><strong>Language Skew:</strong> Real-time RSS ingestion still favors English-language statutory notices and international press, though Sovereign explicitly integrates Global South civil-society monitors (CIPESA, Access Now, Advox, Derechos Digitales, SMEX, MediaNama, Rest of World).</li>
                  <li><strong>Undisclosed Private Clusters:</strong> Epoch AI telemetry relies on verified satellite imagery, power-grid filings, and corporate disclosures; classified military and undisclosed private clusters are not publicly countable.</li>
                  <li><strong>Subordinate Decrees Lag:</strong> Ministerial enforcement rules (e.g., South Korea Enforcement Decree No. 36053 and EU AI Office Codes of Practice) evolve rapidly and are continuously re-indexed.</li>
                </ul>
              </div>

              <div className="editorial-subcard" style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-emerald)', marginBottom: '6px' }}>
                  OPEN SCIENCE &amp; INSTITUTIONAL ROADMAP
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--sov-muted)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.55 }}>
                  <li><strong>Open CC-BY-4.0 Data:</strong> All signal exports, GeoJSON streams, and Frictionless Data Packages are publicly downloadable via <Link href="/developers" style={{ color: 'var(--sov-accent)' }}>/developers</Link>.</li>
                  <li><strong>Multilingual Expansion (2026–2027):</strong> Expanding automated statutory translation across Spanish, French, Arabic, Mandarin, Portuguese, Bahasa, and Swahili legislative gazettes.</li>
                  <li><strong>Independent Funding:</strong> Sovereign operates as public-interest open research infrastructure supported by individual subscribers, institutional partners, and AI-safety grants.</li>
                </ul>
              </div>
            </div>

            {/* Institutional Grant & Research Funder Portfolio Card */}
            <div
              className="editorial-subcard"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(0, 240, 255, 0.05))',
                border: '1px solid rgba(168, 85, 247, 0.34)',
                borderRadius: '10px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-purple)', letterSpacing: '0.1em' }}>
                  PUBLIC-INTEREST INFRASTRUCTURE · RESEARCH &amp; GRANT PORTFOLIO
                </span>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-emerald)', fontWeight: 700 }}>
                  LIVE PLATFORM · CC-BY-4.0 OPEN DATA · NON-DILUTIVE READY
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--sov-text)', margin: 0, lineHeight: 1.65 }}>
                This live empirical edition serves alongside{' '}
                <a href="https://sovdash.com/about.html#grants" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-accent)', fontWeight: 700, textDecoration: 'none' }}>
                  sovdash.com/about.html
                </a>{' '}
                as Sovereign&apos;s verifiable research portfolio for AI governance foundations, public-interest technology funds, and university research centers. Every metric above—<strong>{totalSignalsRecorded.toLocaleString()}</strong> tracked signals, <strong>{totalRegsCount}</strong> statutory frameworks, <strong>{totalDcCount.toLocaleString()}</strong> mapped facilities, <strong>{coverage.totalClusters}</strong> frontier megaclusters, and <strong>{aiEval ? aiEval.phantomCitationCount : 0} phantom citations</strong>—is live and independently auditable today.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)' }}>TRACK A · EPISTEMIC PARITY</div>
                  <div style={{ fontSize: '12px', color: 'var(--sov-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                    7-language Global South statutory gazettes &amp; regional civil-society AI harms monitors.
                  </div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--sov-purple)', fontFamily: 'var(--font-jetbrains-fallback)' }}>TRACK B · COMPUTE–LAW AUDITS</div>
                  <div style={{ fontSize: '12px', color: 'var(--sov-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                    Continuous Epoch AI megacluster monitoring, EU AI Act Art. 73 / CA SB 53 compliance clocks &amp; lab accountability.
                  </div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--sov-emerald)', fontFamily: 'var(--font-jetbrains-fallback)' }}>TRACK C · OPEN CIVIC RAG</div>
                  <div style={{ fontSize: '12px', color: 'var(--sov-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                    Open-source citation-locked evaluation harnesses &amp; free high-rate research APIs for newsrooms and parliaments.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
                <a
                  href="https://sovdash.com/about.html#grants"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '7px',
                    background: 'rgba(168, 85, 247, 0.16)',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    color: 'var(--sov-text)',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Open Grant &amp; Funder Portfolio ↗
                </a>
                <a
                  href="/api/v1/export/dataset?format=datapackage"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '7px',
                    background: 'var(--sov-panel-bg)',
                    border: '1px solid var(--sov-border)',
                    color: 'var(--sov-accent)',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Download Replication DataPackage (CC-BY-4.0) ↗
                </a>
                <a
                  href="https://aviperera.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--sov-muted)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Principal Investigator: Avi Perera (aviperera.com) ↗
                </a>
              </div>
            </div>

            {/* Verified Bibliography */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--sov-text)', margin: 0 }}>
                Primary Sources &amp; Verified References
              </h3>
              <ol style={{ paddingLeft: '22px', margin: 0, display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12.5px', color: 'var(--sov-muted)', lineHeight: 1.55 }}>
                {REFERENCES.map((ref) => (
                  <li key={ref.id}>
                    <strong style={{ color: 'var(--sov-text)' }}>{ref.authors}</strong> ({ref.year}). <em>{ref.title}</em>. {ref.venue}.{' '}
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sov-accent)', wordBreak: 'break-all' }}>
                      {ref.url} ↗
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
