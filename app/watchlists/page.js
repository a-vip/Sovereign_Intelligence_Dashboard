import Link from 'next/link';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import WatchlistsClient from '@/components/WatchlistsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Watchlists & Automated Webhook / Email Alerts',
  description:
    'Create real-time jurisdiction, frontier lab, and keyword watchlists backed by Sovereign Observatory daily intelligence ingestion with Slack, Discord, HTTPS webhook, and email alerts.',
  alternates: { canonical: '/watchlists' }
};

export default function WatchlistsPage() {
  const simplifiedJurisdictions = JURISDICTIONS.map((j) => ({
    slug: j.slug,
    iso: j.iso,
    name: j.name
  }));

  return (
    <div className="editorial-page" style={{ minHeight: '100vh', background: 'var(--sov-bg)', color: 'var(--sov-text)', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1220px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <nav className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--sov-border)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/brief" style={{ color: 'var(--sov-amber)', textDecoration: 'none' }}>BRIEF GENERATOR</Link>
            <Link href="/developers" style={{ color: 'var(--sov-emerald)', textDecoration: 'none' }}>API &amp; EMBEDS</Link>
            <Link href="/compare" style={{ color: 'var(--sov-accent)', textDecoration: 'none' }}>DIFF MATRIX</Link>
            <Link href="/jurisdictions" style={{ color: 'var(--sov-purple)', textDecoration: 'none' }}>ATLAS</Link>
          </div>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // PROACTIVE POLICY &amp; COMPUTE MONITORING
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Jurisdiction, Frontier Lab &amp; Keyword Watchlists
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '860px' }}>
            Monitor statutory enactments, regulatory guidance, autonomous weapons diplomacy, and frontier compute governance across 24+ jurisdictions. Test rules live against verified signals or route automated digests to Email, Slack, Discord, or custom HTTPS webhooks.
          </p>
        </header>

        <WatchlistsClient jurisdictions={simplifiedJurisdictions} />
      </div>
    </div>
  );
}
