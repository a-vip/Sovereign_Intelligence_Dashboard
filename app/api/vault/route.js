import { parseVault } from '@/lib/vaultParser';
import { getAggregatedStats, initDb, saveVaultDocs, getVaultDocs } from '@/lib/db';

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
      const localVault = parseVault();
      
      if (localVault.isMock && process.env.POSTGRES_URL) {
        // Try fetching from DB if local vault is mock (production)
        const dbDocs = await getVaultDocs();
        if (dbDocs.length > 0) {
          // Construct a vault-like object from DB docs
          cache = {
            ...localVault,
            isMock: false,
            documents: dbDocs,
            metrics: {
              ...localVault.metrics,
              totalDocuments: dbDocs.length,
            }
          };
        } else {
          cache = localVault;
        }
      } else {
        cache = localVault;
      }
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
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token || token !== process.env.DASHBOARD_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documents } = await request.json();
    if (!documents || documents.length === 0) {
      return NextResponse.json({ message: 'No documents to sync' });
    }

    if (!dbInitialized) {
      await initDb();
      dbInitialized = true;
    }

    await saveVaultDocs(documents);
    cache = null; // Clear cache

    return NextResponse.json({ 
      message: 'Vault sync successful', 
      count: documents.length 
    });
  } catch (err) {
    console.error('Vault Sync Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
