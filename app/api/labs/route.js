import { NextResponse } from 'next/server';
import { FRONTIER_LABS, matchModelsToLab } from '@/lib/frontierLabs';
import { getFrontierModels, saveFrontierModels } from '@/lib/db';
import { fetchEpochFrontierModels } from '@/lib/epochSync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let models = await getFrontierModels(140).catch(() => []);
    if (models.length === 0) {
      try {
        const fresh = await fetchEpochFrontierModels(140);
        if (fresh.length > 0) {
          models = fresh;
          await saveFrontierModels(fresh);
        }
      } catch (e) {
        console.warn('Labs route Epoch auto-hydration fallback:', e.message);
      }
    }

    const enrichedLabs = FRONTIER_LABS.map((lab) => {
      const labModels = matchModelsToLab(models, lab);
      return {
        ...lab,
        trackedModelsCount: labModels.length,
        latestModels: labModels.slice(0, 6)
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedLabs.length,
      labs: enrichedLabs
    }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('GET /api/labs error:', error);
    return NextResponse.json({ success: false, error: error.message, labs: FRONTIER_LABS }, { status: 500 });
  }
}
