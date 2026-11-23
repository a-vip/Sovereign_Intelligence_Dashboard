import Link from 'next/link';
import EmbedCopyCard from '@/components/EmbedCopyCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Developer REST API, GeoJSON Feeds & Institutional Embeds',
  description:
    'Programmatic REST and RFC 7946 GeoJSON endpoints for AI safety signals, 24-jurisdiction SAGRI readiness scores, Epoch AI compute clusters, and iframeable institutional widgets.',
  alternates: { canonical: '/developers' }
};

const ENDPOINTS = [
  {
    path: '/api/v1/signals?jurisdiction=eu&format=geojson&limit=10',
    title: 'GET /api/v1/signals',
    desc: 'Filter live & historical AI governance, cyber, and autonomous weapons signals by ?jurisdiction=, ?pillar=, ?minSeverity=, ?timespan=7d|21d|90d|all, ?limit=, and ?format=json|geojson.',
    curl: 'curl -s "https://app.sovdash.com/api/v1/signals?jurisdiction=eu&format=geojson&limit=10" | jq .',
    proCurl: 'curl -s -H "Authorization: Bearer SOV-XXXX-XXXX-XXXX" "https://app.sovdash.com/api/v1/signals?timespan=all&limit=250"'
  },
  {
    path: '/api/v1/jurisdictions',
    title: 'GET /api/v1/jurisdictions',
    desc: 'Returns all 24 sovereign AI jurisdiction profiles merged with live SAGRI readiness scores (0–100) and statutory diff parameters. Supports ?slug=eu.',
    curl: 'curl -s "https://app.sovdash.com/api/v1/jurisdictions?slug=eu" | jq .',
    proCurl: null
  },
  {
    path: '/api/v1/compute?format=geojson',
    title: 'GET /api/v1/compute',
    desc: 'Serves synced Epoch AI frontier megaclusters (MW, H100e, CapEx) and notable AI models alongside Compute–Governance Coverage metrics.',
    curl: 'curl -s "https://app.sovdash.com/api/v1/compute?format=geojson" | jq .',
    proCurl: null
  }
];

export default function DevelopersPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/brief" style={{ color: '#facc15', textDecoration: 'none' }}>BRIEF EXPORTER</Link>
            <Link href="/watchlists" style={{ color: '#c084fc', textDecoration: 'none' }}>WATCHLISTS</Link>
            <Link href="/readiness" style={{ color: '#34d399', textDecoration: 'none' }}>SAGRI INDEX</Link>
            <Link href="/methodology" style={{ color: '#94a3b8', textDecoration: 'none' }}>METHODOLOGY</Link>
          </div>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: '#00f0ff', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // VERSIONED DATA API &amp; EMBEDS (v1.0)
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            Developer REST / GeoJSON API &amp; Institutional Embeds
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Query real-time AI governance signals enriched with NATO Admiralty reliability grades, MIT AI Risk categories, and SHA-256 provenance hashes, or embed live jurisdiction scorecards directly into research publications and newsrooms.
          </p>
        </header>

        {/* API Tier Comparison */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(11, 17, 32, 0.88)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#38bdf8', fontWeight: 700 }}>OPEN RESEARCH PREVIEW</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Free · No Key Required</div>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              <li>Up to <strong>15 records</strong> per API call</li>
              <li>21-day live rolling signal window</li>
              <li>Full JSON &amp; RFC 7946 GeoJSON output</li>
              <li>Complete 24-jurisdiction SAGRI &amp; Embed access</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(11, 17, 32, 0.92)', border: '1px solid rgba(0, 240, 255, 0.45)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#00f0ff', fontWeight: 700 }}>PRO &amp; INSTITUTIONAL LICENSE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Bearer SOV-XXXX-XXXX-XXXX</div>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              <li>Up to <strong>250 records</strong> per API call</li>
              <li>Full <strong>90-day &amp; complete historical</strong> archive access</li>
              <li>Authenticate via <code>Authorization: Bearer</code> or <code>X-API-Key</code></li>
              <li>Available immediately with active Sovereign Pro license</li>
            </ul>
            <div style={{ marginTop: '4px' }}>
              <a
                href="https://sovdash.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '7px 14px', borderRadius: '6px', background: 'rgba(0, 240, 255, 0.16)', border: '1px solid rgba(0, 240, 255, 0.45)', color: '#00f0ff', fontSize: '11.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
              >
                OBTAIN PRO API KEY AT SOVDASH.COM ↗
              </a>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>v1 Endpoints Reference</h2>
          {ENDPOINTS.map((ep) => (
            <div key={ep.title} style={{ background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)', color: '#00f0ff' }}>{ep.title}</span>
                <a
                  href={ep.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '5px 10px', borderRadius: '5px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
                >
                  TEST LIVE JSON ↗
                </a>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{ep.desc}</p>
              <pre style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.88)', color: '#e2e8f0', fontSize: '11.5px', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>
                {ep.curl}
              </pre>
              {ep.proCurl && (
                <pre style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.88)', color: '#38bdf8', fontSize: '11.5px', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>
                  {ep.proCurl}
                </pre>
              )}
            </div>
          ))}
        </section>

        {/* Institutional Embeds Gallery */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Embeddable Institutional Widgets</h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px' }}>
              All <code>/embed/*</code> routes permit cross-origin framing (<code>Content-Security-Policy: frame-ancestors *</code>) and support <code>?theme=light</code> for Substack, academic blogs, and whitepaper companions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <iframe
                src="/embed/jurisdiction/eu"
                width="100%"
                height="280"
                style={{ border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', background: '#080e1a' }}
                title="EU Jurisdiction Widget Preview"
              />
              <EmbedCopyCard embedPath="/embed/jurisdiction/eu" title="Jurisdiction Scorecard Widget (EU Example)" height={280} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <iframe
                src="/embed/readiness?limit=5"
                width="100%"
                height="340"
                style={{ border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', background: '#080e1a' }}
                title="SAGRI Readiness Leaderboard Preview"
              />
              <EmbedCopyCard embedPath="/embed/readiness?limit=6" title="SAGRI Global Readiness Leaderboard Widget" height={380} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
