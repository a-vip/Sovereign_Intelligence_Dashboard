import EmbedCopyCard from '@/components/EmbedCopyCard';
import ObservatorySubNav from '@/components/ObservatorySubNav';
import DeveloperApiPlayground from '@/components/DeveloperApiPlayground';
import { JURISDICTIONS } from '@/lib/jurisdictions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Developer REST API, GeoJSON Feeds & Institutional Embeds',
  description:
    'Programmatic REST and RFC 7946 GeoJSON endpoints for AI safety signals, 60-jurisdiction SAGRI readiness scores, Epoch AI compute clusters, and iframeable institutional widgets.',
  alternates: { canonical: '/developers' }
};

const JURISDICTION_COUNT = JURISDICTIONS.length;

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
    desc: `Returns all ${JURISDICTION_COUNT} sovereign AI jurisdiction profiles merged with live SAGRI readiness scores (0–100) and statutory diff parameters. Supports ?slug=eu.`,
    curl: 'curl -s "https://app.sovdash.com/api/v1/jurisdictions?slug=eu" | jq .',
    proCurl: null
  },
  {
    path: '/api/v1/compute?format=geojson',
    title: 'GET /api/v1/compute',
    desc: 'Serves synced Epoch AI frontier megaclusters (MW, H100e, CapEx) and notable AI models alongside Compute–Governance Coverage metrics.',
    curl: 'curl -s "https://app.sovdash.com/api/v1/compute?format=geojson" | jq .',
    proCurl: null
  },
  {
    path: '/api/v1/export/dataset?format=datapackage',
    title: 'GET /api/v1/export/dataset',
    desc: 'CC-BY-4.0 open archival export for academic replication and Zenodo DOI snapshots. Supports ?format=jsonl, ?format=csv, and ?format=datapackage.',
    curl: 'curl -s "https://app.sovdash.com/api/v1/export/dataset?format=datapackage" | jq .',
    proCurl: null
  }
];

export default function DevelopersPage() {
  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <ObservatorySubNav active="developers" />

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // VERSIONED DATA API &amp; EMBEDS (v1.0)
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Developer REST / GeoJSON API &amp; Institutional Embeds
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Query real-time AI governance signals enriched with NATO Admiralty reliability grades, MIT AI Risk categories, and SHA-256 provenance hashes, or embed live jurisdiction scorecards directly into research publications and newsrooms.
          </p>
        </header>

        {/* API Tier Comparison */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-sky)', fontWeight: 700 }}>OPEN RESEARCH PREVIEW</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)' }}>Free · No Key Required</div>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--sov-text)', lineHeight: 1.6 }}>
              <li>Up to <strong>15 records</strong> per API call</li>
              <li>21-day live rolling signal window</li>
              <li>Full JSON &amp; RFC 7946 GeoJSON output</li>
              <li>Complete {JURISDICTION_COUNT}-jurisdiction SAGRI &amp; Embed access</li>
            </ul>
          </div>

          <div style={{ background: 'var(--sov-panel-bg)', border: '1px solid rgba(0, 240, 255, 0.45)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)', fontWeight: 700 }}>PRO &amp; INSTITUTIONAL LICENSE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sov-text)' }}>Bearer SOV-XXXX-XXXX-XXXX</div>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--sov-text)', lineHeight: 1.6 }}>
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
                style={{ display: 'inline-block', padding: '7px 14px', borderRadius: '6px', background: 'rgba(0, 240, 255, 0.16)', border: '1px solid rgba(0, 240, 255, 0.45)', color: 'var(--sov-accent)', fontSize: '11.5px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
              >
                OBTAIN PRO API KEY AT SOVDASH.COM ↗
              </a>
            </div>
          </div>
        </section>

        {/* Interactive API Playground */}
        <DeveloperApiPlayground />

        {/* Endpoints */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sov-text)' }}>v1 Endpoints Reference</h2>
          {ENDPOINTS.map((ep) => (
            <div key={ep.title} style={{ background: 'var(--sov-panel-bg)', border: '1px solid var(--sov-border)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-accent)' }}>{ep.title}</span>
                <a
                  href={ep.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '5px 10px', borderRadius: '5px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--sov-emerald)', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, textDecoration: 'none' }}
                >
                  TEST LIVE JSON ↗
                </a>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--sov-muted)', lineHeight: 1.5 }}>{ep.desc}</p>
              <pre style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'var(--sov-card-bg)', color: 'var(--sov-text)', fontSize: '11.5px', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>
                {ep.curl}
              </pre>
              {ep.proCurl && (
                <pre style={{ margin: 0, padding: '10px 12px', borderRadius: '6px', background: 'var(--sov-card-bg)', color: 'var(--sov-sky)', fontSize: '11.5px', fontFamily: 'var(--font-jetbrains-fallback)', overflowX: 'auto' }}>
                  {ep.proCurl}
                </pre>
              )}
            </div>
          ))}
        </section>

        {/* Institutional Embeds Gallery */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sov-text)' }}>Embeddable Institutional Widgets</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--sov-muted)', marginTop: '4px' }}>
              All <code>/embed/*</code> routes permit cross-origin framing (<code>Content-Security-Policy: frame-ancestors *</code>) and support <code>?theme=light</code> for Substack, academic blogs, and whitepaper companions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <iframe
                src="/embed/jurisdiction/eu"
                width="100%"
                height="280"
                style={{ border: '1px solid var(--sov-border)', borderRadius: '10px', background: 'var(--sov-bg)' }}
                title="EU Jurisdiction Widget Preview"
              />
              <EmbedCopyCard embedPath="/embed/jurisdiction/eu" title="Jurisdiction Scorecard Widget (EU Example)" height={280} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <iframe
                src="/embed/readiness?limit=5"
                width="100%"
                height="340"
                style={{ border: '1px solid var(--sov-border)', borderRadius: '10px', background: 'var(--sov-bg)' }}
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
