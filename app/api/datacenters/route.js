import { NextResponse } from 'next/server';
import { saveDataCenters, getDataCenters, getFrontierClusters, initDb } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminAuth';

const OPERATORS_LIST = [
  "Equinix", "Digital Realty", "CyrusOne", "CoreSite", "NTT", "KDDI", "Interxion", "Telehouse",
  "EdgeConneX", "Amazon", "Google", "Microsoft", "Meta", "Apple", "Oracle", "Iron Mountain",
  "Vantage", "Cologix", "QTS", "Colt", "Flexential", "DataBank", "Zenlayer", "Lumen", "China Telecom"
];

const ENRICH_CACHE = new Map();

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

function sanitizeDcLocation(city, country, lat, lon) {
  let cleanCity = (city || '').trim();
  if (/^unknown$/i.test(cleanCity) || /^undisclosed$/i.test(cleanCity)) cleanCity = '';
  let cleanCountry = (country || 'Global').trim();
  if (/netherlands antilles/i.test(cleanCountry)) {
    // Curaçao sits near lat 12.1-12.4, lon -69.2 to -68.7 (Blue Nap Americas is in Willemstad, Curaçao)
    if (typeof lat === 'number' && typeof lon === 'number' && lat > 11.9 && lat < 12.45 && lon > -69.25 && lon < -68.65) {
      cleanCountry = 'Curaçao';
      if (!cleanCity) cleanCity = 'Willemstad';
    } else {
      cleanCountry = 'Caribbean Netherlands';
    }
  }
  return { city: cleanCity, country: cleanCountry };
}

function buildFacilityPurpose(operator, name, isFrontier, chipTypes, netCount, ixCount) {
  if (isFrontier) {
    return `Hyperscale AI training & inference campus (${operator || 'Operator'}) engineered for ${chipTypes || 'high-density GPU/TPU accelerators'}, liquid cooling, and dedicated substation power.`;
  }
  if (ixCount > 0 || netCount > 5) {
    return `Carrier-neutral Internet Exchange & colocation interconnection facility hosting ${netCount || 'multiple'} autonomous network operators (ASNs)${ixCount ? ` and ${ixCount} peering exchange fabric(s)` : ''}.`;
  }
  const text = `${name} ${operator}`.toLowerCase();
  if (/aws|amazon|google|microsoft|azure|meta|oracle/.test(text)) {
    return 'Hyperscale cloud compute & regional AI inference availability zone hosting multi-tenant enterprise workloads and object storage.';
  }
  return `Enterprise colocation & regional interconnection data center operated by ${operator || 'an independent operator'}, housing server racks, fiber cross-connects, and low-latency cloud on-ramps.`;
}

function buildDataProfile(isFrontier, ixCount, carrierCount) {
  if (isFrontier) {
    return 'Frontier model weights, billion-token training corpora, checkpoint clusters, and synchronous NVLink/InfiniBand tensor traffic.';
  }
  if (ixCount > 0 || carrierCount > 3) {
    return 'Multi-carrier BGP peering traffic, CDN edge caches, sovereign cloud interconnects, and regulated enterprise/financial workloads.';
  }
  return 'Enterprise SaaS applications, regional cloud backups, disaster-recovery replicas, and low-latency carrier/ISP aggregation.';
}

