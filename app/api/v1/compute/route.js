import { NextResponse } from 'next/server';
import { resolveApiAccess } from '@/lib/apiAuth';
import { getFrontierClusters, getFrontierModels } from '@/lib/db';
import { computeGovernanceCoverage } from '@/lib/epochSync';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request) {
  try {
    const access = await resolveApiAccess(request);
    const { searchParams } = new URL(request.url);
    const jurisdictionParam = (searchParams.get('jurisdiction') || '').trim().toLowerCase();
    const format = (searchParams.get('format') || 'json').toLowerCase() === 'geojson' ? 'geojson' : 'json';

    const [clusters, models] = await Promise.all([
      getFrontierClusters(access.maxLimit).catch(() => []),
      getFrontierModels(Math.min(100, access.maxLimit)).catch(() => [])
    ]);

    const filteredClusters = jurisdictionParam
      ? clusters.filter(
          (c) =>
            String(c.jurisdictionSlug || '').toLowerCase() === jurisdictionParam ||
            String(c.country || '').toLowerCase().includes(jurisdictionParam)
        )
      : clusters;

    const coverage = computeGovernanceCoverage(filteredClusters);

    const meta = {
      apiVersion: '1.0',
      tier: access.tier,
      maxLimit: access.maxLimit,
      clusterCount: filteredClusters.length,
      modelCount: models.length,
      generatedAt: new Date().toISOString()
    };

    if (format === 'geojson') {
      const features = filteredClusters
        .filter((c) => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lon)))
        .map((c) => ({
          type: 'Feature',
          id: c.id,
          geometry: {
            type: 'Point',
            coordinates: [Number(c.lon), Number(c.lat)]
          },
          properties: {
            id: c.id,
            name: c.name,
            owner: c.owner,
            country: c.country,
            jurisdictionSlug: c.jurisdictionSlug,
            powerMw: c.powerMw,
            h100Equivalents: c.h100Equivalents,
            capexBillions: c.capexBillions,
            chipTypes: c.chipTypes,
            sourceUrl: c.sourceUrl
          }
        }));

      return NextResponse.json(
        {
          type: 'FeatureCollection',
          metadata: meta,
          governanceCoverage: coverage,
          features
        },
        { headers: access.responseHeaders }
      );
    }

    return NextResponse.json(
      {
        meta,
        governanceCoverage: coverage,
        clusters: filteredClusters,
        models
      },
      { headers: access.responseHeaders }
    );
  } catch (error) {
    console.error('[/api/v1/compute] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal API error' }, { status: 500 });
  }
}
