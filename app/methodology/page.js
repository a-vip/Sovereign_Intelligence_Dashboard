import Link from 'next/link';
import { getObservatoryMetrics } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Methodology, Codebook & Verification Protocol',
  description:
    'Transparent codebook documenting Sovereign AI Observatory taxonomy pillars, deterministic geocoding guarantees, NATO Admiralty grading, SHA-256 provenance, and known epistemic limitations.',
  alternates: { canonical: '/methodology' }
};

const PILLARS = [
  {
    name: 'AI Governance & Policy',
    category: 'Political',
    scope:
      'Binding statutory frameworks (EU AI Act Reg. 2024/1689 & Digital Omnibus 2026/1744, South Korea AI Basic Act, California SB 53), national AI Safety/Security Institutes (UK AISI, US CAISI), bilateral treaties (Council of Europe CETS No. 225), GDPR/DSA algorithmic enforcement, and synthetic media rules.'
  },
  {
    name: 'Autonomous & Defense',
    category: 'Conflict',
    scope:
      'UN CCW Group of Governmental Experts on Lethal Autonomous Weapons Systems (LAWS), UNGA First Committee resolutions, algorithmic battlefield targeting decision-support systems, autonomous UAV swarms, electronic warfare, and GNSS spoofing/jamming affecting civil aviation.'
  },
  {
    name: 'Cyber & Espionage',
    category: 'Surveillance / Disaster',
    scope:
      'State-attributed APT operations, critical infrastructure ransomware (energy, hospitals, water, telecoms), CISA/NCSC/CERT-In/ENISA exploitation advisories, zero-day vulnerabilities, and commercial mercenary spyware investigations.'
  },
  {
    name: 'Digital Rights & Surveillance',
    category: 'Surveillance / Humanitarian',
    scope:
      'Biometric mass surveillance, facial recognition deployments, ordered internet shutdowns, mandated encryption backdoors, client-side scanning proposals, and transnational digital repression.'
  },
  {
    name: 'Compute & Semiconductors',
    category: 'Economic / Disaster',
    scope:
      'Advanced semiconductor export controls, EUV lithography & foundry geopolitics (Hsinchu, Eindhoven), hyperscale AI cluster energy & sovereign cloud siting, subsea cable sabotage, and post-quantum cryptography transitions.'
  }
];

const ADMIRALTY_SOURCES = [
  { code: 'A', label: 'Primary Statutory / Institutional', examples: '.gov, .europa.eu, un.org, coe.int, cisa.gov, ncsc.gov.uk, nist.gov, sipri.org, imda.gov.sg' },
  { code: 'B', label: 'Peer-Reviewed / Specialist Observatory', examples: 'Nature MI, arXiv cs.CY, The Citizen Lab, Epoch AI, METR, HRW, EFF, Access Now, MIT Tech Review' },
  { code: 'C', label: 'Established Tech & Security Journalism', examples: 'Wired Security, Rest of World, The Register, BleepingComputer, The Hacker News, Ars Technica, Krebs, +972' },
  { code: 'D', label: 'Community / Custom Operator Feed', examples: 'User-submitted RSS/Atom endpoints awaiting multi-source corroboration' }
];

