'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { X, Scale, MapPin, ExternalLink, GripHorizontal, Clock, Search, LayoutGrid, Table2 } from 'lucide-react';
import WidgetInfoTooltip from './WidgetInfoTooltip';

const STATUTORY_CLIFFS = [
  {
    id: 'eu-art5',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'EU AI Act: Prohibited AI Practices & AI Literacy',
    date: '2025-02-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'EUR-Lex Reg. (EU) 2024/1689 Art. 5',
    penaltyCap: 'Up to €35M or 7% global turnover',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    note: 'Subliminal/biometric categorization & social scoring bans.'
  },
  {
    id: 'eu-gpai',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'EU AI Act: GPAI & Systemic-Risk Model Duties',
    date: '2025-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European AI Office (Chapter V)',
    penaltyCap: 'Up to €15M or 3% global turnover',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    note: 'Mandatory systemic evaluations & copyright summaries (>10^25 FLOP).'
  },
  {
    id: 'cn-synth',
    jurisdiction: 'China',
    region: 'APAC',
    slug: 'cn',
    title: 'CAC Mandatory AI Synthetic Content Labeling Measures',
    date: '2025-09-01',
    lat: 39.9042,
    lon: 116.4074,
    authority: 'Cyberspace Administration of China',
    penaltyCap: 'App suspension & administrative fines',
    url: 'https://www.cac.gov.cn/',
    note: 'Explicit + implicit cryptographic metadata watermarking nationwide.'
  },
  {
    id: 'jp-ai-act',
    jurisdiction: 'Japan',
    region: 'APAC',
    slug: 'jp',
    title: 'Japan AI Promotion & Safety Investigation Act',
    date: '2025-09-01',
    lat: 35.6762,
    lon: 139.6503,
    authority: 'Cabinet Office / Japan AISI',
    penaltyCap: 'Public non-compliance naming & investigation',
    url: 'https://www8.cao.go.jp/cstp/ai/index.html',
    note: 'Statutory government investigation powers for rights-violating AI.'
  },
  {
    id: 'ca-sb53',
    jurisdiction: 'California (USA)',
    region: 'US',
    slug: 'us-ca',
    title: 'California SB 53 Frontier Safety & Whistleblower Enforcement',
    date: '2026-01-01',
    lat: 38.5816,
    lon: -121.4944,
    authority: 'California Attorney General / CalOES',
    penaltyCap: 'Up to $1M per violation + whistleblower shield',
    url: 'https://leginfo.legislature.ca.gov/',
    note: 'Mandatory safety framework publication & 24h catastrophic incident alerts.'
  },
  {
    id: 'ca-ab2013',
    jurisdiction: 'California (USA)',
    region: 'US',
    slug: 'us-ca',
    title: 'California AB 2013 Generative AI Training Data Transparency',
    date: '2026-01-01',
    lat: 38.5816,
    lon: -121.4944,
    authority: 'California Civil Code §3111',
    penaltyCap: 'Statutory civil enforcement',
    url: 'https://leginfo.legislature.ca.gov/',
    note: 'Public high-level summary of datasets used to train commercial GenAI.'
  },
  {
    id: 'tx-traiga',
    jurisdiction: 'Texas (USA)',
    region: 'US',
    slug: 'us',
    title: 'Texas Responsible AI Governance Act (TRAIGA / HB 149)',
    date: '2026-01-01',
    lat: 30.2672,
    lon: -97.7431,
    authority: 'Texas Attorney General',
    penaltyCap: '$10k–$200k per uncured violation',
    url: 'https://capitol.texas.gov/',
    note: 'Bans unlawful behavioral manipulation, social scoring & biometric misuse.'
  },
  {
    id: 'kr-basic',
    jurisdiction: 'South Korea',
    region: 'APAC',
    slug: 'kr',
    title: 'South Korea Basic AI Act Takes Binding Effect',
    date: '2026-01-22',
    lat: 37.5665,
    lon: 126.9780,
    authority: 'MSIT South Korea',
    penaltyCap: 'Up to KRW 30M + local rep mandate',
    url: 'https://www.msit.go.kr/eng/',
    note: 'High-impact AI transparency, risk management & domestic agent rules.'
  },
  {
    id: 'uk-osa-ai',
    jurisdiction: 'United Kingdom',
    region: 'Global',
    slug: 'uk',
    title: 'UK Online Safety Act: AI Deepfake & Illegal Harm Duties',
    date: '2025-03-17',
    lat: 51.5074,
    lon: -0.1278,
    authority: 'Ofcom / UK AISI',
    penaltyCap: 'Up to £18M or 10% qualifying revenue',
    url: 'https://www.ofcom.org.uk/online-safety',
    note: 'Mandatory risk assessments for AI-generated illegal content & chatbots.'
  },
  {
    id: 'sg-agentic',
    jurisdiction: 'Singapore',
    region: 'APAC',
    slug: 'sg',
    title: 'Singapore IMDA Model AI Governance & Agentic Framework',
    date: '2026-03-01',
    lat: 1.3521,
    lon: 103.8198,
    authority: 'IMDA / AI Verify Foundation',
    penaltyCap: 'Sectoral MAS / PDPC enforcement',
    url: 'https://aiverifyfoundation.sg/',
    note: 'Action-bound guardrails, tool-use limits & audit trails for autonomous agents.'
  },
  {
    id: 'coe-treaty',
    jurisdiction: 'Council of Europe (Treaty)',
    region: 'Global',
    slug: 'eu',
    title: 'Council of Europe AI Convention (CETS No. 225) Ratifications',
    date: '2026-05-15',
    lat: 48.5734,
    lon: 7.7521,
    authority: 'Council of Europe Strasbourg',
    penaltyCap: 'Binding public-international treaty duties',
    url: 'https://www.coe.int/en/web/artificial-intelligence',
    note: 'First binding international human-rights treaty for AI systems.'
  },
  {
    id: 'co-sb205',
    jurisdiction: 'Colorado (USA)',
    region: 'US',
    slug: 'us',
    title: 'Colorado AI Act (SB 24-205) High-Risk Discrimination Rules',
    date: '2026-06-30',
    lat: 39.7392,
    lon: -104.9903,
    authority: 'Colorado Attorney General',
    penaltyCap: 'Up to $20k per consumer violation (CCPA)',
    url: 'https://leg.colorado.gov/bills/sb24-205',
    note: 'Duty of reasonable care against algorithmic employment/housing bias.'
  },
  {
    id: 'eu-art50',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'EU AI Act: Art. 50 Transparency & Sandbox Deadlines',
    date: '2026-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European AI Office',
    penaltyCap: 'Up to €15M or 3% global turnover',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    note: 'Deepfake disclosure, chatbot notice, and national regulatory sandboxes.'
  },
  {
    id: 'ca-sb942',
    jurisdiction: 'California (USA)',
    region: 'US',
    slug: 'us-ca',
    title: 'California AI Transparency Act (SB 942) Provenance Detection',
    date: '2026-08-02',
    lat: 38.5816,
    lon: -121.4944,
    authority: 'California Attorney General',
    penaltyCap: '$5,000 per day per violation',
    url: 'https://leginfo.legislature.ca.gov/',
    note: 'Free public AI provenance detectors & latent watermarking for >1M MAU.'
  },
  {
    id: 'in-meity',
    jurisdiction: 'India',
    region: 'APAC',
    slug: 'in',
    title: 'India MeitY IT Rules & DPDP Automated Processing Guardrails',
    date: '2026-10-01',
    lat: 28.6139,
    lon: 77.2090,
    authority: 'Ministry of Electronics & IT (MeitY)',
    penaltyCap: 'Up to ₹250 Cr (~$30M) under DPDP',
    url: 'https://www.meity.gov.in/',
    note: 'Synthetic media takedown SLAs & consent duties for automated AI profiling.'
  },
  {
    id: 'br-pl2338',
    jurisdiction: 'Brazil',
    region: 'Global',
    slug: 'br',
    title: 'Brazil AI Legal Framework (PL 2338) SIA Oversight Rollout',
    date: '2027-01-15',
    lat: -15.7975,
    lon: -47.8919,
    authority: 'ANPD / National AI System (SIA)',
    penaltyCap: 'Up to R$50M or 2% Brazil revenue',
    url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/157233',
    note: 'Risk-tiered algorithmic impact assessments & copyright remuneration.'
  },
  {
    id: 'eu-gpai-legacy',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'EU AI Act: Pre-2025 Legacy GPAI Full Compliance Cliff',
    date: '2027-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European AI Office (Art. 111)',
    penaltyCap: 'Up to €15M or 3% global turnover',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    note: 'Grace period ends for frontier models placed on the EU market before Aug 2025.'
  },
  {
    id: 'eu-omnibus-hr',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'Digital Omnibus: Standalone High-Risk AI Deadline (Annex III)',
    date: '2027-12-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'Reg. (EU) 2026/1744 / European AI Office',
    penaltyCap: 'Up to €15M or 3% global turnover',
    url: 'https://eur-lex.europa.eu/',
    note: 'Full conformity assessments for employment, credit, asylum & policing AI.'
  },
  {
    id: 'eu-omnibus-emb',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'Digital Omnibus: Embedded Product High-Risk AI (Annex I)',
    date: '2028-08-02',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European Commission / EASA / Medical',
    penaltyCap: 'Up to €15M or 3% + market withdrawal',
    url: 'https://eur-lex.europa.eu/',
    note: 'Safety-critical medical, aviation, machinery & autonomous vehicle AI.'
  },
  {
    id: 'eu-public-legacy',
    jurisdiction: 'European Union',
    region: 'EU',
    slug: 'eu',
    title: 'EU AI Act: Public-Authority Legacy IT Systems Full Compliance',
    date: '2030-12-31',
    lat: 50.8503,
    lon: 4.3517,
    authority: 'European Commission / Member States',
    penaltyCap: 'Mandatory public procurement suspension',
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    note: 'Final compliance deadline for large-scale EU border, visa & justice IT systems.'
  }
];

