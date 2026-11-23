import { NextResponse } from 'next/server';
import { getEvents, getFrontierClusters, getFrontierModels, getAiRegulations } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { JURISDICTIONS } from '@/lib/jurisdictions';
import { computeAdmiraltyGrade, computeContentHash, normalizeSignalId } from '@/lib/provenance';
import { classifyMitRiskDomain } from '@/lib/mitRiskTaxonomy';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS } from '@/lib/governanceIndex';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function csvCell(val) {
  const s = String(val ?? '').replace(/\r?\n/g, ' ');
  if (/[",]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'jsonl').toLowerCase();

    const [dbEvents, curatedEvents, clusters, models, regulations] = await Promise.all([
      getEvents('all').catch(() => []),
      Promise.resolve(getStopKillerRobotsSignals() || []),
      getFrontierClusters(200).catch(() => []),
      getFrontierModels(150).catch(() => []),
      getAiRegulations().catch(() => [])
    ]);

    const seen = new Set();
    const signals = [];
    for (const ev of [...(curatedEvents || []), ...(dbEvents || [])]) {
      const cid = normalizeSignalId(ev?.id);
      if (!cid || seen.has(cid)) continue;
      seen.add(cid);
      const adm = computeAdmiraltyGrade(ev);
      const mit = classifyMitRiskDomain(ev.title || '', ev.details?.summary || '', ev.details?.domainPillar || '');
      const sha256 = computeContentHash(ev);
      const ts = ev.original_post_time || ev.timestamp;
      signals.push({
        id: cid,
        title: ev.title || '',
        category: ev.category || 'Political',
        pillar: ev.details?.domainPillar || ev.category || 'AI Governance & Policy',
        severity: Number(ev.severity) || 2,
        location: ev.location || 'Global / Multilateral',
        lat: ev.lat !== null && ev.lat !== undefined ? Number(ev.lat) : null,
        lon: ev.lon !== null && ev.lon !== undefined ? Number(ev.lon) : null,
        timestamp: ts ? new Date(ts).toISOString() : null,
        source: ev.details?.source || ev.source || 'Sovereign OSINT',
        lifecycle_state: ev.lifecycle_state || 'active',
        admiralty_grade: adm.grade,
        mit_risk_code: mit.code,
        mit_risk_domain: mit.domain,
        sha256,
        permalink: `https://app.sovdash.com/signal/${encodeURIComponent(cid)}`,
        url: ev.url || null
      });
    }

    const versionTag = new Date().toISOString().slice(0, 7);

    if (format === 'csv') {
      const headers = [
        'id', 'title', 'category', 'pillar', 'severity', 'location', 'lat', 'lon',
        'timestamp', 'source', 'lifecycle_state', 'admiralty_grade', 'mit_risk_code',
        'sha256', 'permalink', 'url'
      ];
      const rows = [
        headers.join(','),
        ...signals.map((s) => headers.map((h) => csvCell(s[h])).join(','))
      ].join('\n');

      return new NextResponse(rows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sovereign-ai-observatory-${versionTag}.csv"`,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (format === 'datapackage') {
      const liveMetrics = buildLiveMetricsBySlug({ events: [...curatedEvents, ...dbEvents], clusters, regulations });
      const sagri = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);
      const manifestHash = computeContentHash({
        id: `datapackage-${versionTag}`,
        title: `Sovereign Observatory Dataset ${versionTag} (${signals.length} signals)`
      });

      const datapackage = {
        profile: 'tabular-data-package',
        name: 'sovereign-ai-policy-observatory',
        title: 'Sovereign Global AI Safety & Policy Observatory Open Dataset',
        version: versionTag,
        created: new Date().toISOString(),
        homepage: 'https://app.sovdash.com/whitepaper',
        licenses: [
          {
            name: 'CC-BY-4.0',
            title: 'Creative Commons Attribution 4.0 International',
            path: 'https://creativecommons.org/licenses/by/4.0/'
          }
        ],
        contributors: [
          {
            title: 'Avi Perera',
            role: 'author',
            organization: 'Sovereign Observatory'
          }
        ],
        datasetSha256: manifestHash,
        counts: {
          signals: signals.length,
          jurisdictions: JURISDICTIONS.length,
          frontierClusters: clusters.length,
          frontierModels: models.length,
          topSagriJurisdiction: sagri[0] ? { slug: sagri[0].slug, score: sagri[0].score } : null
        },
        resources: [
          {
            name: 'signals-jsonl',
            path: 'https://app.sovdash.com/api/v1/export/dataset?format=jsonl',
            format: 'jsonl',
            mediatype: 'application/x-ndjson'
          },
          {
            name: 'signals-csv',
            path: 'https://app.sovdash.com/api/v1/export/dataset?format=csv',
            format: 'csv',
            mediatype: 'text/csv'
          },
          {
            name: 'jurisdictions-sagri',
            path: 'https://app.sovdash.com/api/v1/jurisdictions',
            format: 'json',
            mediatype: 'application/json'
          },
          {
            name: 'frontier-compute-clusters',
            path: 'https://app.sovdash.com/api/v1/compute?format=geojson',
            format: 'geojson',
            mediatype: 'application/geo+json'
          }
        ]
      };

      return NextResponse.json(datapackage, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=300'
        }
      });
    }

    // Default JSONL (Newline-Delimited JSON)
    const ndjson = signals.map((s) => JSON.stringify(s)).join('\n');
    return new NextResponse(ndjson, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Content-Disposition': `attachment; filename="sovereign-ai-observatory-${versionTag}.jsonl"`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[/api/v1/export/dataset] Error:', error);
    return NextResponse.json({ error: error.message || 'Dataset export failed' }, { status: 500 });
  }
}
