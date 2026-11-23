import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJurisdictionBySlug, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { getEventsByJurisdiction, getAiRegulations, getFrontierClusters } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { computeAdmiraltyGrade, normalizeSignalId } from '@/lib/provenance';
import EmbedCopyCard from '@/components/EmbedCopyCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { iso } = await params;
  const j = getJurisdictionBySlug(iso);
  if (!j) {
    const cleanName = decodeURIComponent(String(iso || '')).replace(/-/g, ' ');
    return {
      title: `${cleanName} — AI Policy Jurisdiction Profile`,
      description: `AI governance instruments and tracked signals for ${cleanName}.`
    };
  }
  return {
    title: `${j.name} — AI Safety, Legislation & Cyber Policy Dossier`,
    description: `${j.posture}. Primary regulator: ${j.regulator}. Treaty status: ${j.treatyStatus}.`,
    alternates: { canonical: `/jurisdiction/${j.slug}` }
  };
}

export default async function JurisdictionDossierPage({ params }) {
  const { iso } = await params;
  const decodedParam = decodeURIComponent(String(iso || '')).trim();
  const curatedJurisdiction = getJurisdictionBySlug(decodedParam);

  const allRegulations = await getAiRegulations().catch(() => []);

  let jurisdiction = curatedJurisdiction;
  if (!jurisdiction) {
    const normalizedNeedle = decodedParam.toLowerCase().replace(/-/g, ' ');
    const matchedReg = (allRegulations || []).find(
      (r) => String(r.jurisdiction || '').toLowerCase() === normalizedNeedle
    );
    if (!matchedReg) {
      notFound();
    }
    jurisdiction = {
      slug: decodedParam.toLowerCase(),
      iso: decodedParam.toUpperCase().slice(0, 6),
      name: matchedReg.jurisdiction,
      region: 'Global',
      capital: matchedReg.jurisdiction,
      lat: matchedReg.lat || 20,
      lon: matchedReg.lon || 0,
      posture: 'Tracked Jurisdiction',
      postureColor: '#38bdf8',
      treatyStatus: 'Tracked via Sovereign Legislative Registry',
      regulator: 'National Digital / Privacy Authorities',
      flagshipInstruments: [],
      matchPatterns: [matchedReg.jurisdiction.toLowerCase()]
    };
  }

  const dbSignals = await getEventsByJurisdiction(jurisdiction.matchPatterns, 50).catch(() => []);
  const curatedSignals = (getStopKillerRobotsSignals() || []).filter((s) =>
    eventMatchesJurisdiction(s, jurisdiction)
  );

  // Merge and deduplicate signals cleanly
  const seenIds = new Set();
  const combinedSignals = [];
  for (const s of [...curatedSignals, ...dbSignals]) {
    const cid = normalizeSignalId(s.id);
    if (!cid || seenIds.has(cid)) continue;
    seenIds.add(cid);
    combinedSignals.push(s);
  }

  const allClusters = await getFrontierClusters(200).catch(() => []);
  const domesticClusters = (allClusters || []).filter((c) => {
    if (c.jurisdictionSlug && c.jurisdictionSlug === jurisdiction.slug) return true;
    const hay = `${c.country || ''} ${c.address || ''}`.toLowerCase();
    return jurisdiction.matchPatterns?.some((pat) =>
      new RegExp(`\\b${pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay)
    );
  });

  const matchedRegulations = (allRegulations || []).filter((r) => {
    const hay = `${r.jurisdiction || ''} ${r.title || ''}`.toLowerCase();
    return (
      hay.includes(jurisdiction.name.toLowerCase()) ||
      jurisdiction.matchPatterns.some((pat) =>
        new RegExp(`\\b${pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay)
      )
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: '#060a12', color: '#e2e8f0', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        {/* Breadcrumb Bar */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontFamily: 'var(--font-jetbrains-fallback)', fontSize: '12px' }}>
            <Link href="/" style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 700 }}>
              ← 3D GLOBE
            </Link>
            <span style={{ color: '#334155' }}>/</span>
            <Link href="/jurisdictions" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
              JURISDICTIONS
            </Link>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>{jurisdiction.iso}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href={`/brief?jurisdiction=${encodeURIComponent(jurisdiction.slug)}`}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                background: 'rgba(250, 204, 21, 0.12)',
                border: '1px solid rgba(250, 204, 21, 0.45)',
                color: '#facc15',
                fontFamily: 'var(--font-jetbrains-fallback)',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              GENERATE BRIEF ↗
            </Link>
            <Link
              href={`/?country=${encodeURIComponent(jurisdiction.name)}`}
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
              OPEN ON 3D GLOBE ↗
            </Link>
          </div>
        </nav>

        {/* Jurisdiction Header Card */}
        <header style={{ background: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-fallback)', color: jurisdiction.postureColor, background: `${jurisdiction.postureColor}18`, border: `1px solid ${jurisdiction.postureColor}55`, padding: '4px 10px', borderRadius: '4px' }}>
              {jurisdiction.posture.toUpperCase()}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#94a3b8' }}>
              REGION: {jurisdiction.region.toUpperCase()} • HUB: {jurisdiction.capital}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            {jurisdiction.name}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', paddingTop: '6px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>PRIMARY REGULATOR / SAFETY INSTITUTE</div>
              <div style={{ fontSize: '13px', color: '#f8fafc', marginTop: '4px', fontWeight: 600 }}>{jurisdiction.regulator}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700 }}>MULTILATERAL &amp; TREATY POSTURE</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>{jurisdiction.treatyStatus}</div>
            </div>
          </div>
        </header>

        {/* Flagship Statutory & Diplomatic Instruments */}
        {jurisdiction.flagshipInstruments?.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Flagship Legal &amp; Policy Instruments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {jurisdiction.flagshipInstruments.map((inst) => (
                <div key={inst.name} style={{ background: 'rgba(11, 17, 32, 0.85)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{inst.name}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{inst.status}</span>
                    <span style={{ color: '#64748b' }}>|</span>
                    <span style={{ color: '#38bdf8' }}>EFFECTIVE: {inst.effectiveDate}</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.55 }}>{inst.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Live & Historical Signals Feed */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              Tracked Intelligence Signals ({combinedSignals.length})
            </h2>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-jetbrains-fallback)' }}>
              INCLUDES ACTIVE &amp; PERMANENT ARCHIVE RECORDS
            </span>
          </div>

          {combinedSignals.length === 0 ? (
            <div style={{ padding: '24px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', border: '1px dashed rgba(148, 163, 184, 0.25)', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
              No recent geo-tagged wire events matched this jurisdiction yet. Add custom feeds via the live globe Source Manager to expand local coverage.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {combinedSignals.map((sig) => {
                const cid = normalizeSignalId(sig.id);
                const adm = computeAdmiraltyGrade(sig);
                const dateStr = sig.original_post_time || sig.timestamp
                  ? new Date(sig.original_post_time || sig.timestamp).toISOString().slice(0, 10)
                  : '';
                return (
                  <Link
                    key={cid}
                    href={`/signal/${encodeURIComponent(cid)}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      background: 'rgba(11, 17, 32, 0.85)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      textDecoration: 'none',
                      color: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: '#00f0ff', fontWeight: 700 }}>{sig.category || 'Political'}</span>
                        <span style={{ color: '#facc15' }}>SEV-{sig.severity || 2}</span>
                        <span style={{ color: adm.badgeColor }}>ADMIRALTY {adm.grade}</span>
                        {sig.lifecycle_state === 'archived' && (
                          <span style={{ color: '#c084fc' }}>ARCHIVED</span>
                        )}
                      </div>
                      <span style={{ color: '#64748b' }}>{sig.location} • {dateStr}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{sig.title}</div>
                    {sig.details?.summary && (
                      <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                        {String(sig.details.summary).slice(0, 220)}{String(sig.details.summary).length > 220 ? '…' : ''}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Domestic Frontier Compute Clusters (Epoch AI) */}
        {domesticClusters.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                Domestic Frontier AI Compute Clusters ({domesticClusters.length})
              </h2>
              <Link href="/compute" style={{ fontSize: '11px', color: '#facc15', fontFamily: 'var(--font-jetbrains-fallback)', textDecoration: 'none', fontWeight: 700 }}>
                VIEW GLOBAL COMPUTE OBSERVATORY →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {domesticClusters.slice(0, 12).map((cl) => (
                <div key={cl.id} style={{ background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(250, 204, 21, 0.25)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>{cl.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{cl.owner || 'Undisclosed'} • {cl.address || cl.country}</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px', fontFamily: 'var(--font-jetbrains-fallback)', marginTop: '2px' }}>
                    {cl.powerMw ? <span style={{ color: '#facc15', fontWeight: 700 }}>{cl.powerMw} MW</span> : null}
                    {cl.h100Equivalents ? <span style={{ color: '#00f0ff' }}>{cl.h100Equivalents.toLocaleString()} H100e</span> : null}
                    {cl.capexBillions ? <span style={{ color: '#34d399' }}>${cl.capexBillions}B CapEx</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tracked Regulatory Database Entries */}
        {matchedRegulations.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              Tracked Statutory &amp; Policy Registry Entries ({matchedRegulations.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '10px' }}>
              {matchedRegulations.slice(0, 24).map((reg) => (
                <div key={reg.id} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', color: '#c084fc' }}>
                    <span>{reg.status || 'Tracked'}</span>
                    <span>{reg.date || ''}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{reg.title}</div>
                  {reg.description && (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                      {String(reg.description).slice(0, 200)}{String(reg.description).length > 200 ? '…' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Embeddable Scorecard Widget */}
        {curatedJurisdiction && (
          <EmbedCopyCard
            embedPath={`/embed/jurisdiction/${jurisdiction.slug}`}
            title={`Embed ${jurisdiction.name} Live Scorecard Widget`}
            height={280}
          />
        )}
      </div>
    </div>
  );
}
