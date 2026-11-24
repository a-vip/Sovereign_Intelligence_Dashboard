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

/**
 * Splits polylines across antimeridian jumps (>180 deg lon) and filters invalid vertices
 * so no straight wrap-around lines shoot across the globe or 2D map.
 */
function sanitizePipelineSegments(rawCoords = []) {
  const clean = [];
  for (const coord of rawCoords) {
    if (!Array.isArray(coord) || coord.length < 2) continue;
    const lon = Number(coord[0]);
    const lat = Number(coord[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (lat < -85 || lat > 85 || lon < -180 || lon > 180) continue;
    clean.push([lon, lat]);
  }
  if (clean.length < 2) return [];

  const chunks = [];
  let current = [clean[0]];
  for (let i = 1; i < clean.length; i++) {
    const prev = clean[i - 1];
    const curr = clean[i];
    if (Math.abs(curr[0] - prev[0]) > 180) {
      if (current.length >= 2) chunks.push(current);
      current = [curr];
    } else {
      current.push(curr);
    }
  }
  if (current.length >= 2) chunks.push(current);
  return chunks;
}

// Major global gas & crude trunk pipeline corridors with accurate multi-vertex geographies
const TRUNK_PIPELINES = [
  // North America
  {
    project: 'Keystone Crude Oil Pipeline System',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '830 kb/d',
    countries: 'Canada, United States',
    color: '#f97316',
    coordinates: [[-113.49, 53.54], [-109.10, 50.45], [-104.60, 49.00], [-100.30, 46.80], [-97.90, 41.20], [-97.10, 39.80], [-96.76, 35.98], [-95.01, 29.73]]
  },
  {
    project: 'Trans-Alaska Pipeline System (TAPS)',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '2.1 Mb/d',
    countries: 'United States',
    color: '#f97316',
    coordinates: [[-148.47, 70.20], [-149.10, 68.10], [-147.71, 64.84], [-145.60, 62.10], [-146.34, 61.13]]
  },
  {
    project: 'Colonial Refined Products Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '2.5 Mb/d',
    countries: 'United States',
    color: '#f97316',
    coordinates: [[-95.21, 29.73], [-93.93, 29.90], [-91.18, 30.45], [-86.80, 33.51], [-84.38, 33.75], [-80.84, 35.22], [-77.43, 37.54], [-74.16, 40.66]]
  },
  {
    project: 'Trans Mountain Expansion (TMX) Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '890 kb/d',
    countries: 'Canada',
    color: '#f97316',
    coordinates: [[-113.49, 53.54], [-118.08, 52.87], [-120.32, 50.67], [-122.91, 49.28]]
  },
  {
    project: 'Permian Highway Natural Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '2.65 Bcf/d',
    countries: 'United States',
    color: '#38bdf8',
    coordinates: [[-103.50, 31.30], [-100.43, 30.70], [-98.10, 29.90], [-96.30, 29.60]]
  },
  // South America
  {
    project: 'GASBOL Bolivia–Brazil Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '30 Mcm/d',
    countries: 'Bolivia, Brazil',
    color: '#38bdf8',
    coordinates: [[-63.18, -17.78], [-57.65, -19.01], [-54.62, -20.46], [-49.06, -22.31], [-47.06, -22.90], [-49.27, -25.43], [-51.21, -30.03]]
  },
  {
    project: 'Vaca Muerta–Buenos Aires Gas Trunk (Néstor Kirchner)',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '22 Mcm/d',
    countries: 'Argentina',
    color: '#38bdf8',
    coordinates: [[-69.25, -38.40], [-65.00, -37.20], [-61.20, -35.80], [-59.00, -34.20]]
  },
  {
    project: 'OCP Ecuador Heavy Crude Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '450 kb/d',
    countries: 'Ecuador',
    color: '#f97316',
    coordinates: [[-76.88, 0.09], [-78.10, -0.22], [-79.65, 0.96]]
  },
  {
    project: 'Caño Limón–Coveñas Crude Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '220 kb/d',
    countries: 'Colombia',
    color: '#f97316',
    coordinates: [[-71.08, 6.95], [-73.30, 8.30], [-75.68, 9.40]]
  },
  // Europe & Eurasia
  {
    project: 'Druzhba Crude Oil Pipeline Network',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '1.2 Mb/d',
    countries: 'Russia, Belarus, Poland, Germany, Slovakia, Hungary',
    color: '#f97316',
    coordinates: [[52.30, 54.90], [45.00, 53.20], [34.30, 52.80], [29.26, 52.04], [23.68, 52.10], [19.69, 52.54], [14.28, 53.06]]
  },
  {
    project: 'Nord Stream 1 & 2 Subsea Gas Corridor (Ruptured)',
    type: 'gas_pipelines',
    status: 'inactive',
    capacity: '55 Bcm/y',
    countries: 'Russia, Germany',
    color: '#38bdf8',
    coordinates: [[28.55, 60.53], [24.00, 59.30], [19.00, 57.20], [15.80, 55.30], [13.65, 54.15]]
  },
  {
    project: 'Yamal–Europe Natural Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '33 Bcm/y',
    countries: 'Russia, Belarus, Poland, Germany',
    color: '#38bdf8',
    coordinates: [[66.60, 66.00], [50.80, 61.60], [34.80, 56.90], [27.56, 53.90], [21.01, 52.40], [14.55, 52.34]]
  },
  {
    project: 'Southern Gas Corridor (SCPX / TANAP / TAP)',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '20 Bcm/y',
    countries: 'Azerbaijan, Georgia, Turkey, Greece, Albania, Italy',
    color: '#38bdf8',
    coordinates: [[49.45, 40.19], [44.83, 41.71], [41.27, 39.90], [32.86, 39.60], [26.60, 40.90], [20.90, 40.60], [19.38, 40.48], [18.39, 40.23]]
  },
  {
    project: 'TurkStream Subsea Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '31.5 Bcm/y',
    countries: 'Russia, Turkey, Bulgaria, Serbia',
    color: '#38bdf8',
    coordinates: [[37.33, 44.89], [33.50, 43.30], [29.80, 42.10], [28.09, 41.61], [23.32, 42.70]]
  },
  {
    project: 'Baltic Pipe Gas Corridor',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '10 Bcm/y',
    countries: 'Norway, Denmark, Poland',
    color: '#38bdf8',
    coordinates: [[4.50, 56.50], [8.13, 55.76], [12.15, 55.25], [15.05, 54.08]]
  },
  {
    project: 'Europipe II North Sea Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '24 Bcm/y',
    countries: 'Norway, Germany',
    color: '#38bdf8',
    coordinates: [[5.42, 59.27], [6.20, 56.40], [7.49, 53.67]]
  },
  {
    project: 'Power of Siberia Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '38 Bcm/y',
    countries: 'Russia, China',
    color: '#38bdf8',
    coordinates: [[113.80, 60.80], [122.40, 58.60], [127.53, 50.25], [126.64, 45.75], [121.47, 31.23]]
  },
  {
    project: 'Central Asia–China Gas Pipeline (Lines A/B/C)',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '55 Bcm/y',
    countries: 'Turkmenistan, Uzbekistan, Kazakhstan, China',
    color: '#38bdf8',
    coordinates: [[63.57, 39.09], [66.96, 39.65], [69.60, 42.34], [80.42, 44.20], [87.61, 43.82], [108.93, 34.34], [113.26, 23.12]]
  },
  {
    project: 'ESPO Eastern Siberia–Pacific Ocean Crude Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '1.6 Mb/d',
    countries: 'Russia, China',
    color: '#f97316',
    coordinates: [[97.60, 56.07], [105.70, 56.80], [119.50, 55.20], [123.94, 53.97], [133.03, 42.73]]
  },
  // Middle East & Africa
  {
    project: 'Baku–Tbilisi–Ceyhan (BTC) Crude Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '1.2 Mb/d',
    countries: 'Azerbaijan, Georgia, Turkey',
    color: '#f97316',
    coordinates: [[49.45, 40.19], [44.83, 41.71], [41.27, 39.90], [35.93, 36.88]]
  },
  {
    project: 'Saudi Arabia East–West Crude Oil Pipeline (Petroline)',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '5.0 Mb/d',
    countries: 'Saudi Arabia',
    color: '#f97316',
    coordinates: [[49.65, 25.93], [46.72, 24.71], [42.00, 24.40], [38.20, 24.08]]
  },
  {
    project: 'SUMED Suez–Mediterranean Crude Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '2.5 Mb/d',
    countries: 'Egypt',
    color: '#f97316',
    coordinates: [[32.35, 29.60], [31.15, 30.05], [29.82, 31.10]]
  },
  {
    project: 'Habshan–Fujairah (ADCOP) Crude Pipeline',
    type: 'oil_pipelines',
    status: 'operating',
    capacity: '1.8 Mb/d',
    countries: 'UAE',
    color: '#f97316',
    coordinates: [[53.63, 23.83], [55.20, 24.55], [56.35, 25.13]]
  },
  {
    project: 'Dolphin Gulf Natural Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '20 Bcm/y',
    countries: 'Qatar, UAE, Oman',
    color: '#38bdf8',
    coordinates: [[51.55, 25.90], [53.20, 25.25], [54.68, 24.78]]
  },
  {
    project: 'Trans-Mediterranean (Enrico Mattei) Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '33.7 Bcm/y',
    countries: 'Algeria, Tunisia, Italy',
    color: '#38bdf8',
    coordinates: [[6.07, 31.68], [8.40, 35.10], [11.05, 36.85], [12.59, 37.65], [15.05, 40.40]]
  },
  {
    project: 'Medgaz Subsea Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '10.5 Bcm/y',
    countries: 'Algeria, Spain',
    color: '#38bdf8',
    coordinates: [[3.20, 32.90], [-0.40, 35.75], [-2.40, 36.84]]
  },
  {
    project: 'West African Gas Pipeline (WAGP)',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '4.9 Bcm/y',
    countries: 'Nigeria, Benin, Togo, Ghana',
    color: '#38bdf8',
    coordinates: [[5.60, 5.52], [3.38, 6.45], [2.42, 6.35], [1.22, 6.13], [-0.01, 5.66]]
  },
  {
    project: 'East African Crude Oil Pipeline (EACOP - Construction)',
    type: 'oil_pipelines',
    status: 'construction',
    capacity: '246 kb/d',
    countries: 'Uganda, Tanzania',
    color: '#f97316',
    coordinates: [[31.36, 1.43], [31.80, -1.35], [33.41, -4.60], [39.10, -5.07]]
  },
  {
    project: 'ROMPCO Mozambique–South Africa Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '5.0 Bcm/y',
    countries: 'Mozambique, South Africa',
    color: '#38bdf8',
    coordinates: [[35.04, -21.70], [32.58, -25.47], [29.17, -26.52]]
  },
  // Asia-Pacific & Australia
  {
    project: 'Myanmar–China Crude & Gas Pipeline Corridor',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '12 Bcm/y gas + 440 kb/d oil',
    countries: 'Myanmar, China',
    color: '#38bdf8',
    coordinates: [[93.55, 19.43], [96.08, 21.97], [97.85, 24.00], [102.71, 25.04]]
  },
  {
    project: 'Trans-Thailand–Malaysia (TTM) Gas System',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '11 Bcm/y',
    countries: 'Thailand, Malaysia',
    color: '#38bdf8',
    coordinates: [[102.90, 7.35], [100.62, 7.18], [100.39, 6.30], [100.50, 13.75]]
  },
  {
    project: 'South Sumatra–West Java Gas Pipeline (SSWJ)',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '10 Bcm/y',
    countries: 'Indonesia',
    color: '#38bdf8',
    coordinates: [[103.90, -2.50], [105.35, -5.45], [106.10, -6.02], [106.85, -6.21]]
  },
  {
    project: 'Dampier–Bunbury Natural Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '8.7 Bcm/y',
    countries: 'Australia',
    color: '#38bdf8',
    coordinates: [[116.71, -20.66], [115.60, -24.80], [115.86, -31.95], [115.63, -33.32]]
  },
  {
    project: 'Moomba–Sydney Natural Gas Pipeline',
    type: 'gas_pipelines',
    status: 'operating',
    capacity: '4.5 Bcm/y',
    countries: 'Australia',
    color: '#38bdf8',
    coordinates: [[140.20, -28.10], [144.30, -31.90], [148.00, -34.00], [151.20, -33.87]]
  }
];

// Verified Global Oil Refineries (with real capacity kb/d & operators) + Major Global LNG Terminals
const VERIFIED_FACILITIES = [
  // North America Refineries
  { name: 'Motiva Port Arthur Refinery', facilityType: 'refinery', operator: 'Motiva Enterprises (Saudi Aramco)', country: 'United States', capacity: '630 kb/d', coordinate: [-93.96, 29.88], color: '#f59e0b' },
  { name: 'Marathon Galveston Bay Refinery', facilityType: 'refinery', operator: 'Marathon Petroleum', country: 'United States', capacity: '631 kb/d', coordinate: [-94.92, 29.38], color: '#f59e0b' },
  { name: 'ExxonMobil Beaumont Refinery', facilityType: 'refinery', operator: 'ExxonMobil', country: 'United States', capacity: '609 kb/d', coordinate: [-94.08, 30.06], color: '#f59e0b' },
  { name: 'Marathon Garyville Refinery', facilityType: 'refinery', operator: 'Marathon Petroleum', country: 'United States', capacity: '596 kb/d', coordinate: [-90.62, 30.06], color: '#f59e0b' },
  { name: 'ExxonMobil Baytown Refinery', facilityType: 'refinery', operator: 'ExxonMobil', country: 'United States', capacity: '564 kb/d', coordinate: [-95.01, 29.74], color: '#f59e0b' },
  { name: 'ExxonMobil Baton Rouge Refinery', facilityType: 'refinery', operator: 'ExxonMobil', country: 'United States', capacity: '540 kb/d', coordinate: [-91.19, 30.49], color: '#f59e0b' },
  { name: 'BP Whiting Refinery', facilityType: 'refinery', operator: 'BP', country: 'United States', capacity: '435 kb/d', coordinate: [-87.48, 41.67], color: '#f59e0b' },
  { name: 'Chevron Pascagoula Refinery', facilityType: 'refinery', operator: 'Chevron', country: 'United States', capacity: '369 kb/d', coordinate: [-88.49, 30.35], color: '#f59e0b' },
  { name: 'Phillips 66 Wood River Refinery', facilityType: 'refinery', operator: 'Phillips 66 / Cenovus', country: 'United States', capacity: '356 kb/d', coordinate: [-90.08, 38.84], color: '#f59e0b' },
  { name: 'Chevron El Segundo Refinery', facilityType: 'refinery', operator: 'Chevron', country: 'United States', capacity: '269 kb/d', coordinate: [-118.41, 33.91], color: '#f59e0b' },
  { name: 'BP Cherry Point Refinery', facilityType: 'refinery', operator: 'BP', country: 'United States', capacity: '250 kb/d', coordinate: [-122.74, 48.88], color: '#f59e0b' },
  { name: 'Irving Oil Saint John Refinery', facilityType: 'refinery', operator: 'Irving Oil', country: 'Canada', capacity: '320 kb/d', coordinate: [-66.02, 45.28], color: '#f59e0b' },
  { name: 'Imperial Oil Strathcona Refinery', facilityType: 'refinery', operator: 'Imperial Oil', country: 'Canada', capacity: '197 kb/d', coordinate: [-113.38, 53.55], color: '#f59e0b' },
  { name: 'Olmeca (Dos Bocas) Refinery', facilityType: 'refinery', operator: 'Pemex', country: 'Mexico', capacity: '340 kb/d', coordinate: [-93.20, 18.43], color: '#f59e0b' },
  { name: 'Tula Miguel Hidalgo Refinery', facilityType: 'refinery', operator: 'Pemex', country: 'Mexico', capacity: '315 kb/d', coordinate: [-99.27, 20.03], color: '#f59e0b' },
  { name: 'Salina Cruz Refinery', facilityType: 'refinery', operator: 'Pemex', country: 'Mexico', capacity: '330 kb/d', coordinate: [-95.18, 16.19], color: '#f59e0b' },
  // Latin America Refineries
  { name: 'Paraguaná Refining Center (Amuay/Cardón)', facilityType: 'refinery', operator: 'PDVSA', country: 'Venezuela', capacity: '940 kb/d', coordinate: [-70.21, 11.74], color: '#f59e0b' },
  { name: 'Paulínia Refinery (REPLAN)', facilityType: 'refinery', operator: 'Petrobras', country: 'Brazil', capacity: '434 kb/d', coordinate: [-47.13, -22.72], color: '#f59e0b' },
  { name: 'Duque de Caxias Refinery (REDUC)', facilityType: 'refinery', operator: 'Petrobras', country: 'Brazil', capacity: '239 kb/d', coordinate: [-43.28, -22.72], color: '#f59e0b' },
  { name: 'Barrancabermeja Refinery', facilityType: 'refinery', operator: 'Ecopetrol', country: 'Colombia', capacity: '250 kb/d', coordinate: [-73.87, 7.07], color: '#f59e0b' },
  { name: 'Cartagena Refinery (Reficar)', facilityType: 'refinery', operator: 'Ecopetrol', country: 'Colombia', capacity: '210 kb/d', coordinate: [-75.50, 10.31], color: '#f59e0b' },
  { name: 'La Plata Refinery Complex', facilityType: 'refinery', operator: 'YPF', country: 'Argentina', capacity: '189 kb/d', coordinate: [-57.93, -34.89], color: '#f59e0b' },
  { name: 'La Pampilla Refinery', facilityType: 'refinery', operator: 'Repsol', country: 'Peru', capacity: '117 kb/d', coordinate: [-77.13, -11.93], color: '#f59e0b' },
  { name: 'Aconcagua Refinery (Concón)', facilityType: 'refinery', operator: 'ENAP', country: 'Chile', capacity: '104 kb/d', coordinate: [-71.50, -32.94], color: '#f59e0b' },
  // Europe & Eurasia Refineries
  { name: 'Shell Pernis Rotterdam Refinery', facilityType: 'refinery', operator: 'Shell', country: 'Netherlands', capacity: '404 kb/d', coordinate: [4.35, 51.88], color: '#f59e0b' },
  { name: 'TotalEnergies Antwerp Refinery', facilityType: 'refinery', operator: 'TotalEnergies', country: 'Belgium', capacity: '338 kb/d', coordinate: [4.31, 51.28], color: '#f59e0b' },
  { name: 'ExxonMobil Fawley Refinery', facilityType: 'refinery', operator: 'ExxonMobil', country: 'United Kingdom', capacity: '270 kb/d', coordinate: [-1.35, 50.83], color: '#f59e0b' },
  { name: 'MiRO Karlsruhe Refinery', facilityType: 'refinery', operator: 'MiRO Consortium', country: 'Germany', capacity: '310 kb/d', coordinate: [8.31, 49.05], color: '#f59e0b' },
  { name: 'PCK Schwedt Refinery', facilityType: 'refinery', operator: 'PCK Raffinerie', country: 'Germany', capacity: '226 kb/d', coordinate: [14.23, 53.09], color: '#f59e0b' },
  { name: 'TotalEnergies Normandy Refinery (Gonfreville)', facilityType: 'refinery', operator: 'TotalEnergies', country: 'France', capacity: '247 kb/d', coordinate: [0.23, 49.49], color: '#f59e0b' },
  { name: 'Sarroch Refinery Complex', facilityType: 'refinery', operator: 'Saras', country: 'Italy', capacity: '300 kb/d', coordinate: [9.02, 39.07], color: '#f59e0b' },
  { name: 'ISAB Priolo Refinery Complex', facilityType: 'refinery', operator: 'GOI Energy', country: 'Italy', capacity: '320 kb/d', coordinate: [15.20, 37.16], color: '#f59e0b' },
  { name: 'Milazzo Refinery', facilityType: 'refinery', operator: 'RAM (Eni/Q8)', country: 'Italy', capacity: '200 kb/d', coordinate: [15.24, 38.22], color: '#f59e0b' },
  { name: 'Repsol Cartagena Refinery', facilityType: 'refinery', operator: 'Repsol', country: 'Spain', capacity: '220 kb/d', coordinate: [-0.93, 37.57], color: '#f59e0b' },
  { name: 'Cepsa Gibraltar-San Roque Refinery', facilityType: 'refinery', operator: 'Moeve (Cepsa)', country: 'Spain', capacity: '240 kb/d', coordinate: [-5.41, 36.18], color: '#f59e0b' },
  { name: 'Orlen Płock Refinery', facilityType: 'refinery', operator: 'ORLEN', country: 'Poland', capacity: '326 kb/d', coordinate: [19.68, 52.58], color: '#f59e0b' },
  { name: 'Motor Oil Hellas Corinth Refinery', facilityType: 'refinery', operator: 'Motor Oil Hellas', country: 'Greece', capacity: '200 kb/d', coordinate: [23.08, 37.92], color: '#f59e0b' },
  { name: 'Equinor Mongstad Refinery', facilityType: 'refinery', operator: 'Equinor', country: 'Norway', capacity: '226 kb/d', coordinate: [5.03, 60.81], color: '#f59e0b' },
  { name: 'Omsk Oil Refinery', facilityType: 'refinery', operator: 'Gazprom Neft', country: 'Russia', capacity: '420 kb/d', coordinate: [73.26, 55.06], color: '#f59e0b' },
  { name: 'Kirishi (KINEF) Refinery', facilityType: 'refinery', operator: 'Surgutneftegas', country: 'Russia', capacity: '410 kb/d', coordinate: [32.02, 59.48], color: '#f59e0b' },
  { name: 'Ryazan Oil Refinery', facilityType: 'refinery', operator: 'Rosneft', country: 'Russia', capacity: '340 kb/d', coordinate: [39.77, 54.57], color: '#f59e0b' },
  // Middle East Refineries
  { name: 'Ras Tanura Refinery Complex', facilityType: 'refinery', operator: 'Saudi Aramco', country: 'Saudi Arabia', capacity: '550 kb/d', coordinate: [50.15, 26.64], color: '#f59e0b' },
  { name: 'SATORP Jubail Refinery', facilityType: 'refinery', operator: 'Aramco / TotalEnergies', country: 'Saudi Arabia', capacity: '460 kb/d', coordinate: [49.47, 27.03], color: '#f59e0b' },
  { name: 'YASREF Yanbu Refinery', facilityType: 'refinery', operator: 'Aramco / Sinopec', country: 'Saudi Arabia', capacity: '400 kb/d', coordinate: [38.22, 23.95], color: '#f59e0b' },
  { name: 'Jazan Refinery Complex', facilityType: 'refinery', operator: 'Saudi Aramco', country: 'Saudi Arabia', capacity: '400 kb/d', coordinate: [42.49, 17.27], color: '#f59e0b' },
  { name: 'Ruwais Refinery Complex', facilityType: 'refinery', operator: 'ADNOC Refining', country: 'UAE', capacity: '817 kb/d', coordinate: [52.73, 24.12], color: '#f59e0b' },
  { name: 'Al-Zour Refinery Complex', facilityType: 'refinery', operator: 'KIPIC', country: 'Kuwait', capacity: '615 kb/d', coordinate: [48.36, 28.73], color: '#f59e0b' },
  { name: 'Mina Al-Ahmadi Refinery', facilityType: 'refinery', operator: 'KNPC', country: 'Kuwait', capacity: '346 kb/d', coordinate: [48.14, 29.06], color: '#f59e0b' },
  { name: 'Bapco Sitra Refinery', facilityType: 'refinery', operator: 'Bapco Energies', country: 'Bahrain', capacity: '380 kb/d', coordinate: [50.61, 26.13], color: '#f59e0b' },
  { name: 'Duqm Refinery Complex (OQ8)', facilityType: 'refinery', operator: 'OQ / KPI', country: 'Oman', capacity: '230 kb/d', coordinate: [57.69, 19.65], color: '#f59e0b' },
  { name: 'Persian Gulf Star Refinery (Bandar Abbas)', facilityType: 'refinery', operator: 'NIORDC', country: 'Iran', capacity: '420 kb/d', coordinate: [56.11, 27.14], color: '#f59e0b' },
  { name: 'Abadan Oil Refinery', facilityType: 'refinery', operator: 'NIORDC', country: 'Iran', capacity: '400 kb/d', coordinate: [48.28, 30.35], color: '#f59e0b' },
  { name: 'Karbala Oil Refinery', facilityType: 'refinery', operator: 'Midland Refineries', country: 'Iraq', capacity: '140 kb/d', coordinate: [43.92, 32.51], color: '#f59e0b' },
  { name: 'STAR Refinery Aliağa', facilityType: 'refinery', operator: 'SOCAR Turkey', country: 'Turkey', capacity: '214 kb/d', coordinate: [26.92, 38.79], color: '#f59e0b' },
  { name: 'TÜPRAŞ İzmit Refinery', facilityType: 'refinery', operator: 'TÜPRAŞ', country: 'Turkey', capacity: '226 kb/d', coordinate: [29.83, 40.75], color: '#f59e0b' },
  // Africa Refineries
  { name: 'Dangote Oil Refinery & Petrochemicals', facilityType: 'refinery', operator: 'Dangote Group', country: 'Nigeria', capacity: '650 kb/d', coordinate: [4.01, 6.45], color: '#f59e0b' },
  { name: 'Port Harcourt Refinery Complex', facilityType: 'refinery', operator: 'NNPC', country: 'Nigeria', capacity: '210 kb/d', coordinate: [7.09, 4.77], color: '#f59e0b' },
  { name: 'Skikda Refinery Complex', facilityType: 'refinery', operator: 'Sonatrach', country: 'Algeria', capacity: '355 kb/d', coordinate: [6.96, 36.87], color: '#f59e0b' },
  { name: 'MIDOR Alexandria Refinery', facilityType: 'refinery', operator: 'EGPC / MIDOR', country: 'Egypt', capacity: '160 kb/d', coordinate: [29.84, 31.02], color: '#f59e0b' },
  { name: 'Sasol Secunda Synfuels & Refinery', facilityType: 'refinery', operator: 'Sasol', country: 'South Africa', capacity: '160 kb/d', coordinate: [29.17, -26.55], color: '#f59e0b' },
  { name: 'Astron Energy Cape Town Refinery', facilityType: 'refinery', operator: 'Astron Energy', country: 'South Africa', capacity: '100 kb/d', coordinate: [18.52, -33.83], color: '#f59e0b' },
  // Asia & Indo-Pacific Refineries
  { name: 'Reliance Jamnagar Refining Complex', facilityType: 'refinery', operator: 'Reliance Industries', country: 'India', capacity: '1,240 kb/d', coordinate: [69.86, 22.34], color: '#f59e0b' },
  { name: 'Nayara Energy Vadinar Refinery', facilityType: 'refinery', operator: 'Nayara Energy', country: 'India', capacity: '400 kb/d', coordinate: [69.72, 22.42], color: '#f59e0b' },
  { name: 'IndianOil Panipat Refinery', facilityType: 'refinery', operator: 'Indian Oil Corp', country: 'India', capacity: '300 kb/d', coordinate: [76.88, 29.47], color: '#f59e0b' },
  { name: 'BPCL Kochi Refinery', facilityType: 'refinery', operator: 'Bharat Petroleum', country: 'India', capacity: '310 kb/d', coordinate: [76.38, 9.96], color: '#f59e0b' },
  { name: 'IndianOil Paradip Refinery', facilityType: 'refinery', operator: 'Indian Oil Corp', country: 'India', capacity: '300 kb/d', coordinate: [86.58, 20.26], color: '#f59e0b' },
  { name: 'Rongsheng Zhejiang Zhoushan Refinery', facilityType: 'refinery', operator: 'Zhejiang Petroleum & Chemical', country: 'China', capacity: '800 kb/d', coordinate: [121.95, 30.22], color: '#f59e0b' },
  { name: 'Sinopec Zhenhai (Ningbo) Refinery', facilityType: 'refinery', operator: 'Sinopec', country: 'China', capacity: '540 kb/d', coordinate: [121.66, 29.97], color: '#f59e0b' },
  { name: 'CNOOC Huizhou Daya Bay Refinery', facilityType: 'refinery', operator: 'CNOOC', country: 'China', capacity: '440 kb/d', coordinate: [114.62, 22.75], color: '#f59e0b' },
  { name: 'Hengli Dalian Changxing Refinery', facilityType: 'refinery', operator: 'Hengli Petrochemical', country: 'China', capacity: '400 kb/d', coordinate: [121.30, 39.50], color: '#f59e0b' },
  { name: 'Sinopec Maoming Refinery', facilityType: 'refinery', operator: 'Sinopec', country: 'China', capacity: '400 kb/d', coordinate: [110.90, 21.65], color: '#f59e0b' },
  { name: 'SK Energy Ulsan Refining Complex', facilityType: 'refinery', operator: 'SK Innovation', country: 'South Korea', capacity: '840 kb/d', coordinate: [129.36, 35.51], color: '#f59e0b' },
  { name: 'GS Caltex Yeosu Refinery', facilityType: 'refinery', operator: 'GS Caltex', country: 'South Korea', capacity: '800 kb/d', coordinate: [127.69, 34.84], color: '#f59e0b' },
  { name: 'S-Oil Onsan Refinery Complex', facilityType: 'refinery', operator: 'S-Oil (Aramco)', country: 'South Korea', capacity: '669 kb/d', coordinate: [129.35, 35.42], color: '#f59e0b' },
  { name: 'HD Hyundai Oilbank Daesan Refinery', facilityType: 'refinery', operator: 'HD Hyundai Oilbank', country: 'South Korea', capacity: '650 kb/d', coordinate: [126.42, 37.01], color: '#f59e0b' },
  { name: 'Formosa Petrochemical Mailiao Refinery', facilityType: 'refinery', operator: 'Formosa Petrochemical', country: 'Taiwan', capacity: '540 kb/d', coordinate: [120.20, 23.79], color: '#f59e0b' },
  { name: 'ENEOS Negishi (Yokohama) Refinery', facilityType: 'refinery', operator: 'ENEOS', country: 'Japan', capacity: '270 kb/d', coordinate: [139.63, 35.41], color: '#f59e0b' },
  { name: 'ENEOS Mizushima Refinery', facilityType: 'refinery', operator: 'ENEOS', country: 'Japan', capacity: '320 kb/d', coordinate: [133.75, 34.50], color: '#f59e0b' },
  { name: 'ExxonMobil Jurong Island Refinery', facilityType: 'refinery', operator: 'ExxonMobil', country: 'Singapore', capacity: '592 kb/d', coordinate: [103.70, 1.27], color: '#f59e0b' },
  { name: 'Pengerang Integrated Complex (RAPID)', facilityType: 'refinery', operator: 'Petronas / Aramco', country: 'Malaysia', capacity: '300 kb/d', coordinate: [104.14, 1.37], color: '#f59e0b' },
  { name: 'Pertamina Cilacap Refinery', facilityType: 'refinery', operator: 'Pertamina', country: 'Indonesia', capacity: '348 kb/d', coordinate: [109.02, -7.71], color: '#f59e0b' },
  { name: 'Pertamina Balikpapan Refinery', facilityType: 'refinery', operator: 'Pertamina', country: 'Indonesia', capacity: '360 kb/d', coordinate: [116.82, -1.26], color: '#f59e0b' },
  { name: 'Thai Oil Sriracha Refinery', facilityType: 'refinery', operator: 'Thai Oil (PTT)', country: 'Thailand', capacity: '275 kb/d', coordinate: [100.91, 13.12], color: '#f59e0b' },
  { name: 'PTTGC Map Ta Phut Refinery', facilityType: 'refinery', operator: 'PTT Global Chemical', country: 'Thailand', capacity: '280 kb/d', coordinate: [101.14, 12.69], color: '#f59e0b' },
  { name: 'Nghi Son Refinery & Petrochemical', facilityType: 'refinery', operator: 'NSRP (PVN/Idemitsu/KPI)', country: 'Vietnam', capacity: '200 kb/d', coordinate: [105.79, 19.34], color: '#f59e0b' },
  { name: 'Dung Quat Oil Refinery', facilityType: 'refinery', operator: 'BSR / Petrovietnam', country: 'Vietnam', capacity: '148 kb/d', coordinate: [108.77, 15.37], color: '#f59e0b' },
  { name: 'Petron Bataan Refinery', facilityType: 'refinery', operator: 'Petron Corp', country: 'Philippines', capacity: '180 kb/d', coordinate: [120.61, 14.53], color: '#f59e0b' },
  { name: 'Viva Energy Geelong Refinery', facilityType: 'refinery', operator: 'Viva Energy', country: 'Australia', capacity: '120 kb/d', coordinate: [144.38, -38.09], color: '#f59e0b' },
  { name: 'Ampol Lytton (Brisbane) Refinery', facilityType: 'refinery', operator: 'Ampol', country: 'Australia', capacity: '109 kb/d', coordinate: [153.16, -27.41], color: '#f59e0b' },
  // Major Global LNG Liquefaction & Regasification Terminals
  { name: 'Sabine Pass LNG Terminal', facilityType: 'lng_terminal', operator: 'Cheniere Energy', country: 'United States', capacity: '30 mtpa', coordinate: [-93.87, 29.74], color: '#38bdf8' },
  { name: 'Corpus Christi LNG Terminal', facilityType: 'lng_terminal', operator: 'Cheniere Energy', country: 'United States', capacity: '25 mtpa', coordinate: [-97.27, 27.88], color: '#38bdf8' },
  { name: 'Freeport LNG Terminal', facilityType: 'lng_terminal', operator: 'Freeport LNG', country: 'United States', capacity: '15.3 mtpa', coordinate: [-95.32, 28.93], color: '#38bdf8' },
  { name: 'Ras Laffan LNG Export Complex', facilityType: 'lng_terminal', operator: 'QatarEnergy LNG', country: 'Qatar', capacity: '77 mtpa', coordinate: [51.55, 25.91], color: '#38bdf8' },
  { name: 'Gorgon Barrow Island LNG Plant', facilityType: 'lng_terminal', operator: 'Chevron', country: 'Australia', capacity: '15.6 mtpa', coordinate: [115.41, -20.80], color: '#38bdf8' },
  { name: 'Curtis Island (Gladstone) LNG Hub', facilityType: 'lng_terminal', operator: 'QCLNG / GLNG / APLNG', country: 'Australia', capacity: '25 mtpa', coordinate: [151.24, -23.79], color: '#38bdf8' },
  { name: 'MLNG Bintulu Liquefaction Complex', facilityType: 'lng_terminal', operator: 'Petronas', country: 'Malaysia', capacity: '29.3 mtpa', coordinate: [113.07, 3.26], color: '#38bdf8' },
  { name: 'Tangguh LNG Plant (West Papua)', facilityType: 'lng_terminal', operator: 'BP', country: 'Indonesia', capacity: '11.4 mtpa', coordinate: [133.14, -2.44], color: '#38bdf8' },
  { name: 'Yamal Sabetta LNG Terminal', facilityType: 'lng_terminal', operator: 'Novatek', country: 'Russia', capacity: '17.4 mtpa', coordinate: [72.07, 71.27], color: '#38bdf8' },
  { name: 'Bonny Island LNG Liquefaction Plant', facilityType: 'lng_terminal', operator: 'Nigeria LNG (NLNG)', country: 'Nigeria', capacity: '22 mtpa', coordinate: [7.17, 4.43], color: '#38bdf8' },
  { name: 'Arzew LNG Export Complex', facilityType: 'lng_terminal', operator: 'Sonatrach', country: 'Algeria', capacity: '21 mtpa', coordinate: [-0.27, 35.82], color: '#38bdf8' },
  { name: 'Gate Rotterdam LNG Terminal', facilityType: 'lng_terminal', operator: 'Gasunie / Vopak', country: 'Netherlands', capacity: '16 Bcm/y', coordinate: [4.08, 51.96], color: '#38bdf8' },
  { name: 'Zeebrugge LNG Terminal', facilityType: 'lng_terminal', operator: 'Fluxys', country: 'Belgium', capacity: '11 Bcm/y', coordinate: [3.22, 51.33], color: '#38bdf8' },
  { name: 'South Hook LNG Terminal (Milford Haven)', facilityType: 'lng_terminal', operator: 'QatarEnergy / Exxon', country: 'United Kingdom', capacity: '21 Bcm/y', coordinate: [-5.08, 51.70], color: '#38bdf8' },
  { name: 'Barcelona LNG Regasification Terminal', facilityType: 'lng_terminal', operator: 'Enagás', country: 'Spain', capacity: '17.1 Bcm/y', coordinate: [2.15, 41.33], color: '#38bdf8' },
  { name: 'Sines LNG Terminal', facilityType: 'lng_terminal', operator: 'REN Atlântico', country: 'Portugal', capacity: '7.6 Bcm/y', coordinate: [-8.87, 37.93], color: '#38bdf8' },
  { name: 'Fos Cavaou LNG Terminal', facilityType: 'lng_terminal', operator: 'Elengy', country: 'France', capacity: '8.2 Bcm/y', coordinate: [4.89, 43.41], color: '#38bdf8' },
  { name: 'Dahej LNG Receiving Terminal', facilityType: 'lng_terminal', operator: 'Petronet LNG', country: 'India', capacity: '17.5 mtpa', coordinate: [72.58, 21.71], color: '#38bdf8' },
  { name: 'Futtsu LNG Terminal (Tokyo Bay)', facilityType: 'lng_terminal', operator: 'JERA', country: 'Japan', capacity: '19.5 mtpa', coordinate: [139.83, 35.33], color: '#38bdf8' },
  { name: 'Incheon LNG Receiving Terminal', facilityType: 'lng_terminal', operator: 'KOGAS', country: 'South Korea', capacity: '40 mtpa', coordinate: [126.59, 37.34], color: '#38bdf8' },
  { name: 'Pecém LNG Terminal (Ceará)', facilityType: 'lng_terminal', operator: 'Petrobras', country: 'Brazil', capacity: '7 Mcm/d', coordinate: [-38.79, -3.53], color: '#38bdf8' }
];

export async function GET() {
  try {
    // Official Global Energy Monitor - Global Oil Infrastructure Tracker (GOIT) Spreadsheet Data GID
    const sheetUrl =
      'https://docs.google.com/spreadsheets/d/1OysHd1cBjVN98ufNEDIwtI8Du3hY7hm8-wfpYk7wRDE/export?format=csv&gid=997296159';

    const res = await fetch(sheetUrl, {
      headers: {
        'User-Agent': 'SovereignObservatory/2.0'
      },
      next: { revalidate: 86400 }
    }).catch(() => null);

    const resultLines = [];

    if (res && res.ok) {
      const csvText = await res.text();
      const lines = csvText.split(/\r?\n/);
      if (lines.length >= 2) {
        const headers = parseCsvLine(lines[0]);
        const idxProject = headers.indexOf('project');
        const idxType = headers.indexOf('type');
        const idxStatus = headers.indexOf('status');
        const idxCapacity = headers.indexOf('capacity');
        const idxRoute = headers.indexOf('route');
        const idxCountries = headers.indexOf('countries');

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

          const rawCoords = [];
          for (const seg of routeStr.split(':')) {
            const parts = seg.split(',');
            if (parts.length === 2) {
              const lat = parseFloat(parts[0]);
              const lon = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lon)) {
                rawCoords.push([lon, lat]);
              }
            }
          }

          const cleanSegments = sanitizePipelineSegments(rawCoords);
          if (cleanSegments.length === 0) continue;

          const isGas = type.toLowerCase().includes('ngl') || type.toLowerCase().includes('gas');
          const color = isGas ? '#38bdf8' : '#f97316';

          for (const segmentCoords of cleanSegments) {
            resultLines.push({
              project,
              type,
              status,
              capacity,
              countries,
              coordinates: segmentCoords,
              color
            });
          }
        }
      }
    }

    return NextResponse.json({
      lines: [...resultLines, ...TRUNK_PIPELINES],
      points: VERIFIED_FACILITIES,
      meta: {
        pipelinesCount: resultLines.length + TRUNK_PIPELINES.length,
        refineriesCount: VERIFIED_FACILITIES.filter(f => f.facilityType === 'refinery').length,
        lngTerminalsCount: VERIFIED_FACILITIES.filter(f => f.facilityType === 'lng_terminal').length
      }
    });
  } catch (err) {
    console.error('Oil & Gas API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
