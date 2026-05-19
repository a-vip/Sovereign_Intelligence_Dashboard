import { NextResponse } from 'next/server';

// Mathematical helper to calculate great-circle distance between two points in km (Haversine formula)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET() {
  try {
    // Geopolitical epicenters with extended background honeycomb coverage zones matching real maps
    const epicenters = [
      {
        name: 'Baltic Sea & Northern Europe Corridor',
        lat: 56.50,
        lon: 22.00,
        radiusKm: 950, // Extended background coverage grid spanning Europe
        jamLat: 54.71,
        jamLon: 20.45,
        jamRadiusKm: 320,
        maxIntensity: 1.0 // Severe Kaliningrad epicenter
      },
      {
        name: 'Eastern Mediterranean & Levant Corridor',
        lat: 34.00,
        lon: 34.50,
        radiusKm: 850, // Massive Middle East grid
        jamLat: 34.10,
        jamLon: 34.40,
        jamRadiusKm: 380,
        maxIntensity: 0.95 // Severe Levant epicenter
      },
      {
        name: 'Black Sea & Crimea maritime region',
        lat: 43.50,
        lon: 33.50,
        radiusKm: 700,
        jamLat: 44.50,
        jamLon: 33.50,
        jamRadiusKm: 320,
        maxIntensity: 0.9
      },
      {
        name: 'Persian Gulf & Kuwait Corridor',
        lat: 28.00,
        lon: 49.00,
        radiusKm: 650,
        jamLat: 29.37,
        jamLon: 47.97,
        jamRadiusKm: 280,
        maxIntensity: 0.98
      }
    ];

    const hexagons = [];
    const cellRadiusKm = 14; // High-density grid resolution matching the target image perfectly
    const kmPerDegree = 111.32;
    const uniqueKeys = new Set();

    epicenters.forEach(epi => {
      const latSpacing = (cellRadiusKm * Math.sqrt(3)) / kmPerDegree;
      // Adjusted longitude spacing based on latitude distortion
      const lonSpacing = (cellRadiusKm * 1.5) / (kmPerDegree * Math.cos(epi.lat * Math.PI / 180));

      const latLimit = Math.ceil((epi.radiusKm / kmPerDegree) / latSpacing);
      const lonLimit = Math.ceil((epi.radiusKm / (kmPerDegree * Math.cos(epi.lat * Math.PI / 180))) / lonSpacing);

      for (let r = -latLimit; r <= latLimit; r++) {
        for (let c = -lonLimit; c <= lonLimit; c++) {
          // Offsets representing tight honeycomb grid geometry
          const latOffset = r * latSpacing + (c % 2 === 0 ? 0 : latSpacing / 2);
          const lonOffset = c * lonSpacing;

          const cellLat = epi.lat + latOffset;
          const cellLon = epi.lon + lonOffset;

          const distToCenter = getDistanceKm(epi.lat, epi.lon, cellLat, cellLon);
          if (distToCenter > epi.radiusKm) continue;

          // Spatial key to avoid overlap conflicts
          const key = `${cellLat.toFixed(3)},${cellLon.toFixed(3)}`;
          if (uniqueKeys.has(key)) continue;
          uniqueKeys.add(key);

          // Calculate distance to active jamming hotspot
          const distToJam = getDistanceKm(epi.jamLat, epi.jamLon, cellLat, cellLon);
          let rawIntensity = 0;
          
          if (distToJam <= epi.jamRadiusKm) {
            const ratio = distToJam / epi.jamRadiusKm;
            rawIntensity = Math.exp(-2.2 * ratio * ratio) * epi.maxIntensity;
          }

          let category = 'none';
          let color = '#78350f'; // Faint gold/brown background outline

          if (rawIntensity >= 0.7) {
            category = 'high';
            color = '#ef4444'; // Bright crimson red (severe jamming)
          } else if (rawIntensity >= 0.38) {
            category = 'medium';
            color = '#f97316'; // Deep warning orange (moderate degradation)
          } else if (rawIntensity >= 0.15) {
            category = 'low';
            color = '#eab308'; // Neon gold/yellow (low interference)
          }

          hexagons.push({
            lat: cellLat,
            lon: cellLon,
            radiusKm: cellRadiusKm - 0.6, // Minimal outline spacing gap for sharp honeycomb mesh visibility
            intensity: rawIntensity,
            category,
            color,
            source: epi.name
          });
        }
      }
    });

    return NextResponse.json({
      metadata: {
        total_cells: hexagons.length,
        timestamp: new Date().toISOString()
      },
      cells: hexagons
    });

  } catch (err) {
    console.error("GPS Jamming API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
