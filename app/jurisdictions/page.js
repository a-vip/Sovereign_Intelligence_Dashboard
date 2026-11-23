import Link from 'next/link';
import { JURISDICTIONS, JURISDICTION_REGIONS, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { getEvents, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import EditorialThemeToggle from '@/components/EditorialThemeToggle';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global AI Governance Jurisdiction Atlas',
  description:
    'Comparative directory of binding AI legislation, safety institutes, multilateral treaties, and live incident telemetry across 38 major global AI jurisdictions.',
  alternates: { canonical: '/jurisdictions' }
};

export default async function JurisdictionsAtlasPage() {
  const [dbEvents, regs] = await Promise.all([
    getEvents('all').catch(() => []),
    getAiRegulations().catch(() => [])
  ]);

  const curated = getStopKillerRobotsSignals() || [];
  const combinedSignals = [...curated, ...(dbEvents || [])];

  const enriched = JURISDICTIONS.map((j) => {
    const signalCount = combinedSignals.filter((ev) => eventMatchesJurisdiction(ev, j)).length;
    const regCount = (regs || []).filter((r) => {
      const hay = `${r.jurisdiction || ''} ${r.title || ''}`.toLowerCase();
      return (
        hay.includes(j.name.toLowerCase()) ||
        j.matchPatterns.some((pat) => new RegExp(`\\b${pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay))
      );
    }).length;
    return { ...j, signalCount, regCount };
  });

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--sov-border)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/compare" style={{ color: 'var(--sov-accent)', textDecoration: 'none' }}>LEGAL DIFF</Link>
            <Link href="/readiness" style={{ color: 'var(--sov-emerald)', textDecoration: 'none' }}>READINESS INDEX</Link>
            <Link href="/labs" style={{ color: 'var(--sov-emerald)', textDecoration: 'none' }}>LAB WATCH</Link>
            <Link href="/compute" style={{ color: 'var(--sov-amber)', textDecoration: 'none' }}>COMPUTE</Link>
            <Link href="/methodology" style={{ color: 'var(--sov-sky)', textDecoration: 'none' }}>METHODOLOGY →</Link>
            <EditorialThemeToggle />
          </div>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-purple)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // COMPARATIVE LEGAL &amp; SAFETY ATLAS
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Global AI Governance &amp; Safety Jurisdictions
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '820px' }}>
            Explore statutory AI obligations, frontier safety institutes, treaty ratifications (Council of Europe CETS No. 225, UN CCW LAWS), and verified OSINT incident telemetry across {JURISDICTIONS.length} sovereign and multilateral authorities.
          </p>
        </header>

        {JURISDICTION_REGIONS.map((region) => {
          const items = enriched.filter((j) => j.region === region);
          if (items.length === 0) return null;
          return (
            <section key={region} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--sov-border)', paddingBottom: '8px' }}>
                {region} ({items.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
                {items.map((j) => (
                  <Link
                    key={j.slug}
                    href={`/jurisdiction/${j.slug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      background: 'var(--sov-panel-bg)',
                      border: '1px solid var(--sov-border)',
                      borderRadius: '10px',
                      padding: '16px',
                      textDecoration: 'none',
                      color: 'var(--sov-text)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--sov-text)' }}>{j.name}</span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', border: '1px solid rgba(148,163,184,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                          {j.iso}
                        </span>
                      </div>
                      <div style={{ display: 'inline-flex', width: 'fit-content', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)', color: j.postureColor, background: `${j.postureColor}18`, border: `1px solid ${j.postureColor}44`, padding: '3px 8px', borderRadius: '4px' }}>
                        {j.posture}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--sov-muted)', lineHeight: 1.5 }}>{j.treatyStatus}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sov-border)', paddingTop: '10px', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      <span style={{ color: 'var(--sov-sky)' }}>{j.signalCount} SIGNALS • {j.regCount} LAWS</span>
                      <span style={{ color: 'var(--sov-accent)', fontWeight: 700 }}>OPEN DOSSIER →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