export default async function MethodologyPage() {
  const metrics = await getObservatoryMetrics();

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Navigation Bar */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/compare" style={{ color: '#00f0ff', textDecoration: 'none' }}>LEGAL DIFF</Link>
            <Link href="/index" style={{ color: '#34d399', textDecoration: 'none' }}>READINESS INDEX</Link>
            <Link href="/labs" style={{ color: '#10b981', textDecoration: 'none' }}>LAB WATCH</Link>
            <Link href="/jurisdictions" style={{ color: '#c084fc', textDecoration: 'none' }}>
              JURISDICTION ATLAS →
            </Link>
          </div>
        </nav>

        {/* Title Block */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ color: '#00f0ff', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // OPEN CODEBOOK &amp; RESEARCH PROTOCOL
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            Methodology, Verification &amp; Epistemic Standards
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.65, maxWidth: '820px' }}>
            Sovereign Intelligence (<code>app.sovdash.com</code>) is designed as an auditable global observatory uniting statutory AI governance, frontier safety policy, autonomous weapons diplomacy, cyber operations, and compute sovereignty without fabricated telemetry or synthetic geolocation.
          </p>
        </header>

        {/* Live Empirical Telemetry Bar */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Active Globe Signals', value: metrics.activeSignals, color: '#00f0ff' },
            { label: 'Archived Research Corpus', value: metrics.archivedSignals, color: '#a855f7' },
            { label: 'Tracked AI Regulations', value: metrics.totalRegulations, color: '#10b981' },
            { label: 'Compute Infrastructure Nodes', value: metrics.totalDataCenters, color: '#facc15' },
            { label: 'Active Custom Feeds', value: metrics.customSourcesCount, color: '#38bdf8' }
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '4px' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </section>

        {/* 1. Domain Classification Taxonomy */}
        <section style={{ background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(56, 189, 248, 0.18)', borderRadius: '10px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>1. Five-Pillar Inclusion Gate &amp; Noise Exclusion</h2>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65 }}>
            Every ingested RSS/Atom item and GDELT record passes through a strict word-boundary domain gate before entering the observatory. Consumer product promotions, sports/entertainment items, routine weather hazards lacking critical digital infrastructure nexus, and purely theoretical optimization preprints without governance, security, or rights relevance are excluded by rule.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {PILLARS.map((p) => (
              <div key={p.name} style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#00f0ff' }}>{p.name}</div>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', margin: '3px 0 8px' }}>
                  MAP LAYER CATEGORY: {p.category.toUpperCase()}
                </div>
                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.55 }}>{p.scope}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Position-Aware Geocoding & Zero-Fabrication Guarantee */}
        <section style={{ background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: '10px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>2. Zero-Fabrication Sovereign Geocoding Protocol</h2>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
            <li><strong>No Random or Publisher-HQ Pins:</strong> Reports lacking an explicit territorial jurisdiction, city, semiconductor/research hub, or national agency resolve as <em>Global / Non-Territorial</em> and remain in the live reading wire without receiving synthetic globe coordinates.</li>
            <li><strong>Position-Aware Priority Matching:</strong> Leading headline datelines and earliest unambiguous headline mentions take strict precedence over secondary summary clauses, with publisher self-mentions stripped prior to resolution.</li>
            <li><strong>Land-Verified Dispersion:</strong> Co-located dossiers use deterministic golden-angle micro-offsets clamped well within urban land boundaries (<code>&le; 0.28&deg;</code>) so coastal capitals never drift offshore.</li>
          </ul>
        </section>

        {/* 3. NATO Admiralty Grading */}
        <section style={{ background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(168, 85, 247, 0.22)', borderRadius: '10px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>3. NATO Admiralty Two-Axis Reliability Grading</h2>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
            Every dossier receives a standardized two-character Admiralty code combining <strong>Source Reliability (A–D)</strong> and <strong>Information Corroboration (1–4)</strong>, alongside a deterministic <strong>SHA-256 content fingerprint</strong> and Internet Archive Wayback snapshot controls.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ADMIRALTY_SOURCES.map((row) => (
              <div key={row.code} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(15, 23, 42, 0.65)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: '#00f0ff', minWidth: '24px' }}>{row.code}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{row.label}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{row.examples}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>
            <strong>Corroboration Scale:</strong> <code>1</code> = Curated/Administrator-Verified Dossier • <code>2</code> = Primary Statutory/Academic Source Direct • <code>3</code> = Specialist Secondary Reporting • <code>4</code> = Uncorroborated Custom Feed.
          </div>
        </section>

        {/* 4. Non-Destructive Archival Policy & Known Limitations */}
        <section style={{ background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(250, 204, 21, 0.22)', borderRadius: '10px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>4. Longitudinal Preservation &amp; Known Corpus Limitations</h2>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.65 }}>
            Active signals age off the real-time tactical map after 21 days by transitioning to <code>lifecycle_state = &apos;archived&apos;</code> rather than deletion, preserving longitudinal continuity for policy diffusion research. Pinned treaty dossiers remain visible continuously.
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.65 }}>
            <strong>Epistemic Caveat:</strong> Current live wire feeds skew toward English-language policy disclosures, North American/European statutory filings, and anglophone civil-society monitors. Forthcoming Phase 2 ingestion pipelines expand direct machine-readable coverage across CSET AGORA, Epoch AI compute telemetry, the AI Incident Database (AIID), and multilingual non-Western regulatory feeds.
          </p>
        </section>
      </div>
    </div>
  );
}
