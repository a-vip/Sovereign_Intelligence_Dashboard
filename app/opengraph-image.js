import { ImageResponse } from 'next/og';

export const alt = 'Sovereign — Global AI Safety & Policy Observatory';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PILLARS = [
  'AI Governance & Legislation',
  'Frontier Safety & Evals',
  'Autonomous Weapons (LAWS)',
  'Cyber & Espionage Ops',
  'Compute & Semiconductors'
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #040812 0%, #0a1428 55%, #071b2e 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '999px',
                background: '#00f0ff'
              }}
            />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#00f0ff'
              }}
            >
              SOVEREIGN // GLOBAL OBSERVATORY
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              fontSize: '18px',
              fontWeight: 700
            }}
          >
            LIVE EMPIRICAL TELEMETRY
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '980px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '58px',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              color: '#ffffff'
            }}
          >
            Global AI Safety &amp; Policy Observatory
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '26px',
              lineHeight: 1.4,
              color: '#94a3b8'
            }}
          >
            Tracking binding AI statutes, frontier safety commitments, autonomous weapons diplomacy, cyber operations, and compute sovereignty across 180+ jurisdictions.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {PILLARS.map((pillar) => (
              <div
                key={pillar}
                style={{
                  display: 'flex',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#38bdf8',
                  fontSize: '18px',
                  fontWeight: 600
                }}
              >
                {pillar}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              paddingTop: '18px',
              fontSize: '18px',
              color: '#64748b'
            }}
          >
            <span>app.sovdash.com • Jurisdiction Atlas • NATO Admiralty Provenance</span>
            <span style={{ color: '#00f0ff', fontWeight: 700 }}>app.sovdash.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