function computeDayDelta(dateStr) {
  const target = new Date(`${dateStr}T00:00:00Z`).getTime();
  if (isNaN(target)) return { days: 0, inForce: true, label: 'ACTIVE' };
  const diffDays = Math.ceil((target - Date.now()) / 86400000);
  if (diffDays <= 0) return { days: diffDays, inForce: true, label: 'IN FORCE' };
  return { days: diffDays, inForce: false, label: `T-${diffDays}d` };
}

export default function LegislativeCountdownWidget({ onClose, onFocusLocation, isMobile = false }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'in_force'
  const [regionFilter, setRegionFilter] = useState('ALL'); // 'ALL' | 'EU' | 'US' | 'APAC' | 'Global'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('soonest'); // 'soonest' | 'newest' | 'jurisdiction'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [recentRegs, setRecentRegs] = useState([]);
  const [pos, setPos] = useState({ x: 350, y: 84 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 900;
      setPos({
        x: mobile ? 10 : Math.max(24, Math.min(window.innerWidth - 420, 340)),
        y: mobile ? 66 : 84
      });
    }
    fetch('/api/ai-regulations')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.aiRegulations)) {
          setRecentRegs(d.aiRegulations.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  const handlePointerDown = (e) => {
    if (isMobile) return;
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target?.closest?.('button, a, input, select')) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos({
        x: Math.max(8, Math.min(vw - 140, dragRef.current.startPosX + (e.clientX - dragRef.current.startX))),
        y: Math.max(52, Math.min(vh - 90, dragRef.current.startPosY + (e.clientY - dragRef.current.startY)))
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  const enrichedCliffs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return STATUTORY_CLIFFS.map((item) => ({ ...item, delta: computeDayDelta(item.date) }))
      .filter((item) => {
        if (filter === 'upcoming' && item.delta.inForce) return false;
        if (filter === 'in_force' && !item.delta.inForce) return false;
        if (regionFilter !== 'ALL' && item.region !== regionFilter) return false;
        if (q) {
          const hay = `${item.jurisdiction} ${item.title} ${item.note} ${item.authority} ${item.penaltyCap || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'jurisdiction') return a.jurisdiction.localeCompare(b.jurisdiction) || new Date(a.date) - new Date(b.date);
        if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
        // 'soonest': upcoming deadlines first (nearest first), then in-force most recent first
        if (a.delta.inForce !== b.delta.inForce) return a.delta.inForce ? 1 : -1;
        return a.delta.inForce ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
      });
  }, [filter, regionFilter, searchQuery, sortBy]);

  const upcomingCount = useMemo(() => STATUTORY_CLIFFS.filter((x) => !computeDayDelta(x.date).inForce).length, []);
  const inForceCount = STATUTORY_CLIFFS.length - upcomingCount;

  return (
    <aside
      className="sov-modal-shell"
      aria-label="Legislative & Enforcement Countdown Tracker"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: 'min(94vw, 405px)',
        maxHeight: 'calc(100dvh - 134px)',
        zIndex: 1450,
        background: 'var(--sov-panel-bg)',
        border: '1px solid var(--sov-border)',
        borderRadius: '12px',
        boxShadow: 'var(--sov-shadow, 0 20px 44px rgba(0, 0, 0, 0.45))',
        backdropFilter: 'blur(16px)',
        color: 'var(--sov-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 13px',
          background: 'var(--sov-card-bg)',
          borderBottom: '1px solid var(--sov-border)',
          cursor: isMobile ? 'default' : (dragging ? 'grabbing' : 'grab'),
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <GripHorizontal size={13} style={{ color: 'var(--sov-muted)' }} />
          <Scale size={14} style={{ color: 'var(--sov-purple)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-jetbrains-fallback)', letterSpacing: '0.05em' }}>
            ENFORCEMENT TRACKER
          </span>
          <WidgetInfoTooltip
            title="AI Law & Enforcement Countdown"
            accent="var(--sov-purple)"
            description="Tracks real binding AI laws and compliance deadlines around the world — showing which rules are already legally enforceable today and how many days remain until upcoming deadlines take effect."
            bullets={[
              'T-XXXd badges count down exact days until a law enters force; IN FORCE badges mark active statutes.',
              'Click Locate to fly the 3D globe directly to that government jurisdiction, or open the official Statute text.',
              'Filter by status or region, sort by deadline, or switch between clean Cards and a compact Table.'
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'cards' ? 'table' : 'cards'))}
            title={viewMode === 'cards' ? 'Switch to compact table view' : 'Switch to card view'}
            style={{
              background: 'transparent',
              border: '1px solid var(--sov-border)',
              borderRadius: '5px',
              color: viewMode === 'table' ? 'var(--sov-purple)' : 'var(--sov-muted)',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'cards' ? <Table2 size={12} /> : <LayoutGrid size={12} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Enforcement Tracker"
            style={{
              background: 'transparent',
              border: '1px solid var(--sov-border)',
              borderRadius: '5px',
              color: 'var(--sov-muted)',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Filter Pills Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--sov-border)', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'all', label: `All (${STATUTORY_CLIFFS.length})` },
            { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
            { id: 'in_force', label: `In Force (${inForceCount})` }
          ].map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '3px 7px',
                  borderRadius: '5px',
                  border: `1px solid ${on ? 'var(--sov-purple)' : 'var(--sov-border)'}`,
                  background: on ? 'rgba(139, 92, 246, 0.14)' : 'var(--sov-card-bg)',
                  color: on ? 'var(--sov-purple)' : 'var(--sov-muted)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-jetbrains-fallback)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <Link href="/compare" style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 700, color: 'var(--sov-accent)', textDecoration: 'none' }}>
          Compare Matrix ↗
        </Link>
      </div>

      {/* Subtle Search + Region + Sort Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderBottom: '1px solid var(--sov-border)', background: 'var(--sov-card-bg)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search size={11} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sov-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter law, country, fine..."
            style={{
              width: '100%',
              padding: '4px 7px 4px 23px',
              borderRadius: '5px',
              border: '1px solid var(--sov-border)',
              background: 'var(--sov-panel-bg)',
              color: 'var(--sov-text)',
              fontSize: '10px',
              fontFamily: 'var(--font-jetbrains-fallback)',
              outline: 'none'
            }}
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          aria-label="Filter region"
          style={{
            padding: '4px 5px',
            borderRadius: '5px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-panel-bg)',
            color: 'var(--sov-text)',
            fontSize: '9.5px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Regions</option>
          <option value="EU">EU</option>
          <option value="US">USA</option>
          <option value="APAC">APAC</option>
          <option value="Global">UK/Global</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort milestones"
          style={{
            padding: '4px 5px',
            borderRadius: '5px',
            border: '1px solid var(--sov-border)',
            background: 'var(--sov-panel-bg)',
            color: 'var(--sov-text)',
            fontSize: '9.5px',
            fontFamily: 'var(--font-jetbrains-fallback)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <option value="soonest">Soonest</option>
          <option value="newest">Latest Date</option>
          <option value="jurisdiction">A–Z</option>
        </select>
      </div>

      {/* Content Area */}
      <div style={{ padding: '10px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {enrichedCliffs.length === 0 ? (
          <div style={{ padding: '18px', textAlign: 'center', fontSize: '11px', color: 'var(--sov-muted)' }}>
            No statutory milestones match your filter.
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ border: '1px solid var(--sov-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-jetbrains-fallback)' }}>
              <thead>
                <tr style={{ background: 'var(--sov-card-bg)', color: 'var(--sov-muted)', borderBottom: '1px solid var(--sov-border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 7px' }}>STATUTE</th>
                  <th style={{ textAlign: 'right', padding: '6px 7px', whiteSpace: 'nowrap' }}>STATUS</th>
                  <th style={{ textAlign: 'right', padding: '6px 7px' }}>MAP</th>
                </tr>
              </thead>
              <tbody>
                {enrichedCliffs.map((item) => {
                  const isSoon = !item.delta.inForce && item.delta.days <= 450;
                  const badgeCol = item.delta.inForce ? 'var(--sov-emerald)' : isSoon ? 'var(--sov-amber)' : 'var(--sov-sky)';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--sov-border)' }}>
                      <td style={{ padding: '6px 7px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: 'var(--sov-text)', lineHeight: 1.3 }}>{item.title}</div>
                        <div style={{ fontSize: '9px', color: 'var(--sov-muted)', marginTop: '2px' }}>{item.jurisdiction} · {item.date}</div>
                      </td>
                      <td style={{ padding: '6px 7px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        <span style={{ color: badgeCol, fontWeight: 800, fontSize: '9px' }}>{item.delta.label}</span>
                      </td>
                      <td style={{ padding: '6px 7px', textAlign: 'right', verticalAlign: 'top' }}>
                        {onFocusLocation && (
                          <button
                            type="button"
                            onClick={() => onFocusLocation(item.lat, item.lon)}
                            style={{ background: 'var(--sov-card-bg)', border: '1px solid var(--sov-border)', borderRadius: '4px', color: 'var(--sov-accent)', padding: '2px 5px', cursor: 'pointer', fontSize: '9px', fontWeight: 700 }}
                            title="Fly to jurisdiction"
                          >
                            <MapPin size={10} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          enrichedCliffs.map((item) => {
            const isSoon = !item.delta.inForce && item.delta.days <= 450;
            const accentColor = item.delta.inForce ? 'var(--sov-emerald)' : isSoon ? 'var(--sov-amber)' : 'var(--sov-sky)';
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--sov-card-bg)',
                  border: '1px solid var(--sov-border)',
                  borderLeft: `3px solid ${accentColor}`,
                  borderRadius: '8px',
                  padding: '9px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', fontWeight: 700 }}>
                    {item.jurisdiction} · {item.date}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontFamily: 'var(--font-jetbrains-fallback)',
                      fontWeight: 800,
                      color: accentColor,
                      background: item.delta.inForce ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)'
                    }}
                  >
                    <Clock size={9} /> {item.delta.label}
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.35, color: 'var(--sov-text)' }}>
                  {item.title}
                </div>

                <div style={{ fontSize: '10.5px', color: 'var(--sov-muted)', lineHeight: 1.4 }}>
                  {item.note}
                </div>

                {item.penaltyCap && (
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-jetbrains-fallback)', color: 'var(--sov-muted)', opacity: 0.9 }}>
                    Penalty / Remedy: <strong style={{ color: 'var(--sov-text)' }}>{item.penaltyCap}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {onFocusLocation && (
                      <button
                        type="button"
                        onClick={() => onFocusLocation(item.lat, item.lon)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          border: '1px solid var(--sov-border)',
                          background: 'var(--sov-panel-bg)',
                          color: 'var(--sov-accent)',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <MapPin size={10} /> Locate
                      </button>
                    )}
                    <Link
                      href={`/jurisdictions/${item.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '3px 7px',
                        borderRadius: '4px',
                        border: '1px solid var(--sov-border)',
                        background: 'var(--sov-panel-bg)',
                        color: 'var(--sov-text)',
                        fontSize: '10px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      Atlas ↗
                    </Link>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--sov-purple)',
                      textDecoration: 'none'
                    }}
                  >
                    Statute <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            );
          })
        )}

        {recentRegs.length > 0 && viewMode === 'cards' && !searchQuery && regionFilter === 'ALL' && (
          <div style={{ borderTop: '1px solid var(--sov-border)', paddingTop: '8px', marginTop: '2px' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-fallback)', fontWeight: 800, color: 'var(--sov-muted)', letterSpacing: '0.06em', marginBottom: '6px' }}>
              LIVE INDEXED STATUTES ({recentRegs.length} SAMPLE)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentRegs.slice(0, 4).map((r, i) => (
                <a
                  key={r.id || i}
                  href={r.url || '/jurisdictions'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    background: 'var(--sov-card-bg)',
                    border: '1px solid var(--sov-border)',
                    color: 'var(--sov-text)',
                    fontSize: '10.5px',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.jurisdiction}: {r.title}
                  </span>
                  <ExternalLink size={10} style={{ color: 'var(--sov-accent)', flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
