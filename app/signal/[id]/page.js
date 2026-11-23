import Link from 'next/link';
import { notFound } from 'next/navigation';
import CitationProvenanceCard from '@/components/CitationProvenanceCard';
import { getEventById, getEvents } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeAdmiraltyGrade, computeContentHash, normalizeSignalId } from '@/lib/provenance';
import { resolveJurisdictionForLocation } from '@/lib/jurisdictions';

export const dynamic = 'force-dynamic';

async function resolveSignalRecord(rawId) {
  const cleanId = normalizeSignalId(rawId);
  if (!cleanId) return null;

  const curated = (getStopKillerRobotsSignals() || []).find(
    (s) => normalizeSignalId(s.id) === cleanId
  );
  const dbEvt = await getEventById(cleanId).catch(() => null);
  return dbEvt || curated || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await resolveSignalRecord(id);
  if (!event) {
    return { title: 'Signal Not Found' };
  }
  const cleanId = normalizeSignalId(event.id);
  const summary =
    event.details?.summary ||
    event.summary ||
    `Verified AI safety and tech policy intelligence dossier for ${event.location || 'Global'}.`;

  return {
    title: event.title,
    description: String(summary).slice(0, 160),
    alternates: { canonical: `/signal/${encodeURIComponent(cleanId)}` },
    openGraph: {
      type: 'article',
      title: event.title,
      description: String(summary).slice(0, 160),
      url: `https://app.sovdash.com/signal/${encodeURIComponent(cleanId)}`
    }
  };
}

export default async function SignalDossierPage({ params }) {
  const { id } = await params;
  const event = await resolveSignalRecord(id);
  if (!event) {
    notFound();
  }

  const cleanId = normalizeSignalId(event.id);
  const adm = computeAdmiraltyGrade(event);
  const hash = computeContentHash(event);
  const jurisdiction = resolveJurisdictionForLocation(event.location || event.title || '');
  const summary =
    event.details?.summary ||
    event.summary ||
    `Verified intelligence signal tracked under ${event.category || 'Political'} (${event.location || 'Global'}).`;

  const tsRaw = event.original_post_time || event.timestamp;
  const parsedDate = tsRaw ? new Date(tsRaw) : null;
  const formattedDate =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toUTCString().replace(' GMT', ' UTC')
      : String(tsRaw || 'Unknown Date');

  // Load up to 4 related signals for research continuity
  const recentEvents = await getEvents('90d').catch(() => []);
  const relatedSignals = [...(getStopKillerRobotsSignals() || []), ...(recentEvents || [])]
    .filter((ev) => {
      const rid = normalizeSignalId(ev.id);
      if (!rid || rid === cleanId) return false;
      const sameCat = ev.category === event.category;
      const sameLoc = event.location && ev.location && String(ev.location).toLowerCase().includes(String(event.location).split(',')[0].toLowerCase());
      return sameCat || sameLoc;
    })
    .slice(0, 4);

  const schemaArticle = {
    '@context': 'https://schema.org',
    '@type': 'Report',
    headline: event.title,
    datePublished: parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined,
    url: `https://app.sovdash.com/signal/${encodeURIComponent(cleanId)}`,
    identifier: hash,
    publisher: {
      '@type': 'Organization',
      name: event.source || 'Sovereign Global AI Safety & Policy Observatory'
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 64px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }}
      />

      <div style={{ maxWidth: '940px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Breadcrumb & Globe Deep-Link */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 700 }}>
              ← 3D GLOBE
            </Link>
            <span style={{ color: '#334155' }}>/</span>
            <Link href="/jurisdictions" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
              JURISDICTIONS
            </Link>
            {jurisdiction && (
              <>
                <span style={{ color: '#334155' }}>/</span>
                <Link href={`/jurisdiction/${jurisdiction.slug}`} style={{ color: '#c084fc', textDecoration: 'none', fontWeight: 700 }}>
                  {jurisdiction.iso}
                </Link>
              </>
            )}
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#cbd5e1' }}>{cleanId.slice(0, 14)}</span>
          </div>

          <Link
            href={`/?signal=${encodeURIComponent(cleanId)}`}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.45)',
              color: '#00f0ff',
              fontFamily: 'var(--font-jetbrains-fallback)',
              fontSize: '11px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            LOCATE ON 3D GLOBE ↗
          </Link>
        </nav>

        {/* Main Dossier Header */}
        <article style={{ background: 'rgba(11, 17, 32, 0.92)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px' }}>
            <span style={{ padding: '4px 9px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.14)', color: '#00f0ff', fontWeight: 700 }}>
              {(event.category || 'Political').toUpperCase()}
            </span>
            <span style={{ padding: '4px 9px', borderRadius: '4px', background: 'rgba(250, 204, 21, 0.14)', color: '#facc15', fontWeight: 700 }}>
              SEV-{event.severity || 2}
            </span>
            {event.details?.domainPillar && (
              <span style={{ padding: '4px 9px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.14)', color: '#38bdf8', fontWeight: 700 }}>
                {event.details.domainPillar}
              </span>
            )}
            <span style={{ padding: '4px 9px', borderRadius: '4px', background: `${adm.badgeColor}18`, color: adm.badgeColor, border: `1px solid ${adm.badgeColor}44`, fontWeight: 700 }}>
              ADMIRALTY {adm.grade}
            </span>
            {event.lifecycle_state === 'archived' && (
              <span style={{ padding: '4px 9px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.16)', color: '#c084fc', fontWeight: 700 }}>
                PERMANENT ARCHIVE RECORD
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.15rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.28 }}>
            {event.title}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', padding: '12px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>JURISDICTION / LOCATION</div>
              <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px' }}>
                {event.location || 'Global / Multilateral'}
                {typeof event.lat === 'number' && typeof event.lon === 'number' && !isNaN(event.lat) && !isNaN(event.lon) && (
                  <span style={{ color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '11px', marginLeft: '6px' }}>
                    ({event.lat.toFixed(3)}, {event.lon.toFixed(3)})
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>PRIMARY SOURCE</div>
              <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px' }}>{event.source || event.details?.source || 'OSINT Wire'}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>TIMESTAMP (UTC)</div>
              <div style={{ color: '#cbd5e1', fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '3px' }}>{formattedDate}</div>
            </div>
          </div>

          <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
            {summary}
          </div>

          {event.url && (
            <div>
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.14)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                READ ORIGINAL PRIMARY SOURCE ↗
              </a>
            </div>
          )}
        </article>

        {/* Provenance, Admiralty & Academic Citations */}
        <CitationProvenanceCard event={event} isStandalone={true} />

        {/* Related Signals */}
        {relatedSignals.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-jetbrains-fallback)' }}>
              RELATED OBSERVATORY SIGNALS
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {relatedSignals.map((rel) => {
                const rid = normalizeSignalId(rel.id);
                return (
                  <Link
                    key={rid}
                    href={`/signal/${encodeURIComponent(rid)}`}
                    style={{
                      background: 'rgba(11, 17, 32, 0.8)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      textDecoration: 'none',
                      color: '#e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      {rel.location || 'Global'} • SEV-{rel.severity || 2}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                      {rel.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
