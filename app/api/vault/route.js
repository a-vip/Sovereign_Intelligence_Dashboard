import { NextResponse } from 'next/server';
import { parseVault } from '@/lib/vaultParser';
import { getAggregatedStats, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds
let dbInitialized = false;

export async function GET() {
  try {
    if (!dbInitialized && process.env.POSTGRES_URL) {
      await initDb();
      dbInitialized = true;
    }

    const now = Date.now();
    if (!cache || now - cacheTime > CACHE_TTL) {
      cache = parseVault();
      cacheTime = now;
    }

    // Fetch DB stats if possible
    let dbStats = null;
    if (process.env.POSTGRES_URL) {
      dbStats = await getAggregatedStats();
    }

    // Merge DB stats into vault metrics if available
    const mergedMetrics = { ...cache.metrics };
    if (dbStats) {
      // "Intel Briefs" label uses totalDocuments
      mergedMetrics.totalDocuments = (mergedMetrics.totalDocuments || 0) + dbStats.total;
      // "Critical Threats" label uses criticalThreats
      mergedMetrics.criticalThreats = (mergedMetrics.criticalThreats || 0) + dbStats.critical;
      
      // Update category distributions with live data
      if (dbStats.categories && dbStats.categories.length > 0) {
        dbStats.categories.forEach(item => {
          const existing = cache.distributions.categories.find(c => c.name === item.category);
          if (existing) {
            existing.value += parseInt(item.count);
          } else {
            cache.distributions.categories.push({ name: item.category, value: parseInt(item.count) });
          }
        });
      }
    }

    const lite = {
      ...cache,
      metrics: mergedMetrics,
      documents: cache.documents.map(({ content, ...rest }) => rest),
    };

    return NextResponse.json(lite, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Vault API error:', error);
    // Fallback to basic vault parse if DB fails
    try {
      const basicCache = parseVault();
      return NextResponse.json(basicCache);
    } catch (e) {
      return NextResponse.json({ error: 'System error' }, { status: 500 });
    }
  }
}
