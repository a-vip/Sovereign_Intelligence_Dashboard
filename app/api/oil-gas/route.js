import { NextResponse } from 'next/server';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function GET() {
  try {
    // Official Global Energy Monitor - Global Oil Infrastructure Tracker (GOIT) Spreadsheet Data GID
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1OysHd1cBjVN98ufNEDIwtI8Du3hY7hm8-wfpYk7wRDE/export?format=csv&gid=997296159';
    
    const res = await fetch(sheetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 86400 } // Cache locally for 24 hours
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Global Oil Infrastructure Tracker: ${res.status}`);
    }

    const csvText = await res.text();
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json({ error: "Empty CSV data returned" }, { status: 500 });
    }

    const headers = parseCsvLine(lines[0]);
    
    // Header indices
    const idxProject = headers.indexOf('project');
    const idxType = headers.indexOf('type');
    const idxStatus = headers.indexOf('status');
    const idxCapacity = headers.indexOf('capacity');
    const idxRoute = headers.indexOf('route');
    const idxCountries = headers.indexOf('countries');

    const resultLines = [];
    const uniquePointsMap = new Map();

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = parseCsvLine(lines[i]);
      if (row.length <= idxRoute) continue;

      const project = row[idxProject] || 'Unnamed Pipeline';
      const type = row[idxType] || 'oil_pipelines';
      const status = row[idxStatus] || 'operating';
      const capacity = row[idxCapacity] || 'N/A';
      const countries = row[idxCountries] || '';
      const routeStr = row[idxRoute] || '';

      if (!routeStr) continue;

      // Parse coordinates. Format in GEM Sheet is: lat,lon:lat,lon:lat,lon
      const segments = routeStr.split(':');
      const coordinates = [];
      
      segments.forEach(seg => {
        const parts = seg.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lon = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            // Swap to [longitude, latitude] for standard geodata representation
            coordinates.push([lon, lat]);
          }
        }
      });

      if (coordinates.length < 2) continue;

      // Classify and color-code: Orange for Oil/Crude, Blue for Gas/NGL
      const isGas = type.toLowerCase().includes('ngl') || type.toLowerCase().includes('gas');
      const color = isGas ? '#38bdf8' : '#f97316';

      resultLines.push({
        project,
        type,
        status,
        capacity,
        countries,
        coordinates,
        color
      });

      // Extract plants/refineries/terminals at the endpoints
      const startCoord = coordinates[0];
      const endCoord = coordinates[coordinates.length - 1];

      const startKey = `${startCoord[0].toFixed(3)},${startCoord[1].toFixed(3)}`;
      const endKey = `${endCoord[0].toFixed(3)},${endCoord[1].toFixed(3)}`;

      // Style facilities matching the color-coding (Orange for Oil facilities, Blue for Gas processing)
      const pointColor = isGas ? '#38bdf8' : '#f97316';
      const plantLabelSuffix = isGas ? 'Gas / NGL Processing Plant' : 'Crude Oil Refinery / Terminal';

      if (!uniquePointsMap.has(startKey)) {
        uniquePointsMap.set(startKey, {
          name: `${project} - ${plantLabelSuffix}`,
          type,
          coordinate: startCoord,
          color: pointColor
        });
      }

      if (!uniquePointsMap.has(endKey)) {
        uniquePointsMap.set(endKey, {
          name: `${project} - ${plantLabelSuffix}`,
          type,
          coordinate: endCoord,
          color: pointColor
        });
      }
    }

    // High-fidelity European, African, and Middle-Eastern Gas/LNG/Oil Enrichment Dataset
    const enrichedLines = [
      {
        project: 'Nord Stream Gas Pipeline System',
        type: 'gas_pipelines',
        status: 'operating',
        capacity: '55 Bcm/y',
        countries: 'Russia, Germany',
        color: '#38bdf8',
        coordinates: [[30.15, 60.20], [28.00, 59.80], [24.00, 59.00], [19.00, 57.00], [15.00, 55.00], [13.60, 54.20]]
      },
      {
        project: 'Yamal-Europe Gas Pipeline System',
        type: 'gas_pipelines',
        status: 'operating',
        capacity: '33 Bcm/y',
        countries: 'Russia, Belarus, Poland, Germany',
        color: '#38bdf8',
        coordinates: [[55.00, 55.00], [37.60, 55.70], [27.60, 53.90], [21.00, 52.40], [14.40, 52.30]]
      },
      {
        project: 'Trans-Mediterranean Gas Pipeline',
        type: 'gas_pipelines',
        status: 'operating',
        capacity: '33.7 Bcm/y',
        countries: 'Algeria, Tunisia, Italy',
        color: '#38bdf8',
        coordinates: [[2.00, 32.00], [8.00, 35.00], [11.00, 37.00], [12.50, 38.00], [15.00, 40.50]]
      },
      {
        project: 'Medgaz Subsea Gas Pipeline',
        type: 'gas_pipelines',
        status: 'operating',
        capacity: '10.5 Bcm/y',
        countries: 'Algeria, Spain',
        color: '#38bdf8',
        coordinates: [[-1.50, 32.50], [-1.00, 35.20], [-2.10, 36.70]]
      },
      {
        project: 'Dolphin Gulf Gas Pipeline',
        type: 'gas_pipelines',
        status: 'operating',
        capacity: '20 Bcm/y',
        countries: 'Qatar, UAE',
        color: '#38bdf8',
        coordinates: [[51.30, 26.60], [52.80, 25.50], [54.40, 24.40]]
      },
      {
        project: 'East-West Crude Oil Pipeline',
        type: 'oil_pipelines',
        status: 'operating',
        capacity: '5.0 Mb/d',
        countries: 'Saudi Arabia',
        color: '#f97316',
        coordinates: [[49.80, 26.30], [46.70, 24.60], [38.20, 24.10]]
      }
    ];

    const enrichedPoints = [
      { name: 'Yamal Sabetta LNG Terminal', type: 'gas_facilities', coordinate: [72.07, 71.27], color: '#38bdf8' },
      { name: 'Barcelona LNG Regasification Terminal', type: 'gas_facilities', coordinate: [2.15, 41.33], color: '#38bdf8' },
      { name: 'Huelva LNG Terminal', type: 'gas_facilities', coordinate: [-6.92, 37.21], color: '#38bdf8' },
      { name: 'Sines LNG Terminal', type: 'gas_facilities', coordinate: [-8.87, 37.93], color: '#38bdf8' },
      { name: 'Zeebrugge LNG Terminal', type: 'gas_facilities', coordinate: [3.22, 51.33], color: '#38bdf8' },
      { name: 'Fos Cavaou LNG Terminal', type: 'gas_facilities', coordinate: [4.89, 43.41], color: '#38bdf8' },
      { name: 'South Hook LNG Terminal', type: 'gas_facilities', coordinate: [-5.08, 51.70], color: '#38bdf8' },
      { name: 'Arzew LNG Liquefaction Plant', type: 'gas_facilities', coordinate: [-0.27, 35.82], color: '#38bdf8' },
      { name: 'Bonny Island LNG Plant', type: 'gas_facilities', coordinate: [7.17, 4.43], color: '#38bdf8' },
      { name: 'Ras Laffan LNG Export Terminal', type: 'gas_facilities', coordinate: [51.55, 25.90], color: '#38bdf8' },
      { name: 'Yanbu Gas Processing Plant', type: 'gas_facilities', coordinate: [38.22, 23.95], color: '#38bdf8' },
      { name: 'Dahej LNG Terminal', type: 'gas_facilities', coordinate: [72.58, 21.71], color: '#38bdf8' },
      { name: 'Rotterdam Oil Refinery Complex', type: 'oil_facilities', coordinate: [4.30, 51.89], color: '#f97316' },
      { name: 'Milazzo Crude Oil Refinery', type: 'oil_facilities', coordinate: [15.24, 38.22], color: '#f97316' },
      { name: 'Port Harcourt Oil Refinery', type: 'oil_facilities', coordinate: [7.08, 4.75], color: '#f97316' }
    ];

    const sheetPoints = Array.from(uniquePointsMap.values());

    return NextResponse.json({
      lines: [...resultLines, ...enrichedLines],
      points: [...sheetPoints, ...enrichedPoints]
    });

  } catch (err) {
    console.error("Oil & Gas API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
