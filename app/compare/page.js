import Link from 'next/link';
import RegulatoryCompareClient from '@/components/RegulatoryCompareClient';

export const metadata = {
  title: 'Side-by-Side Global AI Regulation Diff Matrix',
  description:
    'Compare binding statutory status, compute thresholds, prohibited AI practices, pre-deployment safety testing, watermarking, whistleblower protections, and penalties across the EU AI Act, California SB 53, South Korea AI Basic Act, China CAC, UK AISI, and more.',
  alternates: { canonical: '/compare' }
};

export default function CompareRegulationsPage() {
  return (
    <div className="editorial-page" style={{ padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <nav className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--sov-border)', paddingBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--sov-accent)', textDecoration: 'none', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            ← RETURN TO LIVE 3D GLOBE
          </Link>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', fontWeight: 700 }}>
            <Link href="/readiness" style={{ color: 'var(--sov-emerald)', textDecoration: 'none' }}>READINESS INDEX</Link>
            <Link href="/jurisdictions" style={{ color: 'var(--sov-purple)', textDecoration: 'none' }}>JURISDICTION ATLAS</Link>
            <Link href="/labs" style={{ color: 'var(--sov-sky)', textDecoration: 'none' }}>LAB WATCH</Link>
            <Link href="/compute" style={{ color: 'var(--sov-amber)', textDecoration: 'none' }}>COMPUTE</Link>
            <Link href="/methodology" style={{ color: 'var(--sov-muted)', textDecoration: 'none' }}>METHODOLOGY</Link>
          </div>
        </nav>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ color: 'var(--sov-accent)', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', letterSpacing: '0.16em', fontWeight: 700 }}>
            SOVEREIGN OBSERVATORY // COMPARATIVE STATUTORY DIFF MATRIX
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)', fontWeight: 800, color: 'var(--sov-text)', lineHeight: 1.2 }}>
            Cross-Jurisdictional AI Law &amp; Compliance Diff Matrix
          </h1>
          <p style={{ color: 'var(--sov-muted)', fontSize: '15px', lineHeight: 1.6, maxWidth: '880px' }}>
            Side-by-side statutory comparison across 9 compliance and enforcement dimensions—built for policy researchers, general counsel, and international governance scholars. Toggle Editorial Light mode or export directly to Markdown/PDF.
          </p>
        </header>

        <RegulatoryCompareClient />
      </div>
    </div>
  );
}