async function handleEnrichRequest(searchParams) {
  const name = (searchParams.get('name') || '').trim();
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));
  const operator = (searchParams.get('operator') || '').trim();
  const rawCountry = (searchParams.get('country') || '').trim();
  const cacheKey = `${name}|${isFinite(lat) ? lat.toFixed(3) : ''}|${isFinite(lon) ? lon.toFixed(3) : ''}`;

  if (ENRICH_CACHE.has(cacheKey)) {
    return NextResponse.json(
      { enriched: ENRICH_CACHE.get(cacheKey), cached: true },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
    );
  }

  const sanitized = sanitizeDcLocation('', rawCountry, lat, lon);
  let pdbMatch = null;
  let osmData = null;

  const queries = [];
  if (name.length >= 3) {
    const cleanQuery = name.replace(/\([^)]*\)/g, '').trim();
    const token = cleanQuery.split(/\s+/).slice(0, 3).join(' ');
    queries.push(
      fetch(`https://www.peeringdb.com/api/fac?name__icontains=${encodeURIComponent(token)}&status=ok&limit=8`, {
        signal: AbortSignal.timeout(4500),
        headers: { Accept: 'application/json' }
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    );
  } else {
    queries.push(Promise.resolve(null));
  }

  if (isFinite(lat) && isFinite(lon)) {
    queries.push(
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16`, {
        signal: AbortSignal.timeout(4500),
        headers: { 'User-Agent': 'SovereignObservatory/2.6 (+https://app.sovdash.com)' }
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    );
  } else {
    queries.push(Promise.resolve(null));
  }

  const [pdbJson, nomJson] = await Promise.all(queries);

  const candidates = Array.isArray(pdbJson?.data) ? pdbJson.data : [];
  if (candidates.length > 0) {
    // Prefer closest coordinates (< 1.5 deg), fallback to first strong name match
    const scored = candidates
      .map((fac) => {
        const fLat = Number(fac.latitude);
        const fLon = Number(fac.longitude);
        const dist = isFinite(lat) && isFinite(lon) && isFinite(fLat) && isFinite(fLon)
          ? Math.hypot(fLat - lat, fLon - lon)
          : 999;
        return { fac, dist };
      })
      .sort((a, b) => a.dist - b.dist);
    if (scored[0] && (scored[0].dist < 1.5 || !isFinite(lat))) {
      pdbMatch = scored[0].fac;
    } else if (candidates[0]?.name?.toLowerCase().includes(name.toLowerCase().slice(0, 8))) {
      pdbMatch = candidates[0];
    }
  }

  osmData = nomJson;
  const osmAddr = osmData?.address || {};
  const osmStreet = [osmAddr.house_number, osmAddr.road || osmAddr.industrial || osmAddr.suburb].filter(Boolean).join(' ');
  const osmCity = osmAddr.city || osmAddr.town || osmAddr.village || osmAddr.municipality || osmAddr.state_district || sanitized.city || '';
  const osmCountry = osmAddr.country || sanitized.country || rawCountry || 'Global';

  const pdbAddress = [pdbMatch?.address1, pdbMatch?.address2].filter(Boolean).join(', ');
  const finalCity = pdbMatch?.city || osmCity;
  const finalCountry = pdbMatch?.country || osmCountry;
  const finalState = pdbMatch?.state || osmAddr.state || '';
  const finalZip = pdbMatch?.zipcode || osmAddr.postcode || '';
  const fullAddress =
    pdbAddress ||
    osmStreet ||
    osmData?.display_name?.split(',').slice(0, 3).join(', ').trim() ||
    [finalCity, finalCountry].filter(Boolean).join(', ');

  const netCount = Number(pdbMatch?.net_count || 0);
  const ixCount = Number(pdbMatch?.ix_count || 0);
  const carrierCount = Number(pdbMatch?.carrier_count || 0);
  const resolvedOperator = pdbMatch?.org_name || operator || 'Independent';
  const website = pdbMatch?.website || null;
  const peeringDbUrl = pdbMatch?.id ? `https://www.peeringdb.com/fac/${pdbMatch.id}` : null;

  const enriched = {
    address: fullAddress,
    city: finalCity,
    state: finalState,
    country: finalCountry,
    zipcode: finalZip,
    operator: resolvedOperator,
    website,
    netCount,
    ixCount,
    carrierCount,
    clli: pdbMatch?.clli || null,
    notes: pdbMatch?.notes ? String(pdbMatch.notes).slice(0, 260) : null,
    peeringDbUrl,
    facilityPurpose: buildFacilityPurpose(resolvedOperator, name, false, null, netCount, ixCount),
    dataProfile: buildDataProfile(false, ixCount, carrierCount),
    source: peeringDbUrl && osmData ? 'PeeringDB + OpenStreetMap Nominatim' : peeringDbUrl ? 'PeeringDB Facility Registry' : osmData ? 'OpenStreetMap Nominatim' : 'ATLAS Infrastructure Registry'
  };

  if (ENRICH_CACHE.size > 400) ENRICH_CACHE.clear();
  ENRICH_CACHE.set(cacheKey, enriched);

  return NextResponse.json(
    { enriched },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('enrich') === '1') {
      return await handleEnrichRequest(searchParams);
    }

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
        address: c.address || '',
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
        facilityPurpose: buildFacilityPurpose(c.owner, c.name, true, c.chipTypes, 0, 0),
        dataProfile: buildDataProfile(true, 0, 0),
        website: c.sourceUrl || 'https://epoch.ai/data/data-centers'
      }));

    const sanitizedColoc = (dataCenters || []).map((dc) => {
      const loc = sanitizeDcLocation(dc.city, dc.country, Number(dc.lat), Number(dc.lon));
      return {
        ...dc,
        city: loc.city,
        country: loc.country,
        facilityPurpose: dc.facilityPurpose || buildFacilityPurpose(dc.operator, dc.name, false, null, 0, 0),
        dataProfile: dc.dataProfile || buildDataProfile(false, 0, 0)
      };
    });

    const combined = [...mappedClusters, ...sanitizedColoc];

    return NextResponse.json({
      metadata: {
        total: combined.length,
        frontierClusters: mappedClusters.length,
        colocationFacilities: sanitizedColoc.length,
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
      next: { revalidate: 86400 }
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
      const loc = sanitizeDcLocation(props.city || props.state || '', props.country || 'Global', lat, lon);

      let status = 'active';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('planned') || nameLower.includes('under construction') || nameLower.includes('proposed') || nameLower.includes('future')) {
        status = 'planned';
      }

      parsedFacilities.push({
        id: `atlas-${idx}`,
        name: name.trim(),
        city: loc.city || 'Regional Hub',
        country: loc.country,
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
