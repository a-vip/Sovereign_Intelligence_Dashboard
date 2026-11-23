import { NextResponse } from 'next/server';
import { resolveApiAccess } from '@/lib/apiAuth';
import { JURISDICTIONS, getJurisdictionBySlug } from '@/lib/jurisdictions';
import { getEvents, getFrontierClusters, getAiRegulations } from '@/lib/db';
import { computeSagriScores, buildLiveMetricsBySlug, DEFAULT_SAGRI_WEIGHTS, REGULATORY_DIFF_PROFILES } from '@/lib/governanceIndex';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request) {
  try {
    const access = await resolveApiAccess(request);
    const { searchParams } = new URL(request.url);
    const slugParam = (searchParams.get('slug') || '').trim();

    const [events, clusters, regulations] = await Promise.all([
      getEvents('90d').catch(() => []),
      getFrontierClusters(200).catch(() => []),
      getAiRegulations().catch(() => [])
    ]);

    const liveMetrics = buildLiveMetricsBySlug({ events, clusters, regulations });
    const sagriList = computeSagriScores(DEFAULT_SAGRI_WEIGHTS, liveMetrics);
    const sagriBySlug = new Map(sagriList.map((s) => [s.slug, s]));
    const diffBySlug = new Map(REGULATORY_DIFF_PROFILES.map((d) => [d.slug, d]));

    const enriched = JURISDICTIONS.map((j) => ({
      ...j,
      sagri: sagriBySlug.get(j.slug) || null,
      regulatoryDiff: diffBySlug.get(j.slug) || null,
      dossierUrl: `https://app.sovdash.com/jurisdiction/${j.slug}`,
      embedUrl: `https://app.sovdash.com/embed/jurisdiction/${j.slug}`
    }));

    if (slugParam) {
      const target = getJurisdictionBySlug(slugParam);
      if (!target) {
        return NextResponse.json({ error: `Unknown jurisdiction slug: ${slugParam}` }, { status: 404 });
      }
      const match = enriched.find((item) => item.slug === target.slug);
      return NextResponse.json(
        {
          meta: { apiVersion: '1.0', tier: access.tier, generatedAt: new Date().toISOString() },
          jurisdiction: match
        },
        { headers: access.responseHeaders }
      );
    }

    return NextResponse.json(
      {
        meta: {
          apiVersion: '1.0',
          tier: access.tier,
          total: enriched.length,
          generatedAt: new Date().toISOString()
        },
        jurisdictions: enriched
      },
      { headers: access.responseHeaders }
    );
  } catch (error) {
    console.error('[/api/v1/jurisdictions] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal API error' }, { status: 500 });
  }
}
