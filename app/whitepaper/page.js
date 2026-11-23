import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { getObservatoryMetrics, getEvents, getFrontierClusters, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeGovernanceCoverage } from '@/lib/epochSync';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS, computeEpistemicParity } from '@/lib/governanceIndex';
import WhitepaperClientActions from '@/components/WhitepaperClientActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Whitepaper #1: Observing the Compute–Governance Gap',
  description:
    'Peer-review-ready technical whitepaper detailing Sovereign Observatory cryptographic provenance, NATO Admiralty grading, 5-pillar classification, SAGRI Readiness Index, and 200-item empirical evaluation.',
  alternates: { canonical: '/whitepaper' }
};

function loadBenchmarkResults() {
  try {
    const filePath = path.join(process.cwd(), 'benchmarks', 'latest-results.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {}
  return null;
}

export default async function WhitepaperPage() {
  const [metrics, dbEvents, clusters, regulations] = await Promise.all([
    getObservatoryMetrics().catch(() => ({ activeSignals: 0, archivedSignals: 0, totalRegulations: 0, totalDataCenters: 0, customSourcesCount: 0 })),
    getEvents('all').catch(() => []),
    getFrontierClusters(200).catch(() => []),
    getAiRegulations().catch(() => [])
  ]);

  const curated = getStopKillerRobotsSignals() || [];
  const combinedEvents = [...curated, ...(dbEvents || [])];
  const liveMetrics = buildLiveMetricsBySlug({ events: combinedEvents, clusters, regulations });
  const sagriTop = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics).slice(0, 6);
  const coverage = computeGovernanceCoverage(clusters || []);
  const parity = computeEpistemicParity(combinedEvents, clusters || []);
  const bench = loadBenchmarkResults();

  const oscolaSelf = `Avi Perera, 'Observing the Compute-Governance Gap: A Cryptographically Auditable Architecture for Real-Time Global AI Safety, Statutory, and Epistemic Parity Monitoring' (Sovereign Observatory Whitepaper v1.0, 2026) <https://app.sovdash.com/whitepaper> accessed ${new Date().toISOString().slice(0, 10)}`;
  const bibtexSelf = `@techreport{perera2026sovereign,\n  author = {Perera, Avi},\n  title = {Observing the Compute--Governance Gap: A Cryptographically Auditable Architecture for Real-Time Global AI Safety, Statutory, and Epistemic Parity Monitoring},\n  institution = {Sovereign Observatory},\n  year = {2026},\n  url = {https://app.sovdash.com/whitepaper}\n}`;

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 72px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <nav className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/readiness" style={{ color: '#34d399', textDecoration: 'none' }}>SAGRI INDEX</Link>
            <Link href="/compare" style={{ color: '#00f0ff', textDecoration: 'none' }}>LEGAL DIFF</Link>
            <Link href="/methodology" style={{ color: '#c084fc', textDecoration: 'none' }}>CODEBOOK</Link>
            <Link href="/developers" style={{ color: '#38bdf8', textDecoration: 'none' }}>API &amp; EXPORTS</Link>
          </div>
        </nav>

        <WhitepaperClientActions bibtex={bibtexSelf} oscola={oscolaSelf} />

        <article className="editorial-card" style={{ background: 'rgba(11, 17, 32, 0.94)', border: '1px solid rgba(56, 189, 248, 0.28)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7 }}>
          <header style={{ borderBottom: '2px solid rgba(0, 240, 255, 0.28)', paddingBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#00f0ff', fontWeight: 700, letterSpacing: '0.12em' }}>
              SOVEREIGN OBSERVATORY WORKING PAPER SERIES // WHITEPAPER V1.0 · LICENSE CC-BY-4.0
            </div>
            <h1 style={{ fontSize: 'clamp(1.65rem, 3vw, 2.3rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              Observing the Compute–Governance Gap: A Cryptographically Auditable Architecture for Real-Time Global AI Safety, Statutory, and Epistemic Parity Monitoring
            </h1>
            <div style={{ fontSize: '13.5px', color: '#94a3b8' }}>
              <strong style={{ color: '#f8fafc' }}>Avi Perera</strong> · Sovereign Global AI Safety &amp; Policy Observatory (<code>app.sovdash.com</code>) · Companion dataset via <code>/api/v1/export/dataset</code>
            </div>
          </header>

          {/* Abstract */}
          <section className="editorial-subcard" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '18px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', color: '#00f0ff', marginBottom: '8px' }}>ABSTRACT</h2>
            <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
              Global artificial intelligence governance is fragmenting across diverging statutory statutes (Regulation (EU) 2024/1689, California SB 53, South Korea&apos;s AI Basic Act), state algorithmic registries, and national AI Safety Institutes. Existing trackers rely largely on static spreadsheets lacking longitudinal signal provenance, rigorous noise exclusion, or empirical correlation with physical frontier compute deployments. We present the Sovereign Observatory Architecture uniting a word-boundary 5-pillar inclusion classifier, position-aware zero-fabrication geocoding, non-destructive PostgreSQL archiving with SHA-256 content fingerprinting, NATO Admiralty grading (A1–D4), MIT AI Risk 7-domain mapping (D1–D7), and live Epoch AI cluster telemetry.
            </p>
          </section>

          {/* Live Empirical Telemetry Snapshot */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>1. Live Empirical Observatory Snapshot</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Active + Archived Signals', value: (metrics.activeSignals || 0) + (metrics.archivedSignals || 0), color: '#00f0ff' },
                { label: 'Frontier Clusters (MW)', value: `${Math.round(coverage.totalMw || 0).toLocaleString()} MW`, color: '#facc15' },
                { label: 'Binding Law Compute Share', value: `${coverage.bindingPct ?? 0}%`, color: '#34d399' },
                { label: 'Global South Signal Share', value: `${parity.globalSouthSharePct ?? 0}%`, color: '#c084fc' }
              ].map((stat) => (
                <div key={stat.label} className="editorial-subcard" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{stat.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '3px' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Architecture */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>2. Six-Layer Cryptographically Auditable Architecture</h2>
            <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
              Every wire item, regulatory filing, and safety evaluation enters a non-destructive pipeline preserving source integrity and epistemic transparency:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <li><strong>Inclusion &amp; Exclusion Gate:</strong> Strict domain matching across AI Governance, Autonomous Weapons (LAWS), Cyber Operations, Digital Rights, and Semiconductor/Compute Geopolitics, explicitly rejecting sports, consumer electronics promos, routine hazards, and purely theoretical optimization papers lacking governance anchors.</li>
              <li><strong>Zero-Fabrication Geocoding:</strong> Leading headline datelines override publisher headquarters; signals without explicit territorial references stay non-territorial (<code>lat = null, lon = null</code>) rather than receiving synthetic pins.</li>
              <li><strong>Non-Destructive Longitudinal Archive:</strong> Active map markers transition cleanly to <code>lifecycle_state = &apos;archived&apos;</code> at 21 days while maintaining permanent SSR permalinks, SHA-256 digests, and Wayback links.</li>
              <li><strong>SAGRI Sensitivity Engine:</strong> Top jurisdictions currently tracked include {sagriTop.map((s) => `${s.name} (${s.score}/100)`).join(', ')}.</li>
            </ul>
          </section>

          {/* 3. Reproducible 200-Item Evaluation Benchmark */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>3. Reproducible 200-Item Benchmark Results</h2>
            {bench ? (
              <>
                <p style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                  Evaluated deterministically against <code>benchmarks/policy-geocoder-benchmark-200.json</code> ({bench.positiveItems} stratified 5-pillar positive records across 25+ countries + {bench.negativeItems} adversarial distractors including abstract pure-math ML preprints, sports, shopping promos, and routine weather).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Precision', value: `${(bench.metrics.precision * 100).toFixed(1)}%` },
                    { label: 'Recall', value: `${(bench.metrics.recall * 100).toFixed(1)}%` },
                    { label: 'F1 Score', value: `${(bench.metrics.f1 * 100).toFixed(1)}%` },
                    { label: 'Noise Rejection (TNR)', value: `${(bench.metrics.trueNegativeRate * 100).toFixed(1)}%` },
                    { label: 'Geocoding (<=200km)', value: `${(bench.metrics.geocodingAccuracy * 100).toFixed(1)}%` },
                    { label: 'Zero-Fabrication Rate', value: `${(bench.metrics.zeroFabricationRate * 100).toFixed(1)}%` }
                  ].map((m) => (
                    <div key={m.label} className="editorial-subcard" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{m.label}</div>
                      <div style={{ fontSize: '19px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '2px' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>Run <code>npm run benchmark</code> to populate live evaluation metrics.</p>
            )}
          </section>

          {/* 4. Limitations & Ethics */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>4. Epistemic Limitations &amp; Open Reproducibility</h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
              Automated wire discovery currently favors English-language statutory filings and international advisories; Sovereign surfaces this explicitly via the Global North vs. Global South parity lens and encourages multilingual feed submissions. All open datasets are published under <strong>CC-BY-4.0</strong> with <code>CITATION.cff</code> and Frictionless Data Package checksums.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
