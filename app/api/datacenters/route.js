import { NextResponse } from 'next/server';
import { saveDataCenters, getDataCenters, getFrontierClusters, initDb } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminAuth';

const OPERATORS_LIST = [
  "Equinix", "Digital Realty", "CyrusOne", "CoreSite", "NTT", "KDDI", "Interxion", "Telehouse", 
  "EdgeConneX", "Amazon", "Google", "Microsoft", "Meta", "Apple", "Oracle", "Iron Mountain", 
  "Vantage", "Cologix", "QTS", "Colt", "Flexential", "DataBank", "Zenlayer", "Lumen", "China Telecom"
];

// Helper to deduce the operator company name
function deduceOperator(name, company) {
  if (company && company.trim().length > 1) {
    return company.trim();
  }
  if (!name) return 'Independent';
  for (const op of OPERATORS_LIST) {
    if (name.toLowerCase().includes(op.toLowerCase())) {
      return op;
    }
  }
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord && firstWord.length > 2 ? firstWord : 'Independent';
}

export async function GET() {
  try {
    await initDb();
    const [dataCenters, frontierClusters] = await Promise.all([
      getDataCenters(),
      getFrontierClusters(200).catch(() => [])
    ]);

    const mappedClusters = (frontierClusters || [])
      .filter((c) => typeof c.lat === 'number' && typeof c.lon === 'number' && !isNaN(c.lat) && !isNaN(c.lon))
      .map((c) => ({
        id: c.id,
        name: `${c.name}${c.powerMw ? ` (${c.powerMw} MW)` : ''}`,
        city: c.address || c.country || 'Undisclosed',
        country: c.country || 'Global',
        lat: c.lat,
        lon: c.lon,
        operator: c.owner || 'Undisclosed',
        status: 'planned',
        isFrontierCluster: true,
        powerMw: c.powerMw,
        h100Equivalents: c.h100Equivalents,
        capexBillions: c.capexBillions,
        chipTypes: c.chipTypes,
        jurisdictionSlug: c.jurisdictionSlug,
        website: c.sourceUrl || 'https://epoch.ai/data/data-centers'
      }));

    const combined = [...mappedClusters, ...(dataCenters || [])];

    return NextResponse.json({
      metadata: {
        total: combined.length,
        frontierClusters: mappedClusters.length,
        colocationFacilities: (dataCenters || []).length,
        timestamp: new Date().toISOString()
      },
      dataCenters: combined
    }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error("GET /api/datacenters error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  try {
    await initDb();
    console.log("Triggering live ATLAS data center sync...");
    
    const response = await fetch('https://raw.githubusercontent.com/Ringmast4r/Global-Data-Center-Map/main/datacenters.geojson', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 } // cache for 1 day
    });

    if (!response.ok) {
      throw new Error(`ATLAS source returned status ${response.status}`);
    }

    const geojson = await response.json();
    if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
      throw new Error("Invalid response format from ATLAS GeoJSON source");
    }

    const parsedFacilities = [];
    geojson.features.forEach((feature, idx) => {
      if (!feature.geometry || !feature.geometry.coordinates) return;
      const coords = feature.geometry.coordinates;
      const lon = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);
      
      if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) return;
      
      const props = feature.properties || {};
      const name = props.name || `Data Center ${idx}`;
      const company = deduceOperator(name, props.company || props.operator);
      
      // Determine city and country
      const city = props.city || props.state || 'Unknown';
      const country = props.country || 'Global';

      // Deduce planned vs active status
      let status = 'active';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('planned') || nameLower.includes('under construction') || nameLower.includes('proposed') || nameLower.includes('future')) {
        status = 'planned';
      }

      parsedFacilities.push({
        id: `atlas-${idx}`,
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
        lat: lat,
        lon: lon,
        operator: company,
        status: status,
        website: props.website || null
      });
    });

    console.log(`Parsed ${parsedFacilities.length} global data center facilities. Saving in database...`);
    await saveDataCenters(parsedFacilities);
    console.log("ATLAS global data centers synced successfully.");

    return NextResponse.json({
      success: true,
      metadata: {
        total_synced: parsedFacilities.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("POST /api/datacenters sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
