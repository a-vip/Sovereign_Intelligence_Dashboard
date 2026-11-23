import { NextResponse } from 'next/server';
import { getEvents, getFrontierClusters } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { JURISDICTIONS, getJurisdictionBySlug, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { REGULATORY_DIFF_PROFILES } from '@/lib/governanceIndex';
import { FRONTIER_LABS } from '@/lib/frontierLabs';
import { computeAdmiraltyGrade, normalizeSignalId } from '@/lib/provenance';
import { askAI } from '@/lib/aiClient';

export const dynamic = 'force-dynamic';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'which', 'how',
  'are', 'was', 'were', 'have', 'has', 'had', 'into', 'about', 'compare', 'over',
  'under', 'between', 'across', 'recent', 'latest', 'tracked', 'global', 'status',
  'summary', 'summarize', 'explain', 'does', 'when', 'where', 'who', 'will'
]);

function tokenizeQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .slice(0, 14);
}

function buildEvidencePool({ events = [], clusters = [] }) {
  const pool = [];

  for (const j of JURISDICTIONS) {
    const diff = REGULATORY_DIFF_PROFILES.find((d) => d.slug === j.slug);
    const instruments = (j.flagshipInstruments || []).map((i) => `${i.name} (${i.status}, ${i.effectiveDate})`).join('; ');
    const diffNotes = diff
      ? ` Compute threshold: ${diff.computeThreshold}. Enforcement: ${diff.penalties}. Open-weights: ${diff.openWeightsExemption}.`
      : '';
    pool.push({
      id: `jur-${j.slug}`,
      kind: 'jurisdiction',
      title: `${j.name} AI Governance Framework`,
      location: j.capital,
      admiraltyGrade: 'A1',
      permalink: `https://app.sovdash.com/jurisdiction/${j.slug}`,
      url: `https://app.sovdash.com/jurisdiction/${j.slug}`,
      snippet: `Posture: ${j.posture}. Regulator: ${j.regulator}. Treaty: ${j.treatyStatus}. Instruments: ${instruments || 'Tracked'}.${diffNotes}`,
      jurisdictionSlug: j.slug,
      baseScore: 2.2
    });
  }

  for (const lab of FRONTIER_LABS) {
    const evals = (lab.externalEvaluations || []).join(', ');
    pool.push({
      id: `lab-${lab.slug}`,
      kind: 'lab',
      title: `${lab.name} — ${lab.safetyFramework.name}`,
      location: lab.headquarters,
      admiraltyGrade: 'A1',
      permalink: 'https://app.sovdash.com/labs',
      url: lab.safetyFramework.url,
      snippet: `Flagship model: ${lab.flagshipModel}. Redlines: ${lab.safetyFramework.redlines}. Evaluations: ${evals}. Treaties: ${lab.treatyCommitments}.`,
      jurisdictionSlug: null,
      baseScore: 2.0
    });
  }

  for (const cl of (clusters || []).slice(0, 80)) {
    pool.push({
      id: `cluster-${cl.id}`,
      kind: 'cluster',
      title: `Compute Cluster: ${cl.name} (${cl.owner || 'Operator undisclosed'})`,
      location: cl.address || cl.country || 'Global',
      admiraltyGrade: 'A2',
      permalink: 'https://app.sovdash.com/compute',
      url: cl.sourceUrl || 'https://app.sovdash.com/compute',
      snippet: `Capacity: ${cl.powerMw || 0} MW, ${cl.h100Equivalents || 0} H100e, $${cl.capexBillions || 0}B CapEx. Chips: ${cl.chipTypes || 'Undisclosed'}. Jurisdiction: ${cl.jurisdictionSlug || cl.country || 'Unknown'}.`,
      jurisdictionSlug: cl.jurisdictionSlug || null,
      baseScore: 1.4
    });
  }

  const seenSignalIds = new Set();
  for (const ev of events || []) {
    const cid = normalizeSignalId(ev?.id);
    if (!cid || seenSignalIds.has(cid)) continue;
    seenSignalIds.add(cid);
    const adm = computeAdmiraltyGrade(ev);
    const sev = Number(ev.severity) || 2;
    pool.push({
      id: cid,
      kind: 'signal',
      title: ev.title || 'Tracked AI Policy Signal',
      location: ev.location || 'Global',
      admiraltyGrade: adm.grade,
      permalink: `https://app.sovdash.com/signal/${encodeURIComponent(cid)}`,
      url: ev.url || `https://app.sovdash.com/signal/${encodeURIComponent(cid)}`,
      snippet: `${ev.details?.summary || ev.title || ''} [Pillar: ${ev.details?.domainPillar || ev.category || 'Policy'} | SEV-${sev} | Source: ${ev.details?.source || ev.source || 'OSINT'}]`,
      pillar: ev.details?.domainPillar || ev.category || '',
      rawEvent: ev,
      baseScore: 1.5 + sev * 0.25 + (adm.grade.startsWith('A') ? 0.8 : 0.2)
    });
  }

  return pool;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    const jurisdictionParam = String(body.jurisdiction || 'all').trim();
    const pillarParam = String(body.pillar || 'all').trim().toLowerCase();

    if (question.length < 4 || question.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Question must be between 4 and 500 characters.' },
        { status: 400 }
      );
    }

    const [dbEvents, curatedEvents, clusters] = await Promise.all([
      getEvents('90d').catch(() => []),
      Promise.resolve(getStopKillerRobotsSignals() || []),
      getFrontierClusters(100).catch(() => [])
    ]);

    const pool = buildEvidencePool({
      events: [...(curatedEvents || []), ...(dbEvents || [])],
      clusters
    });

    const tokens = tokenizeQuestion(question);
    const jObj = jurisdictionParam !== 'all' ? getJurisdictionBySlug(jurisdictionParam) : null;

    const scored = pool.map((item) => {
      const text = `${item.title} ${item.location} ${item.snippet}`.toLowerCase();
      let score = item.baseScore;
      let tokenHits = 0;

      for (const tok of tokens) {
        if (text.includes(tok)) {
          tokenHits++;
          score += item.title.toLowerCase().includes(tok) ? 4.5 : 2.2;
        }
      }

      if (jObj) {
        if (item.jurisdictionSlug === jObj.slug) {
          score += 5.0;
        } else if (item.rawEvent && eventMatchesJurisdiction(item.rawEvent, jObj)) {
          score += 4.5;
        } else if (text.includes(jObj.name.toLowerCase())) {
          score += 3.5;
        }
      }

      if (pillarParam && pillarParam !== 'all' && item.pillar && item.pillar.toLowerCase().includes(pillarParam)) {
        score += 2.5;
      }

      return { item, score, tokenHits };
    });

    scored.sort((a, b) => b.score - a.score);
    const evidence = scored.slice(0, 8).map((entry) => entry.item);

    const citations = evidence.map((ev, idx) => ({
      index: idx + 1,
      id: ev.id,
      kind: ev.kind,
      title: ev.title,
      location: ev.location,
      admiraltyGrade: ev.admiraltyGrade,
      permalink: ev.permalink,
      url: ev.url,
      snippet: ev.snippet
    }));

    const hasLiveLlm = Boolean(
      (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here') ||
        (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
    );

    let answer = '';
    let groundedBy = 'deterministic';

    if (hasLiveLlm && citations.length > 0) {
      const evidenceBlock = citations
        .map((c) => `[${c.index}] (${c.kind.toUpperCase()} | Admiralty ${c.admiraltyGrade} | ${c.location}) ${c.title}: ${c.snippet}`)
        .join('\n');

      const systemPrompt =
        'You are the Sovereign Global AI Safety & Policy Observatory Research Copilot. Answer ONLY using the numbered evidence records [1]-[N] provided below. Cite every factual claim inline with [1], [2], etc. Do not invent laws, dates, figures, or external URLs not present in the evidence. If evidence does not cover part of the question, state that limitation explicitly. Keep the synthesis concise (3-5 bullet points or 2 short paragraphs) in academic policy briefing style.';
      const userPrompt = `Question: ${question}\n\nVerified Evidence Corpus:\n${evidenceBlock}`;

      const rawAnswer = await askAI(userPrompt, systemPrompt);
      if (rawAnswer && !rawAnswer.startsWith('{"summary":"Deterministic')) {
        answer = rawAnswer.trim();
        groundedBy = 'llm';
      }
    }

    if (!answer) {
      const groupedSummary = citations
        .slice(0, 5)
        .map((c) => `- **[${c.index}] ${c.title}** _(${c.location} · Admiralty ${c.admiraltyGrade})_: ${c.snippet.slice(0, 210)}${c.snippet.length > 210 ? '…' : ''}`)
        .join('\n');
      answer = `**Grounded Observatory Synthesis** _(retrieved ${citations.length} verified records across Sovereign statutory registries, Epoch AI clusters, Frontier Lab matrices, and live signals)_:\n\n${groupedSummary}`;
    }

    return NextResponse.json({
      success: true,
      question,
      answer,
      groundedBy,
      citations,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/api/copilot] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Copilot query failed' }, { status: 500 });
  }
}
