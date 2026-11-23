import { NextResponse } from 'next/server';
import { getFrontierClusters, getFrontierModels, saveFrontierClusters, saveFrontierModels } from '@/lib/db';
import { fetchEpochFrontierClusters, fetchEpochFrontierModels, computeGovernanceCoverage } from '@/lib/epochSync';
import { verifyAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantsRefresh = searchParams.get('refresh') === 'true';

    let canForceRefresh = false;
    if (wantsRefresh) {
      const auth = await verifyAdmin(request);
      canForceRefresh = !auth.error;
    }

    let [clusters, models] = await Promise.all([
      getFrontierClusters(160).catch(() => []),
      getFrontierModels(140).catch(() => [])
    ]);

    if (clusters.length === 0 || canForceRefresh) {
      try {
        const freshClusters = await fetchEpochFrontierClusters(160);
        if (freshClusters.length > 0) {
          clusters = freshClusters;
          await saveFrontierClusters(freshClusters);
        }
      } catch (e) {
        console.warn('Epoch cluster auto-hydration fallback:', e.message);
      }
    }

    if (models.length === 0 || canForceRefresh) {
      try {
        const freshModels = await fetchEpochFrontierModels(140);
        if (freshModels.length > 0) {
          models = freshModels;
          await saveFrontierModels(freshModels);
        }
      } catch (e) {
        console.warn('Epoch model auto-hydration fallback:', e.message);
      }
    }

    const coverage = computeGovernanceCoverage(clusters);

    return NextResponse.json({
      success: true,
      coverage,
      clustersCount: clusters.length,
      modelsCount: models.length,
      clusters,
      models
    }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('GET /api/compute error:', error);
    return NextResponse.json({ success: false, error: error.message, clusters: [], models: [] }, { status: 500 });
  }
}
